import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/admin/export - Export all hospital data (for super admin)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const dataType = searchParams.get('type') || 'all';
    const format = searchParams.get('format') || 'json'; // json or csv
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate),
      lte: new Date(endDate),
    } : undefined;

    let exportData: any = {};

    // Export based on type
    if (dataType === 'all' || dataType === 'patients') {
      exportData.patients = await prisma.patient.findMany({
        where: {
          hospitalId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
        include: {
          primaryDoctor: {
            select: { id: true, name: true, email: true },
          },
          hmo: {
            select: { id: true, name: true },
          },
          corporateClient: {
            select: { id: true, companyName: true },
          },
        },
      });
    }

    if (dataType === 'all' || dataType === 'appointments') {
      exportData.appointments = await prisma.appointment.findMany({
        where: {
          hospitalId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          doctor: {
            select: { id: true, name: true },
          },
        },
      });
    }

    if (dataType === 'all' || dataType === 'medical-records') {
      exportData.medicalRecords = await prisma.medicalRecord.findMany({
        where: {
          hospitalId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          doctor: {
            select: { id: true, name: true },
          },
        },
      });
    }

    if (dataType === 'all' || dataType === 'prescriptions') {
      exportData.prescriptions = await prisma.prescription.findMany({
        where: {
          hospitalId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          doctor: {
            select: { id: true, name: true },
          },
          prescriptionItems: true,
        },
      });
    }

    if (dataType === 'all' || dataType === 'lab-orders') {
      exportData.labOrders = await prisma.labOrder.findMany({
        where: {
          hospitalId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          doctor: {
            select: { id: true, name: true },
          },
          assignedLabTech: {
            select: { id: true, name: true },
          },
          labResults: true,
        },
      });
    }

    if (dataType === 'all' || dataType === 'invoices') {
      exportData.invoices = await prisma.invoice.findMany({
        where: {
          hospitalId,
          ...(dateFilter && { createdAt: dateFilter }),
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          invoiceItems: true,
          payments: true,
        },
      });
    }

    if (dataType === 'all' || dataType === 'inventory') {
      exportData.inventory = await prisma.inventory.findMany({
        where: { hospitalId },
      });
    }

    if (dataType === 'all' || dataType === 'users') {
      exportData.users = await prisma.user.findMany({
        where: { hospitalId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          lastLogin: true,
        },
      });
    }

    if (dataType === 'all' || dataType === 'vitals') {
      exportData.vitals = await prisma.vital.findMany({
        where: {
          hospitalId,
          ...(dateFilter && { recordedAt: dateFilter }),
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          recordedByUser: {
            select: { id: true, name: true },
          },
        },
      });
    }

    if (dataType === 'all' || dataType === 'admissions') {
      exportData.admissions = await prisma.admission.findMany({
        where: {
          hospitalId,
          ...(dateFilter && { admissionDate: dateFilter }),
        },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          admittingDoctor: {
            select: { id: true, name: true },
          },
        },
      });
    }

    // Add export metadata
    const metadata = {
      hospitalId,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      dataType,
      format,
      dateRange: dateFilter ? {
        start: startDate,
        end: endDate,
      } : 'all',
      recordCounts: Object.keys(exportData).reduce((acc, key) => {
        acc[key] = Array.isArray(exportData[key]) ? exportData[key].length : 0;
        return acc;
      }, {} as Record<string, number>),
    };

    return apiResponse({
      metadata,
      data: exportData,
      message: 'Data exported successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
