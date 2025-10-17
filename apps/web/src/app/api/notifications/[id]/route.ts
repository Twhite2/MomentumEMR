import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// PATCH /api/notifications/[id] - Mark single notification as read
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['super_admin', 'admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'cashier', 'patient']);
    const userId = parseInt(session.user.id);
    const hospitalId = session.user.hospitalId ? parseInt(session.user.hospitalId) : null;
    const notificationId = parseInt(params.id);

    // Verify notification belongs to user
    const findWhere: any = {
      id: notificationId,
      userId,
    };
    if (hospitalId !== null) {
      findWhere.hospitalId = hospitalId;
    }

    const notification = await prisma.notification.findFirst({
      where: findWhere,
    });

    if (!notification) {
      return apiResponse({ error: 'Notification not found' }, 404);
    }

    // Mark as read
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return apiResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['super_admin', 'admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'cashier', 'patient']);
    const userId = parseInt(session.user.id);
    const hospitalId = session.user.hospitalId ? parseInt(session.user.hospitalId) : null;
    const notificationId = parseInt(params.id);

    // Verify notification belongs to user
    const deleteWhere: any = {
      id: notificationId,
      userId,
    };
    if (hospitalId !== null) {
      deleteWhere.hospitalId = hospitalId;
    }

    const notification = await prisma.notification.findFirst({
      where: deleteWhere,
    });

    if (!notification) {
      return apiResponse({ error: 'Notification not found' }, 404);
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return apiResponse({ message: 'Notification deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
