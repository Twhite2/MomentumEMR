import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/admissions - List admissions
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { hospitalId };
    if (status) where.status = status;

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { admissionDate: 'desc' },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, bloodGroup: true },
          },
          admittingDoctor: {
            select: { id: true, name: true, email: true },
          },
          dischargingDoctor: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.admission.count({ where }),
    ]);

    return apiResponse({
      admissions,
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

// POST /api/admissions - Admit patient
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const admittedBy = parseInt(session.user.id);

    const body = await request.json();
    const { patientId, ward, bedNumber, admissionReason } = body;

    if (!patientId || !admissionReason) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    const admission = await prisma.admission.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        admittedBy,
        ward: ward || null,
        bedNumber: bedNumber || null,
        admissionReason,
        admissionDate: new Date(),
        status: 'admitted',
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        admittingDoctor: { select: { id: true, name: true } },
      },
    });

    return apiResponse(admission, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
