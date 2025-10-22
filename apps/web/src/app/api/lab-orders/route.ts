import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/lab-orders - List lab orders
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const orderType = searchParams.get('orderType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    // Role-based filtering
    if (userRole === 'doctor') {
      where.orderedBy = userId;
    }

    // Lab tech sees: orders assigned to them + unassigned orders
    if (userRole === 'lab_tech') {
      where.OR = [
        { assignedTo: userId }, // Assigned to this lab tech
        { assignedTo: null },   // Unassigned (general pool)
      ];
    }

    if (patientId) {
      where.patientId = parseInt(patientId);
    }

    if (doctorId) {
      where.orderedBy = parseInt(doctorId);
    }

    if (status) {
      where.status = status;
    }

    if (orderType) {
      where.orderType = orderType;
    }

    const [orders, total] = await Promise.all([
      prisma.labOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedLabTech: {
            select: {
              id: true,
              name: true,
            },
          },
          labResults: {
            select: {
              id: true,
              finalized: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.labOrder.count({ where }),
    ]);

    return apiResponse({
      orders,
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

// POST /api/lab-orders - Create new lab order
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const orderedBy = parseInt(session.user.id);

    const body = await request.json();
    const { patientId, orderType, description, assignedTo } = body;

    // Validation
    if (!patientId || !orderType) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    const patientIdInt = parseInt(patientId);
    if (isNaN(patientIdInt)) {
      return apiResponse({ error: 'Invalid patient ID' }, 400);
    }

    // Verify patient belongs to hospital
    const patient = await prisma.patient.findFirst({
      where: { id: patientIdInt, hospitalId },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    // Parse assignedTo if provided
    let assignedToInt = null;
    if (assignedTo && assignedTo !== '') {
      assignedToInt = parseInt(assignedTo);
      if (isNaN(assignedToInt)) {
        assignedToInt = null;
      }
    }

    // Create lab order
    const order = await prisma.labOrder.create({
      data: {
        hospitalId,
        patientId: patientIdInt,
        orderedBy,
        assignedTo: assignedToInt,
        orderType,
        description: description || null,
        status: 'pending',
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedLabTech: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return apiResponse(order, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
