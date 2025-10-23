import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// Define in-memory store for subscription plans (since they're not in the database)
// In a production app, you'd store these in a database table
let subscriptionPlans = [
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

    // Get hospital counts for each plan
    const hospitalCounts = await prisma.hospital.groupBy({
      by: ['subscriptionPlan'],
      _count: {
        id: true,
      },
    });

    // Map hospital counts to plans
    const plansWithCounts = subscriptionPlans.map(plan => {
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
        activePlans: subscriptionPlans.filter(p => p.active).length,
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

// POST /api/subscriptions - Create new subscription plan
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, price, interval, features } = body;

    // Validation
    if (!name || !price || !features || !Array.isArray(features)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if plan name already exists
    if (subscriptionPlans.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 });
    }

    // Create new plan
    const newPlan = {
      id: Math.max(...subscriptionPlans.map(p => p.id)) + 1,
      name,
      price: parseFloat(price),
      interval: interval || 'monthly',
      features,
      active: true,
    };

    subscriptionPlans.push(newPlan);

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// PUT /api/subscriptions/:id - Update subscription plan
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, price, interval, features, active } = body;

    // Find plan
    const planIndex = subscriptionPlans.findIndex(p => p.id === id);
    if (planIndex === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update plan
    subscriptionPlans[planIndex] = {
      ...subscriptionPlans[planIndex],
      ...(name && { name }),
      ...(price && { price: parseFloat(price) }),
      ...(interval && { interval }),
      ...(features && { features }),
      ...(active !== undefined && { active }),
    };

    return NextResponse.json(subscriptionPlans[planIndex]);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
