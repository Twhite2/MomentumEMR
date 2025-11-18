import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/hmo - List HMO providers for hospital
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier', 'nurse', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const hmoList = await prisma.hmo.findMany({
      where: {
        hospitalId,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        hmoplans: {
          where: { active: true },
          select: {
            id: true,
            planName: true,
            planCode: true,
            copayPercentage: true,
          },
        },
        _count: {
          select: {
            patients: true,
            encounters: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return apiResponse(hmoList);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/hmo - Create new HMO (Admin and Cashier)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);
    const body = await request.json();

    const {
      name,
      providerCode,
      submissionMethod,
      requiredFormat,
      submissionEmail,
      submissionPortalUrl,
      codingStandard,
      requiresAuthorization,
      coverageDetails,
      copaymentRules,
    } = body;

    // Validation
    if (!name) {
      return apiResponse({ error: 'HMO name is required' }, 400);
    }

    // Create HMO
    const hmo = await prisma.hmo.create({
      data: {
        hospitalId,
        name,
        providerCode,
        submissionMethod: submissionMethod || 'email_pdf',
        requiredFormat,
        submissionEmail,
        submissionPortalUrl,
        codingStandard: codingStandard || 'icd10',
        requiresAuthorization: requiresAuthorization ?? true,
        coverageDetails: coverageDetails ? JSON.parse(JSON.stringify(coverageDetails)) : null,
        copaymentRules: copaymentRules ? JSON.parse(JSON.stringify(copaymentRules)) : null,
        active: true,
      },
      include: {
        hmoplans: true,
      },
    });

    return apiResponse(hmo, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
