/**
 * Drug Interaction Checker
 * 
 * Provides warnings for potential drug interactions based on:
 * - Common drug combinations
 * - Patient allergies
 * - Duplicate therapy
 * - Contraindications
 */

export interface DrugInteraction {
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  type: 'interaction' | 'allergy' | 'duplicate' | 'contraindication';
  drug1: string;
  drug2?: string;
  description: string;
  recommendation: string;
}

// Common drug interactions database (simplified - in production, use comprehensive database)
const KNOWN_INTERACTIONS: Record<string, Array<{
  interactsWith: string[];
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  description: string;
  recommendation: string;
}>> = {
  // Antimalarials
  'Artemether': [
    {
      interactsWith: ['Lumefantrine', 'Halofantrine'],
      severity: 'critical',
      description: 'Risk of QT prolongation and fatal arrhythmias',
      recommendation: 'Do not co-administer. Consider alternative antimalarial.',
    },
  ],

  // Antibiotics
  'Ciprofloxacin': [
    {
      interactsWith: ['Theophylline', 'Warfarin'],
      severity: 'major',
      description: 'Increases blood levels, risk of toxicity',
      recommendation: 'Monitor closely. May need dose adjustment.',
    },
  ],

  // NSAIDs
  'Ibuprofen': [
    {
      interactsWith: ['Aspirin', 'Diclofenac', 'Naproxen'],
      severity: 'moderate',
      description: 'Increased risk of GI bleeding and ulceration',
      recommendation: 'Avoid combination. Use single NSAID only.',
    },
    {
      interactsWith: ['Warfarin', 'Heparin'],
      severity: 'major',
      description: 'Increased bleeding risk',
      recommendation: 'Use with caution. Monitor INR closely.',
    },
  ],

  'Diclofenac': [
    {
      interactsWith: ['Ibuprofen', 'Aspirin', 'Naproxen'],
      severity: 'moderate',
      description: 'Increased risk of GI bleeding and ulceration',
      recommendation: 'Avoid combination. Use single NSAID only.',
    },
  ],

  // Antihypertensives
  'Lisinopril': [
    {
      interactsWith: ['Spironolactone', 'Amiloride'],
      severity: 'major',
      description: 'Risk of hyperkalemia',
      recommendation: 'Monitor potassium levels closely.',
    },
  ],

  // Antidiabetics
  'Metformin': [
    {
      interactsWith: ['Contrast Media'],
      severity: 'critical',
      description: 'Risk of lactic acidosis',
      recommendation: 'Discontinue 48 hours before contrast procedures.',
    },
  ],

  // Anticoagulants
  'Warfarin': [
    {
      interactsWith: ['Aspirin', 'Ibuprofen', 'Diclofenac'],
      severity: 'major',
      description: 'Increased bleeding risk',
      recommendation: 'Use with caution. Monitor INR closely.',
    },
    {
      interactsWith: ['Ciprofloxacin', 'Metronidazole'],
      severity: 'major',
      description: 'Increased warfarin effect',
      recommendation: 'Monitor INR. May need dose reduction.',
    },
  ],
};

// Drug categories that shouldn't be duplicated
const DUPLICATE_THERAPY_CATEGORIES = [
  'Analgesic',
  'NSAIDs',
  'Antibiotic',
  'Antihypertensive',
  'Antidiabetic',
  'Antimalarial',
];

/**
 * Check for drug interactions in a prescription
 */
export function checkDrugInteractions(
  drugs: Array<{
    drugName: string;
    drugCategory?: string | null;
  }>,
  patientAllergies?: string[]
): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];

  // Check for allergy interactions
  if (patientAllergies && patientAllergies.length > 0) {
    drugs.forEach((drug) => {
      patientAllergies.forEach((allergy) => {
        if (
          drug.drugName.toLowerCase().includes(allergy.toLowerCase()) ||
          allergy.toLowerCase().includes(drug.drugName.toLowerCase())
        ) {
          interactions.push({
            severity: 'critical',
            type: 'allergy',
            drug1: drug.drugName,
            description: `Patient is allergic to ${allergy}`,
            recommendation: 'Do not prescribe. Choose alternative medication.',
          });
        }
      });
    });
  }

  // Check for duplicate therapy
  const categoryCount: Record<string, string[]> = {};
  drugs.forEach((drug) => {
    if (drug.drugCategory && DUPLICATE_THERAPY_CATEGORIES.includes(drug.drugCategory)) {
      if (!categoryCount[drug.drugCategory]) {
        categoryCount[drug.drugCategory] = [];
      }
      categoryCount[drug.drugCategory].push(drug.drugName);
    }
  });

  Object.entries(categoryCount).forEach(([category, drugNames]) => {
    if (drugNames.length > 1) {
      interactions.push({
        severity: 'moderate',
        type: 'duplicate',
        drug1: drugNames[0],
        drug2: drugNames[1],
        description: `Multiple ${category}s prescribed: ${drugNames.join(', ')}`,
        recommendation: 'Review necessity of multiple drugs in same category.',
      });
    }
  });

  // Check for known drug-drug interactions
  drugs.forEach((drug1, i) => {
    const drugName1 = extractGenericName(drug1.drugName);
    const knownInteractions = KNOWN_INTERACTIONS[drugName1];

    if (knownInteractions) {
      drugs.forEach((drug2, j) => {
        if (i !== j) {
          const drugName2 = extractGenericName(drug2.drugName);

          knownInteractions.forEach((interaction) => {
            if (interaction.interactsWith.some((name) =>
              drugName2.toLowerCase().includes(name.toLowerCase())
            )) {
              interactions.push({
                severity: interaction.severity,
                type: 'interaction',
                drug1: drug1.drugName,
                drug2: drug2.drugName,
                description: interaction.description,
                recommendation: interaction.recommendation,
              });
            }
          });
        }
      });
    }
  });

  // Sort by severity
  const severityOrder = { critical: 0, major: 1, moderate: 2, minor: 3 };
  interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return interactions;
}

/**
 * Extract generic drug name from full name
 * Example: "Paracetamol 500mg Tablet" → "Paracetamol"
 */
function extractGenericName(fullName: string): string {
  // Remove dosage and form information
  return fullName
    .replace(/\d+\s*(mg|g|ml|mcg|%)/gi, '')
    .replace(/(tablet|capsule|syrup|injection|cream|ointment)/gi, '')
    .trim();
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: DrugInteraction['severity']): {
  bg: string;
  border: string;
  text: string;
} {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' };
    case 'major':
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' };
    case 'moderate':
      return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' };
    case 'minor':
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' };
  }
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity: DrugInteraction['severity']): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'major':
      return '⚠️';
    case 'moderate':
      return '⚡';
    case 'minor':
      return 'ℹ️';
  }
}

/**
 * Format interaction for display
 */
export function formatInteraction(interaction: DrugInteraction): string {
  const icon = getSeverityIcon(interaction.severity);
  const drugs = interaction.drug2
    ? `${interaction.drug1} + ${interaction.drug2}`
    : interaction.drug1;

  return `${icon} ${drugs}: ${interaction.description}`;
}
