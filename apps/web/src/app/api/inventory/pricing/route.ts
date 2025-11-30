import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/inventory/pricing - Get inventory items with pricing for billing
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'pharmacist', 'cashier', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      hospitalId,
    };

    // Filter by category if provided
    if (category) {
      where.category = category;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const inventory = await prisma.inventory.findMany({
      where,
      select: {
        id: true,
        itemName: true,
        category: true,
        stockQuantity: true,
        unitPrice: true,
        hmoPrice: true,
        corporatePrice: true,
        dosageStrength: true,
        tabletsPerPackage: true,
      },
      orderBy: [
        { category: 'asc' },
        { itemName: 'asc' },
      ],
      take: 200,
    });

    // Group by category
    const grouped = inventory.reduce((acc: any, item: any) => {
      const cat = item.category || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(item);
      return acc;
    }, {});

    return apiResponse({
      inventory,
      grouped,
      count: inventory.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
