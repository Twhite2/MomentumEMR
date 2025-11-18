import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

interface MedicalRecordRow {
  patientId: number;
  visitDate: string;
  diagnosis: string;
  notes?: string;
  allergies?: string[];
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  weight?: string;
  height?: string;
  rowNumber: number;
  errors: string[];
}

function validateMedicalRecordRow(row: any, rowIndex: number): MedicalRecordRow {
  const errors: string[] = [];

  const patientIdStr = row['Patient ID*']?.toString().trim();
  const visitDateStr = row['Visit Date* (YYYY-MM-DD)']?.toString().trim();
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

  // Chief Complaint removed - not in schema
  if (!diagnosis) errors.push('Diagnosis is required');

  const allergiesStr = row['Allergies (comma-separated)']?.toString().trim();
  const allergies = allergiesStr
    ? allergiesStr.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
    : [];

  return {
    patientId,
    visitDate,
    diagnosis: diagnosis || '',
    notes: row['Notes']?.toString().trim() || undefined,
    allergies: allergies.length > 0 ? allergies : undefined,
    temperature: row['Vital Signs (Temperature)']?.toString().trim() || undefined,
    heartRate: row['Vital Signs (Heart Rate)']?.toString().trim() || undefined,
    respiratoryRate: row['Vital Signs (Respiratory Rate)']?.toString().trim() || undefined,
    weight: row['Vital Signs (Weight kg)']?.toString().trim() || undefined,
    height: row['Vital Signs (Height cm)']?.toString().trim() || undefined,
    rowNumber: rowIndex + 2,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);

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
            doctorId: userId,
            visitDate: new Date(row.visitDate),
            diagnosis: row.diagnosis,
            notes: row.notes || undefined,
            allergies: row.allergies ? (JSON.stringify(row.allergies) as any) : undefined,
          },
        });

        // Create vital signs if provided
        if (row.temperature || row.heartRate || row.respiratoryRate || row.weight || row.height) {
          await prisma.vital.create({
            data: {
              hospitalId,
              patientId: row.patientId,
              recordedBy: userId,
              temperature: row.temperature ? parseFloat(row.temperature) : undefined,
              heartRate: row.heartRate ? parseInt(row.heartRate) : undefined,
              respiratoryRate: row.respiratoryRate ? parseInt(row.respiratoryRate) : undefined,
              weight: row.weight ? parseFloat(row.weight) : undefined,
              height: row.height ? parseFloat(row.height) : undefined,
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
