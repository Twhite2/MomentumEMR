import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import * as XLSX from 'xlsx';

// GET /api/super-admin/export - Comprehensive platform analytics export
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can export comprehensive analytics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all hospitals
    const hospitals = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        phoneNumber: true,
        contactEmail: true,
        subdomain: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Note: No Subscription model in schema, subscription info would come from external billing system

    // Fetch platform-wide patient statistics
    const totalPatients = await prisma.patient.count();
    const patientsByType = await prisma.patient.groupBy({
      by: ['patientType'],
      _count: true,
    });
    
    const patientsByHospital = await prisma.patient.groupBy({
      by: ['hospitalId'],
      _count: true,
    });

    // Get hospital names for patient counts
    const patientCountData = await Promise.all(
      patientsByHospital.map(async (item) => {
        const hospital = await prisma.hospital.findUnique({
          where: { id: item.hospitalId },
          select: { name: true },
        });
        return {
          'Hospital ID': item.hospitalId,
          'Hospital Name': hospital?.name || 'Unknown',
          'Patient Count': item._count,
        };
      })
    );

    // Fetch activity metrics
    const totalPrescriptions = await prisma.prescription.count();
    const totalInvoices = await prisma.invoice.count();
    const totalMedicalRecords = await prisma.medicalRecord.count();
    const totalAdmissions = await prisma.admission.count();
    const totalLabOrders = await prisma.labOrder.count();

    // Get weekly activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyPrescriptions = await prisma.prescription.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const weeklyInvoices = await prisma.invoice.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const weeklyMedicalRecords = await prisma.medicalRecord.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const weeklyAdmissions = await prisma.admission.count({
      where: { admissionDate: { gte: sevenDaysAgo } },
    });

    const weeklyLabOrders = await prisma.labOrder.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // Fetch revenue data
    const totalRevenue = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
    });

    const paidRevenue = await prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { totalAmount: true },
    });

    // Fetch all patients (anonymized)
    const allPatients = await prisma.patient.findMany({
      select: {
        id: true,
        dob: true,
        gender: true,
        bloodGroup: true,
        patientType: true,
        hospitalId: true,
        createdAt: true,
        hospital: {
          select: { name: true },
        },
      },
    });

    // Fetch all medical records (anonymized)
    const allMedicalRecords = await prisma.medicalRecord.findMany({
      select: {
        id: true,
        patientId: true,
        hospitalId: true,
        diagnosis: true,
        visitDate: true,
        createdAt: true,
        hospital: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all prescriptions
    const allPrescriptions = await prisma.prescription.findMany({
      select: {
        id: true,
        patientId: true,
        hospitalId: true,
        status: true,
        drugCount: true,
        createdAt: true,
        dispensedAt: true,
        hospital: {
          select: { name: true },
        },
        prescriptionItems: {
          select: {
            drugName: true,
            dosage: true,
            frequency: true,
            duration: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all invoices (anonymized)
    const allInvoices = await prisma.invoice.findMany({
      select: {
        id: true,
        patientId: true,
        hospitalId: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        hospital: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all lab orders
    const allLabOrders = await prisma.labOrder.findMany({
      select: {
        id: true,
        patientId: true,
        hospitalId: true,
        orderType: true,
        description: true,
        status: true,
        createdAt: true,
        hospital: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all admissions
    const allAdmissions = await prisma.admission.findMany({
      select: {
        id: true,
        patientId: true,
        hospitalId: true,
        ward: true,
        bedNumber: true,
        admissionReason: true,
        admissionDate: true,
        dischargeDate: true,
        status: true,
      },
      orderBy: { admissionDate: 'desc' },
    });

    // Generate anonymized patient IDs
    const patientIdMap = new Map<number, string>();
    let patientCounter = 1;

    const getAnonymizedPatientId = (realPatientId: number): string => {
      if (!patientIdMap.has(realPatientId)) {
        patientIdMap.set(realPatientId, `PATIENT_${String(patientCounter).padStart(6, '0')}`);
        patientCounter++;
      }
      return patientIdMap.get(realPatientId)!;
    };

    // Calculate age from DOB
    const calculateAge = (dob: Date): number => {
      return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    };

    const getAgeGroup = (dob: Date): string => {
      const age = calculateAge(dob);
      if (age < 5) return '0-4';
      if (age < 12) return '5-11';
      if (age < 18) return '12-17';
      if (age < 30) return '18-29';
      if (age < 45) return '30-44';
      if (age < 60) return '45-59';
      if (age < 75) return '60-74';
      return '75+';
    };

    // Sheet 1: Hospitals Overview
    const hospitalsData = hospitals.map((hospital) => ({
      'Hospital ID': hospital.id,
      'Hospital Name': hospital.name,
      'Address': hospital.address || 'N/A',
      'Phone': hospital.phoneNumber || 'N/A',
      'Email': hospital.contactEmail || 'N/A',
      'Subdomain': hospital.subdomain || 'N/A',
      'Active': hospital.active ? 'Yes' : 'No',
      'Registered Date': hospital.createdAt.toISOString().split('T')[0],
    }));

    // Sheet 2: All Patients (Anonymized)
    const patientsData = allPatients.map((patient) => ({
      'Anonymized Patient ID': getAnonymizedPatientId(patient.id),
      'Age': patient.dob ? calculateAge(patient.dob) : 'Unknown',
      'Age Group': patient.dob ? getAgeGroup(patient.dob) : 'Unknown',
      'Gender': patient.gender || 'Unknown',
      'Blood Group': patient.bloodGroup || 'Unknown',
      'Patient Type': patient.patientType,
      'Hospital': patient.hospital.name,
      'Hospital ID': patient.hospitalId,
      'Registered Date': patient.createdAt.toISOString().split('T')[0],
    }));

    // Sheet 3: All Medical Records (Anonymized)
    const medicalRecordsData = allMedicalRecords.map((record) => ({
      'Record ID': `MR_${record.id}`,
      'Anonymized Patient ID': getAnonymizedPatientId(record.patientId),
      'Diagnosis': record.diagnosis || 'Not specified',
      'Visit Date': record.visitDate.toISOString().split('T')[0],
      'Hospital': record.hospital.name,
      'Hospital ID': record.hospitalId,
      'Created Date': record.createdAt.toISOString().split('T')[0],
    }));

    // Sheet 4: All Prescriptions (Detailed)
    const prescriptionsDetailData: any[] = [];
    allPrescriptions.forEach((prescription) => {
      if (prescription.prescriptionItems && prescription.prescriptionItems.length > 0) {
        prescription.prescriptionItems.forEach((item) => {
          prescriptionsDetailData.push({
            'Prescription ID': `RX_${prescription.id}`,
            'Anonymized Patient ID': getAnonymizedPatientId(prescription.patientId),
            'Drug Name': item.drugName,
            'Dosage': item.dosage || 'Not specified',
            'Frequency': item.frequency || 'Not specified',
            'Duration': item.duration || 'Not specified',
            'Status': prescription.status || 'active',
            'Prescribed Date': prescription.createdAt.toISOString().split('T')[0],
            'Dispensed Date': prescription.dispensedAt ? prescription.dispensedAt.toISOString().split('T')[0] : 'Not dispensed',
            'Hospital': prescription.hospital.name,
            'Hospital ID': prescription.hospitalId,
          });
        });
      } else {
        prescriptionsDetailData.push({
          'Prescription ID': `RX_${prescription.id}`,
          'Anonymized Patient ID': getAnonymizedPatientId(prescription.patientId),
          'Drug Name': 'No items',
          'Dosage': 'N/A',
          'Frequency': 'N/A',
          'Duration': 'N/A',
          'Status': prescription.status || 'active',
          'Prescribed Date': prescription.createdAt.toISOString().split('T')[0],
          'Dispensed Date': prescription.dispensedAt ? prescription.dispensedAt.toISOString().split('T')[0] : 'Not dispensed',
          'Hospital': prescription.hospital.name,
          'Hospital ID': prescription.hospitalId,
        });
      }
    });

    // Sheet 5: All Invoices (Anonymized)
    const invoicesData = allInvoices.map((invoice) => ({
      'Invoice ID': `INV_${invoice.id}`,
      'Anonymized Patient ID': invoice.patientId ? getAnonymizedPatientId(invoice.patientId) : 'NO_PATIENT',
      'Total Amount (NGN)': invoice.totalAmount ? parseFloat(invoice.totalAmount.toString()) : 0,
      'Paid Amount (NGN)': invoice.paidAmount ? parseFloat(invoice.paidAmount.toString()) : 0,
      'Balance (NGN)': invoice.totalAmount && invoice.paidAmount 
        ? parseFloat(invoice.totalAmount.toString()) - parseFloat(invoice.paidAmount.toString())
        : 0,
      'Status': invoice.status,
      'Payment Method': invoice.paymentMethod || 'Not specified',
      'Created Date': invoice.createdAt.toISOString().split('T')[0],
      'Hospital': invoice.hospital.name,
      'Hospital ID': invoice.hospitalId,
    }));

    // Sheet 6: All Lab Orders (Anonymized)
    const labOrdersData = allLabOrders.map((order) => ({
      'Lab Order ID': `LAB_${order.id}`,
      'Anonymized Patient ID': order.patientId ? getAnonymizedPatientId(order.patientId) : 'NO_PATIENT',
      'Order Type': order.orderType || 'Not specified',
      'Description': order.description || 'Not specified',
      'Status': order.status,
      'Order Date': order.createdAt.toISOString().split('T')[0],
      'Hospital': order.hospital.name,
      'Hospital ID': order.hospitalId,
    }));

    // Sheet 7: All Admissions (Anonymized)
    const admissionsData = allAdmissions.map((admission) => {
      const hospital = hospitals.find(h => h.id === admission.hospitalId);
      return {
        'Admission ID': `ADM_${admission.id}`,
        'Anonymized Patient ID': admission.patientId ? getAnonymizedPatientId(admission.patientId) : 'NO_PATIENT',
        'Ward': admission.ward || 'Not specified',
        'Bed Number': admission.bedNumber || 'Not assigned',
        'Admission Reason': admission.admissionReason || 'Not specified',
        'Admission Date': admission.admissionDate.toISOString().split('T')[0],
        'Discharge Date': admission.dischargeDate ? admission.dischargeDate.toISOString().split('T')[0] : 'Still admitted',
        'Status': admission.status,
        'Hospital': hospital?.name || 'Unknown',
        'Hospital ID': admission.hospitalId,
      };
    });

    // Sheet 8: Revenue by Hospital
    const revenueByHospital = hospitals.map((hospital) => {
      const hospitalInvoices = allInvoices.filter(inv => inv.hospitalId === hospital.id);
      const totalRev = hospitalInvoices.reduce((sum, inv) => 
        sum + (inv.totalAmount ? parseFloat(inv.totalAmount.toString()) : 0), 0
      );
      const paidRev = hospitalInvoices.reduce((sum, inv) => 
        sum + (inv.paidAmount ? parseFloat(inv.paidAmount.toString()) : 0), 0
      );
      return {
        'Hospital': hospital.name,
        'Hospital ID': hospital.id,
        'Total Invoices': hospitalInvoices.length,
        'Total Revenue (NGN)': totalRev,
        'Paid Revenue (NGN)': paidRev,
        'Outstanding (NGN)': totalRev - paidRev,
        'Collection Rate (%)': totalRev > 0 ? ((paidRev / totalRev) * 100).toFixed(2) : '0',
      };
    });

    // Sheet 9: Activity by Hospital
    const activityByHospital = hospitals.map((hospital) => ({
      'Hospital': hospital.name,
      'Hospital ID': hospital.id,
      'Total Patients': allPatients.filter(p => p.hospitalId === hospital.id).length,
      'Medical Records': allMedicalRecords.filter(r => r.hospitalId === hospital.id).length,
      'Prescriptions': allPrescriptions.filter(p => p.hospitalId === hospital.id).length,
      'Lab Orders': allLabOrders.filter(l => l.hospitalId === hospital.id).length,
      'Admissions': allAdmissions.filter(a => a.hospitalId === hospital.id).length,
      'Invoices': allInvoices.filter(i => i.hospitalId === hospital.id).length,
    }));

    // Sheet 10: Disease Statistics
    const diseaseMap = new Map<string, {
      count: number;
      patients: Set<string>;
      hospitals: Set<number>;
    }>();

    allMedicalRecords.forEach((record) => {
      if (record.diagnosis) {
        const diseases = record.diagnosis
          .split(/[,;.]/)
          .map((d) => d.trim())
          .filter((d) => d.length > 0);

        diseases.forEach((disease) => {
          const normalized = disease.toLowerCase();
          if (!diseaseMap.has(normalized)) {
            diseaseMap.set(normalized, {
              count: 0,
              patients: new Set(),
              hospitals: new Set(),
            });
          }
          const data = diseaseMap.get(normalized)!;
          data.count++;
          data.patients.add(getAnonymizedPatientId(record.patientId));
          data.hospitals.add(record.hospitalId);
        });
      }
    });

    const diseaseStatsData = Array.from(diseaseMap.entries())
      .map(([disease, data]) => ({
        'Disease': disease.charAt(0).toUpperCase() + disease.slice(1),
        'Total Cases': data.count,
        'Unique Patients': data.patients.size,
        'Hospitals Affected': data.hospitals.size,
      }))
      .sort((a, b) => b['Total Cases'] - a['Total Cases']);

    // Sheet 11: Patient Statistics
    const patientTypeData = patientsByType.map((item) => ({
      'Patient Type': item.patientType,
      'Count': item._count,
      'Percentage': ((item._count / totalPatients) * 100).toFixed(2) + '%',
    }));

    // Sheet 4: Activity Metrics
    const activityData = [
      { 'Metric': 'Total Prescriptions', 'All Time': totalPrescriptions, 'Last 7 Days': weeklyPrescriptions },
      { 'Metric': 'Total Invoices', 'All Time': totalInvoices, 'Last 7 Days': weeklyInvoices },
      { 'Metric': 'Total Medical Records', 'All Time': totalMedicalRecords, 'Last 7 Days': weeklyMedicalRecords },
      { 'Metric': 'Total Admissions', 'All Time': totalAdmissions, 'Last 7 Days': weeklyAdmissions },
      { 'Metric': 'Total Lab Orders', 'All Time': totalLabOrders, 'Last 7 Days': weeklyLabOrders },
      { 'Metric': 'Total Patients', 'All Time': totalPatients, 'Last 7 Days': '-' },
    ];

    // Sheet 5: Revenue Overview
    const revenueData = [
      { 'Metric': 'Total Revenue (All Invoices)', 'Amount (NGN)': totalRevenue._sum.totalAmount ? parseFloat(totalRevenue._sum.totalAmount.toString()) : 0 },
      { 'Metric': 'Paid Revenue', 'Amount (NGN)': paidRevenue._sum.totalAmount ? parseFloat(paidRevenue._sum.totalAmount.toString()) : 0 },
      { 'Metric': 'Collection Rate', 'Amount (NGN)': totalRevenue._sum.totalAmount && paidRevenue._sum.totalAmount 
          ? ((parseFloat(paidRevenue._sum.totalAmount.toString()) / parseFloat(totalRevenue._sum.totalAmount.toString())) * 100).toFixed(2) + '%'
          : '0%' 
      },
    ];

    // Sheet 6: Platform Summary
    const platformSummary = [
      { 'Metric': 'Total Hospitals', 'Value': hospitals.length },
      { 'Metric': 'Active Hospitals', 'Value': hospitals.filter(h => h.active).length },
      { 'Metric': 'Total Patients', 'Value': totalPatients },
      { 'Metric': 'Total Prescriptions', 'Value': totalPrescriptions },
      { 'Metric': 'Total Invoices', 'Value': totalInvoices },
      { 'Metric': 'Total Medical Records', 'Value': totalMedicalRecords },
      { 'Metric': 'Total Admissions', 'Value': totalAdmissions },
      { 'Metric': 'Total Lab Orders', 'Value': totalLabOrders },
      { 'Metric': 'Total Revenue (NGN)', 'Value': totalRevenue._sum.totalAmount ? parseFloat(totalRevenue._sum.totalAmount.toString()) : 0 },
      { 'Metric': 'Paid Revenue (NGN)', 'Value': paidRevenue._sum.totalAmount ? parseFloat(paidRevenue._sum.totalAmount.toString()) : 0 },
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add sheets
    const summarySheet = XLSX.utils.json_to_sheet(platformSummary);
    const hospitalsSheet = XLSX.utils.json_to_sheet(hospitalsData);
    const patientsSheet = XLSX.utils.json_to_sheet(patientsData);
    const medicalRecordsSheet = XLSX.utils.json_to_sheet(medicalRecordsData);
    const prescriptionsSheet = XLSX.utils.json_to_sheet(prescriptionsDetailData);
    const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
    const labOrdersSheet = XLSX.utils.json_to_sheet(labOrdersData);
    const admissionsSheet = XLSX.utils.json_to_sheet(admissionsData);
    const revenueByHospitalSheet = XLSX.utils.json_to_sheet(revenueByHospital);
    const activityByHospitalSheet = XLSX.utils.json_to_sheet(activityByHospital);
    const diseaseStatsSheet = XLSX.utils.json_to_sheet(diseaseStatsData);
    const patientTypeSheet = XLSX.utils.json_to_sheet(patientTypeData);
    const patientCountSheet = XLSX.utils.json_to_sheet(patientCountData);
    const activitySheet = XLSX.utils.json_to_sheet(activityData);
    const revenueSheet = XLSX.utils.json_to_sheet(revenueData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Platform Summary');
    XLSX.utils.book_append_sheet(workbook, hospitalsSheet, 'Hospitals');
    XLSX.utils.book_append_sheet(workbook, patientsSheet, 'All Patients');
    XLSX.utils.book_append_sheet(workbook, medicalRecordsSheet, 'Medical Records');
    XLSX.utils.book_append_sheet(workbook, prescriptionsSheet, 'Prescriptions');
    XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Invoices');
    XLSX.utils.book_append_sheet(workbook, labOrdersSheet, 'Lab Orders');
    XLSX.utils.book_append_sheet(workbook, admissionsSheet, 'Admissions');
    XLSX.utils.book_append_sheet(workbook, revenueByHospitalSheet, 'Revenue by Hospital');
    XLSX.utils.book_append_sheet(workbook, activityByHospitalSheet, 'Activity by Hospital');
    XLSX.utils.book_append_sheet(workbook, diseaseStatsSheet, 'Disease Statistics');
    XLSX.utils.book_append_sheet(workbook, patientTypeSheet, 'Patient Types');
    XLSX.utils.book_append_sheet(workbook, patientCountSheet, 'Patients by Hospital');
    XLSX.utils.book_append_sheet(workbook, activitySheet, 'Activity Metrics');
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Summary');

    // Generate file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    const filename = `super_admin_analytics_comprehensive_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting super admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}
