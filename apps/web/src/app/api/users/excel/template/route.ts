import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireRole } from '@/lib/api-utils';

// GET /api/users/excel/template - Download Excel template for bulk staff registration
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const workbook = XLSX.utils.book_new();

    const exampleRows = [
      {
        'Full Name*': 'Dr. Sarah Johnson',
        'Email Address*': 'sarah.johnson@hospital.com',
        'Role* (admin/doctor/nurse/receptionist/lab_tech/pharmacist/cashier)': 'doctor',
        'Specialization': 'Cardiology',
        'License Number': 'MD-12345',
        'Phone Number': '08012345678',
        'Initial Password (will be auto-generated if empty)': '',
        'Must Change Password (yes/no)': 'yes',
      },
      {
        'Full Name*': 'John Doe',
        'Email Address*': 'john.doe@hospital.com',
        'Role* (admin/doctor/nurse/receptionist/lab_tech/pharmacist/cashier)': 'nurse',
        'Specialization': 'Emergency Care',
        'License Number': 'RN-67890',
        'Phone Number': '08087654321',
        'Initial Password (will be auto-generated if empty)': '',
        'Must Change Password (yes/no)': 'yes',
      },
      {
        'Full Name*': 'Mary Smith',
        'Email Address*': 'mary.smith@hospital.com',
        'Role* (admin/doctor/nurse/receptionist/lab_tech/pharmacist/cashier)': 'receptionist',
        'Specialization': '',
        'License Number': '',
        'Phone Number': '08098765432',
        'Initial Password (will be auto-generated if empty)': '',
        'Must Change Password (yes/no)': 'yes',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleRows);
    worksheet['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 50 }, { wch: 20 },
      { wch: 18 }, { wch: 15 }, { wch: 40 }, { wch: 25 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Template');

    const instructions = [
      { 'Step': '1', 'Instruction': 'Full Name and Email Address are required' },
      { 'Step': '2', 'Instruction': 'Email must be unique in the system' },
      { 'Step': '3', 'Instruction': 'Valid Roles: admin, doctor, nurse, receptionist, lab_tech, pharmacist, cashier' },
      { 'Step': '4', 'Instruction': 'Specialization and License Number are optional' },
      { 'Step': '5', 'Instruction': 'Leave Initial Password empty to auto-generate secure password' },
      { 'Step': '6', 'Instruction': 'Must Change Password: yes or no (default is yes)' },
      { 'Step': '7', 'Instruction': 'Auto-generated passwords will be emailed to staff' },
      { 'Step': '8', 'Instruction': 'Delete example rows before uploading' },
      { 'Step': '9', 'Instruction': 'All staff will be created as active users' },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 10 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Staff_Registration_Template_${new Date().toISOString().split('T')[0]}.xlsx"`,
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
