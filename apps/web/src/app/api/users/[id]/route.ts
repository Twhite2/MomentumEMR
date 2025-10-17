import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(params.id);

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        hospitalId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return apiResponse({ error: 'User not found' }, 404);
    }

    return apiResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(params.id);

    const body = await request.json();
    const { name, email, password, role, active } = body;

    // Verify user exists
    const existing = await prisma.user.findFirst({
      where: { id: userId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'User not found' }, 404);
    }

    // Check if email is being changed and already exists
    if (email && email !== existing.email) {
      const emailExists = await prisma.user.findFirst({
        where: { email, hospitalId, id: { not: userId } },
      });

      if (emailExists) {
        return apiResponse({ error: 'Email already exists' }, 400);
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });

    return apiResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(params.id);

    // Verify user exists
    const existing = await prisma.user.findFirst({
      where: { id: userId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'User not found' }, 404);
    }

    // Prevent self-deletion
    if (userId === parseInt(session.user.id)) {
      return apiResponse({ error: 'Cannot delete your own account' }, 400);
    }

    // Instead of deleting, deactivate the user
    await prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });

    return apiResponse({ message: 'User deactivated successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
