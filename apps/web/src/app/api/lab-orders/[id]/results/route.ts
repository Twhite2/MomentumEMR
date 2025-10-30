import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/lab-orders/[id]/results - Upload lab result
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const labOrderId = parseInt(params.id);
    const uploadedBy = parseInt(session.user.id);

    const body = await request.json();
    const { resultNotes, testValues, attachments } = body;

    // Verify lab order exists and belongs to hospital
    const labOrder = await prisma.labOrder.findFirst({
      where: { id: labOrderId, hospitalId },
    });

    if (!labOrder) {
      return apiResponse({ error: 'Lab order not found' }, 404);
    }

    // Create lab result with values and attachments
    const result = await prisma.labResult.create({
      data: {
        labOrderId,
        uploadedBy,
        fileUrl: null,
        resultNotes: resultNotes || null,
        finalized: false,
        labResultValues: testValues
          ? {
              create: testValues.map((test: any) => ({
                testName: test.testName,
                resultValue: test.resultValue || null,
                unit: test.unit || null,
                normalRange: test.normalRange || null,
              })),
            }
          : undefined,
        attachments: attachments
          ? {
              create: attachments.map((file: any) => ({
                fileName: file.name,
                fileType: file.type,
                fileData: file.data, // Base64 encoded file data
              })),
            }
          : undefined,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
        labResultValues: true,
        attachments: true,
      },
    });

    // Update lab order status to in_progress or completed
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: { status: 'completed' },
    });

    return apiResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
