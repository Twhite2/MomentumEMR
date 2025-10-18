import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/analytics/diseases - Disease analytics for super admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can access disease analytics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.visitDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get disease statistics from medical records
    const medicalRecords = await prisma.medicalRecord.findMany({
      where: dateFilter,
      select: {
        id: true,
        diagnosis: true,
        visitDate: true,
        patientId: true,
        hospitalId: true,
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Process disease data
    const diseaseMap = new Map<string, {
      count: number;
      patientIds: Set<number>;
      hospitalIds: Set<number>;
      recentCases: Date[];
    }>();

    medicalRecords.forEach((record: { id: number; diagnosis: string | null; visitDate: Date; patientId: number; hospitalId: number; hospital: { id: number; name: string } }) => {
      if (record.diagnosis) {
        // Extract disease names (simple extraction, could be improved)
        const diseases = record.diagnosis
          .split(/[,;.]/)
          .map((d: string) => d.trim())
          .filter((d: string) => d.length > 0);

        diseases.forEach((disease: string) => {
          const normalizedDisease = disease.toLowerCase();
          
          if (!diseaseMap.has(normalizedDisease)) {
            diseaseMap.set(normalizedDisease, {
              count: 0,
              patientIds: new Set(),
              hospitalIds: new Set(),
              recentCases: [],
            });
          }

          const data = diseaseMap.get(normalizedDisease)!;
          data.count++;
          data.patientIds.add(record.patientId);
          data.hospitalIds.add(record.hospitalId);
          data.recentCases.push(record.visitDate);
        });
      }
    });

    // Convert to array and sort by count
    const diseaseStats = Array.from(diseaseMap.entries())
      .map(([disease, data]) => ({
        disease: disease.charAt(0).toUpperCase() + disease.slice(1),
        totalCases: data.count,
        uniquePatients: data.patientIds.size,
        affectedHospitals: data.hospitalIds.size,
        latestCase: new Date(Math.max(...data.recentCases.map(d => d.getTime()))),
        trend: calculateTrend(data.recentCases),
      }))
      .sort((a, b) => b.totalCases - a.totalCases)
      .slice(0, 20); // Top 20 diseases

    // Sample collection statistics
    const labOrders = await prisma.labOrder.findMany({
      where: dateFilter.visitDate ? {
        createdAt: dateFilter.visitDate,
      } : {},
      select: {
        id: true,
        orderType: true,
        status: true,
        createdAt: true,
        hospitalId: true,
      },
    });

    const sampleStats = {
      totalSamples: labOrders.length,
      pendingSamples: labOrders.filter((l: { status: string | null }) => l.status === 'pending').length,
      completedSamples: labOrders.filter((l: { status: string | null }) => l.status === 'completed').length,
      samplesByType: groupByTestType(labOrders),
    };

    // Overall summary
    const summary = {
      totalDiseases: diseaseStats.length,
      totalCases: diseaseStats.reduce((sum: number, d: { totalCases: number }) => sum + d.totalCases, 0),
      totalPatients: new Set(medicalRecords.map(r => r.patientId)).size,
      totalHospitals: new Set(medicalRecords.map(r => r.hospitalId)).size,
      avgCasesPerDisease: diseaseStats.length > 0 
        ? Math.round(diseaseStats.reduce((sum: number, d: { totalCases: number }) => sum + d.totalCases, 0) / diseaseStats.length)
        : 0,
    };

    return NextResponse.json({
      summary,
      diseases: diseaseStats,
      samples: sampleStats,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
    });
  } catch (error) {
    console.error('Error fetching disease analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disease analytics' },
      { status: 500 }
    );
  }
}

// Helper function to calculate trend
function calculateTrend(dates: Date[]): string {
  if (dates.length < 2) return 'stable';
  
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  const midPoint = Math.floor(sortedDates.length / 2);
  const firstHalf = sortedDates.slice(0, midPoint).length;
  const secondHalf = sortedDates.slice(midPoint).length;
  
  if (secondHalf > firstHalf * 1.2) return 'increasing';
  if (secondHalf < firstHalf * 0.8) return 'decreasing';
  return 'stable';
}

// Helper function to group lab orders by order type
function groupByTestType(labOrders: any[]) {
  const typeMap = new Map<string, number>();
  
  labOrders.forEach((order: any) => {
    const type = order.orderType || 'Unknown';
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });
  
  return Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
