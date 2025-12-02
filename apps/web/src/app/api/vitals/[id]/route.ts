import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/vitals/[id] - Get vital details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const vitalId = parseInt(params.id);

    const vital = await prisma.vital.findFirst({
      where: {
        id: vitalId,
        hospitalId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dob: true,
            gender: true,
            patientType: true,
          },
        },
        recordedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            doctor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!vital) {
      return apiResponse({ error: 'Vital record not found' }, 404);
    }

    // Format blood pressure for display
    const formattedVital = {
      ...vital,
      bloodPressure: vital.bloodPressureSys && vital.bloodPressureDia
        ? `${vital.bloodPressureSys}/${vital.bloodPressureDia}`
        : null,
    };

    return apiResponse(formattedVital);
  } catch (error) {
    return handleApiError(error);
  }
}
