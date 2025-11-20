import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';

interface StaffRow {
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'lab_tech' | 'pharmacist' | 'cashier';
  specialization?: string;
  licenseNumber?: string;
  phone?: string;
  password?: string;
  mustChangePassword: boolean;
  rowNumber: number;
  errors: string[];
}

function validateStaffRow(row: any, rowIndex: number): StaffRow {
  const errors: string[] = [];

  const name = row['Full Name*']?.toString().trim();
  const email = row['Email Address*']?.toString().trim();
  const roleStr = row['Role* (admin/doctor/nurse/receptionist/lab_tech/pharmacist/cashier)']?.toString().trim().toLowerCase();

  if (!name) errors.push('Full Name is required');
  if (!email) {
    errors.push('Email Address is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  const validRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'pharmacist', 'cashier'];
  if (!roleStr) {
    errors.push('Role is required');
  } else if (!validRoles.includes(roleStr)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }

  const mustChangePasswordStr = row['Must Change Password (yes/no)']?.toString().trim().toLowerCase();
  const mustChangePassword = mustChangePasswordStr === 'no' ? false : true;

  const password = row['Initial Password (will be auto-generated if empty)']?.toString().trim();

  return {
    name: name || '',
    email: email || '',
    role: roleStr as any || 'receptionist',
    specialization: row['Specialization']?.toString().trim() || undefined,
    licenseNumber: row['License Number']?.toString().trim() || undefined,
    phone: row['Phone Number']?.toString().trim() || undefined,
    password: password || undefined,
    mustChangePassword,
    rowNumber: rowIndex + 2,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);

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

    const validatedRows: StaffRow[] = jsonData.map((row, index) =>
      validateStaffRow(row, index)
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
          data: { name: row.name, email: row.email },
        })),
      }, 400);
    }

    const importResults = [];
    const importErrors = [];

    for (const row of validRows) {
      try {
        // Check if email already exists in this hospital
        const existingUser = await prisma.user.findFirst({
          where: { 
            email: row.email,
            hospitalId,
          },
        });

        if (existingUser) {
          importErrors.push({
            row: row.rowNumber,
            errors: [`Email ${row.email} already exists in this hospital`],
            data: { name: row.name, email: row.email },
          });
          continue;
        }

        // Generate or use provided password
        const password = row.password || Math.random().toString(36).slice(-12);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            hospitalId,
            name: row.name,
            email: row.email,
            hashedPassword,
            role: row.role,
            mustChangePassword: row.mustChangePassword,
            active: true,
          },
        });

        importResults.push({
          row: row.rowNumber,
          userId: user.id,
          name: row.name,
          email: row.email,
          role: row.role,
          temporaryPassword: row.password ? undefined : password,
          success: true,
        });
      } catch (error: any) {
        importErrors.push({
          row: row.rowNumber,
          errors: [error.message || 'Database error'],
          data: { name: row.name, email: row.email },
        });
      }
    }

    return apiResponse({
      success: true,
      message: `Successfully imported ${importResults.length} staff member(s)`,
      imported: importResults.length,
      failed: invalidRows.length + importErrors.length,
      results: importResults,
      errors: [
        ...invalidRows.map(row => ({
          row: row.rowNumber,
          errors: row.errors,
          data: { name: row.name, email: row.email },
        })),
        ...importErrors,
      ],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
