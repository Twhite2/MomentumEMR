import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isChangePasswordPage = request.nextUrl.pathname.startsWith('/auth/change-password');
  
  // If on login page and authenticated, redirect to dashboard (unless must change password)
  if (isAuthPage && session) {
    if ((session.user as any)?.mustChangePassword) {
      return NextResponse.redirect(new URL('/auth/change-password', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If not authenticated and trying to access protected routes, redirect to login
  if (!session && !isAuthPage && !isChangePasswordPage) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }
    
    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    );
  }
  
  // If authenticated but must change password, redirect to change password page
  if (session && (session.user as any)?.mustChangePassword && !isChangePasswordPage) {
    return NextResponse.redirect(new URL('/auth/change-password', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/patients/:path*', 
    '/appointments/:path*',
    '/medical-records/:path*',
    '/prescriptions/:path*',
    '/lab-orders/:path*',
    '/invoices/:path*',
    '/inventory/:path*',
    '/users/:path*',
    '/notifications/:path*',
    '/analytics/:path*',
    '/files/:path*',
    '/queue/:path*',
    '/login',
  ],
};
