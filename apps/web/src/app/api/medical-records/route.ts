import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/medical-records - List medical records (grouped by patient or detailed view)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    // Default to grouped view (one row per patient) for ALL users - only show individual records when explicitly requested
    const groupByPatient = searchParams.get('groupByPatient') !== 'false'; // Default to true
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    // Allow filtering by specific patient or doctor
    if (patientId) {
      where.patientId = parseInt(patientId);
    }

    if (doctorId) {
      where.doctorId = parseInt(doctorId);
    }

    // Note: Doctors and nurses can now see all hospital medical records
    // This enables care continuity and allows nurses to view treatment plans

    // If grouping by patient, return aggregated data
    if (groupByPatient && !patientId) {
      // Get all patients with their record counts and latest visit
      const patientsWithRecords = await prisma.patient.findMany({
        where: {
          hospitalId,
          medicalRecords: {
            some: where,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dob: true,
          gender: true,
          patientType: true,
          _count: {
            select: {
              medicalRecords: true,
            },
          },
          medicalRecords: {
            where,
            orderBy: { visitDate: 'desc' },
            take: 1,
            select: {
              id: true,
              visitDate: true,
              diagnosis: true,
              doctor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          medicalRecords: {
            _count: 'desc',
          },
        },
      });

      const total = await prisma.patient.count({
        where: {
          hospitalId,
          medicalRecords: {
            some: where,
          },
        },
      });

      // Transform to match expected format
      const records = patientsWithRecords.map(patient => ({
        patientId: patient.id,
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dob: patient.dob,
          gender: patient.gender,
          patientType: patient.patientType,
        },
        totalVisits: patient._count.medicalRecords,
        latestVisit: patient.medicalRecords[0] || null,
      }));

      return apiResponse({
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        grouped: true,
      });
    }

    // Default behavior: return individual records
    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
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
        },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return apiResponse({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      grouped: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/medical-records - Create new medical record
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userRole = session.user.role;

    const body = await request.json();
    const { patientId, visitDate, diagnosis, notes, allergies, attachments, doctorId: providedDoctorId } = body;

    // Determine doctorId: doctors use their own ID, others must provide one
    let doctorId: number;
    if (userRole === 'doctor') {
      doctorId = parseInt(session.user.id);
    } else if (providedDoctorId) {
      doctorId = parseInt(providedDoctorId);
    } else {
      return apiResponse({ error: 'Doctor ID is required' }, 400);
    }

    // Validation
    if (!patientId || !visitDate) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Verify patient belongs to hospital
    const patient = await prisma.patient.findFirst({
      where: { id: parseInt(patientId), hospitalId },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    // Create medical record
    const record = await prisma.medicalRecord.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        doctorId,
        visitDate: new Date(visitDate),
        diagnosis: diagnosis || null,
        notes: notes || null,
        allergies: allergies || null,
        attachments: attachments || null,
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
      },
    });

    return apiResponse(record, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
