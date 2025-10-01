import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';

// GET /api/users - List users
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (active === 'true') {
      where.active = true;
    } else if (active === 'false') {
      where.active = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return apiResponse({
      users,
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

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin']);
    const hospitalId = parseInt(session.user.hospitalId);

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Check if email already exists
    const existing = await prisma.user.findFirst({
      where: { email, hospitalId },
    });

    if (existing) {
      return apiResponse({ error: 'Email already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        hospitalId,
        name,
        email,
        password: hashedPassword,
        role,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return apiResponse(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
