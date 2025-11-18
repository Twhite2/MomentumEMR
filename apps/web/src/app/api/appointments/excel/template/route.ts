import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireRole } from '@/lib/api-utils';

// GET /api/appointments/excel/template - Download Excel template for bulk appointments
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'receptionist', 'nurse']);

    const workbook = XLSX.utils.book_new();

    const exampleRows = [
      {
        'Patient ID*': '1',
        'Doctor ID*': '5',
        'Appointment Date* (YYYY-MM-DD)': '2024-11-20',
        'Appointment Time* (HH:MM 24hr)': '09:00',
        'Duration (minutes)': '30',
        'Type* (consultation/follow_up/procedure/lab)': 'consultation',
        'Status (scheduled/checked_in/completed/cancelled)': 'scheduled',
        'Reason for Visit': 'Regular checkup',
        'Notes': 'First visit',
      },
      {
        'Patient ID*': '2',
        'Doctor ID*': '5',
        'Appointment Date* (YYYY-MM-DD)': '2024-11-20',
        'Appointment Time* (HH:MM 24hr)': '10:00',
        'Duration (minutes)': '45',
        'Type* (consultation/follow_up/procedure/lab)': 'follow_up',
        'Status (scheduled/checked_in/completed/cancelled)': 'checked_in',
        'Reason for Visit': 'Post-surgery follow-up',
        'Notes': 'Check wound healing',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleRows);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 25 },
      { wch: 18 }, { wch: 35 }, { wch: 30 }, { wch: 30 }, { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments Template');

    const instructions = [
      { 'Step': '1', 'Instruction': 'Patient ID and Doctor ID must be valid existing IDs' },
      { 'Step': '2', 'Instruction': 'Appointment Date format: YYYY-MM-DD (e.g., 2024-11-20)' },
      { 'Step': '3', 'Instruction': 'Appointment Time format: HH:MM in 24-hour format (e.g., 09:00, 14:30)' },
      { 'Step': '4', 'Instruction': 'Duration in minutes (default is 30 if not specified)' },
      { 'Step': '5', 'Instruction': 'Type: consultation, follow_up, procedure, or lab' },
      { 'Step': '6', 'Instruction': 'Status: scheduled, checked_in, completed, or cancelled (default is scheduled)' },
      { 'Step': '7', 'Instruction': 'Reason for Visit and Notes are optional' },
      { 'Step': '8', 'Instruction': 'System will check for scheduling conflicts' },
      { 'Step': '9', 'Instruction': 'Delete example rows before uploading' },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 10 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Appointments_Template_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate template' },
      { status: error.status || 500 }
    );
  }
}
