import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/hmo/[id] - Get HMO details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);
    const hmoId = parseInt(params.id);

    const hmo = await prisma.hmo.findFirst({
      where: {
        id: hmoId,
        hospitalId,
      },
      include: {
        hmoplans: {
          where: { active: true },
          orderBy: { planName: 'asc' },
        },
        fieldMappings: true,
        _count: {
          select: {
            patients: true,
            encounters: true,
            claimBatches: true,
          },
        },
      },
    });

    if (!hmo) {
      return apiResponse({ error: 'HMO not found' }, 404);
    }

    return apiResponse(hmo);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/hmo/[id] - Update HMO (Admin and Cashier)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);
    const hmoId = parseInt(params.id);
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
      active,
    } = body;

    // Verify HMO exists
    const existingHmo = await prisma.hmo.findFirst({
      where: { id: hmoId, hospitalId },
    });

    if (!existingHmo) {
      return apiResponse({ error: 'HMO not found' }, 404);
    }

    // Update HMO
    const hmo = await prisma.hmo.update({
      where: { id: hmoId },
      data: {
        name,
        providerCode,
        submissionMethod,
        requiredFormat,
        submissionEmail,
        submissionPortalUrl,
        codingStandard,
        requiresAuthorization,
        coverageDetails: coverageDetails ? JSON.parse(JSON.stringify(coverageDetails)) : undefined,
        copaymentRules: copaymentRules ? JSON.parse(JSON.stringify(copaymentRules)) : undefined,
        active,
      },
      include: {
        hmoplans: true,
      },
    });

    return apiResponse(hmo);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/hmo/[id] - Deactivate HMO (Admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const hmoId = parseInt(params.id);

    // Verify HMO exists
    const existingHmo = await prisma.hmo.findFirst({
      where: { id: hmoId, hospitalId },
    });

    if (!existingHmo) {
      return apiResponse({ error: 'HMO not found' }, 404);
    }

    // Soft delete by deactivating
    await prisma.hmo.update({
      where: { id: hmoId },
      data: { active: false },
    });

    return apiResponse({ message: 'HMO deactivated successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
