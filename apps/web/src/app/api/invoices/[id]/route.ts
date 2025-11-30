import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/invoices/[id] - Get invoice details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'cashier', 'pharmacist', 'doctor', 'patient', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const invoiceId = parseInt(params.id);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        hospitalId,
      },
      include: {
        patient: true,
        invoiceItems: {
          orderBy: { id: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      return apiResponse({ error: 'Invoice not found' }, 404);
    }

    return apiResponse(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);
    const invoiceId = parseInt(params.id);

    const body = await request.json();
    const { status, notes } = body;

    // Verify invoice exists
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Invoice not found' }, 404);
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        notes,
      },
      include: {
        patient: true,
        invoiceItems: true,
        payments: true,
      },
    });

    return apiResponse(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const invoiceId = parseInt(params.id);

    // Verify invoice exists
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Invoice not found' }, 404);
    }

    // Don't delete if payments exist
    const paymentsCount = await prisma.payment.count({
      where: { invoiceId },
    });

    if (paymentsCount > 0) {
      return apiResponse(
        { error: 'Cannot delete invoice with existing payments' },
        400
      );
    }

    // Delete invoice (cascade will delete items)
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return apiResponse({ message: 'Invoice deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
