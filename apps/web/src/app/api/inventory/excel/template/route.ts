import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireRole } from '@/lib/api-utils';

// GET /api/inventory/excel/template - Download Excel template for bulk inventory
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'pharmacist']);

    const workbook = XLSX.utils.book_new();

    const exampleRows = [
      {
        'Item Name*': 'Paracetamol 500mg',
        'Item Code': 'PARA-500',
        'Stock Quantity*': '1000',
        'Unit Price*': '50',
        'Reorder Level': '200',
        'Expiry Date (YYYY-MM-DD)': '2025-12-31',
      },
      {
        'Item Name*': 'Surgical Gloves (Large)',
        'Item Code': 'GLOVE-L',
        'Stock Quantity*': '500',
        'Unit Price*': '1200',
        'Reorder Level': '50',
        'Expiry Date (YYYY-MM-DD)': '2026-06-30',
      },
      {
        'Item Name*': 'Blood Pressure Monitor',
        'Item Code': 'BP-MON-01',
        'Stock Quantity*': '10',
        'Unit Price*': '15000',
        'Reorder Level': '2',
        'Expiry Date (YYYY-MM-DD)': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleRows);
    worksheet['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 18 },
      { wch: 15 }, { wch: 15 }, { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Template');

    const instructions = [
      { 'Step': '1', 'Instruction': 'Item Name, Stock Quantity, and Unit Price are required' },
      { 'Step': '2', 'Instruction': 'Item Code is optional but recommended for unique identification' },
      { 'Step': '3', 'Instruction': 'Stock Quantity must be a whole number (integer)' },
      { 'Step': '4', 'Instruction': 'Unit Price should be in Naira (₦)' },
      { 'Step': '5', 'Instruction': 'Reorder Level triggers low stock alerts (default: 10)' },
      { 'Step': '6', 'Instruction': 'Expiry Date format: YYYY-MM-DD (leave empty if not applicable)' },
      { 'Step': '7', 'Instruction': 'Delete example rows before uploading' },
      { 'Step': '8', 'Instruction': 'System will track inventory from upload date' },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 10 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Inventory_Template_${new Date().toISOString().split('T')[0]}.xlsx"`,
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
