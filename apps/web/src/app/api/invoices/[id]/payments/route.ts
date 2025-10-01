import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/invoices/[id]/payments - Record payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['admin', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);
    const invoiceId = parseInt(params.id);
    const processedBy = parseInt(session.user.id);

    const body = await request.json();
    const { amount, paymentMethod, reference } = body;

    // Validation
    if (!amount || !paymentMethod) {
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
    const newPaidAmount = invoice.paidAmount + paymentAmount;

    // Check if payment exceeds total
    if (newPaidAmount > invoice.totalAmount) {
      return apiResponse({ error: 'Payment amount exceeds invoice total' }, 400);
    }

    // Determine new status
    let newStatus = invoice.status;
    if (newPaidAmount >= invoice.totalAmount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    // Create payment and update invoice in transaction
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          paymentMethod,
          paymentDate: new Date(),
          reference: reference || null,
          processedBy,
        },
        include: {
          processedBy: {
            select: {
              id: true,
              name: true,
            },
          },
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
