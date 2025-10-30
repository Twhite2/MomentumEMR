import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/users/lab-scientists - Get list of lab scientists for assignment
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);

    // Fetch all active lab technicians in the hospital
    const labScientists = await prisma.user.findMany({
      where: {
        hospitalId,
        role: 'lab_tech',
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return apiResponse({
      labScientists,
      total: labScientists.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
