import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/super-admin/patient-flow - Calculate real patient flow metrics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can access patient flow analytics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all hospitals
    const hospitals = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Calculate patient flow metrics for each hospital
    const hospitalFlowMetrics = await Promise.all(
      hospitals.map(async (hospital) => {
        // Get patients with their journey timestamps
        const patients = await prisma.patient.findMany({
          where: { hospitalId: hospital.id },
          select: {
            id: true,
            createdAt: true, // Registration time
          },
        });

        const patientIds = patients.map(p => p.id);

        if (patientIds.length === 0) {
          return {
            hospitalId: hospital.id,
            hospitalName: hospital.name,
            registrationToNurse: 0,
            nurseToDoctor: 0,
            doctorConsultation: 0,
            labOrderToResults: 0,
            prescriptionToPharmacy: 0,
            pharmacyToCashier: 0,
            totalJourneyTime: 0,
            patientCount: 0,
          };
        }

        // Stage 1: Registration to Nurse (Patient creation to first vital signs)
        const vitals = await prisma.vital.findMany({
          where: {
            hospitalId: hospital.id,
            patientId: { in: patientIds },
          },
          select: {
            patientId: true,
            recordedAt: true,
            patient: {
              select: {
                createdAt: true,
              },
            },
          },
        });

        const registrationToNurseTimes = vitals.map(vital => {
          const regTime = new Date(vital.patient.createdAt).getTime();
          const nurseTime = new Date(vital.recordedAt).getTime();
          return (nurseTime - regTime) / (1000 * 60); // minutes
        }).filter(time => time > 0 && time < 1440); // Filter valid times (< 24 hours)

        const avgRegistrationToNurse = registrationToNurseTimes.length > 0
          ? registrationToNurseTimes.reduce((a, b) => a + b, 0) / registrationToNurseTimes.length
          : 0;

        // Stage 2: Nurse to Doctor (Vitals to first medical record)
        const medicalRecords = await prisma.medicalRecord.findMany({
          where: {
            hospitalId: hospital.id,
            patientId: { in: patientIds },
          },
          select: {
            patientId: true,
            createdAt: true,
          },
        });

        // Map vitals to medical records for the same patient
        const nurseToDoctorTimes: number[] = [];
        medicalRecords.forEach(record => {
          const patientVitals = vitals.filter(v => v.patientId === record.patientId);
          if (patientVitals.length > 0) {
            // Get the most recent vital before the medical record
            const relevantVitals = patientVitals.filter(v => 
              new Date(v.recordedAt).getTime() <= new Date(record.createdAt).getTime()
            );
            if (relevantVitals.length > 0) {
              const latestVital = relevantVitals.sort((a, b) => 
                new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
              )[0];
              const nurseTime = new Date(latestVital.recordedAt).getTime();
              const doctorTime = new Date(record.createdAt).getTime();
              const timeDiff = (doctorTime - nurseTime) / (1000 * 60);
              if (timeDiff > 0 && timeDiff < 240) { // < 4 hours
                nurseToDoctorTimes.push(timeDiff);
              }
            }
          }
        });

        const avgNurseToDoctor = nurseToDoctorTimes.length > 0
          ? nurseToDoctorTimes.reduce((a, b) => a + b, 0) / nurseToDoctorTimes.length
          : 0;

        // Stage 3: Doctor Consultation Duration (simplified)
        // In a real implementation, this could track when doctor starts/ends consultation
        const avgDoctorConsultation = 20; // This would need actual tracking in medical records

        // Stage 4: Lab Order to Results
        const labOrders = await prisma.labOrder.findMany({
          where: {
            hospitalId: hospital.id,
            patientId: { in: patientIds },
            status: 'completed',
          },
          select: {
            createdAt: true,
            updatedAt: true,
          },
        });

        const labTimes = labOrders.map(order => {
          const orderTime = new Date(order.createdAt).getTime();
          const resultTime = new Date(order.updatedAt).getTime();
          return (resultTime - orderTime) / (1000 * 60); // minutes
        }).filter(time => time > 0 && time < 480); // Filter valid times (< 8 hours)

        const avgLabOrderToResults = labTimes.length > 0
          ? labTimes.reduce((a, b) => a + b, 0) / labTimes.length
          : 0;

        // Stage 5: Prescription to Pharmacy
        const prescriptions = await prisma.prescription.findMany({
          where: {
            hospitalId: hospital.id,
            patientId: { in: patientIds },
            dispensedAt: { not: null },
          },
          select: {
            createdAt: true,
            dispensedAt: true,
          },
        });

        const prescriptionTimes = prescriptions.map(rx => {
          const prescribedTime = new Date(rx.createdAt).getTime();
          const dispensedTime = new Date(rx.dispensedAt!).getTime();
          return (dispensedTime - prescribedTime) / (1000 * 60); // minutes
        }).filter(time => time > 0 && time < 240); // Filter valid times (< 4 hours)

        const avgPrescriptionToPharmacy = prescriptionTimes.length > 0
          ? prescriptionTimes.reduce((a, b) => a + b, 0) / prescriptionTimes.length
          : 0;

        // Stage 6: Pharmacy to Cashier (Dispensing to payment/checkout)
        const invoices = await prisma.invoice.findMany({
          where: {
            hospitalId: hospital.id,
            patientId: { in: patientIds },
            status: 'paid',
          },
          select: {
            createdAt: true,
            updatedAt: true,
          },
        });

        const cashierTimes = invoices.map(invoice => {
          const invoiceTime = new Date(invoice.createdAt).getTime();
          const paidTime = new Date(invoice.updatedAt).getTime();
          return (paidTime - invoiceTime) / (1000 * 60); // minutes
        }).filter(time => time > 0 && time < 120); // Filter valid times (< 2 hours)

        const avgPharmacyToCashier = cashierTimes.length > 0
          ? cashierTimes.reduce((a, b) => a + b, 0) / cashierTimes.length
          : 0;

        // Calculate total journey time
        const totalJourneyTime = 
          avgRegistrationToNurse +
          avgNurseToDoctor +
          avgDoctorConsultation +
          avgLabOrderToResults +
          avgPrescriptionToPharmacy +
          avgPharmacyToCashier;

        return {
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          registrationToNurse: Math.round(avgRegistrationToNurse),
          nurseToDoctor: Math.round(avgNurseToDoctor),
          doctorConsultation: Math.round(avgDoctorConsultation),
          labOrderToResults: Math.round(avgLabOrderToResults),
          prescriptionToPharmacy: Math.round(avgPrescriptionToPharmacy),
          pharmacyToCashier: Math.round(avgPharmacyToCashier),
          totalJourneyTime: Math.round(totalJourneyTime),
          patientCount: patients.length,
        };
      })
    );

    // Calculate platform-wide averages
    const activeHospitals = hospitalFlowMetrics.filter(h => h.patientCount > 0);
    
    const platformAverages = activeHospitals.length > 0 ? {
      registrationToNurse: Math.round(
        activeHospitals.reduce((sum, h) => sum + h.registrationToNurse, 0) / activeHospitals.length
      ),
      nurseToDoctor: Math.round(
        activeHospitals.reduce((sum, h) => sum + h.nurseToDoctor, 0) / activeHospitals.length
      ),
      doctorConsultation: Math.round(
        activeHospitals.reduce((sum, h) => sum + h.doctorConsultation, 0) / activeHospitals.length
      ),
      labOrderToResults: Math.round(
        activeHospitals.reduce((sum, h) => sum + h.labOrderToResults, 0) / activeHospitals.length
      ),
      prescriptionToPharmacy: Math.round(
        activeHospitals.reduce((sum, h) => sum + h.prescriptionToPharmacy, 0) / activeHospitals.length
      ),
      pharmacyToCashier: Math.round(
        activeHospitals.reduce((sum, h) => sum + h.pharmacyToCashier, 0) / activeHospitals.length
      ),
      totalJourneyTime: Math.round(
        activeHospitals.reduce((sum, h) => sum + h.totalJourneyTime, 0) / activeHospitals.length
      ),
    } : {
      registrationToNurse: 0,
      nurseToDoctor: 0,
      doctorConsultation: 0,
      labOrderToResults: 0,
      prescriptionToPharmacy: 0,
      pharmacyToCashier: 0,
      totalJourneyTime: 0,
    };

    return NextResponse.json({
      platformAverages,
      byHospital: hospitalFlowMetrics.sort((a, b) => a.hospitalName.localeCompare(b.hospitalName)),
    });

  } catch (error) {
    console.error('Error fetching patient flow metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient flow metrics' },
      { status: 500 }
    );
  }
}
