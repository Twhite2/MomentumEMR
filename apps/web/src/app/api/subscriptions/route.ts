import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/subscriptions - Get subscription plans with hospital counts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can access subscription management
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Define subscription plans with features
    const plans = [
      {
        id: 1,
        name: 'Basic',
        price: 50000,
        interval: 'monthly' as const,
        features: [
          'Up to 100 patients',
          'Basic EMR features',
          'Email support',
          '5 staff accounts',
          'Basic analytics',
        ],
        active: true,
      },
      {
        id: 2,
        name: 'Standard',
        price: 120000,
        interval: 'monthly' as const,
        features: [
          'Up to 500 patients',
          'Full EMR features',
          'Priority email support',
          '20 staff accounts',
          'Advanced analytics',
          'Lab integration',
          'Pharmacy management',
        ],
        active: true,
      },
      {
        id: 3,
        name: 'Premium',
        price: 250000,
        interval: 'monthly' as const,
        features: [
          'Unlimited patients',
          'All features included',
          '24/7 phone & email support',
          'Unlimited staff accounts',
          'Custom analytics',
          'Full integrations',
          'API access',
          'White-label option',
          'Dedicated account manager',
        ],
        active: true,
      },
    ];

    // Get hospital counts for each plan
    const hospitalCounts = await prisma.hospital.groupBy({
      by: ['subscriptionPlan'],
      _count: {
        id: true,
      },
    });

    // Map hospital counts to plans
    const plansWithCounts = plans.map(plan => {
      const count = hospitalCounts.find(
        h => h.subscriptionPlan === plan.name
      );
      return {
        ...plan,
        hospitals: count?._count.id || 0,
      };
    });

    // Calculate summary stats
    const totalHospitals = hospitalCounts.reduce((sum, plan) => sum + plan._count.id, 0);
    const totalRevenue = plansWithCounts.reduce(
      (sum, plan) => sum + plan.price * plan.hospitals,
      0
    );

    return NextResponse.json({
      plans: plansWithCounts,
      summary: {
        totalRevenue,
        totalHospitals,
        activePlans: plans.filter(p => p.active).length,
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
