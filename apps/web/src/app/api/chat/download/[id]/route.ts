import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, handleApiError } from '@/lib/api-utils';
import { decryptFile, decryptKey } from '@/lib/chat-encryption';

// GET /api/chat/download/[id] - Download encrypted attachment
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier', 'lab_tech']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);
    const attachmentId = parseInt(params.id);

    // Get attachment
    const attachment = await prisma.chatAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        room: {
          include: {
            participants: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!attachment) {
      return new Response('Attachment not found', { status: 404 });
    }

    // Verify user has access (must be participant in room)
    if (attachment.room.participants.length === 0) {
      return new Response('Access denied', { status: 403 });
    }

    // Decrypt file
    const encryptionKey = decryptKey(attachment.encryptionKey);
    const fileBuffer = decryptFile(attachment.encryptedData, encryptionKey);

    // Create audit log
    await prisma.chatAuditLog.create({
      data: {
        hospitalId,
        userId,
        action: 'download',
        resourceType: 'attachment',
        resourceId: attachmentId,
        metadata: {
          roomId: attachment.roomId,
          fileName: attachment.originalFileName,
        },
      },
    });

    // Return file - Convert Buffer to Uint8Array for Response compatibility
    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': attachment.fileType,
        'Content-Disposition': `attachment; filename="${attachment.originalFileName}"`,
        'Content-Length': attachment.fileSize.toString(),
      },
    });
  } catch (error) {
    return new Response('Error downloading file', { status: 500 });
  }
}
