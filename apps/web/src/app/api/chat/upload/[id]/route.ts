import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// PATCH /api/chat/upload/[id] - Link attachment to message
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier', 'lab_tech']);
    const userId = parseInt(session.user.id);
    const attachmentId = parseInt(params.id);

    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return apiResponse({ error: 'Message ID required' }, 400);
    }

    // Get attachment to verify ownership
    const attachment = await prisma.chatAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return apiResponse({ error: 'Attachment not found' }, 404);
    }

    if (attachment.uploadedBy !== userId) {
      return apiResponse({ error: 'Access denied' }, 403);
    }

    // Update attachment with message ID
    const updatedAttachment = await prisma.chatAttachment.update({
      where: { id: attachmentId },
      data: { messageId: parseInt(messageId) },
    });

    return apiResponse(updatedAttachment);
  } catch (error) {
    return handleApiError(error);
  }
}
