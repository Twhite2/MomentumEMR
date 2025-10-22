import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/lab-results/[id]/finalize - Finalize lab result
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['lab_tech', 'admin']);
    const resultId = parseInt(params.id);
    const userId = parseInt(session.user.id);

    // First, fetch the result to check ownership
    const existingResult = await prisma.labResult.findUnique({
      where: { id: resultId },
      select: { uploadedBy: true },
    });

    if (!existingResult) {
      return apiResponse({ error: 'Lab result not found' }, 404);
    }

    // Authorization: Only the uploader or admin can finalize
    if (session.user.role === 'lab_tech' && existingResult.uploadedBy !== userId) {
      return apiResponse({ 
        error: 'You can only finalize results that you uploaded. This result was handled by another lab scientist.' 
      }, 403);
    }

    // Update the lab result to finalized
    const result = await prisma.labResult.update({
      where: { id: resultId },
      data: { finalized: true },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
        labResultValues: true,
      },
    });

    return apiResponse({
      message: 'Lab result finalized successfully',
      result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
