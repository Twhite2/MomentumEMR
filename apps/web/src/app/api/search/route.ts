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
          : { patients: [], appointments: [], medicalRecords: [] }
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

    // Search patients
    const patients = await prisma.patient.findMany({
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
    });

    // Search appointments by patient name
    const appointments = await prisma.appointment.findMany({
      where: {
        ...hospitalFilter,
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

    // Search medical records
    const medicalRecords = await prisma.medicalRecord.findMany({
      where: {
        ...hospitalFilter,
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

    return NextResponse.json({
      patients,
      appointments,
      medicalRecords,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
