import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/admissions/[id] - Get admission details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const admissionId = parseInt(params.id);

    const admission = await prisma.admission.findFirst({
      where: { id: admissionId, hospitalId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, bloodGroup: true },
        },
        admittingDoctor: {
          select: { id: true, name: true, email: true },
        },
        dischargingDoctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!admission) {
      return apiResponse({ error: 'Admission not found' }, 404);
    }

    return apiResponse(admission);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/admissions/[id] - Update admission
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const admissionId = parseInt(params.id);

    const body = await request.json();
    const { ward, bedNumber, status } = body;

    const admission = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        ward: ward !== undefined ? ward : undefined,
        bedNumber: bedNumber !== undefined ? bedNumber : undefined,
        status: status || undefined,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        admittingDoctor: { select: { id: true, name: true } },
        dischargingDoctor: { select: { id: true, name: true } },
      },
    });

    return apiResponse(admission);
  } catch (error) {
    return handleApiError(error);
  }
}
