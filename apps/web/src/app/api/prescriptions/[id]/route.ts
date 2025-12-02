import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/prescriptions/[id] - Get prescription details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);
    const prescriptionId = parseInt(params.id);

    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        hospitalId,
      },
      include: {
        patient: {
          include: {
            admissions: {
              where: {
                status: {
                  in: ['admitted', 'in_treatment'],
                },
              },
              orderBy: {
                admissionDate: 'desc',
              },
              take: 1,
            },
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        prescriptionItems: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!prescription) {
      return apiResponse({ error: 'Prescription not found' }, 404);
    }

    return apiResponse(prescription);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/prescriptions/[id] - Update prescription
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'pharmacist']);
    const hospitalId = parseInt(session.user.hospitalId);
    const prescriptionId = parseInt(params.id);

    const body = await request.json();
    const { status, treatmentPlan } = body;

    // Verify prescription exists
    const existing = await prisma.prescription.findFirst({
      where: { id: prescriptionId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Prescription not found' }, 404);
    }

    // Update prescription
    const prescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status,
        treatmentPlan,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        prescriptionItems: true,
      },
    });

    return apiResponse(prescription);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/prescriptions/[id] - Delete prescription
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'pharmacist']);
    const hospitalId = parseInt(session.user.hospitalId);
    const prescriptionId = parseInt(params.id);

    // Verify prescription exists
    const existing = await prisma.prescription.findFirst({
      where: { id: prescriptionId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Prescription not found' }, 404);
    }

    // Delete prescription (cascade will delete items)
    await prisma.prescription.delete({
      where: { id: prescriptionId },
    });

    return apiResponse({ message: 'Prescription deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
