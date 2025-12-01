import { NextResponse } from 'next/server';
import { prisma } from '@momentum/database';
import { headers } from 'next/headers';

/**
 * Public API endpoint to fetch hospital branding by subdomain
 * This endpoint does NOT require authentication
 * Used by the login page to show hospital-specific branding
 */
export async function GET(request: Request) {
  try {
    // Get subdomain from middleware header or query parameter
    const headersList = await headers();
    const subdomain = headersList.get('x-hospital-subdomain') || 
                     new URL(request.url).searchParams.get('subdomain');
    
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
        active: true, // Only return active hospitals
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        tagline: true,
      },
    });
    
    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found for this subdomain' },
        { status: 404 }
      );
    }
    
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
