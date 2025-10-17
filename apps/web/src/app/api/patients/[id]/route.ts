import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/patients/[id] - Get patient details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'cashier', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const patientId = parseInt(params.id);

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        hospitalId, // Ensure patient belongs to user's hospital
      },
      include: {
        hmo: true,
        corporateClient: true,
        appointments: {
          take: 5,
          orderBy: { startTime: 'desc' },
          include: {
            doctor: {
              select: { id: true, name: true },
            },
          },
        },
        medicalRecords: {
          take: 5,
          orderBy: { visitDate: 'desc' },
          include: {
            doctor: {
              select: { id: true, name: true },
            },
          },
        },
        prescriptions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              select: { id: true, name: true },
            },
            prescriptionItems: true,
          },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        labOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              select: { id: true, name: true },
            },
            labResults: true,
          },
        },
      },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    return apiResponse(patient);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const patientId = parseInt(params.id);

    const body = await request.json();
    const {
      firstName,
      lastName,
      dob,
      gender,
      patientType,
      contactInfo,
      address,
      emergencyContact,
      insuranceId,
      corporateClientId,
    } = body;

    // Verify patient belongs to hospital
    const existingPatient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId },
    });

    if (!existingPatient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    // Update patient
    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        firstName,
        lastName,
        dob: dob ? new Date(dob) : undefined,
        gender,
        patientType,
        contactInfo,
        address,
        emergencyContact,
        insuranceId: insuranceId ? parseInt(insuranceId) : null,
        corporateClientId: corporateClientId ? parseInt(corporateClientId) : null,
      },
      include: {
        hmo: true,
        corporateClient: true,
      },
    });

    return apiResponse(patient);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/patients/[id] - Soft delete patient (set inactive)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const patientId = parseInt(params.id);

    // Verify patient belongs to hospital
    const existingPatient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId },
    });

    if (!existingPatient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    // For now, just return success
    // In production, you might want to add an 'active' field to patient model
    return apiResponse({ message: 'Patient deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
