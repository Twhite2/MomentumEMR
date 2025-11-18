import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

interface InventoryRow {
  itemName: string;
  category: 'medication' | 'supply' | 'equipment';
  description?: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  reorderLevel?: number;
  expiryDate?: string;
  manufacturer?: string;
  storageLocation?: string;
  rowNumber: number;
  errors: string[];
}

function validateInventoryRow(row: any, rowIndex: number): InventoryRow {
  const errors: string[] = [];

  const itemName = row['Item Name*']?.toString().trim();
  const categoryStr = row['Category* (medication/supply/equipment)']?.toString().trim().toLowerCase();
  const quantityStr = row['Quantity*']?.toString().trim();
  const unit = row['Unit* (tablets/bottles/boxes/pieces)']?.toString().trim();
  const unitPriceStr = row['Unit Price*']?.toString().trim();

  if (!itemName) errors.push('Item Name is required');

  const validCategories = ['medication', 'supply', 'equipment'];
  if (!categoryStr) {
    errors.push('Category is required');
  } else if (!validCategories.includes(categoryStr)) {
    errors.push('Category must be: medication, supply, or equipment');
  }

  let quantity = 0;
  if (!quantityStr) {
    errors.push('Quantity is required');
  } else {
    quantity = parseFloat(quantityStr);
    if (isNaN(quantity) || quantity < 0) {
      errors.push('Quantity must be a positive number');
    }
  }

  if (!unit) errors.push('Unit is required');

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
  const reorderLevel = reorderLevelStr ? parseFloat(reorderLevelStr) : undefined;

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
    category: categoryStr as any || 'supply',
    description: row['Description']?.toString().trim() || undefined,
    sku: row['SKU/Item Code']?.toString().trim() || undefined,
    quantity,
    unit: unit || '',
    unitPrice,
    reorderLevel,
    expiryDate,
    manufacturer: row['Manufacturer']?.toString().trim() || undefined,
    storageLocation: row['Storage Location']?.toString().trim() || undefined,
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
            category: row.category,
            description: row.description || undefined,
            sku: row.sku || undefined,
            quantity: row.quantity,
            unit: row.unit,
            unitPrice: row.unitPrice,
            reorderLevel: row.reorderLevel || undefined,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
            manufacturer: row.manufacturer || undefined,
            storageLocation: row.storageLocation || undefined,
          },
        });

        importResults.push({
          row: row.rowNumber,
          itemId: inventoryItem.id,
          itemName: row.itemName,
          quantity: row.quantity,
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
