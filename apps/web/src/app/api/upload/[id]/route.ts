import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import { FileStorage } from '@/lib/file-storage';

// GET /api/upload/[id] - Get file details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'cashier', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);
    const fileDbId = parseInt(params.id);

    const file = await prisma.file.findFirst({
      where: {
        id: fileDbId,
        hospitalId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!file) {
      return apiResponse({ error: 'File not found' }, 404);
    }

    // Generate signed URL if using S3
    const signedUrl = await FileStorage.getSignedUrl(file.fileId, file.category as any);

    return apiResponse({
      ...file,
      signedUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/upload/[id] - Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['admin', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const fileDbId = parseInt(params.id);

    const file = await prisma.file.findFirst({
      where: {
        id: fileDbId,
        hospitalId,
      },
    });

    if (!file) {
      return apiResponse({ error: 'File not found' }, 404);
    }

    // Delete from storage
    await FileStorage.deleteFile(file.fileId, file.category as any);

    // Delete from database
    await prisma.file.delete({
      where: { id: fileDbId },
    });

    return apiResponse({ message: 'File deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
