import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

interface PatientRow {
  firstName: string;
  lastName: string;
  hospitalNumber?: string;
  dob: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  bloodGroup?: string;
  allergies?: string[];
  patientType: 'self_pay' | 'hmo' | 'corporate';
  hmoProvider?: string;
  corporateClient?: string;
  notes?: string;
  rowNumber: number;
  errors: string[];
}

function validatePatientRow(row: any, rowIndex: number): PatientRow {
  const errors: string[] = [];
  
  // Required fields
  const firstName = row['First Name*']?.toString().trim();
  const lastName = row['Last Name*']?.toString().trim();
  const dobStr = row['Date of Birth* (MM/DD/YYYY)']?.toString().trim();
  const gender = row['Gender* (Male/Female/Other)']?.toString().trim();
  const patientType = row['Patient Type* (self_pay/hmo/corporate)']?.toString().trim().toLowerCase();

  if (!firstName) errors.push('First Name is required');
  if (!lastName) errors.push('Last Name is required');
  
  // Validate date of birth - parse MM/DD/YYYY format
  let dob = '';
  if (!dobStr) {
    errors.push('Date of Birth is required');
  } else {
    // Parse MM/DD/YYYY format
    const parts = dobStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      const dobDate = new Date(year, month - 1, day);
      
      if (isNaN(dobDate.getTime()) || month < 1 || month > 12 || day < 1 || day > 31) {
        errors.push('Invalid Date of Birth format (use MM/DD/YYYY)');
      } else {
        dob = dobDate.toISOString().split('T')[0];
      }
    } else {
      errors.push('Invalid Date of Birth format (use MM/DD/YYYY)');
    }
  }

  // Validate gender
  if (!gender) {
    errors.push('Gender is required');
  } else if (!['Male', 'Female', 'Other'].includes(gender)) {
    errors.push('Gender must be Male, Female, or Other');
  }

  // Validate patient type
  if (!patientType) {
    errors.push('Patient Type is required');
  } else if (!['self_pay', 'hmo', 'corporate'].includes(patientType)) {
    errors.push('Patient Type must be self_pay, hmo, or corporate');
  }

  // Validate blood group if provided
  const bloodGroup = row['Blood Group (A+/A-/B+/B-/O+/O-/AB+/AB-)']?.toString().trim();
  if (bloodGroup && !['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(bloodGroup)) {
    errors.push('Invalid Blood Group');
  }

  // Validate email format if provided
  const email = row['Email Address']?.toString().trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  // Parse allergies
  const allergiesStr = row['Allergies (comma-separated)']?.toString().trim();
  const allergies = allergiesStr 
    ? allergiesStr.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
    : [];

  return {
    firstName: firstName || '',
    lastName: lastName || '',
    hospitalNumber: row['Hospital Number (Family/Household)']?.toString().trim() || undefined,
    dob,
    gender: gender || '',
    phone: row['Phone Number']?.toString().trim() || undefined,
    email: email || undefined,
    address: row['Home Address']?.toString().trim() || undefined,
    emergencyContactName: row['Emergency Contact Name']?.toString().trim() || undefined,
    emergencyContactPhone: row['Emergency Contact Phone']?.toString().trim() || undefined,
    emergencyContactRelationship: row['Emergency Contact Relationship']?.toString().trim() || undefined,
    bloodGroup: bloodGroup || undefined,
    allergies: allergies.length > 0 ? allergies : undefined,
    patientType: patientType as any || 'self_pay',
    hmoProvider: row['HMO Provider (if HMO)']?.toString().trim() || undefined,
    corporateClient: row['Corporate Client (if corporate)']?.toString().trim() || undefined,
    notes: row['Notes']?.toString().trim() || undefined,
    rowNumber: rowIndex + 2, // +2 because Excel is 1-indexed and has header row
    errors,
  };
}

// POST /api/patients/excel/import - Import patients from Excel file
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);

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
    const validatedRows: PatientRow[] = jsonData.map((row, index) => 
      validatePatientRow(row, index)
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
            firstName: row.firstName,
            lastName: row.lastName,
          },
        })),
      }, 400);
    }

    // Import valid rows
    const importResults = [];
    const importErrors = [];

    for (const row of validRows) {
      try {
        // Generate password for patient portal using crypto.randomBytes
        const temporaryPassword = crypto.randomBytes(8).toString('base64').slice(0, 12);
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        // Create user account
        const user = await prisma.user.create({
          data: {
            hospitalId,
            name: `${row.firstName} ${row.lastName}`,
            email: row.email || `patient${Date.now()}_${crypto.randomBytes(6).toString('hex')}@placeholder.com`,
            hashedPassword: hashedPassword,
            role: 'patient',
          },
        });

        // Create patient record
        const contactInfo: any = {};
        if (row.phone) contactInfo.phone = row.phone;
        if (row.email) contactInfo.email = row.email;

        // Combine emergency contact name, phone, and relationship
        let emergencyContact = undefined;
        if (row.emergencyContactName || row.emergencyContactPhone || row.emergencyContactRelationship) {
          const parts = [];
          if (row.emergencyContactName) parts.push(row.emergencyContactName);
          if (row.emergencyContactPhone) parts.push(row.emergencyContactPhone);
          if (row.emergencyContactRelationship) parts.push(`(${row.emergencyContactRelationship})`);
          emergencyContact = parts.join(' - ');
        }

        const patient = await prisma.patient.create({
          data: {
            hospitalId,
            userId: user.id,
            firstName: row.firstName,
            lastName: row.lastName,
            hospitalNumber: row.hospitalNumber || undefined,
            dob: new Date(row.dob),
            gender: row.gender,
            contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
            address: row.address || undefined,
            emergencyContact: emergencyContact,
            bloodGroup: row.bloodGroup || undefined,
            allergies: row.allergies ? (JSON.stringify(row.allergies) as any) : undefined,
            patientType: row.patientType,
          },
        });

        importResults.push({
          row: row.rowNumber,
          patientId: patient.id,
          name: `${row.firstName} ${row.lastName}`,
          success: true,
        });
      } catch (error: any) {
        importErrors.push({
          row: row.rowNumber,
          errors: [error.message || 'Database error'],
          data: {
            firstName: row.firstName,
            lastName: row.lastName,
          },
        });
      }
    }

    return apiResponse({
      success: true,
      message: `Successfully imported ${importResults.length} patient(s)`,
      imported: importResults.length,
      failed: invalidRows.length + importErrors.length,
      results: importResults,
      errors: [...invalidRows.map(row => ({
        row: row.rowNumber,
        errors: row.errors,
        data: {
          firstName: row.firstName,
          lastName: row.lastName,
        },
      })), ...importErrors],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
