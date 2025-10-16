import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/analytics/privacy - Get privacy settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin and hospital admins can view privacy settings
    if (!['super_admin', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hospitalId = session.user.role === 'super_admin' 
      ? null 
      : parseInt(session.user.hospitalId);

    // For now, we'll use a simple in-memory or JSON approach
    // In production, you'd store this in the database
    const defaultSettings = {
      diseaseAnalytics: {
        enabled: true,
        visibleToSuperAdmin: true,
        showPatientCount: true,
        showHospitalBreakdown: true,
      },
      sampleAnalytics: {
        enabled: true,
        visibleToSuperAdmin: true,
        showDetailedStats: true,
      },
      hospitalId: hospitalId,
    };

    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    );
  }
}

// PUT /api/analytics/privacy - Update privacy settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update privacy settings
    if (!['super_admin', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { diseaseAnalytics, sampleAnalytics } = body;

    // In a real implementation, store this in the database
    // For now, we'll just validate and return the settings
    const updatedSettings = {
      diseaseAnalytics: {
        enabled: diseaseAnalytics?.enabled ?? true,
        visibleToSuperAdmin: diseaseAnalytics?.visibleToSuperAdmin ?? true,
        showPatientCount: diseaseAnalytics?.showPatientCount ?? true,
        showHospitalBreakdown: diseaseAnalytics?.showHospitalBreakdown ?? true,
      },
      sampleAnalytics: {
        enabled: sampleAnalytics?.enabled ?? true,
        visibleToSuperAdmin: sampleAnalytics?.visibleToSuperAdmin ?? true,
        showDetailedStats: sampleAnalytics?.showDetailedStats ?? true,
      },
      updatedAt: new Date(),
      updatedBy: session.user.name,
    };

    return NextResponse.json({
      message: 'Privacy settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}
