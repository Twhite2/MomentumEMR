import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import { subscriptionPlans } from '@/lib/subscription-plans';

// GET /api/analytics/subscriptions - Subscription analytics for super admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can access subscription analytics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all hospitals with subscription info
    const hospitals = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        active: true,
        createdAt: true,
      },
    });

    // Build pricing map from subscription plans (single source of truth)
    const subscriptionPricing: Record<string, number> = subscriptionPlans.reduce(
      (acc, plan) => {
        acc[plan.name] = plan.price;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate revenue by plan
    const revenueByPlan: Record<string, any> = {};
    
    hospitals.forEach((hospital: { id: number; name: string; subscriptionPlan: string | null; active: boolean; createdAt: Date }) => {
      const plan = hospital.subscriptionPlan || 'Basic';
      const price = subscriptionPricing[plan] || 0;
      
      if (!revenueByPlan[plan]) {
        revenueByPlan[plan] = {
          count: 0,
          monthlyRevenue: 0,
          yearlyRevenue: 0,
          activeCount: 0,
        };
      }
      
      revenueByPlan[plan].count += 1;
      if (hospital.active) {
        revenueByPlan[plan].activeCount += 1;
        revenueByPlan[plan].monthlyRevenue += price;
        revenueByPlan[plan].yearlyRevenue += price * 12;
      }
    });

    // Calculate totals
    const totalMonthlyRevenue = Object.values(revenueByPlan).reduce(
      (sum: number, plan: any) => sum + plan.monthlyRevenue,
      0
    );
    const totalYearlyRevenue = totalMonthlyRevenue * 12;
    const activeSubscriptions = hospitals.filter((h: { active: boolean }) => h.active).length;

    // Get growth metrics (compare with previous month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const hospitalsLastMonth = await prisma.hospital.count({
      where: {
        createdAt: {
          lte: lastMonth,
        },
      },
    });

    const growthRate =
      hospitalsLastMonth > 0
        ? ((hospitals.length - hospitalsLastMonth) / hospitalsLastMonth) * 100
        : 0;

    return NextResponse.json({
      summary: {
        totalSubscriptions: hospitals.length,
        activeSubscriptions,
        inactiveSubscriptions: hospitals.length - activeSubscriptions,
        totalMonthlyRevenue,
        totalYearlyRevenue,
        growthRate: growthRate.toFixed(2),
      },
      revenueByPlan,
      pricing: subscriptionPricing,
      recentSubscriptions: hospitals
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10)
        .map((h: { id: number; name: string; subscriptionPlan: string | null; active: boolean; createdAt: Date }) => {
          const planName = h.subscriptionPlan || 'Basic';
          return {
            id: h.id,
            name: h.name,
            plan: planName,
            active: h.active,
            revenue: h.active ? subscriptionPricing[planName] : 0,
            createdAt: h.createdAt,
          };
        }),
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription analytics' },
      { status: 500 }
    );
  }
}
