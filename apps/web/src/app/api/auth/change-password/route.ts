import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { auth } from '@/lib/auth';
import { apiResponse } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return apiResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return apiResponse({ error: 'Current password and new password are required' }, 400);
    }

    if (newPassword.length < 8) {
      return apiResponse({ error: 'New password must be at least 8 characters long' }, 400);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!user) {
      return apiResponse({ error: 'User not found' }, 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);

    if (!isPasswordValid) {
      return apiResponse({ error: 'Current password is incorrect' }, 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear mustChangePassword flag
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        mustChangePassword: false,
      },
    });

    return apiResponse({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return apiResponse({ error: 'Failed to change password' }, 500);
  }
}
