import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import { getSignedFileUrl, isS3Key } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hospitalId = parseInt(params.id);

    // Super admins can view any hospital, hospital admins can only view their own
    const isSuperAdmin = session.user.role === 'super_admin';
    const isHospitalAdmin = session.user.role === 'admin';
    
    if (!isSuperAdmin && !isHospitalAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Hospital admins can only view their own hospital
    if (isHospitalAdmin && parseInt(session.user.hospitalId as any) !== hospitalId) {
      return NextResponse.json({ error: 'Forbidden - You can only view your own hospital' }, { status: 403 });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    // Generate signed URL for logo if it's an S3 key
    let logoUrl = hospital.logoUrl;
    if (logoUrl && isS3Key(logoUrl)) {
      try {
        logoUrl = await getSignedFileUrl(logoUrl, 86400); // 24 hours
      } catch (error) {
        console.error('Error generating signed URL:', error);
      }
    }

    return NextResponse.json({
      ...hospital,
      logoUrl,
    });
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hospitalId = parseInt(params.id);

    // Super admins can update any hospital
    // Hospital admins (role: 'admin') can only update their own hospital
    const isSuperAdmin = session.user.role === 'super_admin';
    const isHospitalAdmin = session.user.role === 'admin';
    
    if (!isSuperAdmin && !isHospitalAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Hospital admins can only update their own hospital
    if (isHospitalAdmin && parseInt(session.user.hospitalId as any) !== hospitalId) {
      return NextResponse.json({ error: 'Forbidden - You can only update your own hospital' }, { status: 403 });
    }
    const data = await request.json();

    // Prepare update data
    const updateData: any = {
      name: data.name,
      address: data.address,
      phoneNumber: data.phoneNumber,
      contactEmail: data.contactEmail,
      subscriptionPlan: data.subscriptionPlan,
      active: data.active,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      tagline: data.tagline,
    };

    // Only update logoUrl if provided
    // Logo uploads should go through /api/hospitals/[id]/branding endpoint
    if (data.logoUrl) {
      updateData.logoUrl = data.logoUrl;
    }

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: updateData,
    }) as any;

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can delete hospitals
    if (session.user.role !== 'super_admin') {
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
