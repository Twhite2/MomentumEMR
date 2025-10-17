import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only patients can access this endpoint
    if (session.user.role !== 'patient') {
      return NextResponse.json(
        { error: 'This endpoint is for patients only' },
        { status: 403 }
      );
    }

    // Get patient ID from session
    const patientId = (session.user as any).patientId;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID not found in session' },
        { status: 400 }
      );
    }

    // Fetch all released lab results for this patient
    const releasedResults = await prisma.labResult.findMany({
      where: {
        labOrder: {
          patientId: patientId,
        },
        releasedToPatient: true,
      },
      include: {
        labOrder: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        releaser: {
          select: {
            name: true,
          },
        },
        labResultValues: true,
      },
      orderBy: {
        releasedAt: 'desc',
      },
    });

    // Get pending results count (finalized but not released)
    const pendingCount = await prisma.labResult.count({
      where: {
        labOrder: {
          patientId: patientId,
        },
        finalized: true,
        releasedToPatient: false,
      },
    });

    // Get pending lab orders (not yet finalized)
    const pendingOrders = await prisma.labOrder.findMany({
      where: {
        patientId: patientId,
        status: {
          in: ['pending', 'in_progress'],
        },
      },
      include: {
        doctor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      releasedResults,
      pendingCount,
      pendingOrders,
      stats: {
        totalResults: releasedResults.length,
        recentResults: releasedResults.filter(
          (result: any) =>
            result.releasedAt &&
            new Date(result.releasedAt) >
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
        pendingResults: pendingCount,
      },
    });
  } catch (error) {
    console.error('Error fetching patient lab results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab results' },
      { status: 500 }
    );
  }
}
