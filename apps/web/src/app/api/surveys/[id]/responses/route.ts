import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/surveys/[id]/responses - Submit survey response
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['patient']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const surveyId = parseInt(params.id);

    // Find patient record
    const patient = await prisma.patient.findFirst({
      where: {
        hospitalId,
        userId,
      },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient record not found' }, 404);
    }

    // Verify survey exists and is active
    const survey = await prisma.survey.findFirst({
      where: {
        id: surveyId,
        hospitalId,
        status: 'active',
      },
    });

    if (!survey) {
      return apiResponse({ error: 'Survey not found or not active' }, 404);
    }

    // Check if patient already responded
    const existingResponse = await prisma.surveyResponse.findFirst({
      where: {
        surveyId,
        patientId: patient.id,
      },
    });

    if (existingResponse) {
      return apiResponse({ error: 'You have already responded to this survey' }, 400);
    }

    const body = await request.json();
    const { rating, feedback, responses } = body;

    // Validation
    if (!rating) {
      return apiResponse({ error: 'Rating is required' }, 400);
    }

    if (rating < 1 || rating > 5) {
      return apiResponse({ error: 'Rating must be between 1 and 5' }, 400);
    }

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId,
        patientId: patient.id,
        rating,
        feedback,
        responses,
      },
    });

    return apiResponse(response, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
