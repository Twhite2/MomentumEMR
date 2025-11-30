import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    console.log('[INVOICES API] Starting GET request...');
    const session = await requireRole(['admin', 'cashier', 'pharmacist', 'doctor', 'patient', 'lab_tech']);
    console.log('[INVOICES API] Session:', { 
      userId: session.user.id, 
      role: session.user.role, 
      hospitalId: session.user.hospitalId 
    });
    const hospitalId = parseInt(session.user.hospitalId);
    console.log('[INVOICES API] Parsed hospitalId:', hospitalId);

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    // If user is a patient, only show their own invoices
    if (session.user.role === 'patient') {
      const userId = parseInt(session.user.id);
      
      // Find the patient record linked to this user
      const patient = await prisma.patient.findFirst({
        where: {
          hospitalId,
          userId: userId,
        },
      });

      if (!patient) {
        console.log('[INVOICES API] No patient record found for user ID:', userId);
        // Return empty list instead of error - patient profile might not be linked yet
        return apiResponse({
          invoices: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          message: 'No patient record found. Please contact hospital staff to link your account.',
        });
      }
      
      console.log('[INVOICES API] Found patient ID:', patient.id);
      where.patientId = patient.id;
    } else if (patientId) {
      where.patientId = parseInt(patientId);
    }

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
              patientType: true,
            },
          },
          invoiceItems: {
            orderBy: { id: 'asc' },
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    console.log('[INVOICES API] Found invoices:', invoices.length);
    return apiResponse({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[INVOICES API] Error:', error);
    return handleApiError(error);
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'cashier', 'pharmacist', 'doctor', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);

    const body = await request.json();
    const { patientId, appointmentId, items, notes } = body;

    // Validation
    if (!patientId || !items || items.length === 0) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Verify patient belongs to hospital
    const patient = await prisma.patient.findFirst({
      where: { id: parseInt(patientId), hospitalId },
    });

    if (!patient) {
      return apiResponse({ error: 'Patient not found' }, 404);
    }

    // Calculate totals (no VAT)
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.amount),
      0
    );

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        hospitalId,
        patientId: parseInt(patientId),
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        totalAmount,
        paidAmount: 0,
        status: 'pending',
        notes: notes || null,
        invoiceItems: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice),
            amount: parseFloat(item.amount),
          })),
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientType: true,
          },
        },
        invoiceItems: true,
        payments: true,
      },
    });

    return apiResponse(invoice, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
