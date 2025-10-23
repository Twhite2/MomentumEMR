import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/super-admin/stats - Get platform-wide statistics for super admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get platform-wide statistics
    const [
      totalHospitals,
      hospitalsThisMonth,
      activeSubscriptions,
      pendingSubscriptions,
      totalPatients,
      patientsByType,
      totalSubscriptionRevenue,
      recentHospitals,
    ] = await Promise.all([
      // Total hospitals
      prisma.hospital.count(),

      // Hospitals registered this month
      prisma.hospital.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Active subscriptions (assuming subscription table exists, fallback to hospital count)
      prisma.hospital.count({
        where: {
          active: true,
        },
      }),

      // Pending subscriptions (inactive hospitals)
      prisma.hospital.count({
        where: {
          active: false,
        },
      }),

      // Total patients across all hospitals
      prisma.patient.count(),

      // Patients by type across all hospitals
      prisma.patient.groupBy({
        by: ['patientType'],
        _count: true,
      }),

      // Total revenue from subscriptions (placeholder - requires subscription/billing table)
      // For now, using a calculation based on hospital count
      prisma.hospital.count().then(count => count * 50000), // Assume ₦50k per hospital

      // Recent hospital registrations
      prisma.hospital.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          active: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate patient type breakdown
    const patientTypeBreakdown = patientsByType.reduce((acc: any, group) => {
      const percentage = totalPatients > 0 
        ? Math.round((group._count / totalPatients) * 100) 
        : 0;
      acc[group.patientType] = {
        count: group._count,
        percentage,
      };
      return acc;
    }, {});

    // Calculate age distribution (simplified - requires actual DOB calculation)
    // This is a placeholder for now
    const ageDistribution = {
      '0-18': { percentage: 18 },
      '19-35': { percentage: 35 },
      '36-60': { percentage: 32 },
      '60+': { percentage: 15 },
    };

    return NextResponse.json({
      totalHospitals,
      hospitalsThisMonth,
      activeSubscriptions,
      pendingSubscriptions,
      totalPatients,
      patientTypeBreakdown,
      ageDistribution,
      totalSubscriptionRevenue,
      recentHospitals: recentHospitals.map(h => ({
        id: h.id,
        name: h.name,
        status: h.active ? 'Active' : 'Pending',
        plan: 'Standard', // Placeholder - requires subscription table
        date: h.createdAt,
      })),
    });
  } catch (error) {
    console.error('Super admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch super admin statistics' },
      { status: 500 }
    );
  }
}
