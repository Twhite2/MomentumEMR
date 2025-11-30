import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/lab-inventory-usage - Get lab inventory usage records
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['lab_tech', 'admin', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const patientId = searchParams.get('patientId');
    const labTechId = searchParams.get('labTechId');
    const labOrderId = searchParams.get('labOrderId');
    const testType = searchParams.get('testType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { hospitalId };

    if (patientId) where.patientId = parseInt(patientId);
    if (labTechId) where.labTechId = parseInt(labTechId);
    if (labOrderId) where.labOrderId = parseInt(labOrderId);
    if (testType) where.testType = testType;
    if (startDate || endDate) {
      where.usedAt = {};
      if (startDate) where.usedAt.gte = new Date(startDate);
      if (endDate) where.usedAt.lte = new Date(endDate);
    }

    const usageRecords = await prisma.labInventoryUsage.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        labOrder: {
          select: {
            id: true,
            orderType: true,
            description: true,
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
        labTech: {
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

// POST /api/lab-inventory-usage - Record lab inventory usage
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['lab_tech', 'admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const labTechId = parseInt(session.user.id);
    const body = await request.json();
    
    const { patientId, inventoryId, quantity, labOrderId, testType, notes } = body;

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

      const usageRecord = await tx.labInventoryUsage.create({
        data: {
          hospitalId,
          patientId,
          inventoryId,
          labTechId,
          quantity,
          labOrderId: labOrderId || null,
          testType,
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
          labOrder: {
            select: {
              id: true,
              orderType: true,
              description: true,
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
          labTech: {
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
      message: 'Lab inventory usage recorded successfully',
      usageRecord: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
