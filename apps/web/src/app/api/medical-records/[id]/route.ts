import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/medical-records/[id] - Get medical record details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const recordId = parseInt(params.id);

    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        hospitalId,
      },
      include: {
        patient: {
          include: {
            _count: {
              select: {
                medicalRecords: true,
                prescriptions: true,
                labOrders: true,
                vitals: true,
              },
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
      },
    });

    if (!record) {
      return apiResponse({ error: 'Medical record not found' }, 404);
    }

    // Get latest vital signs for this patient
    const latestVital = await prisma.vital.findFirst({
      where: {
        patientId: record.patientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        bloodPressureSys: true,
        bloodPressureDia: true,
        temperature: true,
        heartRate: true,
        weight: true,
      },
    });

    // Format blood pressure for display
    const formattedVital = latestVital ? {
      bloodPressure: latestVital.bloodPressureSys && latestVital.bloodPressureDia 
        ? `${latestVital.bloodPressureSys}/${latestVital.bloodPressureDia}`
        : null,
      temperature: latestVital.temperature,
      pulse: latestVital.heartRate,
      weight: latestVital.weight,
    } : null;

    return apiResponse({
      ...record,
      latestVital: formattedVital,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/medical-records/[id] - Update medical record
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const recordId = parseInt(params.id);
    const userRole = session.user.role;

    const body = await request.json();
    const { visitDate, diagnosis, notes, treatmentPlan, allergies, attachments } = body;
    const userId = parseInt(session.user.id);
    const userName = session.user.name;

    // Verify record exists
    const existing = await prisma.medicalRecord.findFirst({
      where: { id: recordId, hospitalId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existing) {
      return apiResponse({ error: 'Medical record not found' }, 404);
    }

    // Build edit history entry
    const editHistoryEntry = {
      doctorId: userId,
      doctorName: userName,
      editedAt: new Date().toISOString(),
      changes: [] as string[],
      originalDoctorId: existing.doctorId,
      originalDoctorName: existing.doctor.name,
    };

    // Nurses can only update treatment plan
    const updateData: any = {};
    if (userRole === 'nurse') {
      if (treatmentPlan !== undefined && treatmentPlan !== existing.treatmentPlan) {
        updateData.treatmentPlan = treatmentPlan;
        editHistoryEntry.changes.push('treatment plan');
      }
    } else {
      // Doctors and admins can update all fields
      if (visitDate && new Date(visitDate).toISOString() !== new Date(existing.visitDate).toISOString()) {
        updateData.visitDate = new Date(visitDate);
        editHistoryEntry.changes.push('visit date');
      }
      if (diagnosis !== undefined && diagnosis !== existing.diagnosis) {
        updateData.diagnosis = diagnosis;
        editHistoryEntry.changes.push('diagnosis');
      }
      if (notes !== undefined && notes !== existing.notes) {
        updateData.notes = notes;
        editHistoryEntry.changes.push('clinical notes');
      }
      if (treatmentPlan !== undefined && treatmentPlan !== existing.treatmentPlan) {
        updateData.treatmentPlan = treatmentPlan;
        editHistoryEntry.changes.push('treatment plan');
      }
      if (allergies !== undefined && JSON.stringify(allergies) !== JSON.stringify(existing.allergies)) {
        updateData.allergies = allergies;
        editHistoryEntry.changes.push('allergies');
      }
      if (attachments !== undefined && JSON.stringify(attachments) !== JSON.stringify(existing.attachments)) {
        updateData.attachments = attachments;
        editHistoryEntry.changes.push('attachments');
      }
    }

    // Add edit history if changes were made
    if (editHistoryEntry.changes.length > 0) {
      const existingHistory = ((existing as any).editHistory as any[]) || [];
      updateData.editHistory = [...existingHistory, editHistoryEntry];
    }

    // Update record
    const record = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: updateData,
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

    return apiResponse(record);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/medical-records/[id] - Delete medical record
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const recordId = parseInt(params.id);

    // Verify record exists
    const existing = await prisma.medicalRecord.findFirst({
      where: { id: recordId, hospitalId },
    });

    if (!existing) {
      return apiResponse({ error: 'Medical record not found' }, 404);
    }

    // Delete record
    await prisma.medicalRecord.delete({
      where: { id: recordId },
    });

    return apiResponse({ message: 'Medical record deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
