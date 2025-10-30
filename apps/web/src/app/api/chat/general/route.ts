import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/chat/general - Get or create general chat room
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier', 'lab_tech']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);

    // Check if general room exists
    let generalRoom = await prisma.chatRoom.findFirst({
      where: {
        hospitalId,
        roomType: 'general',
      },
    });

    // Create general room if it doesn't exist
    if (!generalRoom) {
      generalRoom = await prisma.chatRoom.create({
        data: {
          hospitalId,
          roomType: 'general',
          name: 'General Chat',
          createdBy: userId,
        },
      });

      // Create audit log
      await prisma.chatAuditLog.create({
        data: {
          hospitalId,
          userId,
          action: 'create',
          resourceType: 'room',
          resourceId: generalRoom.id,
          metadata: { roomType: 'general' },
        },
      });
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId: generalRoom.id,
          userId,
        },
      },
    });

    // Add user as participant if not already
    if (!existingParticipant) {
      await prisma.chatParticipant.create({
        data: {
          roomId: generalRoom.id,
          userId,
          joinedAt: new Date(),
        },
      });
    }

    // Get room with participant info
    const roomWithInfo = await prisma.chatRoom.findUnique({
      where: { id: generalRoom.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate unread count
    const participant = roomWithInfo?.participants.find((p) => p.userId === userId);
    const unreadCount = participant?.lastRead
      ? await prisma.chatMessage.count({
          where: {
            roomId: generalRoom.id,
            createdAt: { gt: participant.lastRead },
            senderId: { not: userId },
          },
        })
      : 0;

    return apiResponse({
      id: roomWithInfo!.id,
      name: roomWithInfo!.name,
      roomType: roomWithInfo!.roomType,
      participants: roomWithInfo!.participants.map((p: any) => ({
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        role: p.user.role,
        user: p.user, // Include full user object for compatibility
      })),
      lastMessage: roomWithInfo!.messages[0] || null,
      lastMessageAt: roomWithInfo!.messages[0]?.createdAt || null,
      unreadCount,
      createdAt: roomWithInfo!.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
