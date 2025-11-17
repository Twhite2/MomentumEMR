import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/encounters - List encounters (with HMO filtering)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // filter by claimStatus
    const hmoId = searchParams.get('hmoId');
    const patientId = searchParams.get('patientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = { hospitalId };

    if (status) {
      where.claimStatus = status;
    }
    if (hmoId) {
      where.hmoId = parseInt(hmoId);
    }
    if (patientId) {
      where.patientId = parseInt(patientId);
    }
    if (startDate && endDate) {
      where.visitDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const encounters = await prisma.encounter.findMany({
      where,
      take: limit,
      orderBy: { visitDate: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            contactInfo: true,
          },
        },
        hmo: {
          select: {
            id: true,
            name: true,
            providerCode: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        diagnoses: true,
        procedures: true,
        billingItems: true,
        _count: {
          select: {
            attachments: true,
          },
        },
      },
    });

    return apiResponse({ encounters, total: encounters.length });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/encounters - Create encounter (Cashier billing)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const body = await request.json();

    const {
      patientId,
      hmoId,
      doctorId,
      visitDate,
      encounterType,
      authorizationCode,
      chiefComplaint,
      notes,
      diagnoses,
      procedures,
      billingItems,
    } = body;

    // Validation
    if (!patientId || !visitDate) {
      return apiResponse({ error: 'Patient and visit date are required' }, 400);
    }

    // Verify patient and HMO
    const patient = await prisma.patient.findFirst({
      where: { id: parseInt(patientId), hospitalId },
      include: { hmo: true },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    // Calculate amounts
    let totalAmount = 0;
    let hmoCoveredAmount = 0;
    let patientCopayAmount = 0;

    if (billingItems && Array.isArray(billingItems)) {
      billingItems.forEach((item: any) => {
        const itemTotal = parseFloat(item.totalCost || 0);
        totalAmount += itemTotal;

        if (item.isCoveredByHmo && item.hmoCoverage) {
          const coverage = parseFloat(item.hmoCoverage) / 100;
          const hmoAmount = itemTotal * coverage;
          hmoCoveredAmount += hmoAmount;
          item.hmoAmount = hmoAmount;
          item.patientAmount = itemTotal - hmoAmount;
        } else {
          item.patientAmount = itemTotal;
        }
      });
      patientCopayAmount = totalAmount - hmoCoveredAmount;
    }

    // Create encounter with nested data
    const encounter = await prisma.encounter.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        hmoId: hmoId ? parseInt(hmoId) : null,
        doctorId: doctorId ? parseInt(doctorId) : userId,
        visitDate: new Date(visitDate),
        encounterType: encounterType || 'OPD',
        authorizationCode,
        chiefComplaint,
        notes,
        totalAmount,
        hmoCoveredAmount,
        patientCopayAmount,
        claimStatus: 'draft',
        diagnoses: diagnoses
          ? {
              create: diagnoses.map((d: any) => ({
                diagnosisCode: d.diagnosisCode,
                description: d.description,
                isPrimary: d.isPrimary || false,
              })),
            }
          : undefined,
        procedures: procedures
          ? {
              create: procedures.map((p: any) => ({
                procedureCode: p.procedureCode,
                description: p.description,
                quantity: p.quantity || 1,
                unitCost: p.unitCost,
                totalCost: p.totalCost,
                performedAt: p.performedAt || new Date(),
                performedById: p.performedById || userId,
              })),
            }
          : undefined,
        billingItems: billingItems
          ? {
              create: billingItems.map((b: any) => ({
                serviceId: b.serviceId,
                description: b.description,
                quantity: b.quantity || 1,
                unitCost: b.unitCost,
                totalCost: b.totalCost,
                isCoveredByHmo: b.isCoveredByHmo ?? true,
                hmoCoverage: b.hmoCoverage,
                hmoAmount: b.hmoAmount || 0,
                patientAmount: b.patientAmount || 0,
              })),
            }
          : undefined,
      },
      include: {
        patient: true,
        hmo: true,
        doctor: true,
        diagnoses: true,
        procedures: true,
        billingItems: true,
      },
    });

    return apiResponse(encounter, 201);
  } catch (error) {
    console.error('Encounter creation error:', error);
    return handleApiError(error);
  }
}
