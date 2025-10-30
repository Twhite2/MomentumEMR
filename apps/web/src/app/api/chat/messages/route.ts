import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import { encryptMessage, decryptMessage, encryptKey, decryptKey } from '@/lib/chat-encryption';

// GET /api/chat/messages - Get messages for a room
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier', 'lab_tech']);
    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const roomId = parseInt(searchParams.get('roomId') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Message ID for pagination

    if (!roomId) {
      return apiResponse({ error: 'Room ID required' }, 400);
    }

    // Verify user is participant in this room
    const participant = await prisma.chatParticipant.findFirst({
      where: { roomId, userId },
    });

    if (!participant) {
      return apiResponse({ error: 'Access denied to this chat room' }, 403);
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        deletedAt: null,
        ...(before ? { id: { lt: parseInt(before) } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: {
          select: {
            id: true,
            originalFileName: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Decrypt messages for this user
    const decryptedMessages = messages.map((msg: any) => {
      try {
        // Format is: iv:authTag:encryptedData:::encryptedKey
        const lastSeparator = msg.encryptedContent.lastIndexOf(':::');
        if (lastSeparator === -1) {
          console.error('Invalid message format - no separator found:', msg.id);
          throw new Error('Invalid encrypted message format');
        }
        
        const encryptedMessage = msg.encryptedContent.substring(0, lastSeparator);
        const encryptedKey = msg.encryptedContent.substring(lastSeparator + 3);
        
        // Decrypt the encryption key
        const messageKey = decryptKey(encryptedKey);
        
        // Decrypt the message content
        const content = decryptMessage(encryptedMessage, messageKey);

        return {
          ...msg,
          content,
          encryptedContent: undefined, // Don't send encrypted version to client
        };
      } catch (error: any) {
        console.error(`Failed to decrypt message ${msg.id}:`, {
          error: error.message,
          stack: error.stack,
          messageLength: msg.encryptedContent?.length,
          hasSeparator: msg.encryptedContent?.includes(':::'),
        });
        return {
          ...msg,
          content: '[Unable to decrypt - message may be corrupted or encrypted with old key]',
          encryptedContent: undefined,
        };
      }
    });

    // Mark messages as read
    await prisma.chatParticipant.update({
      where: {
        roomId_userId: { roomId, userId },
      },
      data: {
        lastRead: new Date(),
        unreadCount: 0,
      },
    });

    // Create audit log
    await prisma.chatAuditLog.create({
      data: {
        hospitalId: parseInt(session.user.hospitalId),
        userId,
        action: 'read',
        resourceType: 'message',
        resourceId: roomId,
        metadata: { messageCount: messages.length },
      },
    });

    return apiResponse(decryptedMessages.reverse()); // Return chronological order
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/chat/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier', 'lab_tech']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);

    const body = await request.json();
    const { roomId, content, mentionedUserIds, replyToMessageId } = body;

    if (!roomId || !content) {
      return apiResponse({ error: 'Room ID and content required' }, 400);
    }

    // Verify user is participant
    const participant = await prisma.chatParticipant.findFirst({
      where: { roomId, userId },
    });

    if (!participant) {
      return apiResponse({ error: 'Access denied to this chat room' }, 403);
    }

    // Encrypt message
    const { encrypted, key } = encryptMessage(content);
    const encryptedKey = encryptKey(key);
    
    // Store encrypted content with encrypted key appended
    const storedContent = `${encrypted}:::${encryptedKey}`;

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: userId,
        encryptedContent: storedContent,
        mentionedUserIds: mentionedUserIds || [],
        replyToMessageId: replyToMessageId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    // Update unread counts for other participants
    await prisma.chatParticipant.updateMany({
      where: {
        roomId,
        userId: { not: userId },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // Update room updated time
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    // Create audit log
    await prisma.chatAuditLog.create({
      data: {
        hospitalId,
        userId,
        action: 'send',
        resourceType: 'message',
        resourceId: message.id,
        metadata: { roomId, mentionedCount: mentionedUserIds?.length || 0 },
      },
    });

    // Return decrypted message
    return apiResponse({
      ...message,
      content,
      encryptedContent: undefined,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
