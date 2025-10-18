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
