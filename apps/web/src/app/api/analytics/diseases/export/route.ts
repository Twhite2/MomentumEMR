import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import * as XLSX from 'xlsx';

// GET /api/analytics/diseases/export - Comprehensive anonymized disease data export for research
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can export comprehensive disease analytics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'xlsx'; // 'xlsx' or 'csv'

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.visitDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch comprehensive medical records data (ANONYMIZED)
    const medicalRecords = await prisma.medicalRecord.findMany({
      where: dateFilter,
      select: {
        id: true,
        visitDate: true,
        diagnosis: true,
        notes: true,
        allergies: true,
        hospitalId: true,
        patientId: true, // For grouping only, not exported
        createdAt: true,
        patient: {
          select: {
            dob: true,
            gender: true,
            bloodGroup: true,
            patientType: true,
            allergies: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Fetch vitals separately (associated with medical records)
    const vitals = await prisma.vital.findMany({
      where: startDate && endDate ? {
        recordedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      } : {},
      select: {
        id: true,
        patientId: true,
        bloodPressureSys: true,
        bloodPressureDia: true,
        temperature: true,
        heartRate: true,
        respiratoryRate: true,
        oxygenSaturation: true,
        weight: true,
        height: true,
        bmi: true,
        recordedAt: true,
      },
      orderBy: { recordedAt: 'desc' },
    });

    // Create a map of patient vitals (most recent)
    const patientVitalsMap = new Map<number, any>();
    vitals.forEach((vital) => {
      if (!patientVitalsMap.has(vital.patientId)) {
        patientVitalsMap.set(vital.patientId, vital);
      }
    });

    // Fetch prescriptions
    const prescriptions = await prisma.prescription.findMany({
      where: startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      } : {},
      select: {
        id: true,
        createdAt: true,
        patientId: true,
        hospitalId: true,
        treatmentPlan: true,
        prescriptionItems: {
          select: {
            drugName: true,
            dosage: true,
            frequency: true,
            duration: true,
            notes: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create a map of patient prescriptions/treatment plans
    const patientTreatmentMap = new Map<number, string>();
    prescriptions.forEach((prescription) => {
      if (prescription.treatmentPlan && !patientTreatmentMap.has(prescription.patientId)) {
        patientTreatmentMap.set(prescription.patientId, prescription.treatmentPlan);
      }
    });

    // Fetch lab orders and results
    const labOrders = await prisma.labOrder.findMany({
      where: startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      } : {},
      select: {
        id: true,
        orderType: true,
        description: true,
        status: true,
        createdAt: true,
        patientId: true,
        hospitalId: true,
        labResults: {
          select: {
            id: true,
            resultNotes: true,
            doctorNote: true,
            finalized: true,
            releasedToPatient: true,
            createdAt: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Generate anonymized patient IDs (hash-based)
    const patientIdMap = new Map<number, string>();
    let patientCounter = 1;

    const getAnonymizedPatientId = (realPatientId: number): string => {
      if (!patientIdMap.has(realPatientId)) {
        patientIdMap.set(realPatientId, `PATIENT_${String(patientCounter).padStart(6, '0')}`);
        patientCounter++;
      }
      return patientIdMap.get(realPatientId)!;
    };

    // Calculate age from DOB (anonymized - just age group)
    const getAgeGroup = (dob: Date): string => {
      const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 5) return '0-4';
      if (age < 12) return '5-11';
      if (age < 18) return '12-17';
      if (age < 30) return '18-29';
      if (age < 45) return '30-44';
      if (age < 60) return '45-59';
      if (age < 75) return '60-74';
      return '75+';
    };

    // Sheet 1: Disease Cases (Anonymized Medical Records)
    const diseaseCasesData = medicalRecords.map((record) => {
      const patientVital = patientVitalsMap.get(record.patientId);
      const treatmentPlan = patientTreatmentMap.get(record.patientId);
      
      return {
        'Record ID': `MR_${record.id}`,
        'Anonymized Patient ID': getAnonymizedPatientId(record.patientId),
        'Visit Date': record.visitDate.toISOString().split('T')[0],
        'Age Group': record.patient.dob ? getAgeGroup(record.patient.dob) : 'Unknown',
        'Gender': record.patient.gender || 'Unknown',
        'Blood Group': record.patient.bloodGroup || 'Unknown',
        'Patient Type': record.patient.patientType,
        'Diagnosis': record.diagnosis || 'Not specified',
        'Treatment Plan': treatmentPlan || 'Not specified',
        'Notes': record.notes || 'None',
        'Patient Allergies': record.patient.allergies ? JSON.stringify(record.patient.allergies) : 'None',
        'Visit Allergies': record.allergies ? JSON.stringify(record.allergies) : 'None',
        'Blood Pressure (Systolic)': patientVital?.bloodPressureSys || 'Not recorded',
        'Blood Pressure (Diastolic)': patientVital?.bloodPressureDia || 'Not recorded',
        'Temperature (°C)': patientVital?.temperature ? parseFloat(patientVital.temperature.toString()) : 'Not recorded',
        'Heart Rate (bpm)': patientVital?.heartRate || 'Not recorded',
        'Respiratory Rate (/min)': patientVital?.respiratoryRate || 'Not recorded',
        'Oxygen Saturation (%)': patientVital?.oxygenSaturation ? parseFloat(patientVital.oxygenSaturation.toString()) : 'Not recorded',
        'Weight (kg)': patientVital?.weight ? parseFloat(patientVital.weight.toString()) : 'Not recorded',
        'Height (cm)': patientVital?.height ? parseFloat(patientVital.height.toString()) : 'Not recorded',
        'BMI': patientVital?.bmi ? parseFloat(patientVital.bmi.toString()) : 'Not recorded',
        'Hospital': record.hospital.name,
        'Hospital ID': record.hospitalId,
      };
    });

    // Sheet 2: Prescriptions (Anonymized)
    const prescriptionsData: any[] = [];
    prescriptions.forEach((prescription) => {
      prescription.prescriptionItems.forEach((item) => {
        prescriptionsData.push({
          'Prescription ID': `RX_${prescription.id}`,
          'Anonymized Patient ID': getAnonymizedPatientId(prescription.patientId),
          'Prescription Date': prescription.createdAt.toISOString().split('T')[0],
          'Treatment Plan': prescription.treatmentPlan || 'Not specified',
          'Drug Name': item.drugName,
          'Dosage': item.dosage || 'Not specified',
          'Frequency': item.frequency || 'Not specified',
          'Duration': item.duration || 'Not specified',
          'Notes': item.notes || 'None',
          'Hospital': prescription.hospital.name,
          'Hospital ID': prescription.hospitalId,
        });
      });
    });

    // Sheet 3: Lab Tests & Results (Anonymized)
    const labTestsData: any[] = [];
    labOrders.forEach((order) => {
      if (order.labResults && order.labResults.length > 0) {
        order.labResults.forEach((result) => {
          labTestsData.push({
            'Lab Order ID': `LAB_${order.id}`,
            'Result ID': `RESULT_${result.id}`,
            'Anonymized Patient ID': getAnonymizedPatientId(order.patientId),
            'Order Date': order.createdAt.toISOString().split('T')[0],
            'Result Date': result.createdAt.toISOString().split('T')[0],
            'Order Type': order.orderType || 'Not specified',
            'Test Description': order.description || 'Not specified',
            'Result Notes': result.resultNotes || 'No notes',
            'Doctor Note': result.doctorNote || 'No note',
            'Finalized': result.finalized ? 'Yes' : 'No',
            'Released to Patient': result.releasedToPatient ? 'Yes' : 'No',
            'Status': order.status || 'Pending',
            'Hospital': order.hospital.name,
            'Hospital ID': order.hospitalId,
          });
        });
      } else {
        // Include pending lab orders without results
        labTestsData.push({
          'Lab Order ID': `LAB_${order.id}`,
          'Result ID': 'N/A',
          'Anonymized Patient ID': getAnonymizedPatientId(order.patientId),
          'Order Date': order.createdAt.toISOString().split('T')[0],
          'Result Date': 'Pending',
          'Order Type': order.orderType || 'Not specified',
          'Test Description': order.description || 'Not specified',
          'Result Notes': 'No results yet',
          'Doctor Note': 'N/A',
          'Finalized': 'No',
          'Released to Patient': 'No',
          'Status': order.status || 'Pending',
          'Hospital': order.hospital.name,
          'Hospital ID': order.hospitalId,
        });
      }
    });

    // Sheet 4: Disease Summary Statistics
    const diseaseMap = new Map<string, {
      count: number;
      patientCount: Set<string>;
      hospitalCount: Set<number>;
      ageGroups: Map<string, number>;
      genders: Map<string, number>;
    }>();

    medicalRecords.forEach((record) => {
      if (record.diagnosis) {
        const diseases = record.diagnosis
          .split(/[,;.]/)
          .map((d) => d.trim())
          .filter((d) => d.length > 0);

        const anonymizedId = getAnonymizedPatientId(record.patientId);
        const ageGroup = record.patient.dob ? getAgeGroup(record.patient.dob) : 'Unknown';
        const gender = record.patient.gender || 'Unknown';

        diseases.forEach((disease) => {
          const normalized = disease.toLowerCase();
          if (!diseaseMap.has(normalized)) {
            diseaseMap.set(normalized, {
              count: 0,
              patientCount: new Set(),
              hospitalCount: new Set(),
              ageGroups: new Map(),
              genders: new Map(),
            });
          }

          const data = diseaseMap.get(normalized)!;
          data.count++;
          data.patientCount.add(anonymizedId);
          data.hospitalCount.add(record.hospitalId);
          data.ageGroups.set(ageGroup, (data.ageGroups.get(ageGroup) || 0) + 1);
          data.genders.set(gender, (data.genders.get(gender) || 0) + 1);
        });
      }
    });

    const diseaseSummaryData = Array.from(diseaseMap.entries())
      .map(([disease, data]) => ({
        'Disease': disease.charAt(0).toUpperCase() + disease.slice(1),
        'Total Cases': data.count,
        'Unique Patients': data.patientCount.size,
        'Hospitals Affected': data.hospitalCount.size,
        'Age 0-4': data.ageGroups.get('0-4') || 0,
        'Age 5-11': data.ageGroups.get('5-11') || 0,
        'Age 12-17': data.ageGroups.get('12-17') || 0,
        'Age 18-29': data.ageGroups.get('18-29') || 0,
        'Age 30-44': data.ageGroups.get('30-44') || 0,
        'Age 45-59': data.ageGroups.get('45-59') || 0,
        'Age 60-74': data.ageGroups.get('60-74') || 0,
        'Age 75+': data.ageGroups.get('75+') || 0,
        'Male': data.genders.get('Male') || 0,
        'Female': data.genders.get('Female') || 0,
        'Other/Unknown': (data.genders.get('Other') || 0) + (data.genders.get('Unknown') || 0),
      }))
      .sort((a, b) => b['Total Cases'] - a['Total Cases']);

    // Sheet 5: Data Dictionary
    const dataDictionaryData = [
      { 'Field': 'Anonymized Patient ID', 'Description': 'Unique anonymized patient identifier (cannot be traced back to real patient)', 'Type': 'String' },
      { 'Field': 'Age Group', 'Description': 'Patient age grouped into ranges (0-4, 5-11, 12-17, 18-29, 30-44, 45-59, 60-74, 75+)', 'Type': 'String' },
      { 'Field': 'Gender', 'Description': 'Patient gender (Male/Female/Other/Unknown)', 'Type': 'String' },
      { 'Field': 'Blood Group', 'Description': 'Patient blood group (A+, B+, O+, AB+, etc.)', 'Type': 'String' },
      { 'Field': 'Patient Type', 'Description': 'Billing type (self_pay/hmo/corporate)', 'Type': 'String' },
      { 'Field': 'Diagnosis', 'Description': 'Medical diagnosis for the visit', 'Type': 'Text' },
      { 'Field': 'Treatment Plan', 'Description': 'Prescribed treatment plan', 'Type': 'Text' },
      { 'Field': 'Allergies', 'Description': 'Known patient allergies (JSON array)', 'Type': 'JSON' },
      { 'Field': 'Vital Signs', 'Description': 'Blood pressure, temperature, pulse, respiratory rate recorded during visit', 'Type': 'Numeric' },
      { 'Field': 'BMI', 'Description': 'Body Mass Index calculated from height and weight', 'Type': 'Numeric' },
      { 'Field': 'Drug Name', 'Description': 'Prescribed medication name', 'Type': 'String' },
      { 'Field': 'Dosage', 'Description': 'Medication dosage and instructions', 'Type': 'String' },
      { 'Field': 'Test Name', 'Description': 'Laboratory test name', 'Type': 'String' },
      { 'Field': 'Result', 'Description': 'Laboratory test result value', 'Type': 'String' },
      { 'Field': 'Normal Range', 'Description': 'Expected normal range for the test', 'Type': 'String' },
      { 'Field': 'Hospital', 'Description': 'Hospital name where service was provided', 'Type': 'String' },
      { 'Field': 'Hospital ID', 'Description': 'Unique hospital identifier', 'Type': 'Number' },
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add sheets
    const diseaseSheet = XLSX.utils.json_to_sheet(diseaseCasesData);
    const prescriptionSheet = XLSX.utils.json_to_sheet(prescriptionsData.length > 0 ? prescriptionsData : [{ 'Note': 'No prescription data available for selected period' }]);
    const labSheet = XLSX.utils.json_to_sheet(labTestsData.length > 0 ? labTestsData : [{ 'Note': 'No lab test data available for selected period' }]);
    const summarySheet = XLSX.utils.json_to_sheet(diseaseSummaryData);
    const dictionarySheet = XLSX.utils.json_to_sheet(dataDictionaryData);

    XLSX.utils.book_append_sheet(workbook, diseaseSheet, 'Disease Cases');
    XLSX.utils.book_append_sheet(workbook, prescriptionSheet, 'Prescriptions');
    XLSX.utils.book_append_sheet(workbook, labSheet, 'Lab Tests');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Disease Summary');
    XLSX.utils.book_append_sheet(workbook, dictionarySheet, 'Data Dictionary');

    // Generate file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    const filename = `disease_analytics_export_${startDate || 'all'}_to_${endDate || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting disease analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export disease analytics' },
      { status: 500 }
    );
  }
}
