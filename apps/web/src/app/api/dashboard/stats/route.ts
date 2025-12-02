import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Base stats for all roles
    const baseStats = {
      hospitalId,
      userName: session.user.name,
      userRole,
    };

    // Role-specific statistics
    switch (userRole) {
      case 'admin':
      case 'super_admin':
        // Admin Dashboard Stats
        const [
          totalPatients,
          totalStaff,
          todayAppointments,
          totalAppointmentsThisMonth,
          completedAppointmentsThisMonth,
          totalInvoicesThisMonth,
          paidInvoicesThisMonth,
          pendingInvoicesThisMonth,
          invoiceSummary,
          todayRevenue,
          patientsByType,
          inventoryStats,
          pharmacyLowStock,
          labLowStock,
          nurseLowStock,
          admissionsToday,
          dischargesToday,
        ] = await Promise.all([
          // Total patients
          prisma.patient.count({ where: { hospitalId } }),
          
          // Total staff
          prisma.user.count({ 
            where: { 
              hospitalId,
              role: { not: 'patient' }
            } 
          }),
          
          // Today's appointments
          prisma.appointment.count({
            where: {
              hospitalId,
              startTime: {
                gte: today,
                lt: tomorrow,
              },
            },
          }),
          
          // This month's appointments
          prisma.appointment.count({
            where: {
              hospitalId,
              startTime: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          
          // Completed appointments this month
          prisma.appointment.count({
            where: {
              hospitalId,
              status: 'completed',
              startTime: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          
          // Total invoices this month
          prisma.invoice.count({
            where: {
              hospitalId,
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          
          // Paid invoices this month
          prisma.invoice.count({
            where: {
              hospitalId,
              status: 'paid',
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          
          // Pending invoices this month
          prisma.invoice.count({
            where: {
              hospitalId,
              status: 'pending',
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          
          // Revenue summary
          prisma.invoice.aggregate({
            where: {
              hospitalId,
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            _sum: {
              totalAmount: true,
              paidAmount: true,
            },
          }),
          
          // Today's revenue (pending + paid)
          prisma.invoice.aggregate({
            where: {
              hospitalId,
              createdAt: {
                gte: today,
                lt: tomorrow,
              },
            },
            _sum: {
              totalAmount: true,
              paidAmount: true,
            },
          }),
          
          // Patients by type
          prisma.patient.groupBy({
            by: ['patientType'],
            where: { hospitalId },
            _count: true,
          }),
          
          // Inventory total value and count
          prisma.$queryRaw`
            SELECT 
              COUNT(*) as total_items,
              SUM(unit_price * stock_quantity) as total_value
            FROM inventory
            WHERE hospital_id = ${hospitalId}
          `,
          
          // Pharmacy low stock (top 3)
          prisma.$queryRaw`
            SELECT item_name, stock_quantity, reorder_level
            FROM inventory
            WHERE hospital_id = ${hospitalId}
            AND category = 'medicine'
            AND stock_quantity <= reorder_level
            ORDER BY stock_quantity ASC
            LIMIT 3
          `,
          
          // Lab low stock (top 3)
          prisma.$queryRaw`
            SELECT item_name, stock_quantity, reorder_level
            FROM inventory
            WHERE hospital_id = ${hospitalId}
            AND category IN ('lab_supplies', 'test_kit')
            AND stock_quantity <= reorder_level
            ORDER BY stock_quantity ASC
            LIMIT 3
          `,
          
          // Nurse low stock (top 3)
          prisma.$queryRaw`
            SELECT item_name, stock_quantity, reorder_level
            FROM inventory
            WHERE hospital_id = ${hospitalId}
            AND category IN ('medical_supply', 'consumable')
            AND stock_quantity <= reorder_level
            ORDER BY stock_quantity ASC
            LIMIT 3
          `,
          
          // Admissions today
          prisma.$queryRaw`
            SELECT COUNT(*) as count
            FROM admissions
            WHERE hospital_id = ${hospitalId}
            AND admission_date >= ${today}
            AND admission_date < ${tomorrow}
          `,
          
          // Discharges today
          prisma.$queryRaw`
            SELECT COUNT(*) as count
            FROM admissions
            WHERE hospital_id = ${hospitalId}
            AND discharge_date >= ${today}
            AND discharge_date < ${tomorrow}
            AND status = 'discharged'
          `,
        ]);

        // Calculate percentages for patient types
        const patientTypeBreakdown = patientsByType.reduce((acc: any, group: { patientType: string; _count: number }) => {
          const percentage = totalPatients > 0 
            ? Math.round((group._count / totalPatients) * 100) 
            : 0;
          acc[group.patientType] = {
            count: group._count,
            percentage,
          };
          return acc;
        }, {} as Record<string, { count: number; percentage: number }>);

        const inventoryData = inventoryStats as any[];
        const admissionsTodayCount = Number((admissionsToday as any)[0]?.count || 0);
        const dischargesTodayCount = Number((dischargesToday as any)[0]?.count || 0);

        // Calculate today's revenue safely
        const revenueTotal = Number(todayRevenue._sum.totalAmount ?? 0);
        const revenuePaid = Number(todayRevenue._sum.paidAmount ?? 0);
        const revenuePending = revenueTotal - revenuePaid;

        return NextResponse.json({
          ...baseStats,
          totalPatients,
          totalStaff,
          todayAppointments,
          totalAppointmentsThisMonth,
          completedAppointmentsThisMonth,
          totalInvoicesThisMonth,
          paidInvoicesThisMonth,
          pendingInvoicesThisMonth,
          revenueThisMonth: invoiceSummary._sum.totalAmount || 0,
          collectedThisMonth: invoiceSummary._sum.paidAmount || 0,
          revenueTodayTotal: revenueTotal,
          revenueTodayPaid: revenuePaid,
          revenueTodayPending: revenuePending,
          patientTypeBreakdown,
          inventoryTotalValue: Number(inventoryData[0]?.total_value || 0),
          inventoryTotalItems: Number(inventoryData[0]?.total_items || 0),
          pharmacyLowStock: pharmacyLowStock || [],
          labLowStock: labLowStock || [],
          nurseLowStock: nurseLowStock || [],
          admissionsToday: admissionsTodayCount,
          dischargesToday: dischargesTodayCount,
        });

      case 'doctor':
        // Doctor Dashboard Stats
        const [
          doctorTotalPatients,
          doctorTodayAppointments,
          doctorPendingAppointments,
          doctorCompletedToday,
          doctorActivePrescriptions,
          doctorPendingLabOrders,
        ] = await Promise.all([
          // Total assigned patients
          prisma.patient.count({
            where: {
              hospitalId,
              primaryDoctorId: userId,
            },
          }),
          
          // Today's appointments
          prisma.appointment.count({
            where: {
              hospitalId,
              doctorId: userId,
              startTime: {
                gte: today,
                lt: tomorrow,
              },
            },
          }),
          
          // Pending appointments
          prisma.appointment.count({
            where: {
              hospitalId,
              doctorId: userId,
              status: 'scheduled',
            },
          }),
          
          // Completed today
          prisma.appointment.count({
            where: {
              hospitalId,
              doctorId: userId,
              status: 'completed',
              startTime: {
                gte: today,
                lt: tomorrow,
              },
            },
          }),
          
          // Active prescriptions
          prisma.prescription.count({
            where: {
              hospitalId,
              doctorId: userId,
              status: 'active',
            },
          }),
          
          // Pending lab orders
          prisma.labOrder.count({
            where: {
              hospitalId,
              orderedBy: userId,
              status: 'pending',
            },
          }),
        ]);

        return NextResponse.json({
          ...baseStats,
          totalPatients: doctorTotalPatients,
          todayAppointments: doctorTodayAppointments,
          pendingAppointments: doctorPendingAppointments,
          completedToday: doctorCompletedToday,
          activePrescriptions: doctorActivePrescriptions,
          pendingLabOrders: doctorPendingLabOrders,
        });

      case 'nurse':
        // Nurse Dashboard Stats
        const [
          nurseTodayAppointments,
          nurseCheckedInToday,
          nursePendingVitals,
          nurseActiveMedications,
        ] = await Promise.all([
          // Today's appointments
          prisma.appointment.count({
            where: {
              hospitalId,
              startTime: {
                gte: today,
                lt: tomorrow,
              },
            },
          }),
          
          // Checked in today
          prisma.appointment.count({
            where: {
              hospitalId,
              status: 'checked_in',
              startTime: {
                gte: today,
                lt: tomorrow,
              },
            },
          }),
          
          // Scheduled (pending check-in)
          prisma.appointment.count({
            where: {
              hospitalId,
              status: 'scheduled',
              startTime: {
                gte: today,
                lt: tomorrow,
              },
            },
          }),
          
          // Active prescriptions (medications to administer)
          prisma.prescription.count({
            where: {
              hospitalId,
              status: 'active',
            },
          }),
        ]);

        return NextResponse.json({
          ...baseStats,
          todayAppointments: nurseTodayAppointments,
          checkedInToday: nurseCheckedInToday,
          pendingCheckIn: nursePendingVitals,
          activeMedications: nurseActiveMedications,
        });

      case 'lab_tech':
        // Lab Tech Dashboard Stats
        const [
          labPendingOrders,
          labCompletedToday,
          labInProgress,
          labAwaitingRelease,
        ] = await Promise.all([
          // Pending lab orders
          prisma.labOrder.count({
            where: {
              hospitalId,
              status: 'pending',
            },
          }),
          
          // Completed today
          prisma.labResult.count({
            where: {
              labOrder: {
                hospitalId,
              },
              finalized: true,
              createdAt: {
                gte: today,
                lt: tomorrow,
              },
            },
          }),
          
          // In progress
          prisma.labOrder.count({
            where: {
              hospitalId,
              status: 'in_progress',
            },
          }),
          
          // Finalized but not released
          prisma.labResult.count({
            where: {
              labOrder: {
                hospitalId,
              },
              finalized: true,
              releasedToPatient: false,
            },
          }),
        ]);

        return NextResponse.json({
          ...baseStats,
          pendingOrders: labPendingOrders,
          completedToday: labCompletedToday,
          inProgress: labInProgress,
          awaitingRelease: labAwaitingRelease,
        });

      case 'pharmacist':
        // Pharmacist Dashboard Stats
        const [
          pharmacistActivePrescriptions,
          pharmacistDispensedToday,
          pharmacistPending,
          pharmacistLowStock,
        ] = await Promise.all([
          // Active prescriptions
          prisma.prescription.count({
            where: {
              hospitalId,
              status: 'active',
            },
          }),
          
          // Dispensed today (completed prescriptions)
          prisma.prescription.count({
            where: {
              hospitalId,
              status: 'completed',
              updatedAt: {
                gte: today,
                lt: tomorrow,
              },
            },
          }),
          
          // Pending prescriptions
          prisma.prescription.count({
            where: {
              hospitalId,
              status: 'active',
            },
          }),
          
          // Low stock items (items where stockQuantity <= reorderLevel)
          prisma.$queryRaw`
            SELECT COUNT(*) as count
            FROM inventory
            WHERE hospital_id = ${hospitalId}
            AND stock_quantity <= reorder_level
          `,
        ]);

        return NextResponse.json({
          ...baseStats,
          activePrescriptions: pharmacistActivePrescriptions,
          dispensedToday: pharmacistDispensedToday,
          pendingPrescriptions: pharmacistPending,
          lowStockItems: Number((pharmacistLowStock as any)[0]?.count || 0),
        });

      case 'patient':
        // Patient Dashboard Stats
        const [
          patientUpcomingAppointments,
          patientActivePrescriptions,
          patientPendingLabResults,
          patientUnpaidInvoices,
        ] = await Promise.all([
          // Upcoming appointments
          prisma.appointment.count({
            where: {
              patient: {
                userId,
              },
              startTime: {
                gte: today,
              },
              status: { in: ['scheduled', 'checked_in'] },
            },
          }),
          
          // Active prescriptions
          prisma.prescription.count({
            where: {
              patient: {
                userId,
              },
              status: 'active',
            },
          }),
          
          // Pending lab results
          prisma.labOrder.count({
            where: {
              patient: {
                userId,
              },
              status: { in: ['pending', 'in_progress'] },
            },
          }),
          
          // Unpaid invoices
          prisma.invoice.count({
            where: {
              patient: {
                userId,
              },
              status: 'pending',
            },
          }),
        ]);

        return NextResponse.json({
          ...baseStats,
          upcomingAppointments: patientUpcomingAppointments,
          activePrescriptions: patientActivePrescriptions,
          pendingLabResults: patientPendingLabResults,
          unpaidInvoices: patientUnpaidInvoices,
        });

      default:
        // Generic staff dashboard
        return NextResponse.json({
          ...baseStats,
          message: 'Dashboard statistics not configured for this role',
        });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
