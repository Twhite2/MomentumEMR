import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import { encryptFile, encryptKey } from '@/lib/chat-encryption';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];

// POST /api/chat/upload - Upload file attachment
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier', 'lab_tech']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const roomId = parseInt(formData.get('roomId') as string);
    const messageId = formData.get('messageId') as string;

    if (!file || !roomId) {
      return apiResponse({ error: 'File and room ID required' }, 400);
    }

    // Verify user is participant
    const participant = await prisma.chatParticipant.findFirst({
      where: { roomId, userId },
    });

    if (!participant) {
      return apiResponse({ error: 'Access denied to this chat room' }, 403);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiResponse(
        { error: 'Invalid file type. Allowed: PDF, JPG, PNG, DOCX, XLSX' },
        400
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return apiResponse({ error: 'File size exceeds 10MB limit' }, 400);
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Encrypt file
    const { encrypted, key } = encryptFile(buffer);
    const encryptedKey = encryptKey(key);

    // Store attachment
    const attachment = await prisma.chatAttachment.create({
      data: {
        roomId,
        messageId: messageId ? parseInt(messageId) : null,
        uploadedBy: userId,
        originalFileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        encryptedData: encrypted,
        encryptionKey: encryptedKey,
      },
    });

    // Create audit log
    await prisma.chatAuditLog.create({
      data: {
        hospitalId,
        userId,
        action: 'upload',
        resourceType: 'attachment',
        resourceId: attachment.id,
        metadata: {
          roomId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      },
    });

    return apiResponse({
      id: attachment.id,
      originalFileName: attachment.originalFileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      uploadedAt: attachment.uploadedAt,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
