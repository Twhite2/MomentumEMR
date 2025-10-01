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
        { itemName: { contains: search, mode: 'insensitive' } },
        { itemCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    let lowStockFilter = false;
    if (lowStock === 'true') {
      lowStockFilter = true;
    }

    if (expired === 'true') {
      where.expiryDate = { lte: new Date() };
    }
    
    const allItems = await prisma.inventory.findMany({
      where,
      orderBy: { itemName: 'asc' },
    });
    
    // Filter low stock items if needed
    let filteredItems = allItems;
    if (lowStockFilter) {
      filteredItems = allItems.filter(item => item.stockQuantity <= item.reorderLevel);
    }
    
    const total = filteredItems.length;
    
    // Apply pagination after filtering
    const items = filteredItems.slice(skip, skip + limit);

    // Add status flags
    const itemsWithStatus = items.map((item) => {
      const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
      const isLowStock = item.stockQuantity <= item.reorderLevel;
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
      itemName,
      itemCode,
      stockQuantity,
      unitPrice,
      reorderLevel,
      expiryDate,
    } = body;

    // Validation
    if (!itemName || stockQuantity === undefined || !unitPrice) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Create inventory item
    const item = await prisma.inventory.create({
      data: {
        hospitalId,
        itemName,
        itemCode: itemCode || null,
        stockQuantity: parseInt(stockQuantity),
        unitPrice: parseFloat(unitPrice),
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : 10,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    return apiResponse(item, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
