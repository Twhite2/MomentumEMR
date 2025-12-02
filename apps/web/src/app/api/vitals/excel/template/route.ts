import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireRole } from '@/lib/api-utils';

// GET /api/vitals/excel/template - Download Excel template for bulk vitals recording
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'doctor', 'nurse']);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Define template headers
    const headers = [
      'Patient ID*',
      'Temperature (°C)',
      'Blood Pressure Systolic* (mmHg)',
      'Blood Pressure Diastolic* (mmHg)',
      'Heart Rate (BPM)',
      'Respiratory Rate (per min)',
      'Oxygen Saturation (%)',
      'Weight (kg)',
      'Height (cm)',
      'Recorded Date* (YYYY-MM-DD HH:mm)',
      'Notes',
    ];

    // Create example rows with sample data
    const exampleRows = [
      {
        'Patient ID*': '1',
        'Temperature (°C)': '37.5',
        'Blood Pressure Systolic* (mmHg)': '120',
        'Blood Pressure Diastolic* (mmHg)': '80',
        'Heart Rate (BPM)': '72',
        'Respiratory Rate (per min)': '16',
        'Oxygen Saturation (%)': '98',
        'Weight (kg)': '70.5',
        'Height (cm)': '175',
        'Recorded Date* (YYYY-MM-DD HH:mm)': '2024-01-15 09:30',
        'Notes': 'Patient was resting during measurement',
      },
      {
        'Patient ID*': '2',
        'Temperature (°C)': '36.8',
        'Blood Pressure Systolic* (mmHg)': '115',
        'Blood Pressure Diastolic* (mmHg)': '75',
        'Heart Rate (BPM)': '68',
        'Respiratory Rate (per min)': '14',
        'Oxygen Saturation (%)': '99',
        'Weight (kg)': '65.2',
        'Height (cm)': '168',
        'Recorded Date* (YYYY-MM-DD HH:mm)': '2024-01-15 10:00',
        'Notes': 'Routine checkup vitals',
      },
      {
        'Patient ID*': '3',
        'Temperature (°C)': '38.2',
        'Blood Pressure Systolic* (mmHg)': '130',
        'Blood Pressure Diastolic* (mmHg)': '85',
        'Heart Rate (BPM)': '88',
        'Respiratory Rate (per min)': '20',
        'Oxygen Saturation (%)': '96',
        'Weight (kg)': '82.0',
        'Height (cm)': '180',
        'Recorded Date* (YYYY-MM-DD HH:mm)': '2024-01-15 11:15',
        'Notes': 'Patient reporting fever, elevated temperature confirmed',
      },
    ];

    // Create the main data sheet
    const worksheet = XLSX.utils.json_to_sheet(exampleRows);

    // Set column widths for better readability
    worksheet['!cols'] = [
      { wch: 12 }, // Patient ID
      { wch: 18 }, // Temperature
      { wch: 25 }, // BP Systolic
      { wch: 25 }, // BP Diastolic
      { wch: 16 }, // Heart Rate
      { wch: 22 }, // Respiratory Rate
      { wch: 20 }, // Oxygen Saturation
      { wch: 12 }, // Weight
      { wch: 12 }, // Height
      { wch: 25 }, // Recorded Date
      { wch: 40 }, // Notes
    ];

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vitals Template');

    // Create instructions sheet
    const instructions = [
      {
        'Step': '1',
        'Instruction': 'Fill in patient vitals in the "Vitals Template" sheet',
      },
      {
        'Step': '2',
        'Instruction': 'Fields marked with * are required',
      },
      {
        'Step': '3',
        'Instruction': 'Patient ID must be an existing patient ID in the system',
      },
      {
        'Step': '4',
        'Instruction': 'Temperature should be in Celsius (e.g., 37.5)',
      },
      {
        'Step': '5',
        'Instruction': 'Blood Pressure must include both Systolic and Diastolic values',
      },
      {
        'Step': '6',
        'Instruction': 'Heart Rate should be in BPM (beats per minute)',
      },
      {
        'Step': '7',
        'Instruction': 'Respiratory Rate should be breaths per minute',
      },
      {
        'Step': '8',
        'Instruction': 'Oxygen Saturation (SpO2) should be a percentage (e.g., 98)',
      },
      {
        'Step': '9',
        'Instruction': 'Weight should be in kilograms (e.g., 70.5)',
      },
      {
        'Step': '10',
        'Instruction': 'Height should be in centimeters (e.g., 175)',
      },
      {
        'Step': '11',
        'Instruction': 'Recorded Date format: YYYY-MM-DD HH:mm (e.g., 2024-01-15 09:30)',
      },
      {
        'Step': '12',
        'Instruction': 'BMI will be automatically calculated from weight and height',
      },
      {
        'Step': '13',
        'Instruction': 'Delete the example rows before uploading',
      },
      {
        'Step': '14',
        'Instruction': 'Save the file and upload it through the system',
      },
      {
        'Step': '15',
        'Instruction': 'System will validate and import all valid records',
      },
      {
        'Step': '16',
        'Instruction': 'Any errors will be reported for correction',
      },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 10 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Create reference values sheet
    const referenceValues = [
      {
        'Vital Sign': 'Temperature',
        'Normal Range': '36.1°C - 37.2°C',
        'Unit': 'Celsius',
        'Notes': 'Fever if above 38°C',
      },
      {
        'Vital Sign': 'Blood Pressure (Systolic)',
        'Normal Range': '90 - 120 mmHg',
        'Unit': 'mmHg',
        'Notes': 'Hypertension if consistently above 140',
      },
      {
        'Vital Sign': 'Blood Pressure (Diastolic)',
        'Normal Range': '60 - 80 mmHg',
        'Unit': 'mmHg',
        'Notes': 'Hypertension if consistently above 90',
      },
      {
        'Vital Sign': 'Heart Rate',
        'Normal Range': '60 - 100 BPM',
        'Unit': 'Beats per minute',
        'Notes': 'Varies with age and fitness level',
      },
      {
        'Vital Sign': 'Respiratory Rate',
        'Normal Range': '12 - 20 per min',
        'Unit': 'Breaths per minute',
        'Notes': 'Adult normal range',
      },
      {
        'Vital Sign': 'Oxygen Saturation',
        'Normal Range': '95% - 100%',
        'Unit': 'Percentage',
        'Notes': 'Below 90% requires immediate attention',
      },
      {
        'Vital Sign': 'BMI',
        'Normal Range': '18.5 - 24.9',
        'Unit': 'kg/m²',
        'Notes': 'Calculated: weight(kg) / height(m)²',
      },
    ];

    const referenceSheet = XLSX.utils.json_to_sheet(referenceValues);
    referenceSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Reference Values');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Vitals_Recording_Template_${new Date().toISOString().split('T')[0]}.xlsx"`,
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
