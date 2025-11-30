import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/claims/[id] - Get single claim details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'cashier', 'super_admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const claimId = parseInt(params.id);

    const claim = await prisma.claimSubmission.findFirst({
      where: {
        id: claimId,
        claimBatch: { hospitalId },
      },
      include: {
        hmo: {
          select: { id: true, name: true },
        },
        claimBatch: {
          select: { 
            id: true, 
            batchNumber: true, 
            batchDate: true,
            encounterCount: true,
          },
        },
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!claim) {
      return apiResponse({ error: 'Claim not found' }, 404);
    }

    return apiResponse(claim);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/claims/[id] - Update claim status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);
    const claimId = parseInt(params.id);
    const body = await request.json();

    const {
      status,
      approvedAmount,
      paidAmount,
      responseDate,
      paymentDate,
      denialReason,
      queryReason,
      queryResponse,
      notes,
    } = body;

    // Verify claim belongs to hospital
    const existingClaim = await prisma.claimSubmission.findFirst({
      where: {
        id: claimId,
        claimBatch: { hospitalId },
      },
    });

    if (!existingClaim) {
      return apiResponse({ error: 'Claim not found' }, 404);
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    if (approvedAmount !== undefined) {
      updateData.approvedAmount = approvedAmount;
    }

    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
    }

    if (responseDate) {
      updateData.responseDate = new Date(responseDate);
    }

    if (paymentDate) {
      updateData.paymentDate = new Date(paymentDate);
    }

    if (denialReason) {
      updateData.denialReason = denialReason;
    }

    if (queryReason) {
      updateData.queryReason = queryReason;
    }

    if (queryResponse) {
      updateData.queryResponse = queryResponse;
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Auto-set dates based on status
    if (status === 'paid' && !paymentDate) {
      updateData.paymentDate = new Date();
    }

    if (status === 'denied' || status === 'queried' || status === 'disputed') {
      if (!responseDate) {
        updateData.responseDate = new Date();
      }
    }

    // Update claim
    const updatedClaim = await prisma.claimSubmission.update({
      where: { id: claimId },
      data: updateData,
      include: {
        hmo: {
          select: { id: true, name: true },
        },
        claimBatch: {
          select: { batchNumber: true },
        },
      },
    });

    return apiResponse({
      message: 'Claim updated successfully',
      claim: updatedClaim,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
