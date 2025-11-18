import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

interface InventoryRow {
  itemName: string;
  itemCode?: string;
  stockQuantity: number;
  unitPrice: number;
  reorderLevel?: number;
  expiryDate?: string;
  rowNumber: number;
  errors: string[];
}

function validateInventoryRow(row: any, rowIndex: number): InventoryRow {
  const errors: string[] = [];

  const itemName = row['Item Name*']?.toString().trim();
  const itemCode = row['Item Code']?.toString().trim();
  const quantityStr = row['Stock Quantity*']?.toString().trim();
  const unitPriceStr = row['Unit Price*']?.toString().trim();

  if (!itemName) errors.push('Item Name is required');

  let stockQuantity = 0;
  if (!quantityStr) {
    errors.push('Quantity is required');
  } else {
    stockQuantity = parseInt(quantityStr);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      errors.push('Stock Quantity must be a positive number');
    }
  }

  let unitPrice = 0;
  if (!unitPriceStr) {
    errors.push('Unit Price is required');
  } else {
    unitPrice = parseFloat(unitPriceStr);
    if (isNaN(unitPrice) || unitPrice < 0) {
      errors.push('Unit Price must be a positive number');
    }
  }

  const reorderLevelStr = row['Reorder Level']?.toString().trim();
  const reorderLevel = reorderLevelStr ? parseInt(reorderLevelStr) : 10; // Default 10

  let expiryDate: string | undefined;
  const expiryDateStr = row['Expiry Date (YYYY-MM-DD)']?.toString().trim();
  if (expiryDateStr) {
    const date = new Date(expiryDateStr);
    if (isNaN(date.getTime())) {
      errors.push('Invalid Expiry Date format');
    } else {
      expiryDate = date.toISOString().split('T')[0];
    }
  }

  return {
    itemName: itemName || '',
    itemCode: itemCode || undefined,
    stockQuantity,
    unitPrice,
    reorderLevel,
    expiryDate,
    rowNumber: rowIndex + 2,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'pharmacist']);
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

    const validatedRows: InventoryRow[] = jsonData.map((row, index) =>
      validateInventoryRow(row, index)
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
          data: { itemName: row.itemName },
        })),
      }, 400);
    }

    const importResults = [];
    const importErrors = [];

    for (const row of validRows) {
      try {
        const inventoryItem = await prisma.inventory.create({
          data: {
            hospitalId,
            itemName: row.itemName,
            itemCode: row.itemCode || undefined,
            stockQuantity: row.stockQuantity,
            unitPrice: row.unitPrice,
            reorderLevel: row.reorderLevel || 10,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
          },
        });

        importResults.push({
          row: row.rowNumber,
          itemId: inventoryItem.id,
          itemName: row.itemName,
          stockQuantity: row.stockQuantity,
          success: true,
        });
      } catch (error: any) {
        importErrors.push({
          row: row.rowNumber,
          errors: [error.message || 'Database error'],
          data: { itemName: row.itemName },
        });
      }
    }

    return apiResponse({
      success: true,
      message: `Successfully imported ${importResults.length} inventory item(s)`,
      imported: importResults.length,
      failed: invalidRows.length + importErrors.length,
      results: importResults,
      errors: [
        ...invalidRows.map(row => ({
          row: row.rowNumber,
          errors: row.errors,
          data: { itemName: row.itemName },
        })),
        ...importErrors,
      ],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
