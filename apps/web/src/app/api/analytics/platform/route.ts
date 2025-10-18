import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/analytics/platform - Super admin platform-wide analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can access platform analytics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Fetch platform-wide data in parallel
    const [
      totalHospitals,
      activeHospitals,
      totalUsers,
      totalPatients,
      hospitalsByPlan,
      recentHospitals,
      usersByRole,
    ] = await Promise.all([
      // Total hospitals
      prisma.hospital.count(),

      // Active hospitals
      prisma.hospital.count({
        where: { active: true },
      }),

      // Total users across all hospitals
      prisma.user.count(),

      // Total patients across all hospitals
      prisma.patient.count(),

      // Hospitals by subscription plan
      prisma.hospital.groupBy({
        by: ['subscriptionPlan'],
        _count: {
          id: true,
        },
      }),

      // Recent hospitals (last 30 days)
      prisma.hospital.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true,
        },
      }),
    ]);

    // Get hospitals with their stats
    const hospitalsWithStats = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            patients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Transform subscription data
    const subscriptionDistribution = hospitalsByPlan.reduce(
      (acc, plan) => {
        const planName = plan.subscriptionPlan || 'Basic';
        acc[planName] = plan._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Transform user role data
    const roleDistribution = usersByRole.reduce(
      (acc, role) => {
        acc[role.role] = role._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate subscription revenue (simplified - you can adjust pricing)
    const subscriptionPricing: Record<string, number> = {
      Basic: 50000, // NGN per month
      Standard: 100000,
      Premium: 200000,
      Enterprise: 500000,
    };

    const monthlyRevenue = hospitalsByPlan.reduce((total, plan) => {
      const planName = plan.subscriptionPlan || 'Basic';
      const price = subscriptionPricing[planName] || 0;
      return total + price * plan._count.id;
    }, 0);

    const yearlyRevenue = monthlyRevenue * 12;

    return NextResponse.json({
      summary: {
        totalHospitals,
        activeHospitals,
        inactiveHospitals: totalHospitals - activeHospitals,
        totalUsers,
        totalPatients,
        recentHospitals, // Last 30 days
        monthlyRevenue,
        yearlyRevenue,
      },
      subscriptionDistribution,
      roleDistribution,
      topHospitals: hospitalsWithStats.map((h: { id: number; name: string; subscriptionPlan: string | null; active: boolean; createdAt: Date; _count: { users: number; patients: number } }) => ({
        id: h.id,
        name: h.name,
        plan: h.subscriptionPlan,
        active: h.active,
        userCount: h._count.users,
        patientCount: h._count.patients,
        createdAt: h.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
