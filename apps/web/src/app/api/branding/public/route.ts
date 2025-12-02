import { NextResponse } from 'next/server';
import { prisma } from '@momentum/database';
import { headers } from 'next/headers';

/**
 * Extract subdomain from hostname
 */
function getSubdomainFromHost(hostname: string): string | null {
  const hostWithoutPort = hostname.split(':')[0];
  
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return null;
  }
  
  const parts = hostWithoutPort.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

/**
 * Public API endpoint to fetch hospital branding by subdomain
 * This endpoint does NOT require authentication
 * Used by the login page to show hospital-specific branding
 */
export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const url = new URL(request.url);
    
    // Get subdomain from multiple sources (priority order)
    const subdomain = 
      headersList.get('x-hospital-subdomain') || // From middleware
      url.searchParams.get('subdomain') ||       // From query param
      getSubdomainFromHost(headersList.get('host') || ''); // From hostname directly
    
    if (!subdomain) {
      return NextResponse.json(
        { error: 'No subdomain provided' },
        { status: 400 }
      );
    }
    
    // Fetch hospital by subdomain
    const hospital = await prisma.hospital.findUnique({
      where: {
        subdomain: subdomain.toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        tagline: true,
        backgroundImageUrl: true,
        active: true,
      },
    });
    
    if (!hospital) {
      console.log(`[Branding API] No hospital found for subdomain: ${subdomain}`);
      return NextResponse.json(
        { error: 'Hospital not found for this subdomain' },
        { status: 404 }
      );
    }
    
    // Log branding fetch for debugging
    console.log(`[Branding API] Fetched branding for: ${hospital.name} (${subdomain})`);
    console.log(`[Branding API] Logo URL: ${hospital.logoUrl || 'none'}`);
    console.log(`[Branding API] Colors: ${hospital.primaryColor}, ${hospital.secondaryColor}`);
    
    // Return branding information
    return NextResponse.json({
      hospital: {
        id: hospital.id,
        name: hospital.name,
        subdomain: hospital.subdomain,
        logoUrl: hospital.logoUrl,
        primaryColor: hospital.primaryColor || '#0F4C81',
        secondaryColor: hospital.secondaryColor || '#4A90E2',
        tagline: hospital.tagline,
        backgroundImageUrl: hospital.backgroundImageUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching public branding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospital branding' },
      { status: 500 }
    );
  }
}
