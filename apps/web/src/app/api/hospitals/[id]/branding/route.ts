import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import { uploadFile, deleteFile } from '@/lib/storage';

// PUT /api/hospitals/[id]/branding - Update hospital branding
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can update branding
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only admins can update hospital branding' },
        { status: 403 }
      );
    }

    const hospitalId = parseInt(params.id);

    // Super admins can update any hospital, admins only their own
    if (session.user.role === 'admin' && parseInt(session.user.hospitalId) !== hospitalId) {
      return NextResponse.json(
        { error: 'You can only update your own hospital branding' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const logo = formData.get('logo') as File | null;
    const primaryColor = formData.get('primaryColor') as string | null;
    const secondaryColor = formData.get('secondaryColor') as string | null;
    const tagline = formData.get('tagline') as string | null;

    // Get current hospital data
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { logoUrl: true },
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    let logoUrl = hospital.logoUrl;

    // Handle logo upload
    if (logo && logo.size > 0) {
      // Validate logo file type
      const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!ALLOWED_IMAGE_TYPES.includes(logo.type)) {
        return NextResponse.json(
          { error: 'Logo must be an image file (JPEG, PNG, SVG, or WebP)' },
          { status: 400 }
        );
      }

      // Validate logo size (max 2MB)
      const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
      if (logo.size > MAX_LOGO_SIZE) {
        return NextResponse.json(
          { error: 'Logo file size must not exceed 2MB' },
          { status: 400 }
        );
      }

      // Delete old logo if exists
      if (hospital.logoUrl) {
        try {
          await deleteFile(hospital.logoUrl);
        } catch (error) {
          console.error('Error deleting old logo:', error);
          // Continue even if deletion fails
        }
      }

      // Upload new logo
      const buffer = Buffer.from(await logo.arrayBuffer());
      logoUrl = await uploadFile({
        file: buffer,
        fileName: logo.name,
        contentType: logo.type,
        folder: 'logos',
      });
    }

    // Validate color formats (hex colors)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return NextResponse.json(
        { error: 'Primary color must be a valid hex color code' },
        { status: 400 }
      );
    }

    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return NextResponse.json(
        { error: 'Secondary color must be a valid hex color code' },
        { status: 400 }
      );
    }

    // Update hospital branding
    const updatedHospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...(logoUrl && { logoUrl }),
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(tagline !== null && { tagline }),
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        tagline: true,
      },
    });

    return NextResponse.json({
      message: 'Hospital branding updated successfully',
      hospital: updatedHospital,
    });
  } catch (error) {
    console.error('Branding update error:', error);
    return NextResponse.json(
      { error: 'Failed to update hospital branding' },
      { status: 500 }
    );
  }
}

// GET /api/hospitals/[id]/branding - Get hospital branding
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const hospitalId = parseInt(params.id);

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        tagline: true,
      },
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json(hospital);
  } catch (error) {
    console.error('Error fetching hospital branding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospital branding' },
      { status: 500 }
    );
  }
}
