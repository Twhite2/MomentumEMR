import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/hmo/[id]/tariffs - Search HMO tariffs
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['super_admin', 'admin', 'doctor', 'nurse', 'pharmacist', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);
    const hmoId = parseInt(params.id);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Verify HMO belongs to hospital
    const hmo = await prisma.hmo.findFirst({
      where: { id: hmoId, hospitalId },
    });

    if (!hmo) {
      return apiResponse({ error: 'HMO not found' }, 404);
    }

    const where: any = {
      hmoId,
      active: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [tariffs, total] = await Promise.all([
      prisma.hmoTariff.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { name: 'asc' },
      }),
      prisma.hmoTariff.count({ where }),
    ]);

    return apiResponse({
      tariffs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/hmo/[id]/tariffs - Clear all tariffs for HMO
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['super_admin', 'admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const hmoId = parseInt(params.id);

    // Verify HMO belongs to hospital
    const hmo = await prisma.hmo.findFirst({
      where: { id: hmoId, hospitalId },
    });

    if (!hmo) {
      return apiResponse({ error: 'HMO not found' }, 404);
    }

    const result = await prisma.hmoTariff.deleteMany({
      where: { hmoId },
    });

    return apiResponse({
      success: true,
      message: `Deleted ${result.count} tariffs`,
      count: result.count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
