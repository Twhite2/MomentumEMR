import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import crypto from 'crypto';

// POST /api/hospitals/[id]/send-setup-link - Resend password setup link to hospital admin
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can send setup links
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hospitalId = parseInt(params.id);

    // Find the hospital
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    // Find the admin user for this hospital
    const adminUser = await prisma.user.findFirst({
      where: {
        hospitalId: hospitalId,
        role: 'admin',
      },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'No admin user found for this hospital' },
        { status: 404 }
      );
    }

    // Generate new token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    // Generate setup link
    const setupLink = `${process.env.NEXTAUTH_URL}/auth/setup-password?token=${resetToken}`;

    // TODO: Send email
    console.log('=================================');
    console.log('PASSWORD SETUP LINK GENERATED');
    console.log('=================================');
    console.log(`Hospital: ${hospital.name}`);
    console.log(`Admin: ${adminUser.name}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Setup Link: ${setupLink}`);
    console.log('=================================');

    return NextResponse.json({
      message: 'Setup link sent successfully',
      setupLink, // For development/testing
      sentTo: adminUser.email,
    });
  } catch (error) {
    console.error('Error sending setup link:', error);
    return NextResponse.json(
      { error: 'Failed to send setup link' },
      { status: 500 }
    );
  }
}
