import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/claims - Get list of claims with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier', 'super_admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const hmoId = searchParams.get('hmoId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      claimBatch: { hospitalId },
    };

    if (status) {
      where.status = status;
    }

    if (hmoId) {
      where.hmoId = parseInt(hmoId);
    }

    if (startDate && endDate) {
      where.submissionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get total count
    const total = await prisma.claimSubmission.count({ where });

    // Get claims
    const claims = await prisma.claimSubmission.findMany({
      where,
      include: {
        hmo: {
          select: { id: true, name: true },
        },
        claimBatch: {
          select: { 
            id: true, 
            batchNumber: true, 
            batchDate: true,
            encounterCount: true,
          },
        },
        submittedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        submissionDate: 'desc',
      },
      skip,
      take: limit,
    });

    return apiResponse({
      claims,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
