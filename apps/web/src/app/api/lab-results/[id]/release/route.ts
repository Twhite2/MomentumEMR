import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import { notifyLabResultsReady } from '@/lib/notification-helpers';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only doctors can release lab results
    if (session.user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can release lab results to patients' },
        { status: 403 }
      );
    }

    const resultId = parseInt(params.id);

    // Check if result exists and is finalized
    const labResult = await prisma.labResult.findUnique({
      where: { id: resultId },
      include: {
        labOrder: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }

    if (!labResult.finalized) {
      return NextResponse.json(
        { error: 'Lab result must be finalized before releasing to patient' },
        { status: 400 }
      );
    }

    if (labResult.releasedToPatient) {
      return NextResponse.json(
        { error: 'Lab result already released to patient' },
        { status: 400 }
      );
    }

    // Release the lab result to patient
    const updatedResult = await prisma.labResult.update({
      where: { id: resultId },
      data: {
        releasedToPatient: true,
        releasedAt: new Date(),
        releasedBy: parseInt(session.user.id),
      },
      include: {
        releaser: {
          select: {
            name: true,
          },
        },
      },
    });

    // TODO: Send notification to patient about new lab result
    // You can use the notification service here

    return NextResponse.json({
      message: 'Lab result released to patient successfully',
      result: updatedResult,
    });
  } catch (error) {
    console.error('Error releasing lab result:', error);
    return NextResponse.json(
      { error: 'Failed to release lab result' },
      { status: 500 }
    );
  }
}
