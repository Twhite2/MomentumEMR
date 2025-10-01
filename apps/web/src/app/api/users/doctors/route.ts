import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/users/doctors - List doctors for hospital
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);

    const doctors = await prisma.user.findMany({
      where: {
        hospitalId,
        role: 'doctor',
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    });

    return apiResponse(doctors);
  } catch (error) {
    return handleApiError(error);
  }
}
