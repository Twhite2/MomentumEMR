import { NextRequest } from 'next/server';
import { prisma, Prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/analytics/allergies - Get allergy statistics and calculations for dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get all patients with allergies
    const patients = await prisma.patient.findMany({
      where: {
        hospitalId,
        allergies: {
          not: Prisma.DbNull,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        allergies: true,
        createdAt: true,
      },
    });

    // Process allergy data
    const allergyMap = new Map<string, number>();
    const patientAllergyCount = new Map<string, number>();
    let totalPatientsWithAllergies = 0;
    const allergyDetails: Array<{
      allergy: string;
      count: number;
      percentage: number;
      patients: Array<{ id: number; name: string }>;
    }> = [];

    patients.forEach((patient) => {
      if (!patient.allergies) return;

      let allergies: string[] = [];
      
      // Parse allergies (can be JSON array or string)
      if (typeof patient.allergies === 'string') {
        try {
          allergies = JSON.parse(patient.allergies);
        } catch {
          allergies = [patient.allergies];
        }
      } else if (Array.isArray(patient.allergies)) {
        allergies = patient.allergies as string[];
      }

      if (allergies.length > 0) {
        totalPatientsWithAllergies++;
        
        allergies.forEach((allergy: string) => {
          const normalizedAllergy = allergy.trim().toLowerCase();
          if (!normalizedAllergy) return;

          // Count allergy occurrences
          allergyMap.set(
            normalizedAllergy,
            (allergyMap.get(normalizedAllergy) || 0) + 1
          );

          // Track patients per allergy
          const key = normalizedAllergy;
          if (!patientAllergyCount.has(key)) {
            patientAllergyCount.set(key, 0);
          }
        });
      }
    });

    // Build allergy details with patient info
    const allergyPatientMap = new Map<string, Array<{ id: number; name: string }>>();
    
    patients.forEach((patient) => {
      if (!patient.allergies) return;

      let allergies: string[] = [];
      if (typeof patient.allergies === 'string') {
        try {
          allergies = JSON.parse(patient.allergies);
        } catch {
          allergies = [patient.allergies];
        }
      } else if (Array.isArray(patient.allergies)) {
        allergies = patient.allergies as string[];
      }

      allergies.forEach((allergy: string) => {
        const normalizedAllergy = allergy.trim().toLowerCase();
        if (!normalizedAllergy) return;

        if (!allergyPatientMap.has(normalizedAllergy)) {
          allergyPatientMap.set(normalizedAllergy, []);
        }
        
        allergyPatientMap.get(normalizedAllergy)!.push({
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
        });
      });
    });

    // Convert to array and calculate percentages
    allergyMap.forEach((count, allergy) => {
      const percentage = totalPatientsWithAllergies > 0 
        ? (count / totalPatientsWithAllergies) * 100 
        : 0;

      allergyDetails.push({
        allergy: allergy.charAt(0).toUpperCase() + allergy.slice(1),
        count,
        percentage: Math.round(percentage * 100) / 100,
        patients: allergyPatientMap.get(allergy) || [],
      });
    });

    // Sort by count descending
    allergyDetails.sort((a, b) => b.count - a.count);

    // Get total patient count for hospital
    const totalPatients = await prisma.patient.count({
      where: { hospitalId },
    });

    // Calculate top allergies (top 10)
    const topAllergies = allergyDetails.slice(0, 10);

    // Common allergy categories
    const categories = {
      drugAllergies: allergyDetails.filter(a =>
        ['penicillin', 'aspirin', 'ibuprofen', 'sulfa', 'codeine', 'morphine'].some(drug =>
          a.allergy.toLowerCase().includes(drug)
        )
      ),
      foodAllergies: allergyDetails.filter(a =>
        ['peanut', 'nut', 'shellfish', 'egg', 'milk', 'wheat', 'soy', 'fish'].some(food =>
          a.allergy.toLowerCase().includes(food)
        )
      ),
      environmentalAllergies: allergyDetails.filter(a =>
        ['pollen', 'dust', 'mold', 'pet', 'latex', 'bee', 'insect'].some(env =>
          a.allergy.toLowerCase().includes(env)
        )
      ),
    };

    return apiResponse({
      summary: {
        totalPatients,
        totalPatientsWithAllergies,
        percentageWithAllergies: totalPatients > 0 
          ? Math.round((totalPatientsWithAllergies / totalPatients) * 10000) / 100 
          : 0,
        uniqueAllergies: allergyDetails.length,
      },
      topAllergies,
      categories: {
        drugAllergies: {
          count: categories.drugAllergies.length,
          allergies: categories.drugAllergies,
        },
        foodAllergies: {
          count: categories.foodAllergies.length,
          allergies: categories.foodAllergies,
        },
        environmentalAllergies: {
          count: categories.environmentalAllergies.length,
          allergies: categories.environmentalAllergies,
        },
      },
      allAllergies: allergyDetails,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
