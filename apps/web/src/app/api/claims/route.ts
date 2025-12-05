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

    // Get HMO invoices (claims)
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Transform invoices to claims format
    const transformedClaims = claims.map(invoice => ({
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
    }));

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
