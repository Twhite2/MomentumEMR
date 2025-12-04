import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/inventory/[id]/stock - Adjust stock (add or remove)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'pharmacist', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const itemId = parseInt(params.id);

    const body = await request.json();
    const { quantity, type, notes } = body;

    // Validation
    if (!quantity || !type) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      return apiResponse({ error: 'Quantity must be greater than 0' }, 400);
    }

    if (!['in', 'out'].includes(type)) {
      return apiResponse({ error: 'Type must be "in" or "out"' }, 400);
    }

    // Verify item exists
    const item = await prisma.inventory.findFirst({
      where: { id: itemId, hospitalId },
    });

    if (!item) {
      return apiResponse({ error: 'Inventory item not found' }, 404);
    }

    // Calculate new quantity
    let newQuantity: number;
    if (type === 'in') {
      newQuantity = item.stockQuantity + quantityNum;
    } else {
      // type === 'out'
      if (item.stockQuantity < quantityNum) {
        return apiResponse({ error: 'Insufficient stock' }, 400);
      }
      newQuantity = item.stockQuantity - quantityNum;
    }

    // Update quantity
    const updatedItem = await prisma.inventory.update({
      where: { id: itemId },
      data: {
        stockQuantity: newQuantity,
      },
    });

    return apiResponse({
      ...updatedItem,
      adjustment: {
        type,
        quantity: quantityNum,
        previousQuantity: item.stockQuantity,
        newQuantity,
        notes: notes || null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
