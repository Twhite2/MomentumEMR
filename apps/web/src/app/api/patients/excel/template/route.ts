import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireRole } from '@/lib/api-utils';

// GET /api/patients/excel/template - Download Excel template for bulk patient registration
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'receptionist']);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Define template headers
    const headers = [
      'First Name*',
      'Last Name*',
      'Hospital Number (Family/Household)',
      'Date of Birth* (MM/DD/YYYY)',
      'Gender* (Male/Female/Other)',
      'Phone Number',
      'Email Address',
      'Home Address',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Emergency Contact Relationship',
      'Blood Group (A+/A-/B+/B-/O+/O-/AB+/AB-)',
      'Allergies (comma-separated)',
      'Patient Type* (self_pay/hmo/corporate)',
      'HMO Provider (if HMO)',
      'Corporate Client (if corporate)',
      'Notes',
    ];

    // Create example rows with sample data
    const exampleRows = [
      {
        'First Name*': 'John',
        'Last Name*': 'Doe',
        'Hospital Number (Family/Household)': 'FAM-2024-001',
        'Date of Birth* (MM/DD/YYYY)': '05/15/1990',
        'Gender* (Male/Female/Other)': 'Male',
        'Phone Number': '08012345678',
        'Email Address': 'john.doe@example.com',
        'Home Address': '123 Main Street, Lagos',
        'Emergency Contact Name': 'Jane Doe',
        'Emergency Contact Phone': '08098765432',
        'Emergency Contact Relationship': 'Spouse',
        'Blood Group (A+/A-/B+/B-/O+/O-/AB+/AB-)': 'O+',
        'Allergies (comma-separated)': 'Penicillin, Peanuts',
        'Patient Type* (self_pay/hmo/corporate)': 'self_pay',
        'HMO Provider (if HMO)': '',
        'Corporate Client (if corporate)': '',
        'Notes': 'Family head',
      },
      {
        'First Name*': 'Jane',
        'Last Name*': 'Doe',
        'Hospital Number (Family/Household)': 'FAM-2024-001',
        'Date of Birth* (MM/DD/YYYY)': '03/22/1992',
        'Gender* (Male/Female/Other)': 'Female',
        'Phone Number': '08098765432',
        'Email Address': 'jane.doe@example.com',
        'Home Address': '123 Main Street, Lagos',
        'Emergency Contact Name': 'John Doe',
        'Emergency Contact Phone': '08012345678',
        'Emergency Contact Relationship': 'Spouse',
        'Blood Group (A+/A-/B+/B-/O+/O-/AB+/AB-)': 'A+',
        'Allergies (comma-separated)': '',
        'Patient Type* (self_pay/hmo/corporate)': 'self_pay',
        'HMO Provider (if HMO)': '',
        'Corporate Client (if corporate)': '',
        'Notes': 'Same family as John Doe',
      },
      {
        'First Name*': 'Amina',
        'Last Name*': 'Ibrahim',
        'Hospital Number (Family/Household)': 'FAM-2024-002',
        'Date of Birth* (MM/DD/YYYY)': '12/20/1985',
        'Gender* (Male/Female/Other)': 'Female',
        'Phone Number': '08087654321',
        'Email Address': 'amina.ibrahim@example.com',
        'Home Address': '45 Victoria Island, Lagos',
        'Emergency Contact Name': 'Hassan Ibrahim',
        'Emergency Contact Phone': '08011112222',
        'Emergency Contact Relationship': 'Sibling',
        'Blood Group (A+/A-/B+/B-/O+/O-/AB+/AB-)': 'A+',
        'Allergies (comma-separated)': 'Latex',
        'Patient Type* (self_pay/hmo/corporate)': 'hmo',
        'HMO Provider (if HMO)': 'Reliance HMO',
        'Corporate Client (if corporate)': '',
        'Notes': 'Has active HMO coverage',
      },
    ];

    // Create the main data sheet
    const worksheet = XLSX.utils.json_to_sheet(exampleRows);

    // Set column widths for better readability
    worksheet['!cols'] = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 20 }, // Hospital Number
      { wch: 20 }, // Date of Birth
      { wch: 20 }, // Gender
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 30 }, // Address
      { wch: 25 }, // Emergency Contact Name
      { wch: 20 }, // Emergency Contact Phone
      { wch: 25 }, // Emergency Contact Relationship
      { wch: 15 }, // Blood Group
      { wch: 25 }, // Allergies
      { wch: 20 }, // Patient Type
      { wch: 20 }, // HMO Provider
      { wch: 20 }, // Corporate Client
      { wch: 30 }, // Notes
    ];

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patient Template');

    // Create instructions sheet
    const instructions = [
      {
        'Step': '1',
        'Instruction': 'Fill in patient details in the "Patient Template" sheet',
      },
      {
        'Step': '2',
        'Instruction': 'Fields marked with * are required',
      },
      {
        'Step': '3',
        'Instruction': 'Date format must be MM/DD/YYYY (e.g., 05/15/1990)',
      },
      {
        'Step': '4',
        'Instruction': 'Gender must be exactly: Male, Female, or Other',
      },
      {
        'Step': '5',
        'Instruction': 'Hospital Number can be shared by family members (e.g., FAM-2024-001 for entire family)',
      },
      {
        'Step': '6',
        'Instruction': 'Blood Group must be: A+, A-, B+, B-, O+, O-, AB+, or AB-',
      },
      {
        'Step': '7',
        'Instruction': 'Patient Type must be: self_pay, hmo, or corporate',
      },
      {
        'Step': '8',
        'Instruction': 'Delete the example rows before uploading',
      },
      {
        'Step': '9',
        'Instruction': 'Save the file and upload it through the system',
      },
      {
        'Step': '10',
        'Instruction': 'System will validate and import all valid records',
      },
      {
        'Step': '11',
        'Instruction': 'Any errors will be reported for correction',
      },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 10 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Patient_Registration_Template_${new Date().toISOString().split('T')[0]}.xlsx"`,
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
