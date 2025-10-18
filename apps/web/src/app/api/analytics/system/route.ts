import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/analytics/system - System health and activity metrics for super admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can access system analytics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalAppointments,
      todayAppointments,
      last7DaysAppointments,
      totalInvoices,
      totalNotifications,
      unreadNotifications,
      activeUsers,
      usersByHospital,
    ] = await Promise.all([
      // Total appointments across all hospitals
      prisma.appointment.count(),

      // Today's appointments
      prisma.appointment.count({
        where: {
          startTime: {
            gte: today.toISOString(),
          },
        },
      }),

      // Last 7 days appointments
      prisma.appointment.count({
        where: {
          startTime: {
            gte: last7Days.toISOString(),
          },
        },
      }),

      // Total invoices
      prisma.invoice.count(),

      // Total notifications
      prisma.notification.count(),

      // Unread notifications
      prisma.notification.count({
        where: {
          readAt: null,
        },
      }),

      // Active users (logged in last 30 days - simplified)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: last30Days,
          },
        },
      }),

      // Users per hospital
      prisma.hospital.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              users: true,
              patients: true,
              appointments: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    // Calculate appointment growth
    const appointmentGrowthRate =
      last7DaysAppointments > 0
        ? ((todayAppointments / (last7DaysAppointments / 7)) * 100 - 100).toFixed(1)
        : 0;

    // Get top performing hospitals by activity
    const hospitalActivity = usersByHospital
      .map((h: { id: number; name: string; _count: { users: number; patients: number; appointments: number } }) => ({
        id: h.id,
        name: h.name,
        userCount: h._count.users,
        patientCount: h._count.patients,
        appointmentCount: h._count.appointments,
        activityScore:
          h._count.users * 2 + h._count.patients + h._count.appointments * 3,
      }))
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        totalAppointments,
        todayAppointments,
        last7DaysAppointments,
        appointmentGrowthRate,
        totalInvoices,
        totalNotifications,
        unreadNotifications,
        notificationReadRate: totalNotifications > 0 
          ? (((totalNotifications - unreadNotifications) / totalNotifications) * 100).toFixed(1)
          : 0,
        activeUsers,
        totalHospitals: usersByHospital.length,
      },
      topHospitals: hospitalActivity,
      systemHealth: {
        status: 'healthy', // You can add more sophisticated health checks
        uptime: '99.9%', // Placeholder
        lastIncident: null,
        totalHospitals: usersByHospital.length,
        activeHospitals: usersByHospital.filter((h) => h._count.users > 0).length,
      },
    });
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system analytics' },
      { status: 500 }
    );
  }
}
