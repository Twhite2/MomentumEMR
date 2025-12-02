import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

// GET /api/analytics/comprehensive - Get comprehensive hospital analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    // Date range
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : new Date();

    // Parallel queries for all metrics
    const [
      // Basic counts
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
      
      // Top lists
      topHMOClients,
      topDiagnoses,
      topDrugCategories,
      topLabTests,
      
      // Claims
      claimsData,
      
      // Age distribution
      patientAgeData,
      
      // Time tracking
      timeTrackingData,
    ] = await Promise.all([
      // Medical Records Count
      prisma.medicalRecord.count({
        where: {
          hospitalId,
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
        WHERE mr.hospital_id = ${hospitalId}
        AND mr.created_at >= ${startDate}
        AND mr.created_at <= ${endDate}
        GROUP BY p.patient_type
      `,
      
      // Admissions Count
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM admissions
        WHERE hospital_id = ${hospitalId}
        AND admission_date >= ${startDate}
        AND admission_date <= ${endDate}
      `,
      
      // Admissions by Patient Type
      prisma.$queryRaw`
        SELECT 
          p.patient_type,
          COUNT(a.id) as count
        FROM admissions a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.hospital_id = ${hospitalId}
        AND a.admission_date >= ${startDate}
        AND a.admission_date <= ${endDate}
        GROUP BY p.patient_type
      `,
      
      // Invoices Count
      prisma.invoice.count({
        where: {
          hospitalId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Invoices by Status
      prisma.invoice.groupBy({
        by: ['status'],
        where: {
          hospitalId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      
      // Prescriptions Count
      prisma.prescription.count({
        where: {
          hospitalId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Prescriptions by Status
      prisma.prescription.groupBy({
        by: ['status'],
        where: {
          hospitalId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      
      // Investigations (Lab Orders) Count
      prisma.labOrder.count({
        where: {
          hospitalId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Investigations by Status
      prisma.labOrder.groupBy({
        by: ['status'],
        where: {
          hospitalId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      
      // Top 5 HMO Clients by Revenue
      prisma.$queryRaw`
        SELECT 
          h.name as hmo_name,
          COUNT(i.id) as invoice_count,
          SUM(i.total_amount) as total_revenue
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        LEFT JOIN hmo h ON p.insurance_id = h.id
        WHERE i.hospital_id = ${hospitalId}
        AND p.patient_type = 'hmo'
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
            WHERE hospital_id = ${hospitalId}
            AND created_at >= ${startDate}
            AND created_at <= ${endDate}
            AND diagnosis IS NOT NULL
          )), 2) as percentage
        FROM medical_records
        WHERE hospital_id = ${hospitalId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
        AND diagnosis IS NOT NULL
        GROUP BY diagnosis
        ORDER BY count DESC
        LIMIT 5
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
            WHERE p.hospital_id = ${hospitalId}
            AND p.created_at >= ${startDate}
            AND p.created_at <= ${endDate}
          )), 2) as percentage
        FROM prescription_items pi
        JOIN prescriptions p ON pi.prescription_id = p.id
        WHERE p.hospital_id = ${hospitalId}
        AND p.created_at >= ${startDate}
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
            WHERE hospital_id = ${hospitalId}
            AND created_at >= ${startDate}
            AND created_at <= ${endDate}
          )), 2) as percentage
        FROM lab_orders
        WHERE hospital_id = ${hospitalId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
        GROUP BY order_type
        ORDER BY count DESC
        LIMIT 5
      `,
      
      // Claims Data (for HMO)
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_claims,
          SUM(i.total_amount) as total_claimed_amount
        FROM invoices i
        JOIN patients p ON i.patient_id = p.id
        WHERE i.hospital_id = ${hospitalId}
        AND p.patient_type = 'hmo'
        AND i.created_at >= ${startDate}
        AND i.created_at <= ${endDate}
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
        WHERE hospital_id = ${hospitalId}
        GROUP BY age_group
        ORDER BY age_group
      `,
      
      // Average Time Per Section
      prisma.$queryRaw`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (vitals_completed_at - checked_in_at))/60) as front_desk_avg,
          AVG(EXTRACT(EPOCH FROM (doctor_started_at - vitals_completed_at))/60) as nursing_avg,
          AVG(EXTRACT(EPOCH FROM (doctor_completed_at - doctor_started_at))/60) as consultation_avg,
          AVG(EXTRACT(EPOCH FROM (lab_completed_at - lab_started_at))/60) as investigation_avg,
          AVG(EXTRACT(EPOCH FROM (pharmacy_completed_at - pharmacy_started_at))/60) as pharmacy_avg
        FROM appointments
        WHERE hospital_id = ${hospitalId}
        AND checked_in_at IS NOT NULL
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      `,
    ]);

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

    // Helper function to convert BigInt to Number
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

    const responseData = {
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      metrics: {
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
        topDrugCategories: convertBigInt(topDrugCategories || []),
        topLabTests: convertBigInt(topLabTests || []),
        claims: convertBigInt((claimsData as any[])[0] || { total_claims: 0, total_claimed_amount: 0 }),
        patientAgeDistribution: convertBigInt(patientAgeData || []),
        timeTracking: {
          frontDesk: Number((timeTrackingData as any[])[0]?.front_desk_avg || 0),
          nursing: Number((timeTrackingData as any[])[0]?.nursing_avg || 0),
          consultation: Number((timeTrackingData as any[])[0]?.consultation_avg || 0),
          investigation: Number((timeTrackingData as any[])[0]?.investigation_avg || 0),
          pharmacy: Number((timeTrackingData as any[])[0]?.pharmacy_avg || 0),
        },
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Comprehensive analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
