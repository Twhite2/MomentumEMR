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

// PATCH /api/claims/[id] - Update claim (invoice) status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);
    const invoiceId = parseInt(params.id);
    const body = await request.json();

    const {
      status,
      paidAmount,
      notes,
    } = body;

    // Verify invoice belongs to hospital and is an HMO invoice
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        hospitalId,
        hmoId: { not: null }, // Must be an HMO invoice
      },
    });

    if (!existingInvoice) {
      return apiResponse({ error: 'Claim not found' }, 404);
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update invoice status (map to valid InvoiceStatus)
    if (status) {
      // Map claim statuses to invoice statuses
      if (status === 'submitted' || status === 'pending') {
        updateData.status = 'pending';
      } else if (status === 'paid') {
        updateData.status = 'paid';
      } else if (status === 'denied' || status === 'cancelled') {
        updateData.status = 'cancelled';
      } else if (status === 'refunded') {
        updateData.status = 'refunded';
      } else {
        updateData.status = status; // Use as-is if it's already valid
      }
    }

    // Update paid amount
    if (paidAmount !== undefined) {
      const paidAmountNum = parseFloat(paidAmount);
      updateData.paidAmount = paidAmountNum;
      
      // Auto-set status to paid if paid amount equals total
      const totalAmount = Number(existingInvoice.totalAmount);
      if (paidAmountNum >= totalAmount && !status) {
        updateData.status = 'paid';
      }
    }

    // Update notes field if available, otherwise skip
    if (notes) {
      updateData.notes = notes;
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            hmo: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return apiResponse({
      message: 'Claim updated successfully',
      claim: updatedInvoice,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
