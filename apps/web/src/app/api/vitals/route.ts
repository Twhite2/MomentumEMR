import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/vitals - List vitals records
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const appointmentId = searchParams.get('appointmentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { hospitalId };
    if (patientId) where.patientId = parseInt(patientId);
    if (appointmentId) where.appointmentId = parseInt(appointmentId);

    const [vitalsData, total] = await Promise.all([
      prisma.vital.findMany({
        where,
        skip,
        take: limit,
        orderBy: { recordedAt: 'desc' },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          recordedByUser: {
            select: { id: true, name: true },
          },
          appointment: {
            select: { id: true, startTime: true },
          },
        },
      }),
      prisma.vital.count({ where }),
    ]);

    // Format blood pressure for display
    const vitals = vitalsData.map((vital: any) => ({
      ...vital,
      bloodPressure: vital.bloodPressureSys && vital.bloodPressureDia
        ? `${vital.bloodPressureSys}/${vital.bloodPressureDia}`
        : null,
    }));

    return apiResponse({
      vitals,
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

// POST /api/vitals - Record new vitals
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const recordedBy = parseInt(session.user.id);

    const body = await request.json();
    let {
      patientId,
      appointmentId,
      temperature,
      bloodPressure,
      bloodPressureSys,
      bloodPressureDia,
      heartRate,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      notes,
    } = body;

    // Parse blood pressure if provided as "120/80" format
    if (bloodPressure && typeof bloodPressure === 'string' && bloodPressure.includes('/')) {
      const [sys, dia] = bloodPressure.split('/').map((v: string) => v.trim());
      bloodPressureSys = sys;
      bloodPressureDia = dia;
    }

    if (!patientId) {
      return apiResponse({ error: 'Patient ID is required' }, 400);
    }

    // Calculate BMI
    let bmi = null;
    if (weight && height) {
      const heightInMeters = parseFloat(height) / 100;
      bmi = parseFloat(weight) / (heightInMeters * heightInMeters);
    }

    const vital = await prisma.vital.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        recordedBy,
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        bloodPressureSys: bloodPressureSys ? parseInt(bloodPressureSys) : null,
        bloodPressureDia: bloodPressureDia ? parseInt(bloodPressureDia) : null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
        oxygenSaturation: oxygenSaturation ? parseFloat(oxygenSaturation) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        bmi: bmi ? parseFloat(bmi.toFixed(2)) : null,
        notes: notes || null,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        recordedByUser: { select: { id: true, name: true } },
      },
    });

    // Format blood pressure for display
    const formattedVital = {
      ...vital,
      bloodPressure: vital.bloodPressureSys && vital.bloodPressureDia
        ? `${vital.bloodPressureSys}/${vital.bloodPressureDia}`
        : null,
    };

    return apiResponse(formattedVital, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
