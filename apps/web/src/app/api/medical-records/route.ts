import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/medical-records - List medical records
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    // Role-based filtering
    if (userRole === 'doctor') {
      where.doctorId = userId;
    }

    if (patientId) {
      where.patientId = parseInt(patientId);
    }

    if (doctorId) {
      where.doctorId = parseInt(doctorId);
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
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
        },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return apiResponse({
      records,
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

// POST /api/medical-records - Create new medical record
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const doctorId = parseInt(session.user.id);

    const body = await request.json();
    const { patientId, visitDate, diagnosis, notes, attachments } = body;

    // Validation
    if (!patientId || !visitDate) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Verify patient belongs to hospital
    const patient = await prisma.patient.findFirst({
      where: { id: parseInt(patientId), hospitalId },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    // Create medical record
    const record = await prisma.medicalRecord.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        doctorId,
        visitDate: new Date(visitDate),
        diagnosis: diagnosis || null,
        notes: notes || null,
        attachments: attachments || null,
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
      },
    });

    return apiResponse(record, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
