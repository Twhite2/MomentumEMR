import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  
  // If on login page and authenticated, redirect to dashboard
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If not authenticated and trying to access protected routes, redirect to login
  if (!session && !isAuthPage) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }
    
    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    );
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
