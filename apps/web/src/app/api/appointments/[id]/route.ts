import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/appointments/[id] - Get appointment details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);
    const appointmentId = parseInt(params.id);

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        hospitalId,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      return apiResponse({ error: 'Appointment not found' }, 404);
    }

    return apiResponse(appointment);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);
    const appointmentId = parseInt(params.id);

    const body = await request.json();
    const { status, startTime, endTime, department, appointmentType } = body;

    // Verify appointment exists
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Appointment not found' }, 404);
    }

    // Update appointment
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        department,
        appointmentType,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return apiResponse(appointment);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/appointments/[id] - Update appointment status (for check-in/check-out)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);
    const appointmentId = parseInt(params.id);

    const body = await request.json();
    const { status } = body;

    // Verify appointment exists
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Appointment not found' }, 404);
    }

    // Update appointment status
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return apiResponse(appointment);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/appointments/[id] - Cancel appointment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);
    const appointmentId = parseInt(params.id);

    // Verify appointment exists
    const existing = await prisma.appointment.findFirst({
      where: { id: appointmentId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Appointment not found' }, 404);
    }

    // Update status to cancelled
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'cancelled' },
    });

    return apiResponse({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
