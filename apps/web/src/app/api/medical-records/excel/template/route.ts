import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireRole } from '@/lib/api-utils';

// GET /api/medical-records/excel/template - Download Excel template for bulk medical records
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'doctor', 'nurse']);

    const workbook = XLSX.utils.book_new();

    // Define template headers
    const headers = [
      'Patient ID*',
      'Visit Date* (YYYY-MM-DD)',
      'Chief Complaint*',
      'Diagnosis*',
      'Treatment Plan',
      'Vital Signs (BP)',
      'Vital Signs (Temperature)',
      'Vital Signs (Pulse)',
      'Vital Signs (Respiratory Rate)',
      'Vital Signs (Weight kg)',
      'Vital Signs (Height cm)',
      'Allergies (comma-separated)',
      'Notes',
      'Follow-up Date (YYYY-MM-DD)',
    ];

    const exampleRows = [
      {
        'Patient ID*': '1',
        'Visit Date* (YYYY-MM-DD)': '2024-11-17',
        'Chief Complaint*': 'Severe headache for 3 days',
        'Diagnosis*': 'Migraine',
        'Treatment Plan': 'Prescribed pain medication and rest',
        'Vital Signs (BP)': '120/80',
        'Vital Signs (Temperature)': '36.8',
        'Vital Signs (Pulse)': '72',
        'Vital Signs (Respiratory Rate)': '16',
        'Vital Signs (Weight kg)': '70',
        'Vital Signs (Height cm)': '170',
        'Allergies (comma-separated)': 'Penicillin',
        'Notes': 'Patient advised to avoid triggers',
        'Follow-up Date (YYYY-MM-DD)': '2024-12-01',
      },
      {
        'Patient ID*': '2',
        'Visit Date* (YYYY-MM-DD)': '2024-11-17',
        'Chief Complaint*': 'Persistent cough and fever',
        'Diagnosis*': 'Upper Respiratory Tract Infection',
        'Treatment Plan': 'Antibiotics and cough syrup prescribed',
        'Vital Signs (BP)': '118/76',
        'Vital Signs (Temperature)': '38.2',
        'Vital Signs (Pulse)': '88',
        'Vital Signs (Respiratory Rate)': '20',
        'Vital Signs (Weight kg)': '65',
        'Vital Signs (Height cm)': '165',
        'Allergies (comma-separated)': '',
        'Notes': 'Rest and fluids recommended',
        'Follow-up Date (YYYY-MM-DD)': '2024-11-24',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleRows);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 30 },
      { wch: 35 }, { wch: 15 }, { wch: 22 }, { wch: 18 },
      { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 25 },
      { wch: 40 }, { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical Records');

    const instructions = [
      { 'Step': '1', 'Instruction': 'Patient ID must be a valid existing patient ID from your system' },
      { 'Step': '2', 'Instruction': 'Visit Date format must be YYYY-MM-DD (e.g., 2024-11-17)' },
      { 'Step': '3', 'Instruction': 'Chief Complaint, Diagnosis are required fields' },
      { 'Step': '4', 'Instruction': 'Blood Pressure format: 120/80' },
      { 'Step': '5', 'Instruction': 'Temperature in Celsius (e.g., 36.8)' },
      { 'Step': '6', 'Instruction': 'Follow-up Date is optional, use YYYY-MM-DD format' },
      { 'Step': '7', 'Instruction': 'Allergies should be comma-separated (e.g., Penicillin, Latex)' },
      { 'Step': '8', 'Instruction': 'Delete example rows before uploading' },
      { 'Step': '9', 'Instruction': 'All records will be created by the logged-in user' },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 10 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Medical_Records_Template_${new Date().toISOString().split('T')[0]}.xlsx"`,
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
