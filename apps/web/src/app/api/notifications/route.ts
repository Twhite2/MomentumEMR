import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['super_admin', 'admin', 'doctor', 'nurse', 'pharmacist', 'receptionist', 'lab_tech', 'cashier', 'patient']);
    const userId = parseInt(session.user.id);
    const hospitalId = session.user.hospitalId ? parseInt(session.user.hospitalId) : null;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    // Super admin doesn't have hospitalId, so don't filter by it
    if (hospitalId !== null) {
      where.hospitalId = hospitalId;
    }

    if (unreadOnly) {
      where.readAt = null; // Unread means readAt is null
    }

    const unreadWhere: any = { userId, readAt: null };
    if (hospitalId !== null) {
      unreadWhere.hospitalId = hospitalId;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: unreadWhere }),
    ]);

    return apiResponse({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['super_admin', 'admin', 'doctor', 'nurse', 'pharmacist', 'receptionist', 'lab_tech', 'cashier', 'patient']);
    const userId = parseInt(session.user.id);
    const hospitalId = session.user.hospitalId ? parseInt(session.user.hospitalId) : null;

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all user's notifications as read
      const markAllWhere: any = { userId, readAt: null };
      if (hospitalId !== null) {
        markAllWhere.hospitalId = hospitalId;
      }
      await prisma.notification.updateMany({
        where: markAllWhere,
        data: {
          readAt: new Date(),
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const markSpecificWhere: any = {
        id: { in: notificationIds.map((id: string) => parseInt(id)) },
        userId,
      };
      if (hospitalId !== null) {
        markSpecificWhere.hospitalId = hospitalId;
      }
      await prisma.notification.updateMany({
        where: markSpecificWhere,
        data: {
          readAt: new Date(),
        },
      });
    } else {
      return apiResponse({ error: 'Invalid request' }, 400);
    }

    return apiResponse({ message: 'Notifications marked as read' });
  } catch (error) {
    return handleApiError(error);
  }
}
