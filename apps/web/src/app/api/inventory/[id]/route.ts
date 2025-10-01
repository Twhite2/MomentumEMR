import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/inventory/[id] - Get inventory item details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['admin', 'pharmacist']);
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

    // Add status flags
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
    const isLowStock = item.quantity <= item.reorderLevel;
    const daysToExpiry = item.expiryDate
      ? Math.ceil(
          (new Date(item.expiryDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return apiResponse({
      ...item,
      isExpired,
      isLowStock,
      daysToExpiry,
      expiringSoon: daysToExpiry !== null && daysToExpiry <= 90 && daysToExpiry > 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['admin', 'pharmacist']);
    const hospitalId = parseInt(session.user.hospitalId);
    const itemId = parseInt(params.id);

    const body = await request.json();
    const {
      drugName,
      genericName,
      category,
      quantity,
      unitPrice,
      reorderLevel,
      expiryDate,
      batchNumber,
      manufacturer,
    } = body;

    // Verify item exists
    const existing = await prisma.inventory.findFirst({
      where: { id: itemId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Inventory item not found' }, 404);
    }

    // Update item
    const item = await prisma.inventory.update({
      where: { id: itemId },
      data: {
        drugName,
        genericName,
        category,
        quantity: quantity !== undefined ? parseInt(quantity) : undefined,
        unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : undefined,
        reorderLevel: reorderLevel !== undefined ? parseInt(reorderLevel) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        batchNumber,
        manufacturer,
      },
    });

    return apiResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
