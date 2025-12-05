import { NextRequest } from 'next/server';
import { prisma, Prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/claims/analytics - Get comprehensive claims analytics
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier', 'super_admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const hmoId = searchParams.get('hmoId');

    // Build where clause for HMO invoices
    const where: any = {
      hospitalId,
      hmoId: { not: null }, // Only HMO invoices
    };

    // Date filter
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    // HMO filter
    if (hmoId) {
      where.hmoId = parseInt(hmoId);
    }

    // Get all HMO invoices with grouping by status
    const claimsByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { 
        totalAmount: true,
        paidAmount: true,
      },
    });

    // Get HMO invoices by HMO
    const claimsByHmo = await prisma.invoice.groupBy({
      by: ['hmoId', 'status'],
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    // Get HMO details for the grouped claims
    const hmoIds = [...new Set(claimsByHmo.map(c => c.hmoId).filter(id => id !== null))] as number[];
    const hmos = await prisma.hmo.findMany({
      where: { id: { in: hmoIds } },
      select: { id: true, name: true },
    });

    const hmoMap = new Map(hmos.map(h => [h.id, h.name]));

    // Calculate summary metrics
    const summary = {
      totalClaims: 0,
      totalAmount: 0,
      pending: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 },
    };

    claimsByStatus.forEach(group => {
      const count = group._count._all;
      const amount = Number(group._sum.totalAmount || 0);
      
      summary.totalClaims += count;
      summary.totalAmount += amount;

      const status = group.status;
      if (status === 'pending') {
        summary.pending = { count, amount };
      } else if (status === 'paid') {
        summary.paid = { count, amount: Number(group._sum.paidAmount || 0) };
      } else if (status === 'cancelled') {
        summary.cancelled = { count, amount };
      } else if (status === 'refunded') {
        summary.refunded = { count, amount };
      }
    });

    // Format byHmo data
    const hmoBreakdown: any = {};
    
    claimsByHmo.forEach(group => {
      const hmoId = group.hmoId;
      if (!hmoId) return; // Skip if no HMO ID
      
      const hmoName = hmoMap.get(hmoId) || `HMO ${hmoId}`;
      const hmoKey = hmoId.toString();
      
      if (!hmoBreakdown[hmoKey]) {
        hmoBreakdown[hmoKey] = {
          hmoId,
          hmoName,
          pending: { count: 0, amount: 0 },
          paid: { count: 0, amount: 0 },
          cancelled: { count: 0, amount: 0 },
          refunded: { count: 0, amount: 0 },
          totalClaims: 0,
          totalAmount: 0,
        };
      }

      const count = group._count._all;
      const amount = Number(group._sum.totalAmount || 0);
      const status = group.status;

      hmoBreakdown[hmoKey].totalClaims += count;
      hmoBreakdown[hmoKey].totalAmount += amount;

      if (status === 'pending') {
        hmoBreakdown[hmoKey].pending = { count, amount };
      } else if (status === 'paid') {
        hmoBreakdown[hmoKey].paid = { 
          count, 
          amount: Number(group._sum.paidAmount || 0) 
        };
      } else if (status === 'cancelled') {
        hmoBreakdown[hmoKey].cancelled = { count, amount };
      } else if (status === 'refunded') {
        hmoBreakdown[hmoKey].refunded = { count, amount };
      }
    });

    // Convert to array and calculate payment rates
    const byHmo = Object.values(hmoBreakdown).map((hmo: any) => ({
      ...hmo,
      paymentRate: hmo.totalClaims > 0 
        ? Math.round((hmo.paid.count / hmo.totalClaims) * 100) 
        : 0,
      outstandingAmount: hmo.pending.amount,
    }));

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get month-by-month breakdown from invoices
    const monthlyTrends = hmoId
      ? await prisma.$queryRaw<any[]>`
          SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            status,
            COUNT(*)::int as count,
            SUM(total_amount)::numeric as amount
          FROM invoices
          WHERE hospital_id = ${hospitalId}
            AND hmo_id IS NOT NULL
            AND hmo_id = ${parseInt(hmoId)}
            AND created_at >= ${sixMonthsAgo}
          GROUP BY TO_CHAR(created_at, 'YYYY-MM'), status
          ORDER BY month DESC
        `
      : await prisma.$queryRaw<any[]>`
          SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            status,
            COUNT(*)::int as count,
            SUM(total_amount)::numeric as amount
          FROM invoices
          WHERE hospital_id = ${hospitalId}
            AND hmo_id IS NOT NULL
            AND created_at >= ${sixMonthsAgo}
          GROUP BY TO_CHAR(created_at, 'YYYY-MM'), status
          ORDER BY month DESC
        `;

    // Format monthly trends
    const monthlyGrouped: any = {};
    monthlyTrends.forEach((row: any) => {
      if (!monthlyGrouped[row.month]) {
        monthlyGrouped[row.month] = {
          month: row.month,
          pending: 0,
          paid: 0,
          denied: 0,
          disputed: 0,
          outstanding: 0,
          queried: 0,
        };
      }
      // Map 'pending' status to 'pending' for consistency
      const statusKey = row.status === 'pending' ? 'pending' : row.status;
      monthlyGrouped[row.month][statusKey] = row.count;
    });

    return apiResponse({
      summary,
      byHmo,
      monthlyTrends: Object.values(monthlyGrouped),
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
