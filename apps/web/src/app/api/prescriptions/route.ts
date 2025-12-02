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

    // Helper function to calculate total tablets needed
    const calculateTotalTablets = (frequency: string, duration: string): number => {
      // Extract numeric values from frequency (e.g., "3 times daily" -> 3)
      const freqMatch = frequency?.match(/(\d+)/);
      const timesPerDay = freqMatch ? parseInt(freqMatch[1]) : 1;

      // Extract numeric values and unit from duration
      const durationMatch = duration?.match(/(\d+)\s*(day|week|month)/i);
      if (!durationMatch) return timesPerDay; // Default to times per day if no duration

      const durationValue = parseInt(durationMatch[1]);
      const durationUnit = durationMatch[2].toLowerCase();

      // Convert to days
      let totalDays = durationValue;
      if (durationUnit === 'week') {
        totalDays = durationValue * 7;
      } else if (durationUnit === 'month') {
        totalDays = durationValue * 30;
      }

      return timesPerDay * totalDays;
    };

    // Create prescription with items (calculate drug count and total tablets)
    const prescription = await prisma.prescription.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        doctorId,
        treatmentPlan: treatmentPlan || null,
        status: 'active',
        drugCount: medications.length,
        prescriptionItems: {
          create: medications.map((med: any) => ({
            drugName: med.drugName,
            dosage: med.dosage || null,
            frequency: med.frequency || null,
            duration: med.duration || null,
            notes: med.notes || null,
            totalTablets: med.frequency && med.duration 
              ? calculateTotalTablets(med.frequency, med.duration)
              : null,
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
