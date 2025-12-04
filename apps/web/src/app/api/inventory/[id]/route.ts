import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/inventory/[id] - Get inventory item details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'pharmacist', 'doctor', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const itemId = parseInt(params.id);

    const item = await prisma.inventory.findFirst({
      where: {
        id: itemId,
        hospitalId,
      },
    });

    if (!item) {
      return apiResponse({ error: 'Inventory item not found' }, 404);
    }

    // Add status flags and transform field names
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
    const isLowStock = item.stockQuantity <= item.reorderLevel;
    const daysToExpiry = item.expiryDate
      ? Math.ceil(
          (new Date(item.expiryDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return apiResponse({
      ...item,
      // Transform database field names to match frontend expectations
      drugName: item.itemName,
      quantity: item.stockQuantity,
      batchNumber: item.itemCode,
      isExpired,
      isLowStock,
      daysToExpiry,
      expiringSoon: daysToExpiry !== null && daysToExpiry <= 90 && daysToExpiry > 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/inventory/[id] - Update inventory item (full update)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'pharmacist', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const itemId = parseInt(params.id);

    const body = await request.json();
    const {
      itemName,
      drugName,
      itemCode,
      batchNumber,
      stockQuantity,
      quantity,
      packagingUnit,
      tabletsPerPackage,
      unitPrice,
      corporatePrice,
      hmoPrice,
      reorderLevel,
      expiryDate,
      category,
      drugCategory,
      dosageForm,
      dosageStrength,
    } = body;
    
    // Transform frontend field names to database field names
    const finalItemName = itemName || drugName;
    const finalItemCode = itemCode || batchNumber;
    const finalStockQuantity = stockQuantity !== undefined ? stockQuantity : quantity;

    // Verify item exists
    const existing = await prisma.inventory.findFirst({
      where: { id: itemId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Inventory item not found' }, 404);
    }

    // Build update data
    const updateData: any = {};
    if (finalItemName !== undefined) updateData.itemName = finalItemName;
    // Only include itemCode if it has a value (to avoid unique constraint issues)
    if (finalItemCode && finalItemCode.trim()) updateData.itemCode = finalItemCode.trim();
    if (finalStockQuantity !== undefined) updateData.stockQuantity = parseInt(finalStockQuantity);
    if (packagingUnit !== undefined) updateData.packagingUnit = packagingUnit;
    if (tabletsPerPackage !== undefined) updateData.tabletsPerPackage = parseInt(tabletsPerPackage);
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice);
    if (corporatePrice !== undefined) updateData.corporatePrice = parseFloat(corporatePrice);
    if (hmoPrice !== undefined) updateData.hmoPrice = parseFloat(hmoPrice);
    if (reorderLevel !== undefined) updateData.reorderLevel = parseInt(reorderLevel);
    if (expiryDate) updateData.expiryDate = new Date(expiryDate);
    if (category !== undefined) updateData.category = category;
    if (drugCategory !== undefined) updateData.drugCategory = drugCategory;
    if (dosageForm !== undefined) updateData.dosageForm = dosageForm;
    if (dosageStrength !== undefined) updateData.dosageStrength = dosageStrength;

    // Update item
    const item = await prisma.inventory.update({
      where: { id: itemId },
      data: updateData,
    });

    return apiResponse({
      ...item,
      message: 'Inventory item updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/inventory/[id] - Partial update inventory item
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Use same logic as PUT for partial updates
  return PUT(request, context);
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const itemId = parseInt(params.id);

    // Verify item exists
    const existing = await prisma.inventory.findFirst({
      where: { id: itemId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Inventory item not found' }, 404);
    }

    // Delete item
    await prisma.inventory.delete({
      where: { id: itemId },
    });

    return apiResponse({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
