import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/analytics/appointments - Get appointment analytics
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

    // Get appointment statistics
    const [
      totalAppointments,
      appointmentsByStatus,
      appointmentsByType,
      upcomingAppointments,
    ] = await Promise.all([
      // Total appointments
      prisma.appointment.count({ where }),
      // By status
      prisma.appointment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      // By type
      prisma.appointment.groupBy({
        by: ['appointmentType'],
        where,
        _count: true,
      }),
      // Upcoming appointments (next 7 days)
      prisma.appointment.count({
        where: {
          hospitalId,
          startTime: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          status: 'scheduled',
        },
      }),
    ]);

    // Calculate completion rate
    const completedCount = appointmentsByStatus.find((s: { status: string; _count: number }) => s.status === 'completed')?._count || 0;
    const completionRate = totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0;

    // Get daily appointment count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyAppointments = await prisma.$queryRaw`
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM appointments
      WHERE hospital_id = ${hospitalId}
        AND start_time >= ${startDate ? new Date(startDate) : thirtyDaysAgo}
        ${endDate ? prisma.$queryRaw`AND start_time <= ${new Date(endDate)}` : prisma.$queryRaw``}
      GROUP BY DATE(start_time)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Get top doctors by appointment count
    const topDoctors = await prisma.appointment.groupBy({
      by: ['doctorId'],
      where,
      _count: true,
      orderBy: {
        _count: {
          doctorId: 'desc',
        },
      },
      take: 10,
    });

    const doctorIds = topDoctors.map((d: { doctorId: number; _count: number }) => d.doctorId);
    const doctors = await prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, name: true },
    });

    const doctorStats = topDoctors.map((stat: { doctorId: number; _count: number }) => ({
      doctor: doctors.find((d: { id: number; name: string | null }) => d.id === stat.doctorId),
      count: stat._count,
    }));

    return apiResponse({
      summary: {
        totalAppointments,
        completionRate,
        upcomingAppointments,
      },
      distribution: {
        byStatus: appointmentsByStatus.reduce((acc: any, item: { status: string; _count: number }) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        byType: appointmentsByType.reduce((acc: any, item: { appointmentType: string; _count: number }) => {
          acc[item.appointmentType] = item._count;
          return acc;
        }, {}),
      },
      dailyAppointments,
      topDoctors: doctorStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
