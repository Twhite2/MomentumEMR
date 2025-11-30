import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/nursing-inventory-usage - Get nursing inventory usage records
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['nurse', 'admin', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const patientId = searchParams.get('patientId');
    const nurseId = searchParams.get('nurseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { hospitalId };

    if (patientId) where.patientId = parseInt(patientId);
    if (nurseId) where.nurseId = parseInt(nurseId);
    if (startDate || endDate) {
      where.usedAt = {};
      if (startDate) where.usedAt.gte = new Date(startDate);
      if (endDate) where.usedAt.lte = new Date(endDate);
    }

    const usageRecords = await prisma.nursingInventoryUsage.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        inventory: {
          select: {
            id: true,
            itemName: true,
            itemCode: true,
            category: true,
            packagingUnit: true,
          },
        },
        nurse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { usedAt: 'desc' },
    });

    return apiResponse({ usageRecords });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/nursing-inventory-usage - Record nursing inventory usage
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['nurse', 'admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const nurseId = parseInt(session.user.id);
    const body = await request.json();
    
    const { patientId, inventoryId, quantity, purpose, notes } = body;

    if (!patientId || !inventoryId) {
      return apiResponse({ error: 'Patient ID and Inventory ID are required' }, 400);
    }

    const inventory = await prisma.inventory.findFirst({
      where: { id: inventoryId, hospitalId },
    });

    if (!inventory) {
      return apiResponse({ error: 'Inventory item not found' }, 404);
    }

    if (inventory.stockQuantity < quantity) {
      return apiResponse(
        {
          error: 'Insufficient stock',
          available: inventory.stockQuantity,
          requested: quantity,
        },
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { id: inventoryId },
        data: { stockQuantity: { decrement: quantity } },
      });

      const usageRecord = await tx.nursingInventoryUsage.create({
        data: {
          hospitalId,
          patientId,
          inventoryId,
          nurseId,
          quantity,
          purpose,
          notes,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          inventory: {
            select: {
              id: true,
              itemName: true,
              itemCode: true,
              category: true,
              packagingUnit: true,
            },
          },
          nurse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return usageRecord;
    });

    return apiResponse({
      message: 'Inventory usage recorded successfully',
      usageRecord: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
