import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Extract subdomain from hostname
 * Examples:
 * - citygeneralhospital.momentumhealthcare.io → citygeneralhospital
 * - localhost:3000 → null (development)
 * - momentumhealthcare.io → null (main domain)
 */
function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0];
  
  // Development/localhost check
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return null;
  }
  
  // Split hostname into parts
  const parts = hostWithoutPort.split('.');
  
  // If we have at least 3 parts (subdomain.domain.com), extract subdomain
  if (parts.length >= 3) {
    return parts[0];
  }
  
  // No subdomain found
  return null;
}

export async function middleware(request: NextRequest) {
  // Extract subdomain from hostname
  const hostname = request.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);
  
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
  
  // Add subdomain to request headers for use in API routes and pages
  const response = NextResponse.next();
  if (subdomain) {
    response.headers.set('x-hospital-subdomain', subdomain);
  }
  
  return response;
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
