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

    // Date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.submissionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // HMO filter
    const where: any = { 
      claimBatch: { hospitalId } 
    };
    
    if (hmoId) {
      where.hmoId = parseInt(hmoId);
    }

    if (Object.keys(dateFilter).length > 0) {
      Object.assign(where, dateFilter);
    }

    // Get all claims with grouping by status
    const claimsByStatus = await prisma.claimSubmission.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { 
        submittedAmount: true,
        approvedAmount: true,
        paidAmount: true,
      },
    });

    // Get claims by HMO
    const claimsByHmo = await prisma.claimSubmission.groupBy({
      by: ['hmoId', 'status'],
      where,
      _count: { _all: true },
      _sum: {
        submittedAmount: true,
        approvedAmount: true,
        paidAmount: true,
      },
    });

    // Get HMO details for the grouped claims
    const hmoIds = [...new Set(claimsByHmo.map(c => c.hmoId))];
    const hmos = await prisma.hmo.findMany({
      where: { id: { in: hmoIds } },
      select: { id: true, name: true },
    });

    const hmoMap = new Map(hmos.map(h => [h.id, h.name]));

    // Calculate summary metrics
    const summary = {
      totalClaims: 0,
      totalAmount: 0,
      submitted: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      denied: { count: 0, amount: 0 },
      disputed: { count: 0, amount: 0 },
      outstanding: { count: 0, amount: 0 },
      queried: { count: 0, amount: 0 },
    };

    claimsByStatus.forEach(group => {
      const count = group._count._all;
      const amount = Number(group._sum.submittedAmount || 0);
      
      summary.totalClaims += count;
      summary.totalAmount += amount;

      const status = group.status;
      if (status === 'submitted') {
        summary.submitted = { count, amount };
      } else if (status === 'paid') {
        summary.paid = { count, amount: Number(group._sum.paidAmount || 0) };
      } else if (status === 'denied') {
        summary.denied = { count, amount };
      } else if (status === 'disputed') {
        summary.disputed = { count, amount };
      } else if (status === 'outstanding') {
        summary.outstanding = { count, amount };
      } else if (status === 'queried') {
        summary.queried = { count, amount };
      }
    });

    // Format byHmo data
    const hmoBreakdown: any = {};
    
    claimsByHmo.forEach(group => {
      const hmoId = group.hmoId;
      const hmoName = hmoMap.get(hmoId) || `HMO ${hmoId}`;
      
      if (!hmoBreakdown[hmoId]) {
        hmoBreakdown[hmoId] = {
          hmoId,
          hmoName,
          submitted: { count: 0, amount: 0 },
          paid: { count: 0, amount: 0 },
          denied: { count: 0, amount: 0 },
          disputed: { count: 0, amount: 0 },
          outstanding: { count: 0, amount: 0 },
          queried: { count: 0, amount: 0 },
          totalClaims: 0,
          totalAmount: 0,
        };
      }

      const count = group._count._all;
      const amount = Number(group._sum.submittedAmount || 0);
      const status = group.status;

      hmoBreakdown[hmoId].totalClaims += count;
      hmoBreakdown[hmoId].totalAmount += amount;

      if (status === 'submitted') {
        hmoBreakdown[hmoId].submitted = { count, amount };
      } else if (status === 'paid') {
        hmoBreakdown[hmoId].paid = { 
          count, 
          amount: Number(group._sum.paidAmount || 0) 
        };
      } else if (status === 'denied') {
        hmoBreakdown[hmoId].denied = { count, amount };
      } else if (status === 'disputed') {
        hmoBreakdown[hmoId].disputed = { count, amount };
      } else if (status === 'outstanding') {
        hmoBreakdown[hmoId].outstanding = { count, amount };
      } else if (status === 'queried') {
        hmoBreakdown[hmoId].queried = { count, amount };
      }
    });

    // Convert to array and calculate payment rates
    const byHmo = Object.values(hmoBreakdown).map((hmo: any) => ({
      ...hmo,
      paymentRate: hmo.totalClaims > 0 
        ? Math.round((hmo.paid.count / hmo.totalClaims) * 100) 
        : 0,
      outstandingAmount: hmo.submitted.amount - hmo.paid.amount,
    }));

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await prisma.claimSubmission.groupBy({
      by: ['status'],
      where: {
        ...where,
        submissionDate: {
          gte: sixMonthsAgo,
        },
      },
      _count: { _all: true },
      _sum: { submittedAmount: true },
    });

    // Get month-by-month breakdown
    const monthlyTrends = await prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR(submission_date, 'YYYY-MM') as month,
        status,
        COUNT(*)::int as count,
        SUM(submitted_amount)::numeric as amount
      FROM claim_submissions cs
      JOIN claim_batches cb ON cs.claim_batch_id = cb.id
      WHERE cb.hospital_id = ${hospitalId}
        ${hmoId ? Prisma.sql`AND cs.hmo_id = ${parseInt(hmoId)}` : Prisma.empty}
        AND cs.submission_date >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(submission_date, 'YYYY-MM'), status
      ORDER BY month DESC
    `;

    // Format monthly trends
    const monthlyGrouped: any = {};
    monthlyTrends.forEach((row: any) => {
      if (!monthlyGrouped[row.month]) {
        monthlyGrouped[row.month] = {
          month: row.month,
          submitted: 0,
          paid: 0,
          denied: 0,
          disputed: 0,
          outstanding: 0,
          queried: 0,
        };
      }
      monthlyGrouped[row.month][row.status] = row.count;
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
