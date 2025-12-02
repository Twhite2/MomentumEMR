import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import { Decimal } from '@prisma/client/runtime/library';

interface VitalRow {
  patientId: number;
  temperature?: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  recordedAt: Date;
  notes?: string;
  rowNumber: number;
  errors: string[];
}

function calculateBMI(weight?: number, height?: number): number | undefined {
  if (!weight || !height) return undefined;
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 100) / 100; // Round to 2 decimal places
}

function validateVitalRow(row: any, rowIndex: number): VitalRow {
  const errors: string[] = [];
  
  // Required fields
  const patientIdStr = row['Patient ID*']?.toString().trim();
  const bpSysStr = row['Blood Pressure Systolic* (mmHg)']?.toString().trim();
  const bpDiaStr = row['Blood Pressure Diastolic* (mmHg)']?.toString().trim();
  const recordedAtStr = row['Recorded Date* (YYYY-MM-DD HH:mm)']?.toString().trim();

  // Validate Patient ID
  let patientId = 0;
  if (!patientIdStr) {
    errors.push('Patient ID is required');
  } else {
    const parsedId = parseInt(patientIdStr);
    if (isNaN(parsedId) || parsedId <= 0) {
      errors.push('Patient ID must be a positive number');
    } else {
      patientId = parsedId;
    }
  }

  // Validate Blood Pressure
  let bloodPressureSys = 0;
  let bloodPressureDia = 0;
  
  if (!bpSysStr) {
    errors.push('Blood Pressure Systolic is required');
  } else {
    const parsed = parseInt(bpSysStr);
    if (isNaN(parsed) || parsed < 60 || parsed > 250) {
      errors.push('Blood Pressure Systolic must be between 60 and 250 mmHg');
    } else {
      bloodPressureSys = parsed;
    }
  }

  if (!bpDiaStr) {
    errors.push('Blood Pressure Diastolic is required');
  } else {
    const parsed = parseInt(bpDiaStr);
    if (isNaN(parsed) || parsed < 40 || parsed > 150) {
      errors.push('Blood Pressure Diastolic must be between 40 and 150 mmHg');
    } else {
      bloodPressureDia = parsed;
    }
  }

  // Validate BP relationship
  if (bloodPressureSys > 0 && bloodPressureDia > 0 && bloodPressureDia >= bloodPressureSys) {
    errors.push('Diastolic pressure must be lower than Systolic pressure');
  }

  // Validate Recorded Date
  let recordedAt = new Date();
  if (!recordedAtStr) {
    errors.push('Recorded Date is required');
  } else {
    const date = new Date(recordedAtStr);
    if (isNaN(date.getTime())) {
      errors.push('Invalid Recorded Date format (use YYYY-MM-DD HH:mm)');
    } else {
      recordedAt = date;
    }
  }

  // Optional fields with validation
  let temperature: number | undefined;
  const tempStr = row['Temperature (°C)']?.toString().trim();
  if (tempStr) {
    const temp = parseFloat(tempStr);
    if (isNaN(temp) || temp < 30 || temp > 45) {
      errors.push('Temperature must be between 30°C and 45°C');
    } else {
      temperature = temp;
    }
  }

  let heartRate: number | undefined;
  const hrStr = row['Heart Rate (BPM)']?.toString().trim();
  if (hrStr) {
    const hr = parseInt(hrStr);
    if (isNaN(hr) || hr < 30 || hr > 250) {
      errors.push('Heart Rate must be between 30 and 250 BPM');
    } else {
      heartRate = hr;
    }
  }

  let respiratoryRate: number | undefined;
  const rrStr = row['Respiratory Rate (per min)']?.toString().trim();
  if (rrStr) {
    const rr = parseInt(rrStr);
    if (isNaN(rr) || rr < 5 || rr > 60) {
      errors.push('Respiratory Rate must be between 5 and 60 per minute');
    } else {
      respiratoryRate = rr;
    }
  }

  let oxygenSaturation: number | undefined;
  const o2Str = row['Oxygen Saturation (%)']?.toString().trim();
  if (o2Str) {
    const o2 = parseFloat(o2Str);
    if (isNaN(o2) || o2 < 70 || o2 > 100) {
      errors.push('Oxygen Saturation must be between 70% and 100%');
    } else {
      oxygenSaturation = o2;
    }
  }

  let weight: number | undefined;
  const weightStr = row['Weight (kg)']?.toString().trim();
  if (weightStr) {
    const w = parseFloat(weightStr);
    if (isNaN(w) || w < 1 || w > 500) {
      errors.push('Weight must be between 1 and 500 kg');
    } else {
      weight = w;
    }
  }

  let height: number | undefined;
  const heightStr = row['Height (cm)']?.toString().trim();
  if (heightStr) {
    const h = parseFloat(heightStr);
    if (isNaN(h) || h < 30 || h > 300) {
      errors.push('Height must be between 30 and 300 cm');
    } else {
      height = h;
    }
  }

  // Calculate BMI if weight and height are provided
  const bmi = calculateBMI(weight, height);

  const notes = row['Notes']?.toString().trim() || undefined;

  return {
    patientId,
    temperature,
    bloodPressureSys,
    bloodPressureDia,
    heartRate,
    respiratoryRate,
    oxygenSaturation,
    weight,
    height,
    bmi,
    recordedAt,
    notes,
    rowNumber: rowIndex + 2, // +2 because Excel is 1-indexed and has header row
    errors,
  };
}

// POST /api/vitals/excel/import - Import vitals from Excel file
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const recordedBy = session.user.id;

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiResponse({ error: 'No file provided' }, 400);
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return apiResponse({ error: 'Excel file is empty or has no data' }, 400);
    }

    // Validate all rows
    const validatedRows: VitalRow[] = jsonData.map((row, index) => 
      validateVitalRow(row, index)
    );

    // Separate valid and invalid rows
    const validRows = validatedRows.filter(row => row.errors.length === 0);
    const invalidRows = validatedRows.filter(row => row.errors.length > 0);

    // If no valid rows, return errors
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
          },
        })),
      }, 400);
    }

    // Verify all patient IDs exist in the hospital
    const patientIds = validRows.map(row => row.patientId);
    const existingPatients = await prisma.patient.findMany({
      where: {
        id: { in: patientIds },
        hospitalId,
      },
      select: { id: true },
    });

    const existingPatientIds = new Set(existingPatients.map(p => p.id));
    
    // Filter out rows with non-existent patient IDs
    const rowsWithValidPatients = validRows.filter(row => existingPatientIds.has(row.patientId));
    const rowsWithInvalidPatients = validRows.filter(row => !existingPatientIds.has(row.patientId));

    // Add patient not found errors
    const patientNotFoundErrors = rowsWithInvalidPatients.map(row => ({
      row: row.rowNumber,
      errors: [`Patient ID ${row.patientId} not found in this hospital`],
      data: {
        patientId: row.patientId,
      },
    }));

    // Import valid rows
    const importResults = [];
    const importErrors = [];

    for (const row of rowsWithValidPatients) {
      try {
        const vital = await prisma.vital.create({
          data: {
            hospitalId,
            patientId: row.patientId,
            recordedBy,
            temperature: row.temperature ? new Decimal(row.temperature) : null,
            bloodPressureSys: row.bloodPressureSys,
            bloodPressureDia: row.bloodPressureDia,
            heartRate: row.heartRate || null,
            respiratoryRate: row.respiratoryRate || null,
            oxygenSaturation: row.oxygenSaturation ? new Decimal(row.oxygenSaturation) : null,
            weight: row.weight ? new Decimal(row.weight) : null,
            height: row.height ? new Decimal(row.height) : null,
            bmi: row.bmi ? new Decimal(row.bmi) : null,
            notes: row.notes || null,
            recordedAt: row.recordedAt,
          },
        });

        importResults.push({
          row: row.rowNumber,
          vitalId: vital.id,
          patientId: row.patientId,
          success: true,
        });
      } catch (error: any) {
        importErrors.push({
          row: row.rowNumber,
          errors: [error.message || 'Database error'],
          data: {
            patientId: row.patientId,
          },
        });
      }
    }

    return apiResponse({
      success: true,
      message: `Successfully imported ${importResults.length} vital record(s)`,
      imported: importResults.length,
      failed: invalidRows.length + patientNotFoundErrors.length + importErrors.length,
      results: importResults,
      errors: [
        ...invalidRows.map(row => ({
          row: row.rowNumber,
          errors: row.errors,
          data: { patientId: row.patientId },
        })),
        ...patientNotFoundErrors,
        ...importErrors,
      ],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
