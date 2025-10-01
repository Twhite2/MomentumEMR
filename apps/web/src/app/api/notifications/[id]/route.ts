import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// PATCH /api/notifications/[id] - Mark single notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'cashier', 'patient']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);
    const notificationId = parseInt(params.id);

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        hospitalId,
      },
    });

    if (!notification) {
      return apiResponse({ error: 'Notification not found' }, 404);
    }

    // Mark as read
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return apiResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'cashier', 'patient']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);
    const notificationId = parseInt(params.id);

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        hospitalId,
      },
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
