import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/hmo - List HMO policies for hospital
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'nurse', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);

    const hmoList = await prisma.hmo.findMany({
      where: {
        hospitalId,
        active: true,
      },
      orderBy: { policyName: 'asc' },
    });

    return apiResponse(hmoList);
  } catch (error) {
    return handleApiError(error);
  }
}
