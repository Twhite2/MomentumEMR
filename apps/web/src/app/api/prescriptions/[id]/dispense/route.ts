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

    // Check stock availability and prepare deductions
    const stockErrors: string[] = [];
    const stockDeductions: Array<{ inventoryId: number; quantity: number; drugName: string }> = [];

    for (const item of prescription.prescriptionItems) {
      if (item.inventoryId && item.inventory) {
        const totalNeeded = item.totalTablets || 1;
        const availableStock = item.inventory.stockQuantity;

        if (availableStock < totalNeeded) {
          stockErrors.push(
            `${item.drugName}: Need ${totalNeeded} but only ${availableStock} available`
          );
        } else {
          stockDeductions.push({
            inventoryId: item.inventoryId,
            quantity: totalNeeded,
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

    // Calculate invoice total
    let totalAmount = 0;
    const invoiceItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }> = [];

    for (const item of prescription.prescriptionItems) {
      const quantity = item.totalTablets || 1;
      let unitPrice = 0;

      if (item.inventory) {
        // Get price based on patient type
        const inventory = item.inventory as any;
        if (prescription.patient.patientType === 'hmo' && inventory.hmoPrice) {
          unitPrice = parseFloat(inventory.hmoPrice.toString());
        } else if (prescription.patient.patientType === 'corporate' && inventory.corporatePrice) {
          unitPrice = parseFloat(inventory.corporatePrice.toString());
        } else {
          unitPrice = parseFloat(item.inventory.unitPrice?.toString() || '0');
        }
      }

      const amount = quantity * unitPrice;
      totalAmount += amount;

      invoiceItems.push({
        description: `${item.drugName}${item.dosage ? ` - ${item.dosage}` : ''}${
          item.frequency ? ` (${item.frequency})` : ''
        }${item.duration ? ` for ${item.duration}` : ''}`,
        quantity,
        unitPrice,
        amount,
      });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct stock from inventory
      for (const deduction of stockDeductions) {
        await tx.inventory.update({
          where: { id: deduction.inventoryId },
          data: {
            stockQuantity: {
              decrement: deduction.quantity,
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
