import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view hospital details
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hospitalId = parseInt(params.id);

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json(hospital);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospital' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update hospitals
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hospitalId = parseInt(params.id);
    const data = await request.json();

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        contactEmail: data.contactEmail,
        subscriptionPlan: data.subscriptionPlan,
        active: data.active,
      },
    });

    return NextResponse.json(hospital);
  } catch (error) {
    console.error('Error updating hospital:', error);
    return NextResponse.json(
      { error: 'Failed to update hospital' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete hospitals
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hospitalId = parseInt(params.id);

    // Soft delete by marking as inactive
    await prisma.hospital.update({
      where: { id: hospitalId },
      data: { active: false },
    });

    return NextResponse.json({ message: 'Hospital deactivated successfully' });
  } catch (error) {
    console.error('Error deleting hospital:', error);
    return NextResponse.json(
      { error: 'Failed to delete hospital' },
      { status: 500 }
    );
  }
}
