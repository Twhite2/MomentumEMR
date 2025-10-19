import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/medical-records/[id] - Get medical record details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const recordId = parseInt(params.id);

    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
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
      },
    });

    if (!record) {
      return apiResponse({ error: 'Medical record not found' }, 404);
    }

    return apiResponse(record);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/medical-records/[id] - Update medical record
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const recordId = parseInt(params.id);

    const body = await request.json();
    const { visitDate, diagnosis, notes, attachments } = body;

    // Verify record exists
    const existing = await prisma.medicalRecord.findFirst({
      where: { id: recordId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Medical record not found' }, 404);
    }

    // Update record
    const record = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        visitDate: visitDate ? new Date(visitDate) : undefined,
        diagnosis,
        notes,
        attachments,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return apiResponse(record);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/medical-records/[id] - Delete medical record
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const recordId = parseInt(params.id);

    // Verify record exists
    const existing = await prisma.medicalRecord.findFirst({
      where: { id: recordId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Medical record not found' }, 404);
    }

    // Delete record
    await prisma.medicalRecord.delete({
      where: { id: recordId },
    });

    return apiResponse({ message: 'Medical record deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
