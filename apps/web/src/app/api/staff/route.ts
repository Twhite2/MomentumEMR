import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/staff - List staff members (doctors, nurses, etc.) for hospital
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // Filter by role (e.g., 'doctor', 'nurse')
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: any = { 
      hospitalId,
      active: true,
    };

    // Filter by role if provided
    if (role) {
      where.role = role;
    } else {
      // By default, only show medical staff roles
      where.role = {
        in: ['doctor', 'nurse', 'lab_tech'],
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get staff members
    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return apiResponse({ staff });
  } catch (error) {
    return handleApiError(error);
  }
}
