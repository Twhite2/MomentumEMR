import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/hmo-tariffs - Get HMO tariffs for a specific HMO or patient
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'pharmacist', 'cashier', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const hmoId = searchParams.get('hmoId');
    const patientId = searchParams.get('patientId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let finalHmoId = hmoId ? parseInt(hmoId) : null;

    // If patientId is provided, fetch patient's HMO
    if (patientId && !finalHmoId) {
      const patient = await prisma.patient.findUnique({
        where: { id: parseInt(patientId) },
        select: { 
          hmo: {
            select: { id: true }
          }, 
          patientType: true 
        },
      });

      if (!patient) {
        return apiResponse({ error: 'Patient not found' }, 404);
      }

      if (patient.patientType !== 'hmo' || !patient.hmo) {
        return apiResponse({
          tariffs: [],
          message: 'Patient is not an HMO patient',
        });
      }

      finalHmoId = patient.hmo.id;
    }

    if (!finalHmoId) {
      return apiResponse({ error: 'hmoId or patientId is required' }, 400);
    }

    // Build where clause
    const where: any = {
      hmoId: finalHmoId,
      active: true,
      AND: [],
    };

    // Filter by category if provided
    if (category) {
      where.category = category;
    }

    // Search functionality
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Check if tariff expires
    const now = new Date();
    where.AND.push({
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: now } },
      ],
    });

    const tariffs = await prisma.hmoTariff.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        unit: true,
        basePrice: true,
        tier0Price: true,
        tier1Price: true,
        tier2Price: true,
        tier3Price: true,
        tier4Price: true,
        isPARequired: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
      take: 200,
    });

    // Get HMO details
    const hmo = await prisma.hmo.findUnique({
      where: { id: finalHmoId },
      select: { id: true, name: true },
    });

    return apiResponse({
      tariffs,
      hmo,
      count: tariffs.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
