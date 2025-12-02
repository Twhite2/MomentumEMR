import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/prescriptions/[id]/dispense - Dispense prescription, deduct stock, create invoice
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['pharmacist', 'admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const prescriptionId = parseInt(params.id);
    const pharmacistId = parseInt(session.user.id);

    // Fetch prescription with items
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        hospitalId,
      },
      include: {
        prescriptionItems: {
          include: {
            inventory: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientType: true,
            insuranceId: true,
          },
        },
      },
    });

    if (!prescription) {
      return apiResponse({ error: 'Prescription not found' }, 404);
    }

    // Check if already dispensed
    if (prescription.status === 'completed' || (prescription as any).dispensedAt) {
      return apiResponse(
        {
          error: 'Prescription has already been dispensed',
          dispensedAt: (prescription as any).dispensedAt,
          dispensedBy: (prescription as any).dispensedBy,
        },
        400
      );
    }

    // Check stock availability and prepare deductions (package-based)
    const stockErrors: string[] = [];
    const stockDeductions: Array<{ 
      inventoryId: number; 
      packages: number; 
      tablets: number;
      drugName: string;
    }> = [];

    for (const item of prescription.prescriptionItems) {
      if (item.inventoryId && item.inventory) {
        // Use packagesNeeded (new system) or fallback to totalTablets
        const packagesNeeded = (item as any).packagesNeeded || 
          Math.ceil((item.totalTablets || 1) / (item.inventory.tabletsPerPackage || 1));
        const availableStock = item.inventory.stockQuantity;

        if (availableStock < packagesNeeded) {
          const tabletsAvailable = availableStock * (item.inventory.tabletsPerPackage || 1);
          const tabletsNeeded = item.totalTablets || 1;
          stockErrors.push(
            `${item.drugName}: Need ${packagesNeeded} packages (${tabletsNeeded} tablets) but only ${availableStock} packages (${tabletsAvailable} tablets) available`
          );
        } else {
          stockDeductions.push({
            inventoryId: item.inventoryId,
            packages: packagesNeeded,
            tablets: item.totalTablets || 1,
            drugName: item.drugName,
          });
        }
      }
    }

    // Return error if insufficient stock
    if (stockErrors.length > 0) {
      return apiResponse(
        {
          error: 'Insufficient stock for some items',
          details: stockErrors,
        },
        400
      );
    }

    // Calculate invoice total (using new pricing if available)
    let totalAmount = 0;
    let totalHMOContribution = 0;
    const invoiceItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      hmoContribution?: number;
    }> = [];

    for (const item of prescription.prescriptionItems) {
      const itemData = item as any;
      const quantity = item.totalTablets || 1;
      
      // Use pre-calculated pricing if available (from new system)
      let unitPrice = 0;
      let itemAmount = 0;
      let hmoContribution = 0;

      if (itemData.unitPrice && itemData.patientPays !== undefined) {
        // New system: use pre-calculated values
        unitPrice = parseFloat(itemData.unitPrice.toString());
        itemAmount = parseFloat(itemData.patientPays.toString()); // Patient pays after HMO
        hmoContribution = parseFloat(itemData.hmoContribution?.toString() || '0');
      } else if (item.inventory) {
        // Fallback: calculate from inventory prices
        const inventory = item.inventory as any;
        if (prescription.patient.patientType === 'hmo' && inventory.hmoPrice) {
          unitPrice = parseFloat(inventory.hmoPrice.toString());
        } else if (prescription.patient.patientType === 'corporate' && inventory.corporatePrice) {
          unitPrice = parseFloat(inventory.corporatePrice.toString());
        } else {
          unitPrice = parseFloat(item.inventory.unitPrice?.toString() || '0');
        }
        itemAmount = quantity * unitPrice;
      }

      totalAmount += itemAmount;
      totalHMOContribution += hmoContribution;

      invoiceItems.push({
        description: `${item.drugName}${item.dosage ? ` - ${item.dosage}` : ''}${
          item.frequency ? ` (${item.frequency})` : ''
        }${item.duration ? ` for ${item.duration}` : ''}`,
        quantity,
        unitPrice,
        amount: itemAmount,
        hmoContribution: hmoContribution > 0 ? hmoContribution : undefined,
      });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct stock from inventory (package-based)
      for (const deduction of stockDeductions) {
        await tx.inventory.update({
          where: { id: deduction.inventoryId },
          data: {
            stockQuantity: {
              decrement: deduction.packages, // Deduct packages, not tablets
            },
          },
        });
      }

      // 2. Create invoice
      const invoice = await tx.invoice.create({
        data: {
          hospitalId,
          patientId: prescription.patientId,
          totalAmount,
          paidAmount: 0,
          status: 'pending',
          hmoId: prescription.patient.insuranceId,
          notes: `Auto-generated from Prescription #${prescriptionId}`,
          invoiceItems: {
            create: invoiceItems,
          },
        },
        include: {
          invoiceItems: true,
        },
      });

      // 3. Update prescription
      const updatedPrescription = await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: 'completed',
          dispensedBy: pharmacistId,
          dispensedAt: new Date(),
          invoiceId: invoice.id,
        } as any,
        include: {
          prescriptionItems: true,
          patient: true,
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
          invoice: {
            include: {
              invoiceItems: true,
            },
          },
        } as any,
      });

      return {
        prescription: updatedPrescription,
        invoice,
        stockDeductions,
      };
    });

    return apiResponse({
      message: 'Prescription dispensed successfully',
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
