import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/chat/rooms - Get all chat rooms for current user
export async function GET(request: NextRequest) {
  try {
    // Exclude super_admin from chat access
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier', 'lab_tech']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);

    // Get all rooms where user is a participant
    const rooms = await prisma.chatRoom.findMany({
      where: {
        hospitalId,
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                active: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            senderId: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get unread counts for each room
    const roomsWithUnread = rooms.map((room) => {
      const participant = room.participants.find((p) => p.userId === userId);
      return {
        ...room,
        unreadCount: participant?.unreadCount || 0,
        lastMessageAt: room.messages[0]?.createdAt || room.createdAt,
      };
    });

    return apiResponse(roomsWithUnread);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/chat/rooms - Create a new chat room (private chat)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier', 'lab_tech']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);

    const body = await request.json();
    const { participantId, roomType } = body;

    if (roomType === 'private' && !participantId) {
      return apiResponse({ error: 'Participant ID required for private chat' }, 400);
    }

    // Check if private chat already exists between these users
    if (roomType === 'private') {
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          hospitalId,
          roomType: 'private',
          participants: {
            every: {
              OR: [{ userId }, { userId: participantId }],
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (existingRoom && existingRoom.participants.length === 2) {
        return apiResponse(existingRoom);
      }
    }

    // Create new room
    const room = await prisma.chatRoom.create({
      data: {
        hospitalId,
        roomType,
        name: roomType === 'general' ? 'General Chat' : null,
        createdBy: userId,
        participants: {
          create: [
            { userId },
            ...(participantId ? [{ userId: participantId }] : []),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return apiResponse(room, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
