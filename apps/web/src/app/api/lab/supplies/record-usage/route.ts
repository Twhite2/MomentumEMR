import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@momentum/database';

/**
 * POST /api/lab/supplies/record-usage
 * Record lab supply usage for a patient/test
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only lab scientists and admins can record lab supply usage
    const allowedRoles = ['lab_scientist', 'admin'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only lab scientists can record supply usage' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { inventoryId, patientId, labOrderId, quantity, testType, notes } = body;

    if (!inventoryId || !patientId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const hospitalId = parseInt(session.user.hospitalId);
    const labTechId = parseInt(session.user.id);

    // Check inventory exists and has enough stock
    const inventoryItem = await prisma.inventory.findFirst({
      where: {
        id: parseInt(inventoryId),
        hospitalId,
      },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: 'Supply not found' },
        { status: 404 }
      );
    }

    if (inventoryItem.stockQuantity < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${inventoryItem.stockQuantity} units available` },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Record usage
      const usage = await tx.labInventoryUsage.create({
        data: {
          hospitalId,
          patientId: parseInt(patientId),
          labOrderId: labOrderId ? parseInt(labOrderId) : null,
          inventoryId: parseInt(inventoryId),
          labTechId,
          quantity: parseInt(quantity),
          testType,
          notes,
        },
        include: {
          inventory: true,
          patient: true,
          labOrder: true,
          labTech: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // 2. Deduct from inventory
      await tx.inventory.update({
        where: { id: parseInt(inventoryId) },
        data: {
          stockQuantity: {
            decrement: parseInt(quantity),
          },
        },
      });

      // 3. Create invoice item
      const totalCost = parseFloat(inventoryItem.unitPrice?.toString() || '0') * quantity;
      
      // Find or create invoice for the patient
      let invoice = await tx.invoice.findFirst({
        where: {
          patientId: parseInt(patientId),
          status: 'pending',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!invoice) {
        invoice = await tx.invoice.create({
          data: {
            hospitalId,
            patientId: parseInt(patientId),
            totalAmount: totalCost,
            paidAmount: 0,
            status: 'pending',
            notes: 'Lab supplies usage',
          },
        });
      } else {
        // Update existing invoice
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            totalAmount: {
              increment: totalCost,
            },
          },
        });
      }

      // Create invoice item
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: `${inventoryItem.itemName}${testType ? ` - ${testType}` : ''}${
            labOrderId ? ` (Order #${labOrderId})` : ''
          }`,
          quantity,
          unitPrice: parseFloat(inventoryItem.unitPrice?.toString() || '0'),
          amount: totalCost,
        },
      });

      return { usage, invoice };
    });

    return NextResponse.json({
      message: 'Usage recorded successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error recording lab supply usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
