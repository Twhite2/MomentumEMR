import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';
import {
  calculateTabletQuantity,
  calculatePricing,
  parseFrequency,
  parseDosage,
  parseDuration,
} from '@momentum/database/src/lib/pharmacy-calculations';

/**
 * POST /api/prescriptions/calculate-cost
 * 
 * Calculate prescription cost based on drug, dosage, frequency, and duration
 * Takes into account patient type (self-pay, corporate, HMO) and inventory pricing
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      inventoryId,
      patientId,
      dosage,       // e.g., "1 tablet" or "2"
      frequency,    // e.g., "TDS" or "3 times daily"
      duration,     // e.g., "7 days" or "2 weeks"
    } = body;

    // Validate required fields
    if (!inventoryId || !patientId || !dosage || !frequency || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch inventory item
    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: parseInt(inventoryId) },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Fetch patient with HMO info
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
      include: {
        hmo: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Parse prescription details
    const dosageCount = parseDosage(dosage);
    const frequencyCount = parseFrequency(frequency);
    const { value: durationValue, unit: durationUnit } = parseDuration(duration);

    // Calculate tablet quantity
    const quantityResult = calculateTabletQuantity({
      dosage: dosageCount,
      frequency: frequencyCount,
      duration: durationValue,
      durationUnit,
      tabletsPerPackage: inventoryItem.tabletsPerPackage || 1,
    });

    // Determine patient type and pricing
    let patientType: 'self' | 'corporate' | 'hmo' = 'self';
    let hmoTariffPrice: number | undefined;

    if (patient.patientType === 'hmo' && patient.hmo) {
      patientType = 'hmo';

      // Try to find HMO tariff for this drug
      const hmoTariff = await prisma.hmoTariff.findFirst({
        where: {
          hmoId: patient.hmo.id,
          OR: [
            { name: { contains: inventoryItem.itemName, mode: 'insensitive' } },
            { code: inventoryItem.itemCode || '' },
          ],
        },
      });

      if (hmoTariff) {
        hmoTariffPrice = parseFloat(hmoTariff.basePrice.toString());
      }
    } else if (patient.patientType === 'corporate') {
      patientType = 'corporate';
    }

    // Calculate pricing
    const pricingResult = calculatePricing({
      totalTablets: quantityResult.totalTablets,
      unitPrice: parseFloat(inventoryItem.unitPrice?.toString() || '0'),
      patientType,
      corporatePrice: inventoryItem.corporatePrice
        ? parseFloat(inventoryItem.corporatePrice.toString())
        : undefined,
      hmoTariffPrice,
    });

    // Check stock availability
    const stockAvailable = 
      inventoryItem.stockQuantity >= quantityResult.packagesNeeded;
    const shortage = Math.max(
      0,
      quantityResult.packagesNeeded - inventoryItem.stockQuantity
    );

    // Return complete calculation
    return NextResponse.json({
      calculation: {
        // Quantity details
        dosageCount,
        frequencyCount,
        durationValue,
        durationUnit,
        totalTablets: quantityResult.totalTablets,
        packagesNeeded: quantityResult.packagesNeeded,
        unitsFromPackages: quantityResult.unitsFromPackages,
        excessTablets: quantityResult.excessTablets,

        // Pricing details
        unitPrice: pricingResult.unitPrice,
        subtotal: pricingResult.subtotal,
        hmoContribution: pricingResult.hmoContribution,
        patientPays: pricingResult.patientPays,

        // Inventory details
        drugName: inventoryItem.itemName,
        dosageStrength: inventoryItem.dosageStrength,
        dosageForm: inventoryItem.dosageForm,
        tabletsPerPackage: inventoryItem.tabletsPerPackage,
        currentStock: inventoryItem.stockQuantity,
        stockAvailable,
        shortage,

        // Patient details
        patientType,
        patientName: `${patient.firstName} ${patient.lastName}`,
        hmoName: patient.hmo?.name,
      },
    });
  } catch (error) {
    console.error('Error calculating prescription cost:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
