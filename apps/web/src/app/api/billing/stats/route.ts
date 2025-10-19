import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/billing/stats - Get billing statistics
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier', 'doctor', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userRole = session.user.role;

    if (userRole === 'patient') {
      // Patient stats
      const userId = parseInt(session.user.id);
      
      // Find patient record
      const patient = await prisma.patient.findFirst({
        where: {
          hospitalId,
          userId,
        },
      });

      if (!patient) {
        return apiResponse({
          outstandingBalance: 0,
          totalPaidThisYear: 0,
          billsPaidCount: 0,
        });
      }

      // Calculate patient stats
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);

      const [outstandingInvoices, paidInvoices] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            hospitalId,
            patientId: patient.id,
            status: 'pending',
          },
        }),
        prisma.invoice.findMany({
          where: {
            hospitalId,
            patientId: patient.id,
            status: 'paid',
          },
          include: {
            payments: true,
          },
        }),
      ]);

      // Filter paid invoices for this year
      const paidInvoicesThisYear = paidInvoices.filter((inv) => {
        const payment = inv.payments[0];
        return payment && new Date(payment.paymentDate) >= yearStart;
      });

      const outstandingBalance = outstandingInvoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      );

      const totalPaidThisYear = paidInvoicesThisYear.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      );

      return apiResponse({
        outstandingBalance,
        totalPaidThisYear,
        billsPaidCount: paidInvoicesThisYear.length,
      });
    } else {
      // Staff stats - Company financials
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const lastMonth = new Date(currentMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const [
        totalRevenueAgg,
        pendingInvoices,
        allPaidInvoices,
      ] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            hospitalId,
            status: 'paid',
          },
          _sum: { totalAmount: true },
        }),
        prisma.invoice.findMany({
          where: {
            hospitalId,
            status: 'pending',
          },
        }),
        prisma.invoice.findMany({
          where: {
            hospitalId,
            status: 'paid',
          },
          include: {
            payments: true,
          },
        }),
      ]);

      // Filter paid invoices by date using Payment.paymentDate
      const paidToday = allPaidInvoices.filter((inv) => {
        const payment = inv.payments[0];
        return payment && new Date(payment.paymentDate) >= today;
      });

      const paidThisMonth = allPaidInvoices.filter((inv) => {
        const payment = inv.payments[0];
        return payment && new Date(payment.paymentDate) >= currentMonth;
      });

      const paidLastMonth = allPaidInvoices.filter((inv) => {
        const payment = inv.payments[0];
        const paymentDate = payment && new Date(payment.paymentDate);
        return paymentDate && paymentDate >= lastMonth && paymentDate < currentMonth;
      });

      // Calculate overdue (pending invoices older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const overdueInvoices = pendingInvoices.filter(
        (inv) => new Date(inv.createdAt) < thirtyDaysAgo
      );

      const pendingAmount = pendingInvoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      );

      const paidTodayAmount = paidToday.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      );

      const overdueAmount = overdueInvoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      );

      // Calculate month-over-month growth
      const currentRevenue = paidThisMonth.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      );
      const lastRevenue = paidLastMonth.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      );
      const growthPercentage = lastRevenue > 0 
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 
        : 0;

      return apiResponse({
        totalRevenue: Number(totalRevenueAgg._sum?.totalAmount || 0),
        revenueGrowth: Math.round(growthPercentage),
        pendingInvoicesCount: pendingInvoices.length,
        pendingAmount,
        paidTodayCount: paidToday.length,
        paidTodayAmount,
        overdueCount: overdueInvoices.length,
        overdueAmount,
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
