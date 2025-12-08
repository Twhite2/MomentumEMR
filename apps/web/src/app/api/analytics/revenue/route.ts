import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/analytics/revenue - Get revenue analytics
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where: any = { hospitalId };
    if (startDate || endDate) {
      where.createdAt = dateFilter;
    }

    // Get invoice statistics
    const [
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      invoiceCount,
      paidInvoiceCount,
      pendingInvoiceCount,
      recentInvoices,
    ] = await Promise.all([
      // Total revenue (all invoices)
      prisma.invoice.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      // Paid revenue
      prisma.invoice.aggregate({
        where: { ...where, status: 'paid' },
        _sum: { paidAmount: true },
      }),
      // Pending revenue
      prisma.invoice.aggregate({
        where: { ...where, status: 'pending' },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      // Invoice counts
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: { ...where, status: 'paid' } }),
      prisma.invoice.count({ where: { ...where, status: 'pending' } }),
      // Recent invoices
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientType: true,
            },
          },
        },
      }),
    ]);

    // Calculate outstanding balance
    const outstandingBalance =
      Number(pendingRevenue._sum.totalAmount || 0) - Number(pendingRevenue._sum.paidAmount || 0);

    // Get revenue by patient type
    const revenueByPatientType = await prisma.invoice.groupBy({
      by: ['patientId'],
      where,
      _sum: { paidAmount: true },
    });

    // Get patient types
    const patientIds = revenueByPatientType
      .map((r) => r.patientId)
      .filter((id): id is number => id !== null);
    const patients = await prisma.patient.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, patientType: true },
    });

    const revenueByType = patients.reduce((acc: any, patient) => {
      const revenue = revenueByPatientType.find((r) => r.patientId === patient.id);
      const amount = Number(revenue?._sum.paidAmount || 0);
      acc[patient.patientType] = (acc[patient.patientType] || 0) + amount;
      return acc;
    }, {});

    // Get daily revenue for the period (last 30 days if no date filter)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenueRaw: any = endDate
      ? await prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            SUM(paid_amount) as revenue,
            COUNT(*) as invoice_count
          FROM invoices
          WHERE hospital_id = ${hospitalId}
            AND created_at >= ${startDate ? new Date(startDate) : thirtyDaysAgo}
            AND created_at <= ${new Date(endDate)}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `
      : await prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            SUM(paid_amount) as revenue,
            COUNT(*) as invoice_count
          FROM invoices
          WHERE hospital_id = ${hospitalId}
            AND created_at >= ${startDate ? new Date(startDate) : thirtyDaysAgo}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `;

    // Convert BigInt to Number for JSON serialization
    const dailyRevenue = dailyRevenueRaw.map((item: any) => ({
      date: item.date,
      revenue: Number(item.revenue),
      invoice_count: Number(item.invoice_count),
    }));

    return apiResponse({
      summary: {
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        paidRevenue: Number(paidRevenue._sum.paidAmount || 0),
        outstandingBalance,
        invoiceCount,
        paidInvoiceCount,
        pendingInvoiceCount,
        collectionRate: totalRevenue._sum.totalAmount
          ? (Number(paidRevenue._sum.paidAmount || 0) / Number(totalRevenue._sum.totalAmount)) * 100
          : 0,
      },
      revenueByPatientType: revenueByType,
      dailyRevenue,
      recentInvoices,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
