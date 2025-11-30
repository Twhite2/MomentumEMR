import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/analytics/clinical-flow - Get clinical flow time tracking analytics
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const department = searchParams.get('department');

    const where: any = {
      hospitalId,
      checkedInAt: { not: null },
    };

    if (startDate && endDate) {
      where.checkedInAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (department) {
      where.department = department;
    }

    const appointments = (await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        checkedInAt: true,
        checkedOutAt: true,
        skipVitals: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        department: true,
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    })) as any[];

    // Calculate time metrics
    const metrics = {
      registrationToVitals: [] as number[],
      vitalsToDoctor: [] as number[],
      doctorConsultation: [] as number[],
      doctorToLab: [] as number[],
      labProcessing: [] as number[],
      labToPharmacy: [] as number[],
      pharmacyProcessing: [] as number[],
      totalTimeInFacility: [] as number[],
    };

    const flowDetails = appointments.map((apt) => {
      const detail: any = {
        appointmentId: apt.id,
        patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
        doctor: apt.doctor.name,
        department: apt.department,
        timestamps: {
          checkedIn: apt.checkedInAt,
          vitalsCompleted: apt.vitalsCompletedAt,
          doctorStarted: apt.doctorStartedAt,
          doctorCompleted: apt.doctorCompletedAt,
          labStarted: apt.labStartedAt,
          labCompleted: apt.labCompletedAt,
          pharmacyStarted: apt.pharmacyStartedAt,
          pharmacyCompleted: apt.pharmacyCompletedAt,
          checkedOut: apt.checkedOutAt,
        },
        durations: {},
      };

      // Calculate durations (in minutes)
      if (apt.checkedInAt) {
        if (apt.vitalsCompletedAt && !apt.skipVitals) {
          const duration = (apt.vitalsCompletedAt.getTime() - apt.checkedInAt.getTime()) / (1000 * 60);
          detail.durations.registrationToVitals = Math.round(duration);
          metrics.registrationToVitals.push(duration);
        }

        if (apt.vitalsCompletedAt && apt.doctorStartedAt) {
          const duration = (apt.doctorStartedAt.getTime() - apt.vitalsCompletedAt.getTime()) / (1000 * 60);
          detail.durations.vitalsToDoctor = Math.round(duration);
          metrics.vitalsToDoctor.push(duration);
        }

        if (apt.doctorStartedAt && apt.doctorCompletedAt) {
          const duration = (apt.doctorCompletedAt.getTime() - apt.doctorStartedAt.getTime()) / (1000 * 60);
          detail.durations.doctorConsultation = Math.round(duration);
          metrics.doctorConsultation.push(duration);
        }

        if (apt.doctorCompletedAt && apt.labStartedAt) {
          const duration = (apt.labStartedAt.getTime() - apt.doctorCompletedAt.getTime()) / (1000 * 60);
          detail.durations.doctorToLab = Math.round(duration);
          metrics.doctorToLab.push(duration);
        }

        if (apt.labStartedAt && apt.labCompletedAt) {
          const duration = (apt.labCompletedAt.getTime() - apt.labStartedAt.getTime()) / (1000 * 60);
          detail.durations.labProcessing = Math.round(duration);
          metrics.labProcessing.push(duration);
        }

        if (apt.labCompletedAt && apt.pharmacyStartedAt) {
          const duration = (apt.pharmacyStartedAt.getTime() - apt.labCompletedAt.getTime()) / (1000 * 60);
          detail.durations.labToPharmacy = Math.round(duration);
          metrics.labToPharmacy.push(duration);
        }

        if (apt.pharmacyStartedAt && apt.pharmacyCompletedAt) {
          const duration = (apt.pharmacyCompletedAt.getTime() - apt.pharmacyStartedAt.getTime()) / (1000 * 60);
          detail.durations.pharmacyProcessing = Math.round(duration);
          metrics.pharmacyProcessing.push(duration);
        }

        if (apt.checkedOutAt) {
          const duration = (apt.checkedOutAt.getTime() - apt.checkedInAt.getTime()) / (1000 * 60);
          detail.durations.totalTimeInFacility = Math.round(duration);
          metrics.totalTimeInFacility.push(duration);
        }
      }

      return detail;
    });

    // Calculate averages
    const calculateAverage = (arr: number[]) =>
      arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

    const calculateMedian = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
        : Math.round(sorted[mid] * 10) / 10;
    };

    const summary = {
      totalAppointments: appointments.length,
      averageTimes: {
        registrationToVitals: calculateAverage(metrics.registrationToVitals),
        vitalsToDoctor: calculateAverage(metrics.vitalsToDoctor),
        doctorConsultation: calculateAverage(metrics.doctorConsultation),
        doctorToLab: calculateAverage(metrics.doctorToLab),
        labProcessing: calculateAverage(metrics.labProcessing),
        labToPharmacy: calculateAverage(metrics.labToPharmacy),
        pharmacyProcessing: calculateAverage(metrics.pharmacyProcessing),
        totalTimeInFacility: calculateAverage(metrics.totalTimeInFacility),
      },
      medianTimes: {
        registrationToVitals: calculateMedian(metrics.registrationToVitals),
        vitalsToDoctor: calculateMedian(metrics.vitalsToDoctor),
        doctorConsultation: calculateMedian(metrics.doctorConsultation),
        doctorToLab: calculateMedian(metrics.doctorToLab),
        labProcessing: calculateMedian(metrics.labProcessing),
        labToPharmacy: calculateMedian(metrics.labToPharmacy),
        pharmacyProcessing: calculateMedian(metrics.pharmacyProcessing),
        totalTimeInFacility: calculateMedian(metrics.totalTimeInFacility),
      },
      stageCompletionRates: {
        vitalsCompleted: appointments.filter(a => a.vitalsCompletedAt).length,
        doctorConsultation: appointments.filter(a => a.doctorCompletedAt).length,
        labProcessed: appointments.filter(a => a.labCompletedAt).length,
        pharmacyDispensed: appointments.filter(a => a.pharmacyCompletedAt).length,
        fullyCompleted: appointments.filter(a => a.checkedOutAt).length,
      },
    };

    return apiResponse({
      summary,
      flowDetails,
      dateRange: {
        start: startDate || 'all',
        end: endDate || 'all',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
