import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// PUT /api/admissions/[id]/discharge - Discharge patient
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const dischargedBy = parseInt(session.user.id);
    const admissionId = parseInt(params.id);

    const body = await request.json();
    const { dischargeSummary, followUpInstructions, dischargeDate } = body;

    const admission = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        status: 'discharged',
        dischargedBy,
        dischargeDate: dischargeDate ? new Date(dischargeDate) : new Date(),
        dischargeSummary: dischargeSummary || null,
        followUpInstructions: followUpInstructions || null,
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
