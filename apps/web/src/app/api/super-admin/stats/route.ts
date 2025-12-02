import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/super-admin/stats - Get platform-wide statistics for super admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get current week range
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get platform-wide statistics
    const [
      totalHospitals,
      hospitalsThisMonth,
      activeSubscriptions,
      pendingSubscriptions,
      totalPatients,
      patientsByType,
      totalSubscriptionRevenue,
      recentHospitals,
      totalAppointments,
      totalLabOrders,
      totalInvoices,
      
      // New metrics
      newPatientsThisWeek,
      activeUsersNow,
      totalNotifications,
      unreadNotifications,
      totalClaims,
      medicationsDispensedThisWeek,
      labTestsThisWeek,
      completedRecordsPercentage,
      hmoUsagePercentage,
      appointmentsByDay,
      totalPrescriptions,
    ] = await Promise.all([
      // Total hospitals
      prisma.hospital.count(),

      // Hospitals registered this month
      prisma.hospital.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Active subscriptions (assuming subscription table exists, fallback to hospital count)
      prisma.hospital.count({
        where: {
          active: true,
        },
      }),

      // Pending subscriptions (inactive hospitals)
      prisma.hospital.count({
        where: {
          active: false,
        },
      }),

      // Total patients across all hospitals
      prisma.patient.count(),

      // Patients by type across all hospitals
      prisma.patient.groupBy({
        by: ['patientType'],
        _count: true,
      }),

      // Total revenue from all invoices across platform
      prisma.invoice.aggregate({
        _sum: {
          totalAmount: true,
        },
      }).then(result => result._sum.totalAmount ? Number(result._sum.totalAmount) : 0),

      // Recent hospital registrations
      prisma.hospital.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          active: true,
          createdAt: true,
        },
      }),

      // Total appointments across all hospitals
      prisma.appointment.count(),

      // Total lab orders (investigations)
      prisma.labOrder.count(),

      // Total invoices for average cost calculation
      prisma.invoice.aggregate({
        _avg: {
          totalAmount: true,
        },
        _count: true,
      }),
      
      // New patients registered this week
      prisma.patient.count({
        where: {
          createdAt: {
            gte: startOfWeek,
          },
        },
      }),
      
      // Active users now (users created/updated recently as proxy)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      
      // Total notifications
      prisma.notification.count(),
      
      // Unread notifications
      prisma.notification.count({
        where: {
          readAt: null,
        },
      }),
      
      // Total claims (HMO invoices)
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        WHERE p.patient_type = 'hmo'
      `,
      
      // Medications dispensed this week
      prisma.prescription.count({
        where: {
          status: 'completed',
          updatedAt: {
            gte: startOfWeek,
          },
        },
      }),
      
      // Lab tests ordered this week
      prisma.labOrder.count({
        where: {
          createdAt: {
            gte: startOfWeek,
          },
        },
      }),
      
      // Percentage of complete patient records
      prisma.$queryRaw`
        SELECT 
          COUNT(CASE WHEN diagnosis IS NOT NULL AND treatment_plan IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as percentage
        FROM medical_records
      `,
      
      // HMO usage percentage
      prisma.$queryRaw`
        SELECT 
          COUNT(CASE WHEN patient_type = 'hmo' THEN 1 END) * 100.0 / COUNT(*) as percentage
        FROM patients
      `,
      
      // Appointments by day of week (for chart)
      prisma.$queryRaw`
        SELECT 
          CASE EXTRACT(DOW FROM start_time)
            WHEN 0 THEN 'Sunday'
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
            WHEN 6 THEN 'Saturday'
          END as day_name,
          EXTRACT(DOW FROM start_time) as day_num,
          appointment_type,
          COUNT(*) as count
        FROM appointments
        WHERE start_time >= ${startOfWeek}
        GROUP BY day_name, day_num, appointment_type
        ORDER BY day_num
      `,
      
      // Total prescriptions (for activity scoring)
      prisma.prescription.count(),
    ]);

    // Calculate patient type breakdown
    const patientTypeBreakdown = patientsByType.reduce((acc: any, group) => {
      const percentage = totalPatients > 0 
        ? Math.round((group._count / totalPatients) * 100) 
        : 0;
      acc[group.patientType] = {
        count: group._count,
        percentage,
      };
      return acc;
    }, {});

    // Calculate real age distribution from patient DOB
    const allPatients = await prisma.patient.findMany({
      select: {
        dob: true,
      },
    });
    
    const patientsWithDOB = allPatients.filter(p => p.dob !== null);

    const now = new Date();
    const ageCounts = { '0-18': 0, '19-35': 0, '36-60': 0, '60+': 0 };
    
    patientsWithDOB.forEach(patient => {
      if (patient.dob) {
        const age = Math.floor((now.getTime() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age <= 18) ageCounts['0-18']++;
        else if (age <= 35) ageCounts['19-35']++;
        else if (age <= 60) ageCounts['36-60']++;
        else ageCounts['60+']++;
      }
    });

    const totalWithDOB = patientsWithDOB.length;
    const ageDistribution = {
      '0-18': { percentage: totalWithDOB > 0 ? Math.round((ageCounts['0-18'] / totalWithDOB) * 100) : 0 },
      '19-35': { percentage: totalWithDOB > 0 ? Math.round((ageCounts['19-35'] / totalWithDOB) * 100) : 0 },
      '36-60': { percentage: totalWithDOB > 0 ? Math.round((ageCounts['36-60'] / totalWithDOB) * 100) : 0 },
      '60+': { percentage: totalWithDOB > 0 ? Math.round((ageCounts['60+'] / totalWithDOB) * 100) : 0 },
    };

    // Process appointment data for chart
    const appointmentChartData = (appointmentsByDay as any[]).reduce((acc, row) => {
      const day = row.day_name;
      if (!acc[day]) {
        acc[day] = {};
      }
      acc[day][row.appointment_type] = Number(row.count);
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Calculate read rate
    const notificationReadRate = totalNotifications > 0 
      ? Math.round(((totalNotifications - unreadNotifications) / totalNotifications) * 100)
      : 0;

    // Helper function to convert BigInt values
    const convertBigInt = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return Number(obj);
      if (Array.isArray(obj)) return obj.map(convertBigInt);
      if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
          newObj[key] = convertBigInt(obj[key]);
        }
        return newObj;
      }
      return obj;
    };

    return NextResponse.json({
      totalHospitals,
      hospitalsThisMonth,
      activeSubscriptions,
      pendingSubscriptions,
      totalPatients,
      patientTypeBreakdown,
      ageDistribution,
      totalSubscriptionRevenue,
      
      // New metrics
      newPatientsThisWeek,
      activeUsersNow,
      
      systemMonitoring: {
        activeUsersNow,
        errorLogs: 0, // Real-time error tracking would require error logging system
        failedProcesses: await prisma.invoice.count({ where: { status: 'cancelled' } }),
        avgTimePerUser: activeUsersNow > 0 ? Math.round(totalAppointments / activeUsersNow) : 0,
      },
      
      platformStatistics: {
        totalInvoices: totalInvoices._count,
        totalClaims: Number((totalClaims as any[])[0]?.count || 0),
        totalNotifications,
        notificationReadRate,
      },
      
      weeklyActivity: {
        medicationsDispensed: medicationsDispensedThisWeek,
        labTestsOrdered: labTestsThisWeek,
      },
      
      adoptionMetrics: {
        userActivityLevel: Math.round((activeUsersNow / (await prisma.user.count())) * 100),
        hospitalUsageScore: Math.round((activeSubscriptions / totalHospitals) * 100),
        avgConsultTimePerHospital: await (async () => {
          // Calculate real average consultation time from medical records
          const medicalRecords = await prisma.medicalRecord.findMany({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
            select: {
              createdAt: true,
              updatedAt: true,
            },
          });
          
          if (medicalRecords.length === 0) return 0;
          
          // Calculate average time difference between creation and update (in minutes)
          const totalTime = medicalRecords.reduce((sum, record) => {
            const timeDiff = new Date(record.updatedAt).getTime() - new Date(record.createdAt).getTime();
            const minutes = timeDiff / (1000 * 60);
            // Only count realistic consultation times (5 min to 2 hours)
            return sum + (minutes > 5 && minutes < 120 ? minutes : 20);
          }, 0);
          
          return Math.round(totalTime / medicalRecords.length);
        })(),
        completeRecordsPercentage: Number((completedRecordsPercentage as any[])[0]?.percentage || 0),
        hmoUsagePercentage: Number((hmoUsagePercentage as any[])[0]?.percentage || 0),
      },
      
      appointmentActivity: convertBigInt(appointmentChartData),
      
      analytics: {
        avgCostPerPatient: Number(totalInvoices._avg.totalAmount || 0),
        totalAppointments,
        totalInvestigations: totalLabOrders,
        totalInvoices: totalInvoices._count,
        totalPrescriptions,
      },
      
      recentHospitals: await Promise.all(recentHospitals.map(async (h) => {
        const patientCount = await prisma.patient.count({ where: { hospitalId: h.id } });
        const plan = patientCount > 100 ? 'Premium' : patientCount > 50 ? 'Standard' : 'Basic';
        return {
          id: h.id,
          name: h.name,
          status: h.active ? 'Active' : 'Pending',
          plan,
          date: h.createdAt,
        };
      })),
    });
  } catch (error) {
    console.error('Super admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch super admin statistics' },
      { status: 500 }
    );
  }
}
