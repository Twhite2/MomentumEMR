/**
 * Pharmacy Calculation Utilities
 * 
 * Handles all pharmaceutical calculations including:
 * - Tablet/unit quantities based on prescription
 * - Package calculations
 * - Multi-tier pricing (Self-pay, Corporate, HMO)
 * - Cost breakdowns
 */

export interface PrescriptionCalculationInput {
  dosage: number; // Number of tablets per dose (e.g., 1, 2)
  frequency: number; // Times per day (e.g., 3 for TDS)
  duration: number; // Duration value
  durationUnit: 'days' | 'weeks' | 'months';
  tabletsPerPackage: number; // From inventory
}

export interface PricingInput {
  totalTablets: number;
  unitPrice: number; // Price per tablet
  patientType: 'self' | 'corporate' | 'hmo';
  corporatePrice?: number; // Corporate rate per tablet
  hmoTariffPrice?: number; // Total HMO contribution
}

export interface CalculationResult {
  totalTablets: number;
  packagesNeeded: number;
  unitsFromPackages: number; // Total tablets from packages
  excessTablets: number; // Leftover tablets patient gets
}

export interface PricingResult {
  unitPrice: number; // Price per tablet
  subtotal: number; // Total before HMO
  hmoContribution: number; // Amount HMO pays
  patientPays: number; // Amount patient pays
  pricePerPackage?: number; // For display
}

/**
 * Calculate total tablets needed based on prescription details
 */
export function calculateTabletQuantity(
  input: PrescriptionCalculationInput
): CalculationResult {
  const { dosage, frequency, duration, durationUnit, tabletsPerPackage } = input;

  // Convert duration to days
  let durationInDays = duration;
  if (durationUnit === 'weeks') {
    durationInDays = duration * 7;
  } else if (durationUnit === 'months') {
    durationInDays = duration * 30; // Approximate
  }

  // Calculate total tablets: dosage × frequency × duration
  const totalTablets = dosage * frequency * durationInDays;

  // Calculate packages needed (round up)
  const packagesNeeded = Math.ceil(totalTablets / tabletsPerPackage);

  // Total tablets patient receives (might be more than prescribed)
  const unitsFromPackages = packagesNeeded * tabletsPerPackage;

  // Excess tablets (patient gets full packages)
  const excessTablets = unitsFromPackages - totalTablets;

  return {
    totalTablets,
    packagesNeeded,
    unitsFromPackages,
    excessTablets,
  };
}

/**
 * Calculate pricing based on patient type and HMO coverage
 */
export function calculatePricing(input: PricingInput): PricingResult {
  const { totalTablets, unitPrice, patientType, corporatePrice, hmoTariffPrice } = input;

  let finalUnitPrice = unitPrice;
  let hmoContribution = 0;

  // Determine unit price based on patient type
  if (patientType === 'corporate' && corporatePrice) {
    finalUnitPrice = corporatePrice;
  }

  // Calculate subtotal (before HMO)
  const subtotal = totalTablets * finalUnitPrice;

  // Calculate HMO contribution if applicable
  if (patientType === 'hmo' && hmoTariffPrice) {
    hmoContribution = Math.min(hmoTariffPrice, subtotal); // HMO pays up to tariff amount
  }

  // Calculate what patient pays
  const patientPays = Math.max(0, subtotal - hmoContribution);

  return {
    unitPrice: finalUnitPrice,
    subtotal,
    hmoContribution,
    patientPays,
    pricePerPackage: undefined, // Can be calculated if needed
  };
}

/**
 * Complete prescription calculation including quantity and pricing
 */
export function calculatePrescriptionCost(
  prescriptionInput: PrescriptionCalculationInput,
  pricingInput: Omit<PricingInput, 'totalTablets'>
): {
  quantity: CalculationResult;
  pricing: PricingResult;
} {
  const quantity = calculateTabletQuantity(prescriptionInput);
  const pricing = calculatePricing({
    ...pricingInput,
    totalTablets: quantity.totalTablets,
  });

  return {
    quantity,
    pricing,
  };
}

/**
 * Validate if inventory has enough stock for prescription
 */
export function validateStockAvailability(
  packagesNeeded: number,
  currentStock: number
): {
  available: boolean;
  shortage: number;
} {
  const shortage = Math.max(0, packagesNeeded - currentStock);
  return {
    available: currentStock >= packagesNeeded,
    shortage,
  };
}

/**
 * Calculate total tablets in inventory
 */
export function calculateTotalTabletsInStock(
  packages: number,
  tabletsPerPackage: number
): number {
  return packages * tabletsPerPackage;
}

/**
 * Parse frequency string to number
 * Examples: "TDS" → 3, "BD" → 2, "OD" → 1, "QID" → 4, "3 times daily" → 3
 */
export function parseFrequency(frequency: string): number {
  const freq = frequency.toUpperCase().trim();

  // Medical abbreviations
  const frequencyMap: Record<string, number> = {
    'OD': 1,     // Once daily
    'DAILY': 1,
    'BD': 2,     // Twice daily
    'BID': 2,
    'TDS': 3,    // Three times daily
    'TID': 3,
    'QDS': 4,    // Four times daily
    'QID': 4,
    'STAT': 1,   // Immediately (single dose)
    'PRN': 1,    // As needed
  };

  // Check if it's a known abbreviation
  if (frequencyMap[freq]) {
    return frequencyMap[freq];
  }

  // Try to extract number from string (e.g., "3 times daily" → 3)
  const match = freq.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Default to once daily if can't parse
  return 1;
}

/**
 * Parse dosage string to number
 * Examples: "1 tablet" → 1, "2 caps" → 2, "1" → 1
 */
export function parseDosage(dosage: string): number {
  const match = dosage.trim().match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Parse duration string
 * Examples: "7 days" → { value: 7, unit: 'days' }, "2 weeks" → { value: 2, unit: 'weeks' }
 */
export function parseDuration(duration: string): {
  value: number;
  unit: 'days' | 'weeks' | 'months';
} {
  const durationStr = duration.toLowerCase().trim();

  // Extract number
  const numberMatch = durationStr.match(/(\d+)/);
  const value = numberMatch ? parseInt(numberMatch[1], 10) : 7; // Default 7 days

  // Determine unit
  let unit: 'days' | 'weeks' | 'months' = 'days';
  if (durationStr.includes('week')) {
    unit = 'weeks';
  } else if (durationStr.includes('month')) {
    unit = 'months';
  }

  return { value, unit };
}

/**
 * Format prescription for display
 */
export function formatPrescriptionDisplay(
  drugName: string,
  dosage: number,
  frequency: number,
  duration: number,
  durationUnit: string
): string {
  const freqMap: Record<number, string> = {
    1: 'OD (Once daily)',
    2: 'BD (Twice daily)',
    3: 'TDS (Three times daily)',
    4: 'QDS (Four times daily)',
  };

  const freqText = freqMap[frequency] || `${frequency}× daily`;
  return `${drugName} - ${dosage} tab ${freqText} for ${duration} ${durationUnit}`;
}
