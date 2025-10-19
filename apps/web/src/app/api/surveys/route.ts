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
        return apiResponse({ surveys: [], stats: {} });
      }

      // Get all active surveys
      const surveys = await prisma.survey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      // Get patient's responses
      const responses = await prisma.surveyResponse.findMany({
        where: {
          patientId: patient.id,
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
      }));

      // Calculate stats
      const available = surveysWithStatus.filter(s => !s.completed).length;
      const completed = responses.length;
      const avgRating = responses.length > 0
        ? responses.reduce((sum, r) => sum + (r.rating || 0), 0) / responses.length
        : 0;

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
          responses: {
            select: {
              id: true,
              rating: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate stats
      const total = surveys.length;
      const active = surveys.filter(s => s.status === 'active').length;
      const totalResponses = surveys.reduce((sum, s) => sum + s.responses.length, 0);
      const allRatings = surveys.flatMap(s => s.responses.map(r => r.rating || 0));
      const avgSatisfaction = allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : 0;

      const surveysWithStats = surveys.map(survey => ({
        ...survey,
        responseCount: survey.responses.length,
        avgRating: survey.responses.length > 0
          ? survey.responses.reduce((sum, r) => sum + (r.rating || 0), 0) / survey.responses.length
          : 0,
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

// POST /api/surveys - Create new survey (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const createdBy = parseInt(session.user.id);

    const body = await request.json();
    const { title, description, status } = body;

    // Validation
    if (!title) {
      return apiResponse({ error: 'Title is required' }, 400);
    }

    const survey = await prisma.survey.create({
      data: {
        hospitalId,
        title,
        description,
        status: status || 'draft',
        createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return apiResponse(survey, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
