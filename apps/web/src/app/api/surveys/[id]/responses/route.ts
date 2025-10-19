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
      include: {
        questions: true,
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
    const { answers } = body; // Array of { questionId, answer }

    // Validation
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return apiResponse({ error: 'Answers are required' }, 400);
    }

    // Validate required questions are answered
    const requiredQuestions = survey.questions.filter(q => q.required);
    const answeredQuestionIds = answers.map(a => a.questionId);
    const missingRequired = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id));
    
    if (missingRequired.length > 0) {
      return apiResponse({ error: 'Please answer all required questions' }, 400);
    }

    // Create response with answers in a transaction
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId,
        patientId: patient.id,
        answers: {
          create: answers.map((a: any) => ({
            questionId: a.questionId,
            answer: String(a.answer),
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    return apiResponse(response, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
