import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/analytics/super-admin - Get comprehensive analytics for super admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Date range
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : new Date();

    // Parallel queries for all analytics
    const [
      // Top metrics
      platformRevenue,
      medicalRecordsCount,
      medicalRecordsByType,
      admissionsCount,
      admissionsByType,
      invoicesCount,
      invoicesByStatus,
      prescriptionsCount,
      prescriptionsByStatus,
      investigationsCount,
      investigationsByStatus,
      
      // Top analyses
      topHMOClients,
      topDiagnoses,
      totalClaims,
      patientTypeDistribution,
      topDrugCategories,
      topLabTests,
      
      // Clinical analytics
      prescriptionRates,
      antibioticsRates,
      admissionRates,
      dischargeRates,
      
      // Age and time tracking
      ageDistribution,
      timeTracking,
    ] = await Promise.all([
      // Platform Revenue
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      
      // Medical Records Count
      prisma.medicalRecord.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Medical Records by Patient Type
      prisma.$queryRaw`
        SELECT 
          p.patient_type,
          COUNT(mr.id) as count
        FROM medical_records mr
        JOIN patients p ON mr.patient_id = p.id
        WHERE mr.created_at >= ${startDate}
        AND mr.created_at <= ${endDate}
        GROUP BY p.patient_type
      `,
      
      // Admissions Count
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM admissions
        WHERE admission_date >= ${startDate}
        AND admission_date <= ${endDate}
      `,
      
      // Admissions by Patient Type
      prisma.$queryRaw`
        SELECT 
          p.patient_type,
          COUNT(a.id) as count
        FROM admissions a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.admission_date >= ${startDate}
        AND a.admission_date <= ${endDate}
        GROUP BY p.patient_type
      `,
      
      // Invoices Count
      prisma.invoice.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Invoices by Status
      prisma.invoice.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      
      // Prescriptions Count
      prisma.prescription.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Prescriptions by Status
      prisma.prescription.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      
      // Investigations Count
      prisma.labOrder.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Investigations by Status
      prisma.labOrder.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      
      // Top 5 HMO Clients
      prisma.$queryRaw`
        SELECT 
          h.name as hmo_name,
          COUNT(i.id) as invoice_count,
          SUM(i.total_amount) as total_revenue,
          COUNT(DISTINCT p.id) as patient_count
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        LEFT JOIN hmo h ON p.insurance_id = h.id
        WHERE p.patient_type = 'hmo'
        AND i.created_at >= ${startDate}
        AND i.created_at <= ${endDate}
        AND h.name IS NOT NULL
        GROUP BY h.name
        ORDER BY total_revenue DESC
        LIMIT 5
      `,
      
      // Top 5 Diagnoses
      prisma.$queryRaw`
        SELECT 
          diagnosis,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) 
            FROM medical_records 
            WHERE created_at >= ${startDate}
            AND created_at <= ${endDate}
            AND diagnosis IS NOT NULL
          )), 2) as percentage
        FROM medical_records
        WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND diagnosis IS NOT NULL
        GROUP BY diagnosis
        ORDER BY count DESC
        LIMIT 5
      `,
      
      // Total Claims by Facility
      prisma.$queryRaw`
        SELECT 
          h.name as hospital_name,
          COUNT(i.id) as claim_count,
          SUM(i.total_amount) as total_amount
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        JOIN hospitals h ON i.hospital_id = h.id
        WHERE p.patient_type = 'hmo'
        AND i.created_at >= ${startDate}
        AND i.created_at <= ${endDate}
        GROUP BY h.name
        ORDER BY total_amount DESC
      `,
      
      // Patient Type Distribution
      prisma.$queryRaw`
        SELECT 
          patient_type,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM patients)), 2) as percentage
        FROM patients
        GROUP BY patient_type
      `,
      
      // Top 5 Drug Categories
      prisma.$queryRaw`
        SELECT 
          drug_category,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) 
            FROM prescription_items pi
            JOIN prescriptions p ON pi.prescription_id = p.id
            WHERE p.created_at >= ${startDate}
            AND p.created_at <= ${endDate}
          )), 2) as percentage
        FROM prescription_items pi
        JOIN prescriptions p ON pi.prescription_id = p.id
        WHERE p.created_at >= ${startDate}
        AND p.created_at <= ${endDate}
        AND pi.drug_category IS NOT NULL
        GROUP BY drug_category
        ORDER BY count DESC
        LIMIT 5
      `,
      
      // Top 5 Lab Test Types
      prisma.$queryRaw`
        SELECT 
          order_type,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) 
            FROM lab_orders 
            WHERE created_at >= ${startDate}
            AND created_at <= ${endDate}
          )), 2) as percentage
        FROM lab_orders
        WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        GROUP BY order_type
        ORDER BY count DESC
        LIMIT 5
      `,
      
      // Prescription Rate Per Hospital
      prisma.$queryRaw`
        SELECT 
          h.name as hospital_name,
          COUNT(p.id) as prescription_count,
          COUNT(DISTINCT p.patient_id) as patient_count,
          ROUND((COUNT(p.id) * 1.0 / NULLIF(COUNT(DISTINCT p.patient_id), 0)), 2) as rate
        FROM prescriptions p
        JOIN hospitals h ON p.hospital_id = h.id
        WHERE p.created_at >= ${startDate}
        AND p.created_at <= ${endDate}
        GROUP BY h.name
        ORDER BY rate DESC
      `,
      
      // Antibiotics Rate Per Hospital
      prisma.$queryRaw`
        SELECT 
          h.name as hospital_name,
          COUNT(CASE WHEN pi.drug_category ILIKE '%antibiotic%' THEN 1 END) as antibiotic_count,
          COUNT(pi.id) as total_prescriptions,
          ROUND((COUNT(CASE WHEN pi.drug_category ILIKE '%antibiotic%' THEN 1 END) * 100.0 / NULLIF(COUNT(pi.id), 0)), 2) as percentage
        FROM prescription_items pi
        JOIN prescriptions p ON pi.prescription_id = p.id
        JOIN hospitals h ON p.hospital_id = h.id
        WHERE p.created_at >= ${startDate}
        AND p.created_at <= ${endDate}
        GROUP BY h.name
        ORDER BY percentage DESC
      `,
      
      // Admission Rates Per Hospital
      prisma.$queryRaw`
        SELECT 
          h.name as hospital_name,
          COUNT(a.id) as admission_count,
          COUNT(DISTINCT a.patient_id) as unique_patients
        FROM admissions a
        JOIN hospitals h ON a.hospital_id = h.id
        WHERE a.admission_date >= ${startDate}
        AND a.admission_date <= ${endDate}
        GROUP BY h.name
        ORDER BY admission_count DESC
      `,
      
      // Discharge Rates Per Hospital
      prisma.$queryRaw`
        SELECT 
          h.name as hospital_name,
          COUNT(CASE WHEN a.discharge_date IS NOT NULL THEN 1 END) as discharge_count,
          COUNT(a.id) as total_admissions,
          ROUND((COUNT(CASE WHEN a.discharge_date IS NOT NULL THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 2) as discharge_rate
        FROM admissions a
        JOIN hospitals h ON a.hospital_id = h.id
        WHERE a.admission_date >= ${startDate}
        AND a.admission_date <= ${endDate}
        GROUP BY h.name
        ORDER BY discharge_rate DESC
      `,
      
      // Patient Age Distribution
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) < 18 THEN '0-17'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 18 AND 30 THEN '18-30'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 31 AND 45 THEN '31-45'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob)) BETWEEN 46 AND 60 THEN '46-60'
            ELSE '60+'
          END as age_group,
          COUNT(*) as count
        FROM patients
        GROUP BY age_group
        ORDER BY age_group
      `,
      
      // Average Time Tracking by User
      prisma.$queryRaw`
        SELECT 
          u.name as user_name,
          u.role,
          h.name as hospital_name,
          AVG(EXTRACT(EPOCH FROM (u.updated_at - u.created_at))/3600) as avg_hours
        FROM users u
        JOIN hospitals h ON u.hospital_id = h.id
        WHERE u.updated_at >= ${startDate}
        GROUP BY u.name, u.role, h.name
        ORDER BY avg_hours DESC
        LIMIT 20
      `,
    ]);

    // Helper function to convert BigInt
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

    // Format results
    const medicalRecordsByTypeObj = (medicalRecordsByType as any[]).reduce((acc, item) => {
      acc[item.patient_type] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);

    const admissionsByTypeObj = (admissionsByType as any[]).reduce((acc, item) => {
      acc[item.patient_type] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);

    const invoicesByStatusObj = invoicesByStatus.reduce((acc, item) => {
      if (item.status) {
        acc[item.status] = item._count;
      }
      return acc;
    }, {} as Record<string, number>);

    const prescriptionsByStatusObj = prescriptionsByStatus.reduce((acc, item) => {
      if (item.status) {
        acc[item.status] = item._count;
      }
      return acc;
    }, {} as Record<string, number>);

    const investigationsByStatusObj = investigationsByStatus.reduce((acc, item) => {
      if (item.status) {
        acc[item.status] = item._count;
      }
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      topMetrics: {
        revenue: Number(platformRevenue._sum.totalAmount || 0),
        medicalRecords: {
          total: medicalRecordsCount,
          byType: medicalRecordsByTypeObj,
        },
        admissions: {
          total: Number((admissionsCount as any[])[0]?.count || 0),
          byType: admissionsByTypeObj,
        },
        invoices: {
          total: invoicesCount,
          byStatus: invoicesByStatusObj,
        },
        prescriptions: {
          total: prescriptionsCount,
          byStatus: prescriptionsByStatusObj,
        },
        investigations: {
          total: investigationsCount,
          byStatus: investigationsByStatusObj,
        },
      },
      analytics: {
        topHMOClients: convertBigInt(topHMOClients || []),
        topDiagnoses: convertBigInt(topDiagnoses || []),
        claimsByFacility: convertBigInt(totalClaims || []),
        patientTypeDistribution: convertBigInt(patientTypeDistribution || []),
        topDrugCategories: convertBigInt(topDrugCategories || []),
        topLabTests: convertBigInt(topLabTests || []),
      },
      clinicalAnalytics: {
        prescriptionRates: convertBigInt(prescriptionRates || []),
        antibioticsRates: convertBigInt(antibioticsRates || []),
        admissionRates: convertBigInt(admissionRates || []),
        dischargeRates: convertBigInt(dischargeRates || []),
      },
      demographics: {
        ageDistribution: convertBigInt(ageDistribution || []),
        timeTracking: convertBigInt(timeTracking || []),
      },
    });
  } catch (error) {
    console.error('Super admin analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
