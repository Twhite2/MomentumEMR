import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/search - Role-aware global search
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json(
        session.user.role === 'super_admin'
          ? { hospitals: [], subscriptions: [] }
          : session.user.role === 'patient'
          ? { appointments: [], medicalRecords: [], invoices: [], prescriptions: [], labOrders: [] }
          : { patients: [], appointments: [], medicalRecords: [], invoices: [], prescriptions: [], labOrders: [] }
      );
    }

    const searchTerm = query.toLowerCase();

    // SUPER ADMIN: Search hospitals and subscriptions
    if (session.user.role === 'super_admin') {
      const hospitals = await prisma.hospital.findMany({
        where: {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              address: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              contactEmail: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              phoneNumber: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          address: true,
          contactEmail: true,
          phoneNumber: true,
          subscriptionPlan: true,
          active: true,
        },
        take: 5,
      });

      return NextResponse.json({
        hospitals,
        subscriptions: [], // Can be expanded later
      });
    }

    // HOSPITAL STAFF: Search patients, appointments, medical records
    const hospitalFilter: any = {};
    if (session.user.hospitalId) {
      hospitalFilter.hospitalId = parseInt(session.user.hospitalId);
    }

    // PATIENT ROLE: Only search their own records
    const isPatient = session.user.role === 'patient';
    let patientId: number | null = null;

    if (isPatient) {
      // Get patient ID for this user
      const patientRecord = await prisma.patient.findFirst({
        where: {
          hospitalId: parseInt(session.user.hospitalId),
          userId: parseInt(session.user.id),
        },
        select: { id: true },
      });
      patientId = patientRecord?.id || null;
    }

    // Search patients (staff only)
    const patients = !isPatient ? await prisma.patient.findMany({
      where: {
        ...hospitalFilter,
        OR: [
          {
            firstName: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            contactInfo: {
              path: ['email'],
              string_contains: searchTerm,
            },
          },
          {
            contactInfo: {
              path: ['phone'],
              string_contains: searchTerm,
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        patientType: true,
        gender: true,
      },
      take: 5,
    }) : [];

    // Search appointments (filter by patient if patient role)
    const appointments = await prisma.appointment.findMany({
      where: {
        ...hospitalFilter,
        ...(isPatient && patientId ? { patientId } : {}),
        OR: [
          {
            department: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          ...(isPatient ? [] : [
            {
              patient: {
                OR: [
                  {
                    firstName: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                  {
                    lastName: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          ]),
        ],
      },
      select: {
        id: true,
        appointmentType: true,
        department: true,
        startTime: true,
        status: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 5,
    });

    // Search medical records (filter by patient if patient role)
    const medicalRecords = await prisma.medicalRecord.findMany({
      where: {
        ...hospitalFilter,
        ...(isPatient && patientId ? { patientId } : {}),
        OR: [
          {
            diagnosis: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            notes: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          ...(isPatient ? [] : [
            {
              patient: {
                OR: [
                  {
                    firstName: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                  {
                    lastName: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          ]),
        ],
      },
      select: {
        id: true,
        visitDate: true,
        diagnosis: true,
        notes: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        visitDate: 'desc',
      },
      take: 5,
    });

    // Search invoices (bills) - filter by patient if patient role
    const invoices = await prisma.invoice.findMany({
      where: {
        ...hospitalFilter,
        ...(isPatient && patientId ? { patientId } : {}),
        ...(isPatient ? {} : {
          patient: {
            OR: [
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          },
        }),
      },
      select: {
        id: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        createdAt: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Search prescriptions - filter by patient if patient role
    const prescriptions = await prisma.prescription.findMany({
      where: {
        ...hospitalFilter,
        ...(isPatient && patientId ? { patientId } : {}),
        OR: [
          {
            treatmentPlan: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            prescriptionItems: {
              some: {
                drugName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
          ...(isPatient ? [] : [
            {
              patient: {
                OR: [
                  {
                    firstName: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                  {
                    lastName: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          ]),
        ],
      },
      select: {
        id: true,
        treatmentPlan: true,
        status: true,
        createdAt: true,
        prescriptionItems: {
          select: {
            drugName: true,
            dosage: true,
          },
          take: 2,
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Search lab orders - filter by patient if patient role
    const labOrders = await prisma.labOrder.findMany({
      where: {
        ...hospitalFilter,
        ...(isPatient && patientId ? { patientId } : {}),
        OR: [
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          ...(isPatient ? [] : [
            {
              patient: {
                OR: [
                  {
                    firstName: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                  {
                    lastName: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          ]),
        ],
      },
      select: {
        id: true,
        orderType: true,
        description: true,
        status: true,
        createdAt: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json({
      patients,
      appointments,
      medicalRecords,
      invoices,
      prescriptions,
      labOrders,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
