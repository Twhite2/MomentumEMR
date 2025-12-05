import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/claims - Get list of HMO invoices (claims) with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier', 'super_admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const hmoId = searchParams.get('hmoId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause for HMO invoices
    const where: any = {
      hospitalId,
      hmoId: { not: null }, // Only get invoices with HMO
    };

    if (status) {
      where.status = status;
    }

    if (hmoId) {
      where.hmoId = parseInt(hmoId);
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get total count
    const total = await prisma.invoice.count({ where });

    // Get HMO invoices (claims) with comprehensive visit information
    const claims = await prisma.invoice.findMany({
      where,
      include: {
        patient: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            patientType: true,
            hmo: {
              select: {
                id: true,
                name: true,
                provider: true,
              },
            },
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        invoiceItems: true,
        // Prescriptions linked to this invoice
        prescriptions: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
              },
            },
            prescriptionItems: {
              include: {
                inventory: {
                  select: {
                    id: true,
                    itemName: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // For each invoice, fetch related medical records and lab orders
    const transformedClaims = await Promise.all(
      claims.map(async (invoice) => {
        // Get medical records for the same day and patient
        const invoiceDate = new Date(invoice.createdAt);
        const startOfDay = new Date(invoiceDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(invoiceDate.setHours(23, 59, 59, 999));

        const medicalRecords = await prisma.medicalRecord.findMany({
          where: {
            patientId: invoice.patientId,
            visitDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get the most recent one for that day
        });

        // Get lab orders for the same day and patient
        const labOrders = await prisma.labOrder.findMany({
          where: {
            patientId: invoice.patientId,
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
              },
            },
            labResults: {
              select: {
                id: true,
                fileUrl: true,
                resultNotes: true,
                createdAt: true,
              },
            },
          },
        });

        return {
          id: invoice.id,
          invoiceId: invoice.id,
          status: invoice.status,
          submittedAmount: Number(invoice.totalAmount),
          paidAmount: Number(invoice.paidAmount),
          submissionDate: invoice.createdAt,
          hmoId: invoice.hmoId,
          patient: invoice.patient,
          hmo: invoice.patient.hmo, // Include HMO from patient
          invoiceItems: invoice.invoiceItems,
          totalAmount: invoice.totalAmount,
          notes: invoice.notes,
          // Visit information
          prescriptions: invoice.prescriptions || [],
          medicalRecords: medicalRecords || [],
          labOrders: labOrders || [],
        };
      })
    );

    return apiResponse({
      claims: transformedClaims,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
