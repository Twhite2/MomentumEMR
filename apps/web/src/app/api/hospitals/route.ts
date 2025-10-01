import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view all hospitals
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hospitals = await prisma.hospital.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospitals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create hospitals
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    const hospital = await prisma.hospital.create({
      data: {
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        contactEmail: data.contactEmail,
        subscriptionPlan: data.subscriptionPlan || 'Basic',
        active: data.active ?? true,
      },
    });

    return NextResponse.json(hospital, { status: 201 });
  } catch (error) {
    console.error('Error creating hospital:', error);
    return NextResponse.json(
      { error: 'Failed to create hospital' },
      { status: 500 }
    );
  }
}
