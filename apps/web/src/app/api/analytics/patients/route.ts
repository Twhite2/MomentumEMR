import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/analytics/patients - Get patient analytics
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where: any = { hospitalId };
    if (startDate || endDate) {
      where.createdAt = dateFilter;
    }

    // Get patient statistics
    const [
      totalPatients,
      newPatients,
      patientsByType,
      patientsByGender,
      recentPatients,
    ] = await Promise.all([
      // Total patients
      prisma.patient.count({ where: { hospitalId } }),
      // New patients in period
      prisma.patient.count({ where }),
      // Patients by type
      prisma.patient.groupBy({
        by: ['patientType'],
        where: { hospitalId },
        _count: true,
      }),
      // Patients by gender
      prisma.patient.groupBy({
        by: ['gender'],
        where: { hospitalId },
        _count: true,
      }),
      // Recent registrations
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientType: true,
          gender: true,
          createdAt: true,
        },
      }),
    ]);

    // Get age distribution
    const patients = await prisma.patient.findMany({
      where: { hospitalId },
      select: { dob: true },
    });

    const ageDistribution = patients.reduce(
      (acc: any, patient: { dob: Date }) => {
        const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();
        if (age < 18) acc['0-17']++;
        else if (age < 30) acc['18-29']++;
        else if (age < 45) acc['30-44']++;
        else if (age < 60) acc['45-59']++;
        else acc['60+']++;
        return acc;
      },
      { '0-17': 0, '18-29': 0, '30-44': 0, '45-59': 0, '60+': 0 }
    );

    // Get patient growth over time (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyGrowth = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM patients
      WHERE hospital_id = ${hospitalId}
        AND created_at >= ${twelveMonthsAgo}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `;

    return apiResponse({
      summary: {
        totalPatients,
        newPatients,
        growthRate: totalPatients > 0 ? (newPatients / totalPatients) * 100 : 0,
      },
      distribution: {
        byType: patientsByType.reduce((acc: any, item) => {
          acc[item.patientType] = item._count;
          return acc;
        }, {}),
        byGender: patientsByGender.reduce((acc: any, item) => {
          const gender = item.gender || 'unknown';
          acc[gender] = item._count;
          return acc;
        }, {}),
        byAge: ageDistribution,
      },
      monthlyGrowth,
      recentPatients,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
