import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/lab-orders/[id] - Get lab order details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const orderId = parseInt(params.id);

    const order = await prisma.labOrder.findFirst({
      where: {
        id: orderId,
        hospitalId,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        labResults: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
              },
            },
            releaser: {
              select: {
                name: true,
              },
            },
            labResultValues: {
              orderBy: { id: 'asc' },
            },
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileType: true,
                fileData: true,
                uploadedAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return apiResponse({ error: 'Lab order not found' }, 404);
    }

    return apiResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/lab-orders/[id] - Update lab order
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const orderId = parseInt(params.id);

    const body = await request.json();
    const { status, description } = body;

    // Verify order exists
    const existing = await prisma.labOrder.findFirst({
      where: { id: orderId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Lab order not found' }, 404);
    }

    // Update order
    const order = await prisma.labOrder.update({
      where: { id: orderId },
      data: {
        status,
        description,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        labResults: true,
      },
    });

    return apiResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/lab-orders/[id] - Delete lab order
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const orderId = parseInt(params.id);

    // Verify order exists
    const existing = await prisma.labOrder.findFirst({
      where: { id: orderId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Lab order not found' }, 404);
    }

    // Delete order (cascade will delete results)
    await prisma.labOrder.delete({
      where: { id: orderId },
    });

    return apiResponse({ message: 'Lab order deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
