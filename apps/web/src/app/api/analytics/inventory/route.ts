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
    const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    // Calculate stock status
    const lowStockItems = inventory.filter((item) => item.quantity <= item.reorderLevel);
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

    // Group by category
    const byCategory = inventory.reduce((acc: any, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, value: 0 };
      }
      acc[item.category].count++;
      acc[item.category].value += item.quantity * item.unitPrice;
      return acc;
    }, {});

    // Get top value items
    const topValueItems = inventory
      .map((item) => ({
        id: item.id,
        drugName: item.drugName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalValue: item.quantity * item.unitPrice,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // Calculate turnover (items with low quantity / reorder level ratio)
    const slowMovingItems = inventory
      .filter((item) => item.quantity > item.reorderLevel * 2)
      .map((item) => ({
        id: item.id,
        drugName: item.drugName,
        quantity: item.quantity,
        reorderLevel: item.reorderLevel,
        ratio: item.quantity / item.reorderLevel,
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
      distribution: {
        byCategory,
      },
      alerts: {
        lowStock: lowStockItems.slice(0, 10).map((item) => ({
          id: item.id,
          drugName: item.drugName,
          quantity: item.quantity,
          reorderLevel: item.reorderLevel,
        })),
        expired: expiredItems.slice(0, 10).map((item) => ({
          id: item.id,
          drugName: item.drugName,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
        })),
        expiringSoon: expiringSoonItems.slice(0, 10).map((item) => ({
          id: item.id,
          drugName: item.drugName,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
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
