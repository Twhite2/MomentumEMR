import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/chat/users - Get all users available for chat (for @mentions and private chat)
export async function GET(request: NextRequest) {
  try {
    // Exclude super_admin from chat
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'cashier', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Get all staff users (exclude super_admin and current user)
    const users = await prisma.user.findMany({
      where: {
        hospitalId,
        active: true,
        role: { not: 'super_admin' },
        id: { not: parseInt(session.user.id) },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    return apiResponse(users);
  } catch (error) {
    return handleApiError(error);
  }
}
