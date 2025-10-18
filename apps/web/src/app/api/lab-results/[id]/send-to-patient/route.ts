import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/lab-results/[id]/send-to-patient - Send lab result to patient with doctor's note
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['doctor', 'admin']);
    const resultId = parseInt(params.id);
    const userId = parseInt(session.user.id);

    const body = await request.json();
    const { doctorNote } = body;

    if (!doctorNote || !doctorNote.trim()) {
      return apiResponse({ error: 'Doctor note is required' }, 400);
    }

    // Get the lab result to verify it exists and is finalized
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
      return apiResponse({ error: 'Lab result not found' }, 404);
    }

    if (!labResult.finalized) {
      return apiResponse({ error: 'Result must be finalized before sending to patient' }, 400);
    }

    if (labResult.releasedToPatient) {
      return apiResponse({ error: 'Result has already been sent to patient' }, 400);
    }

    // Update the lab result with doctor's note and release it to patient
    const updatedResult = await prisma.labResult.update({
      where: { id: resultId },
      data: {
        doctorNote: doctorNote.trim(),
        releasedToPatient: true,
        releasedAt: new Date(),
        releasedBy: userId,
      },
      include: {
        labOrder: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                contactInfo: true,
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
    });

    // TODO: Send notification to patient (email, SMS, in-app)
    // For now, just log that we would send a notification
    console.log(`[Lab Result] Sent to patient ${labResult.labOrder.patient.firstName} ${labResult.labOrder.patient.lastName}`);
    console.log(`[Doctor Note] ${doctorNote}`);

    return apiResponse({
      message: 'Lab result sent to patient successfully',
      result: updatedResult,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
