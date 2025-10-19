import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/surveys - List surveys
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause
    const where: any = { hospitalId };
    
    if (status) {
      where.status = status;
    }

    if (userRole === 'patient') {
      // For patients, only show active surveys
      where.status = 'active';
      
      const userId = parseInt(session.user.id);
      
      // Find patient record
      const patient = await prisma.patient.findFirst({
        where: {
          hospitalId,
          userId,
        },
      });

      if (!patient) {
        return apiResponse({ surveys: [], stats: { available: 0, completed: 0, avgRating: 0 } });
      }

      // Get all active surveys with questions
      const surveys = await prisma.survey.findMany({
        where,
        include: {
          questions: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get patient's responses
      const responses = await prisma.surveyResponse.findMany({
        where: {
          patientId: patient.id,
        },
        include: {
          answers: true,
        },
      });

      const responsesBySurveyId = new Map(
        responses.map(r => [r.surveyId, r])
      );

      // Mark surveys as completed if patient has responded
      const surveysWithStatus = surveys.map(survey => ({
        ...survey,
        completed: responsesBySurveyId.has(survey.id),
        response: responsesBySurveyId.get(survey.id) || null,
        questionCount: survey.questions.length,
      }));

      // Calculate stats
      const available = surveysWithStatus.filter(s => !s.completed).length;
      const completed = responses.length;
      
      // Calculate average rating from all responses
      const totalRating = responses.reduce((sum, response) => {
        const ratingAnswer = response.answers.find(a => {
          const question = surveys
            .find(s => s.id === response.surveyId)
            ?.questions.find(q => q.id === a.questionId);
          return question?.questionType === 'rating';
        });
        return sum + (ratingAnswer ? parseInt(ratingAnswer.answer || '0') : 0);
      }, 0);
      
      const avgRating = responses.length > 0 ? totalRating / responses.length : 0;

      return apiResponse({
        surveys: surveysWithStatus,
        stats: {
          available,
          completed,
          avgRating: parseFloat(avgRating.toFixed(1)),
        },
      });
    } else {
      // For staff, show all surveys with response counts
      const surveys = await prisma.survey.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          questions: true,
          responses: {
            include: {
              answers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate stats
      const total = surveys.length;
      const active = surveys.filter(s => s.status === 'active').length;
      const totalResponses = surveys.reduce((sum, s) => sum + s.responses.length, 0);
      
      // Calculate average satisfaction from rating questions
      let totalRatingSum = 0;
      let ratingCount = 0;
      
      surveys.forEach(survey => {
        const ratingQuestion = survey.questions.find(q => q.questionType === 'rating');
        if (ratingQuestion) {
          survey.responses.forEach(response => {
            const ratingAnswer = response.answers.find(a => a.questionId === ratingQuestion.id);
            if (ratingAnswer) {
              totalRatingSum += parseInt(ratingAnswer.answer || '0');
              ratingCount++;
            }
          });
        }
      });
      
      const avgSatisfaction = ratingCount > 0 ? totalRatingSum / ratingCount : 0;

      const surveysWithStats = surveys.map(survey => ({
        ...survey,
        responseCount: survey.responses.length,
        questionCount: survey.questions.length,
      }));

      return apiResponse({
        surveys: surveysWithStats,
        stats: {
          total,
          active,
          totalResponses,
          avgSatisfaction: parseFloat(avgSatisfaction.toFixed(1)),
        },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/surveys - Create new survey with questions (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const createdBy = parseInt(session.user.id);

    const body = await request.json();
    const { title, description, status, questions } = body;

    // Validation
    if (!title) {
      return apiResponse({ error: 'Title is required' }, 400);
    }

    if (!questions || questions.length === 0) {
      return apiResponse({ error: 'At least one question is required' }, 400);
    }

    // Create survey with questions in a transaction
    const survey = await prisma.survey.create({
      data: {
        hospitalId,
        title,
        description,
        status: status || 'draft',
        createdBy,
        questions: {
          create: questions.map((q: any, index: number) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options && q.options.length > 0 ? q.options : null,
            required: q.required || false,
            order: index,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: true,
      },
    });

    return apiResponse(survey, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
