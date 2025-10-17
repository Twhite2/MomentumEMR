import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/patients/me - Get current patient's information
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['patient']);
    const userId = parseInt(session.user.id);
    const hospitalId = parseInt(session.user.hospitalId);

    // Find the patient record linked to this user
    const patient = await prisma.patient.findFirst({
      where: {
        hospitalId,
        userId: userId,
      },
      include: {
        hmo: true,
        corporateClient: true,
      },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient record not found' }, 404);
    }

    return apiResponse(patient);
  } catch (error) {
    return handleApiError(error);
  }
}
