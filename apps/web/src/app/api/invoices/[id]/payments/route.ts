import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/invoices/[id]/payments - Record payment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);
    const invoiceId = parseInt(params.id);

    const body = await request.json();
    const { amount, paymentGateway, transactionRef } = body;

    // Validation
    if (!amount) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return apiResponse({ error: 'Payment amount must be greater than 0' }, 400);
    }

    // Verify invoice exists and belongs to hospital
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, hospitalId },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return apiResponse({ error: 'Invoice not found' }, 404);
    }

    // Calculate new paid amount
    const currentPaidAmount = Number(invoice.paidAmount);
    const totalAmount = Number(invoice.totalAmount);
    const newPaidAmount = currentPaidAmount + paymentAmount;

    // Check if payment exceeds total
    if (newPaidAmount > totalAmount) {
      return apiResponse({ error: 'Payment amount exceeds invoice total' }, 400);
    }

    // Determine new status
    let newStatus = invoice.status;
    if (newPaidAmount >= totalAmount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'pending'; // Partially paid invoices remain pending
    }

    // Create payment and update invoice in transaction
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId,
          amountPaid: paymentAmount,
          paymentGateway: paymentGateway || null,
          paymentDate: new Date(),
          transactionRef: transactionRef || null,
        },
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      }),
    ]);

    return apiResponse(payment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
