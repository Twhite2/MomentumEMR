import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/corporate-clients - List corporate clients for hospital
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'nurse', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);

    const clients = await prisma.corporateClient.findMany({
      where: {
        hospitalId,
        active: true,
      },
      orderBy: { companyName: 'asc' },
    });

    return apiResponse(clients);
  } catch (error) {
    return handleApiError(error);
  }
}
