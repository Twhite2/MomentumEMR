import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/appointments - List appointments for hospital
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    // Role-based filtering
    if (userRole === 'doctor') {
      where.doctorId = userId;
    } else if (userRole === 'patient') {
      // Find patient record for this user using userId
      const patientRecord = await prisma.patient.findFirst({
        where: { hospitalId, userId },
      });
      if (patientRecord) {
        where.patientId = patientRecord.id;
      } else {
        // If no patient record found, return empty results
        return apiResponse({
          appointments: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    if (patientId) {
      where.patientId = parseInt(patientId);
    }

    if (doctorId) {
      where.doctorId = parseInt(doctorId);
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientType: true,
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
      prisma.appointment.count({ where }),
    ]);

    return apiResponse({
      appointments,
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

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);

    const body = await request.json();
    const {
      patientId,
      doctorId,
      department,
      appointmentType,
      status,
      startTime,
      endTime,
    } = body;

    // Validation
    if (!patientId || !doctorId || !appointmentType || !startTime) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Verify patient and doctor belong to hospital
    const [patient, doctor] = await Promise.all([
      prisma.patient.findFirst({ where: { id: parseInt(patientId), hospitalId } }),
      prisma.user.findFirst({ where: { id: parseInt(doctorId), hospitalId, role: 'doctor' } }),
    ]);

    if (!patient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    if (!doctor) {
      return apiResponse({ error: 'Doctor not found' }, 404);
    }

    // Check for scheduling conflicts
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: parseInt(doctorId),
        startTime: new Date(startTime),
        status: { in: ['scheduled', 'checked_in'] },
      },
    });

    if (conflict) {
      return apiResponse({ error: 'Doctor already has an appointment at this time' }, 409);
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        doctorId: parseInt(doctorId),
        department: department || null,
        appointmentType,
        status: status || 'scheduled',
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
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

    return apiResponse(appointment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
