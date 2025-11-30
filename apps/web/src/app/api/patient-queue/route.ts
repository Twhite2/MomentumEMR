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
        isEmergency: apt.isEmergency,
        doctor: apt.doctor,
      },
      checkedInAt: apt.checkedInAt,
      checkedOutAt: apt.checkedOutAt,
    }));

    // Sort queue properly:
    // 1. Emergency cases first (regardless of status)
    // 2. Then by status: checked_in -> scheduled -> completed
    // 3. Within each group, sort by time (checkedInAt for checked_in, startTime for scheduled, checkedOutAt for completed)
    queue.sort((a, b) => {
      // Emergency cases always come first
      if (a.appointment.isEmergency && !b.appointment.isEmergency) return -1;
      if (!a.appointment.isEmergency && b.appointment.isEmergency) return 1;

      // Group by status
      const statusOrder = { 'checked_in': 1, 'scheduled': 2, 'completed': 3 };
      const aOrder = statusOrder[a.appointment.status as keyof typeof statusOrder] || 4;
      const bOrder = statusOrder[b.appointment.status as keyof typeof statusOrder] || 4;
      
      if (aOrder !== bOrder) return aOrder - bOrder;

      // Within same status group, sort by time
      if (a.appointment.status === 'checked_in') {
        const aTime = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
        const bTime = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
        return aTime - bTime;
      } else if (a.appointment.status === 'scheduled') {
        return new Date(a.appointment.startTime).getTime() - new Date(b.appointment.startTime).getTime();
      } else if (a.appointment.status === 'completed') {
        const aTime = a.checkedOutAt ? new Date(a.checkedOutAt).getTime() : 0;
        const bTime = b.checkedOutAt ? new Date(b.checkedOutAt).getTime() : 0;
        return aTime - bTime;
      }
      return 0;
    });

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
    const now = new Date();
    const appointment = await prisma.appointment.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        doctorId: finalDoctorId,
        appointmentType: 'walk_in',
        status: 'checked_in', // Immediately check them in
        startTime: now,
        checkedInAt: now, // Record actual check-in time
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

    // Create notification for the doctor
    try {
      await prisma.notification.create({
        data: {
          hospitalId,
          userId: finalDoctorId,
          notificationType: 'appointment_reminder',
          deliveryMethod: 'in_app',
          message: `New Walk-in Patient: ${appointment.patient.firstName} ${appointment.patient.lastName} has been added to your queue`,
          status: 'pending',
        },
      });
    } catch (notifError) {
      // Don't fail the request if notification fails
      console.error('Failed to create notification:', notifError);
    }

    return apiResponse({
      message: 'Walk-in patient added to queue successfully',
      appointment,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
