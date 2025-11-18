import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

interface AppointmentRow {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: 'consultation' | 'follow_up' | 'procedure' | 'lab';
  status: 'scheduled' | 'checked_in' | 'completed' | 'cancelled';
  reason?: string;
  notes?: string;
  rowNumber: number;
  errors: string[];
}

function validateAppointmentRow(row: any, rowIndex: number): AppointmentRow {
  const errors: string[] = [];

  const patientIdStr = row['Patient ID*']?.toString().trim();
  const doctorIdStr = row['Doctor ID*']?.toString().trim();
  const dateStr = row['Appointment Date* (YYYY-MM-DD)']?.toString().trim();
  const timeStr = row['Appointment Time* (HH:MM 24hr)']?.toString().trim();
  const typeStr = row['Type* (consultation/follow_up/procedure/lab)']?.toString().trim().toLowerCase();
  const statusStr = row['Status (scheduled/checked_in/completed/cancelled)']?.toString().trim().toLowerCase() || 'scheduled';

  let patientId = 0;
  if (!patientIdStr) {
    errors.push('Patient ID is required');
  } else {
    patientId = parseInt(patientIdStr);
    if (isNaN(patientId)) {
      errors.push('Patient ID must be a number');
    }
  }

  let doctorId = 0;
  if (!doctorIdStr) {
    errors.push('Doctor ID is required');
  } else {
    doctorId = parseInt(doctorIdStr);
    if (isNaN(doctorId)) {
      errors.push('Doctor ID must be a number');
    }
  }

  let appointmentDate = '';
  if (!dateStr) {
    errors.push('Appointment Date is required');
  } else {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      errors.push('Invalid Appointment Date format');
    } else {
      appointmentDate = date.toISOString().split('T')[0];
    }
  }

  let appointmentTime = '';
  if (!timeStr) {
    errors.push('Appointment Time is required');
  } else if (!/^\d{2}:\d{2}$/.test(timeStr)) {
    errors.push('Invalid Time format (use HH:MM)');
  } else {
    appointmentTime = timeStr;
  }

  const durationStr = row['Duration (minutes)']?.toString().trim();
  const duration = durationStr ? parseInt(durationStr) : 30;

  const validTypes = ['consultation', 'follow_up', 'procedure', 'lab'];
  if (!typeStr) {
    errors.push('Type is required');
  } else if (!validTypes.includes(typeStr)) {
    errors.push('Type must be: consultation, follow_up, procedure, or lab');
  }

  const validStatuses = ['scheduled', 'checked_in', 'completed', 'cancelled'];
  if (!validStatuses.includes(statusStr)) {
    errors.push('Status must be: scheduled, checked_in, completed, or cancelled');
  }

  return {
    patientId,
    doctorId,
    appointmentDate,
    appointmentTime,
    duration,
    type: typeStr as any || 'consultation',
    status: statusStr as any || 'scheduled',
    reason: row['Reason for Visit']?.toString().trim() || undefined,
    notes: row['Notes']?.toString().trim() || undefined,
    rowNumber: rowIndex + 2,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'receptionist', 'nurse']);
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

    const validatedRows: AppointmentRow[] = jsonData.map((row, index) =>
      validateAppointmentRow(row, index)
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
          data: { patientId: row.patientId, doctorId: row.doctorId },
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

        // Verify doctor exists
        const doctor = await prisma.user.findUnique({
          where: { id: row.doctorId },
        });

        if (!doctor || doctor.role !== 'doctor') {
          importErrors.push({
            row: row.rowNumber,
            errors: [`Doctor ID ${row.doctorId} not found or not a doctor`],
            data: { doctorId: row.doctorId },
          });
          continue;
        }

        // Combine date and time
        const startTime = new Date(`${row.appointmentDate}T${row.appointmentTime}:00`);
        const endTime = new Date(startTime.getTime() + row.duration * 60000); // Add duration in milliseconds

        const appointment = await prisma.appointment.create({
          data: {
            hospitalId,
            patientId: row.patientId,
            doctorId: row.doctorId,
            appointmentType: row.type,
            status: row.status,
            startTime,
            endTime,
          },
        });

        importResults.push({
          row: row.rowNumber,
          appointmentId: appointment.id,
          patientId: row.patientId,
          doctorId: row.doctorId,
          date: row.appointmentDate,
          time: row.appointmentTime,
          success: true,
        });
      } catch (error: any) {
        importErrors.push({
          row: row.rowNumber,
          errors: [error.message || 'Database error'],
          data: { patientId: row.patientId, doctorId: row.doctorId },
        });
      }
    }

    return apiResponse({
      success: true,
      message: `Successfully imported ${importResults.length} appointment(s)`,
      imported: importResults.length,
      failed: invalidRows.length + importErrors.length,
      results: importResults,
      errors: [
        ...invalidRows.map(row => ({
          row: row.rowNumber,
          errors: row.errors,
          data: { patientId: row.patientId, doctorId: row.doctorId },
        })),
        ...importErrors,
      ],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
