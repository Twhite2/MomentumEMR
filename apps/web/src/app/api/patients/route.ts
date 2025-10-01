import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/patients - List patients for hospital
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'cashier']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const patientType = searchParams.get('patientType') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { 
          contactInfo: { 
            path: ['email'], 
            string_contains: search 
          } 
        },
      ];
    }

    if (patientType) {
      where.patientType = patientType;
    }

    // Get patients with related data
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          hmo: {
            select: { id: true, policyName: true, provider: true },
          },
          corporateClient: {
            select: { id: true, companyName: true },
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return apiResponse({
      patients,
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

// POST /api/patients - Create new patient
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);

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

    // Validation
    if (!firstName || !lastName || !dob || !patientType) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        hospitalId,
        firstName,
        lastName,
        dob: new Date(dob),
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

    return apiResponse(patient, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
