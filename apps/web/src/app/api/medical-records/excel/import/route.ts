import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

interface MedicalRecordRow {
  patientId: number;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan?: string;
  bp?: string;
  temperature?: number;
  pulse?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
  allergies?: string[];
  notes?: string;
  followUpDate?: string;
  rowNumber: number;
  errors: string[];
}

function validateMedicalRecordRow(row: any, rowIndex: number): MedicalRecordRow {
  const errors: string[] = [];

  const patientIdStr = row['Patient ID*']?.toString().trim();
  const visitDateStr = row['Visit Date* (YYYY-MM-DD)']?.toString().trim();
  const chiefComplaint = row['Chief Complaint*']?.toString().trim();
  const diagnosis = row['Diagnosis*']?.toString().trim();

  let patientId = 0;
  if (!patientIdStr) {
    errors.push('Patient ID is required');
  } else {
    patientId = parseInt(patientIdStr);
    if (isNaN(patientId)) {
      errors.push('Patient ID must be a number');
    }
  }

  let visitDate = '';
  if (!visitDateStr) {
    errors.push('Visit Date is required');
  } else {
    const date = new Date(visitDateStr);
    if (isNaN(date.getTime())) {
      errors.push('Invalid Visit Date format (use YYYY-MM-DD)');
    } else {
      visitDate = date.toISOString().split('T')[0];
    }
  }

  if (!chiefComplaint) errors.push('Chief Complaint is required');
  if (!diagnosis) errors.push('Diagnosis is required');

  let followUpDate: string | undefined;
  const followUpDateStr = row['Follow-up Date (YYYY-MM-DD)']?.toString().trim();
  if (followUpDateStr) {
    const date = new Date(followUpDateStr);
    if (isNaN(date.getTime())) {
      errors.push('Invalid Follow-up Date format');
    } else {
      followUpDate = date.toISOString().split('T')[0];
    }
  }

  const allergiesStr = row['Allergies (comma-separated)']?.toString().trim();
  const allergies = allergiesStr
    ? allergiesStr.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
    : [];

  const temperatureStr = row['Vital Signs (Temperature)']?.toString().trim();
  const temperature = temperatureStr ? parseFloat(temperatureStr) : undefined;

  const pulseStr = row['Vital Signs (Pulse)']?.toString().trim();
  const pulse = pulseStr ? parseInt(pulseStr) : undefined;

  const rrStr = row['Vital Signs (Respiratory Rate)']?.toString().trim();
  const respiratoryRate = rrStr ? parseInt(rrStr) : undefined;

  const weightStr = row['Vital Signs (Weight kg)']?.toString().trim();
  const weight = weightStr ? parseFloat(weightStr) : undefined;

  const heightStr = row['Vital Signs (Height cm)']?.toString().trim();
  const height = heightStr ? parseFloat(heightStr) : undefined;

  return {
    patientId,
    visitDate,
    chiefComplaint: chiefComplaint || '',
    diagnosis: diagnosis || '',
    treatmentPlan: row['Treatment Plan']?.toString().trim() || undefined,
    bp: row['Vital Signs (BP)']?.toString().trim() || undefined,
    temperature,
    pulse,
    respiratoryRate,
    weight,
    height,
    allergies: allergies.length > 0 ? allergies : undefined,
    notes: row['Notes']?.toString().trim() || undefined,
    followUpDate,
    rowNumber: rowIndex + 2,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiResponse({ error: 'No file provided' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return apiResponse({ error: 'Excel file is empty or has no data' }, 400);
    }

    const validatedRows: MedicalRecordRow[] = jsonData.map((row, index) =>
      validateMedicalRecordRow(row, index)
    );

    const validRows = validatedRows.filter(row => row.errors.length === 0);
    const invalidRows = validatedRows.filter(row => row.errors.length > 0);

    if (validRows.length === 0) {
      return apiResponse({
        success: false,
        message: 'No valid records found',
        imported: 0,
        failed: invalidRows.length,
        errors: invalidRows.map(row => ({
          row: row.rowNumber,
          errors: row.errors,
          data: {
            patientId: row.patientId,
            chiefComplaint: row.chiefComplaint,
          },
        })),
      }, 400);
    }

    const importResults = [];
    const importErrors = [];

    for (const row of validRows) {
      try {
        // Verify patient exists
        const patient = await prisma.patient.findUnique({
          where: { id: row.patientId },
        });

        if (!patient) {
          importErrors.push({
            row: row.rowNumber,
            errors: [`Patient ID ${row.patientId} not found`],
            data: { patientId: row.patientId },
          });
          continue;
        }

        // Create medical record
        const medicalRecord = await prisma.medicalRecord.create({
          data: {
            hospitalId,
            patientId: row.patientId,
            userId,
            visitDate: new Date(row.visitDate),
            chiefComplaint: row.chiefComplaint,
            diagnosis: row.diagnosis,
            treatmentPlan: row.treatmentPlan || undefined,
            allergies: row.allergies ? (JSON.stringify(row.allergies) as any) : undefined,
            notes: row.notes || undefined,
            followUpDate: row.followUpDate ? new Date(row.followUpDate) : undefined,
          },
        });

        // Create vital signs if provided
        if (row.bp || row.temperature || row.pulse || row.respiratoryRate || row.weight || row.height) {
          await prisma.vital.create({
            data: {
              hospitalId,
              patientId: row.patientId,
              recordedBy: userId,
              bloodPressure: row.bp || undefined,
              temperature: row.temperature || undefined,
              pulse: row.pulse || undefined,
              respiratoryRate: row.respiratoryRate || undefined,
              weight: row.weight || undefined,
              height: row.height || undefined,
            },
          });
        }

        importResults.push({
          row: row.rowNumber,
          recordId: medicalRecord.id,
          patientId: row.patientId,
          success: true,
        });
      } catch (error: any) {
        importErrors.push({
          row: row.rowNumber,
          errors: [error.message || 'Database error'],
          data: {
            patientId: row.patientId,
            chiefComplaint: row.chiefComplaint,
          },
        });
      }
    }

    return apiResponse({
      success: true,
      message: `Successfully imported ${importResults.length} medical record(s)`,
      imported: importResults.length,
      failed: invalidRows.length + importErrors.length,
      results: importResults,
      errors: [
        ...invalidRows.map(row => ({
          row: row.rowNumber,
          errors: row.errors,
          data: { patientId: row.patientId },
        })),
        ...importErrors,
      ],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
