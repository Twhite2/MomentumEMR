import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/analytics/inventory - Get inventory analytics
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'pharmacist']);
    const hospitalId = parseInt(session.user.hospitalId);

    // Get inventory statistics
    const inventory = await prisma.inventory.findMany({
      where: { hospitalId },
    });

    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => {
      const price = item.unitPrice ? Number(item.unitPrice) : 0;
      return sum + item.stockQuantity * price;
    }, 0);

    // Calculate stock status
    const lowStockItems = inventory.filter((item) => item.stockQuantity <= item.reorderLevel);
    const expiredItems = inventory.filter(
      (item) => item.expiryDate && new Date(item.expiryDate) < new Date()
    );
    const expiringSoonItems = inventory.filter((item) => {
      if (!item.expiryDate) return false;
      const daysToExpiry = Math.ceil(
        (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysToExpiry > 0 && daysToExpiry <= 90;
    });

    // Get top value items
    const topValueItems = inventory
      .map((item) => {
        const price = item.unitPrice ? Number(item.unitPrice) : 0;
        return {
          id: item.id,
          itemName: item.itemName,
          stockQuantity: item.stockQuantity,
          unitPrice: price,
          totalValue: item.stockQuantity * price,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // Calculate turnover (items with low stockQuantity / reorder level ratio)
    const slowMovingItems = inventory
      .filter((item) => item.stockQuantity > item.reorderLevel * 2)
      .map((item) => ({
        id: item.id,
        itemName: item.itemName,
        stockQuantity: item.stockQuantity,
        reorderLevel: item.reorderLevel,
        ratio: item.stockQuantity / item.reorderLevel,
      }))
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);

    return apiResponse({
      summary: {
        totalItems,
        totalValue,
        lowStockCount: lowStockItems.length,
        expiredCount: expiredItems.length,
        expiringSoonCount: expiringSoonItems.length,
        averageItemValue: totalItems > 0 ? totalValue / totalItems : 0,
      },
      alerts: {
        lowStock: lowStockItems.slice(0, 10).map((item) => ({
          id: item.id,
          itemName: item.itemName,
          stockQuantity: item.stockQuantity,
          reorderLevel: item.reorderLevel,
        })),
        expired: expiredItems.slice(0, 10).map((item) => ({
          id: item.id,
          itemName: item.itemName,
          expiryDate: item.expiryDate,
          stockQuantity: item.stockQuantity,
        })),
        expiringSoon: expiringSoonItems.slice(0, 10).map((item) => ({
          id: item.id,
          itemName: item.itemName,
          expiryDate: item.expiryDate,
          stockQuantity: item.stockQuantity,
          daysToExpiry: Math.ceil(
            (new Date(item.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
        })),
      },
      topValueItems,
      slowMovingItems,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
