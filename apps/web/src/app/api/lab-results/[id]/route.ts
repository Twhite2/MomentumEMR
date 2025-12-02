import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/lab-results/[id] - Get single lab result
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['lab_tech', 'admin', 'doctor', 'pharmacist']);
    const resultId = parseInt(params.id);

    const result = await prisma.labResult.findUnique({
      where: { id: resultId },
      include: {
        labOrder: {
          include: {
            patient: true,
            doctor: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
        releaser: {
          select: {
            id: true,
            name: true,
          },
        },
        labResultValues: true,
        attachments: true,
      },
    });

    if (!result) {
      return apiResponse({ error: 'Lab result not found' }, 404);
    }

    return apiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/lab-results/[id] - Update lab result
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['lab_tech', 'admin']);
    const resultId = parseInt(params.id);
    const userId = parseInt(session.user.id);

    const body = await request.json();
    const { resultNotes, testValues } = body;

    // First, fetch the result to check ownership
    const existingResult = await prisma.labResult.findUnique({
      where: { id: resultId },
      select: { 
        uploadedBy: true,
        finalized: true,
        releasedToPatient: true,
      },
    });

    if (!existingResult) {
      return apiResponse({ error: 'Lab result not found' }, 404);
    }

    // Authorization: Only the uploader or admin can edit
    if (session.user.role === 'lab_tech' && existingResult.uploadedBy !== userId) {
      return apiResponse({ 
        error: 'You can only edit results that you uploaded. This result was handled by another lab scientist.' 
      }, 403);
    }

    // Prevent editing finalized or released results
    if (existingResult.finalized) {
      return apiResponse({ 
        error: 'Cannot edit finalized results. Please unfinalize first if changes are needed.' 
      }, 400);
    }

    if (existingResult.releasedToPatient) {
      return apiResponse({ 
        error: 'Cannot edit results that have been released to patients.' 
      }, 400);
    }

    // Delete existing test values if updating
    if (testValues) {
      await prisma.labResultValue.deleteMany({
        where: { labResultId: resultId },
      });
    }

    // Update lab result
    const result = await prisma.labResult.update({
      where: { id: resultId },
      data: {
        resultNotes: resultNotes || null,
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
      },
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
      message: 'Lab result updated successfully',
      result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/lab-results/[id] - Delete lab result
export async function DELETE(
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
      select: { 
        uploadedBy: true,
        finalized: true,
        releasedToPatient: true,
      },
    });

    if (!existingResult) {
      return apiResponse({ error: 'Lab result not found' }, 404);
    }

    // Authorization: Only the uploader or admin can delete
    if (session.user.role === 'lab_tech' && existingResult.uploadedBy !== userId) {
      return apiResponse({ 
        error: 'You can only delete results that you uploaded. This result was handled by another lab scientist.' 
      }, 403);
    }

    // Prevent deleting finalized or released results
    if (existingResult.finalized) {
      return apiResponse({ 
        error: 'Cannot delete finalized results.' 
      }, 400);
    }

    if (existingResult.releasedToPatient) {
      return apiResponse({ 
        error: 'Cannot delete results that have been released to patients.' 
      }, 400);
    }

    // Delete test values first
    await prisma.labResultValue.deleteMany({
      where: { labResultId: resultId },
    });

    // Delete the result
    await prisma.labResult.delete({
      where: { id: resultId },
    });

    return apiResponse({
      message: 'Lab result deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/lab-results/[id] - Finalize/Unfinalize lab result
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['lab_tech', 'admin']);
    const resultId = parseInt(params.id);
    const userId = parseInt(session.user.id);

    const body = await request.json();
    const { finalized } = body;

    if (typeof finalized !== 'boolean') {
      return apiResponse({ error: 'finalized field must be a boolean' }, 400);
    }

    // Fetch the result
    const existingResult = await prisma.labResult.findUnique({
      where: { id: resultId },
      select: { 
        uploadedBy: true,
        finalized: true,
        releasedToPatient: true,
      },
    });

    if (!existingResult) {
      return apiResponse({ error: 'Lab result not found' }, 404);
    }

    // Authorization: Only the uploader or admin can finalize
    if (session.user.role === 'lab_tech' && existingResult.uploadedBy !== userId) {
      return apiResponse({ 
        error: 'You can only finalize results that you uploaded' 
      }, 403);
    }

    // Cannot un-finalize results that have been released
    if (!finalized && existingResult.releasedToPatient) {
      return apiResponse({ 
        error: 'Cannot unfinalize results that have been released to patients' 
      }, 400);
    }

    // Update finalized status
    const updatedResult = await prisma.labResult.update({
      where: { id: resultId },
      data: { finalized },
      include: {
        labOrder: {
          include: {
            patient: true,
            doctor: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return apiResponse({
      message: finalized ? 'Lab result finalized successfully' : 'Lab result un-finalized successfully',
      result: updatedResult,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
