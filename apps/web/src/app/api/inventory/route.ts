import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/inventory - List inventory items
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'pharmacist']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');
    const expired = searchParams.get('expired');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    if (search) {
      where.OR = [
        { drugName: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (lowStock === 'true') {
      where.quantity = { lte: prisma.inventory.fields.reorderLevel };
    }

    if (expired === 'true') {
      where.expiryDate = { lte: new Date() };
    }

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { drugName: 'asc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    // Add status flags
    const itemsWithStatus = items.map((item) => {
      const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
      const isLowStock = item.quantity <= item.reorderLevel;
      const daysToExpiry = item.expiryDate
        ? Math.ceil(
            (new Date(item.expiryDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        ...item,
        isExpired,
        isLowStock,
        daysToExpiry,
        expiringSoon: daysToExpiry !== null && daysToExpiry <= 90 && daysToExpiry > 0,
      };
    });

    return apiResponse({
      items: itemsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/inventory - Add new inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'pharmacist']);
    const hospitalId = parseInt(session.user.hospitalId);

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

    // Validation
    if (!drugName || !category || quantity === undefined || !unitPrice) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Create inventory item
    const item = await prisma.inventory.create({
      data: {
        hospitalId,
        drugName,
        genericName: genericName || null,
        category,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : 10,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        batchNumber: batchNumber || null,
        manufacturer: manufacturer || null,
      },
    });

    return apiResponse(item, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
