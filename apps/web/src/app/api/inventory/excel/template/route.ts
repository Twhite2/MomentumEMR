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
        'Category* (medication/supply/equipment)': 'medication',
        'Description': 'Pain relief and fever reducer',
        'SKU/Item Code': 'PARA-500',
        'Quantity*': '1000',
        'Unit* (tablets/bottles/boxes/pieces)': 'tablets',
        'Unit Price*': '50',
        'Reorder Level': '200',
        'Expiry Date (YYYY-MM-DD)': '2025-12-31',
        'Manufacturer': 'Pharma Labs Ltd',
        'Storage Location': 'Shelf A-12',
      },
      {
        'Item Name*': 'Surgical Gloves (Large)',
        'Category* (medication/supply/equipment)': 'supply',
        'Description': 'Disposable latex gloves',
        'SKU/Item Code': 'GLOVE-L',
        'Quantity*': '500',
        'Unit* (tablets/bottles/boxes/pieces)': 'boxes',
        'Unit Price*': '1200',
        'Reorder Level': '50',
        'Expiry Date (YYYY-MM-DD)': '2026-06-30',
        'Manufacturer': 'MedSupply Co',
        'Storage Location': 'Storage Room B',
      },
      {
        'Item Name*': 'Blood Pressure Monitor',
        'Category* (medication/supply/equipment)': 'equipment',
        'Description': 'Digital BP monitor',
        'SKU/Item Code': 'BP-MON-01',
        'Quantity*': '10',
        'Unit* (tablets/bottles/boxes/pieces)': 'pieces',
        'Unit Price*': '15000',
        'Reorder Level': '2',
        'Expiry Date (YYYY-MM-DD)': '',
        'Manufacturer': 'MedTech Inc',
        'Storage Location': 'Equipment Room',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleRows);
    worksheet['!cols'] = [
      { wch: 30 }, { wch: 35 }, { wch: 35 }, { wch: 15 },
      { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 15 },
      { wch: 20 }, { wch: 25 }, { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Template');

    const instructions = [
      { 'Step': '1', 'Instruction': 'Item Name, Category, Quantity, Unit, and Unit Price are required' },
      { 'Step': '2', 'Instruction': 'Category must be: medication, supply, or equipment' },
      { 'Step': '3', 'Instruction': 'Common Units: tablets, bottles, boxes, pieces, vials, syringes, etc.' },
      { 'Step': '4', 'Instruction': 'Unit Price should be in Naira (₦)' },
      { 'Step': '5', 'Instruction': 'Reorder Level triggers low stock alerts' },
      { 'Step': '6', 'Instruction': 'Expiry Date format: YYYY-MM-DD (leave empty if not applicable)' },
      { 'Step': '7', 'Instruction': 'SKU/Item Code is optional but recommended for tracking' },
      { 'Step': '8', 'Instruction': 'Delete example rows before uploading' },
      { 'Step': '9', 'Instruction': 'System will track inventory from upload date' },
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
