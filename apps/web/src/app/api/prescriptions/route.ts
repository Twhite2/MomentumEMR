import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/prescriptions - List prescriptions
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist', 'cashier', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    // Role-based filtering
    if (userRole === 'doctor') {
      where.doctorId = userId;
    } else if (userRole === 'pharmacist') {
      // Pharmacist sees pending and active prescriptions
      where.status = { in: ['active', 'completed'] };
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

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
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
          prescriptionItems: true,
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    return apiResponse({
      prescriptions,
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

// POST /api/prescriptions - Create new prescription
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['doctor', 'pharmacist', 'admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    const body = await request.json();
    const { patientId, treatmentPlan, medications, doctorId: requestDoctorId } = body;

    // Determine doctorId: use provided doctorId, or session user ID if they're a doctor
    let doctorId: number;
    if (requestDoctorId) {
      doctorId = parseInt(requestDoctorId);
    } else if (userRole === 'doctor') {
      doctorId = userId;
    } else {
      return apiResponse({ error: 'doctorId is required for non-doctor users' }, 400);
    }

    // Validation
    if (!patientId || !medications || medications.length === 0) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Verify patient belongs to hospital
    const patient = await prisma.patient.findFirst({
      where: { id: parseInt(patientId), hospitalId },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    // Create prescription with items
    const prescription = await prisma.prescription.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        doctorId,
        treatmentPlan: treatmentPlan || null,
        status: 'active',
        prescriptionItems: {
          create: medications.map((med: any) => ({
            drugName: med.drugName,
            dosage: med.dosage || null,
            frequency: med.frequency || null,
            duration: med.duration || null,
            notes: med.notes || null,
          })),
        },
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
        prescriptionItems: true,
      },
    });

    return apiResponse(prescription, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
