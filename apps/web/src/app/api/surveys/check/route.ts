import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/surveys/check - Check if survey tables exist
export async function GET(request: NextRequest) {
  try {
    // Try to count surveys
    const surveyCount = await prisma.survey.count();
    const questionCount = await prisma.surveyQuestion.count();
    const responseCount = await prisma.surveyResponse.count();
    const answerCount = await prisma.surveyAnswer.count();

    return apiResponse({
      status: 'ok',
      tablesExist: true,
      counts: {
        surveys: surveyCount,
        questions: questionCount,
        responses: responseCount,
        answers: answerCount,
      },
      message: 'Survey tables exist and are accessible',
    });
  } catch (error: any) {
    return apiResponse({
      status: 'error',
      tablesExist: false,
      error: error.message,
      message: 'Survey tables may not exist or migration not applied',
    }, 500);
  }
}
