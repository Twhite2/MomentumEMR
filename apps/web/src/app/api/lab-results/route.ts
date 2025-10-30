import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/lab-results - Get all lab results (for lab technicians)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['lab_tech', 'admin', 'doctor', 'pharmacist']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const whereClause: any = {
      labOrder: {
        hospitalId,
      },
    };

    // Filter by finalized status if provided
    if (status === 'finalized') {
      whereClause.finalized = true;
    } else if (status === 'pending') {
      whereClause.finalized = false;
    }

    // Get lab results with related data
    const [results, total] = await Promise.all([
      prisma.labResult.findMany({
        where: whereClause,
        include: {
          labOrder: {
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  dob: true,
                  gender: true,
                },
              },
              doctor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          releaser: {
            select: {
              id: true,
              name: true,
            },
          },
          labResultValues: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.labResult.count({
        where: whereClause,
      }),
    ]);

    // Get stats
    const stats = await prisma.labResult.aggregate({
      where: {
        labOrder: {
          hospitalId,
        },
      },
      _count: true,
    });

    const finalizedCount = await prisma.labResult.count({
      where: {
        labOrder: {
          hospitalId,
        },
        finalized: true,
      },
    });

    const releasedCount = await prisma.labResult.count({
      where: {
        labOrder: {
          hospitalId,
        },
        releasedToPatient: true,
      },
    });

    const recentResultsCount = await prisma.labResult.count({
      where: {
        labOrder: {
          hospitalId,
        },
        releasedToPatient: true,
        releasedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return apiResponse({
      results,
      stats: {
        totalResults: stats._count,
        finalizedResults: finalizedCount,
        releasedResults: releasedCount,
        recentResults: recentResultsCount,
        pendingResults: stats._count - finalizedCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
