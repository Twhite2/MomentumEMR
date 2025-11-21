import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/patient-queue - Get today's patient queue (outpatients)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Base query for today's appointments
    const where: any = {
      hospitalId,
      startTime: {
        gte: today,
        lt: tomorrow,
      },
      // Only show scheduled, checked-in, or completed appointments
      status: {
        in: ['scheduled', 'checked_in', 'completed'],
      },
    };

    // Get all appointments for today with patient info
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dob: true,
            gender: true,
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
      orderBy: { startTime: 'asc' },
    });

    // Transform data to include queue info
    const queue = appointments.map(apt => ({
      id: apt.patientId,
      firstName: apt.patient.firstName,
      lastName: apt.patient.lastName,
      dob: apt.patient.dob,
      gender: apt.patient.gender,
      patientType: apt.patient.patientType,
      appointment: {
        id: apt.id,
        startTime: apt.startTime,
        status: apt.status,
        appointmentType: apt.appointmentType || 'consultation',
        doctor: apt.doctor,
      },
      checkedInAt: apt.status === 'checked_in' || apt.status === 'completed' ? apt.startTime : undefined,
      checkedOutAt: apt.status === 'completed' ? apt.endTime : undefined,
    }));

    // Calculate stats
    const stats = {
      waiting: queue.filter(p => p.appointment.status === 'scheduled').length,
      inProgress: queue.filter(p => p.appointment.status === 'checked_in').length,
      completed: queue.filter(p => p.appointment.status === 'completed').length,
    };

    // Apply status filter if provided
    let filteredQueue = queue;
    if (statusFilter === 'waiting') {
      filteredQueue = queue.filter(p => p.appointment.status === 'scheduled');
    } else if (statusFilter === 'in-progress') {
      filteredQueue = queue.filter(p => p.appointment.status === 'checked_in');
    } else if (statusFilter === 'completed') {
      filteredQueue = queue.filter(p => p.appointment.status === 'completed');
    }

    return apiResponse({
      queue: filteredQueue,
      stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/patient-queue - Add walk-in patient to queue
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'nurse', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);

    const body = await request.json();
    const { patientId, doctorId } = body;

    if (!patientId) {
      return apiResponse({ error: 'Patient ID is required' }, 400);
    }

    // Verify patient exists and belongs to hospital
    const patient = await prisma.patient.findFirst({
      where: { id: parseInt(patientId), hospitalId },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    // Check if patient already has a queue entry today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        hospitalId,
        patientId: parseInt(patientId),
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ['scheduled', 'checked_in'],
        },
      },
    });

    if (existingAppointment) {
      return apiResponse({ 
        error: 'Patient is already in today\'s queue',
        appointmentId: existingAppointment.id 
      }, 400);
    }

    // Determine doctorId - if not provided, find any available doctor in the hospital
    let finalDoctorId: number;
    if (doctorId) {
      finalDoctorId = parseInt(doctorId);
    } else if (patient.primaryDoctorId) {
      finalDoctorId = patient.primaryDoctorId;
    } else {
      // Find any doctor in the hospital
      const anyDoctor = await prisma.user.findFirst({
        where: {
          hospitalId,
          role: 'doctor',
          active: true,
        },
      });
      
      if (!anyDoctor) {
        return apiResponse({ error: 'No available doctors found. Please assign a doctor.' }, 400);
      }
      
      finalDoctorId = anyDoctor.id;
    }

    // Create walk-in appointment
    const appointment = await prisma.appointment.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        doctorId: finalDoctorId,
        appointmentType: 'walk_in',
        status: 'checked_in', // Immediately check them in
        startTime: new Date(),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dob: true,
            gender: true,
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
    });

    return apiResponse({
      message: 'Walk-in patient added to queue successfully',
      appointment,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
