import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import crypto from 'crypto';

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

    // Generate a secure token for password setup
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create hospital and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the hospital
      const hospital = await tx.hospital.create({
        data: {
          name: data.name,
          address: data.address,
          phoneNumber: data.phoneNumber,
          contactEmail: data.contactEmail,
          subscriptionPlan: data.subscriptionPlan || 'Basic',
          active: data.active ?? true,
          logoUrl: data.logoUrl || null,
          primaryColor: data.primaryColor || '#1253b2', // Momentum tory-blue
          secondaryColor: data.secondaryColor || '#729ad2', // Momentum danube
          tagline: data.tagline || null,
        },
      });

      // Create default admin user for the hospital
      const adminUser = await tx.user.create({
        data: {
          hospitalId: hospital.id,
          name: `${hospital.name} Admin`,
          email: data.contactEmail,
          hashedPassword: crypto.randomBytes(32).toString('hex'), // Temporary random password
          role: 'admin',
          active: false, // Will be activated when password is set
          passwordResetToken: resetToken,
          passwordResetExpiry: resetExpiry,
        },
      });

      return { hospital, adminUser, resetToken };
    });

    // Generate password setup link
    const setupLink = `${process.env.NEXTAUTH_URL}/auth/setup-password?token=${result.resetToken}`;

    // TODO: Send email to hospital contact with setup link
    console.log('=================================');
    console.log('HOSPITAL CREATED SUCCESSFULLY');
    console.log('=================================');
    console.log(`Hospital: ${result.hospital.name}`);
    console.log(`Admin Email: ${result.adminUser.email}`);
    console.log(`Password Setup Link: ${setupLink}`);
    console.log('=================================');
    console.log('📧 Email should be sent to:', data.contactEmail);
    console.log('Subject: Welcome to Momentum EMR - Set Up Your Account');
    console.log('=================================');

    return NextResponse.json({
      hospital: result.hospital,
      adminUser: {
        id: result.adminUser.id,
        name: result.adminUser.name,
        email: result.adminUser.email,
        role: result.adminUser.role,
      },
      setupLink, // Include in response for development/testing
      message: 'Hospital created. Password setup email sent to contact email.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating hospital:', error);
    return NextResponse.json(
      { error: 'Failed to create hospital' },
      { status: 500 }
    );
  }
}
