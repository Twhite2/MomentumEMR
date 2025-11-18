import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can view all hospitals
    if (session.user.role !== 'super_admin') {
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

    // Only super admins can create hospitals
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.contactEmail || !data.password) {
      return NextResponse.json(
        { error: 'Name, contact email, and password are required' },
        { status: 400 }
      );
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Remove id field if present to avoid unique constraint error
    const { id, password, ...hospitalData } = data;

    // Create hospital and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the hospital
      const hospital = await tx.hospital.create({
        data: {
          name: hospitalData.name,
          address: hospitalData.address,
          phoneNumber: hospitalData.phoneNumber,
          contactEmail: hospitalData.contactEmail,
          subscriptionPlan: hospitalData.subscriptionPlan || 'Basic',
          active: hospitalData.active ?? true,
          logoUrl: hospitalData.logoUrl || null,
          primaryColor: hospitalData.primaryColor || '#1253b2', // Momentum tory-blue
          secondaryColor: hospitalData.secondaryColor || '#729ad2', // Momentum danube
          tagline: hospitalData.tagline || null,
        },
      });

      // Create default admin user for the hospital
      const adminUser = await tx.user.create({
        data: {
          hospitalId: hospital.id,
          name: `${hospital.name} Admin`,
          email: hospitalData.contactEmail,
          hashedPassword,
          role: 'admin',
          active: true, // Activated immediately with password
        },
      });

      return { hospital, adminUser };
    });

    console.log('=================================');
    console.log('HOSPITAL CREATED SUCCESSFULLY');
    console.log('=================================');
    console.log(`Hospital: ${result.hospital.name}`);
    console.log(`Admin Email: ${result.adminUser.email}`);
    console.log(`Admin can now login with the provided password`);
    console.log('=================================');

    return NextResponse.json({
      hospital: result.hospital,
      adminUser: {
        id: result.adminUser.id,
        name: result.adminUser.name,
        email: result.adminUser.email,
        role: result.adminUser.role,
      },
      message: 'Hospital created successfully. Admin account is ready to use.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating hospital:', error);
    return NextResponse.json(
      { error: 'Failed to create hospital' },
      { status: 500 }
    );
  }
}
