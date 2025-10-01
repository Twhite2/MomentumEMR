import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden');
  }
  return session;
}

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return apiError('Authentication required', 401);
    }
    if (error.message === 'Forbidden') {
      return apiError('Insufficient permissions', 403);
    }
    return apiError(error.message, 400);
  }
  
  return apiError('Internal server error', 500);
}
