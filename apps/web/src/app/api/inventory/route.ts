import { NextRequest } from 'next/server';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// GET /api/inventory - List inventory items
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'pharmacist', 'doctor', 'lab_tech', 'nurse']);
    const hospitalId = parseInt(session.user.hospitalId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock');
    const expired = searchParams.get('expired');
    const category = searchParams.get('category');
    const drugCategory = searchParams.get('drugCategory');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { itemCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by category if specified
    if (category && category !== '') {
      where.category = category;
    }

    // Filter by drugCategory if specified
    if (drugCategory && drugCategory !== '') {
      where.drugCategory = drugCategory;
    }

    let lowStockFilter = false;
    if (lowStock === 'true') {
      lowStockFilter = true;
    }

    if (expired === 'true') {
      where.expiryDate = { lte: new Date() };
    }
    
    const allItems = await prisma.inventory.findMany({
      where,
      orderBy: { itemName: 'asc' },
    });
    
    // Filter low stock items if needed
    let filteredItems = allItems;
    if (lowStockFilter) {
      filteredItems = allItems.filter(item => item.stockQuantity <= item.reorderLevel);
    }
    
    const total = filteredItems.length;
    
    // Apply pagination after filtering
    const items = filteredItems.slice(skip, skip + limit);

    // Add status flags and transform field names for frontend
    const itemsWithStatus = items.map((item: any) => {
      const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
      const isLowStock = item.stockQuantity <= item.reorderLevel;
      const daysToExpiry = item.expiryDate
        ? Math.ceil(
            (new Date(item.expiryDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        ...item,
        // Transform database field names to match frontend expectations
        drugName: item.itemName,
        genericName: null,
        category: item.category || 'Other', // Use actual category from database
        quantity: item.stockQuantity,
        batchNumber: item.itemCode,
        manufacturer: null,
        isExpired,
        isLowStock,
        daysToExpiry,
        expiringSoon: daysToExpiry !== null && daysToExpiry <= 90 && daysToExpiry > 0,
      };
    });

    return apiResponse({
      items: itemsWithStatus,
      inventory: itemsWithStatus, // For prescription page compatibility
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/inventory - Add new inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'pharmacist', 'nurse', 'lab_tech']);
    const hospitalId = parseInt(session.user.hospitalId);

    const body = await request.json();
    const {
      itemName,
      itemCode,
      category,
      drugCategory,
      dosageForm,
      dosageStrength,
      stockQuantity,
      packagingUnit,
      tabletsPerPackage,
      unitPrice,
      corporatePrice,
      hmoPrice,
      reorderLevel,
      expiryDate,
    } = body;

    // Validation
    if (!itemName || stockQuantity === undefined || !unitPrice) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Build data object
    const data: any = {
      hospitalId,
      itemName,
      category: category || 'Medication',
      stockQuantity: parseInt(stockQuantity),
      packagingUnit: packagingUnit || 'tablet',
      tabletsPerPackage: tabletsPerPackage ? parseInt(tabletsPerPackage) : 1,
      unitPrice: parseFloat(unitPrice),
      reorderLevel: reorderLevel ? parseInt(reorderLevel) : 10,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    };

    console.log('📥 API Received stockQuantity:', stockQuantity);
    console.log('📊 API Parsed stockQuantity:', parseInt(stockQuantity));
    console.log('💾 Data to save:', data);

    // Only include itemCode if provided (to avoid unique constraint issues)
    if (itemCode && itemCode.trim()) {
      data.itemCode = itemCode.trim();
    }

    // Optional fields
    if (drugCategory) data.drugCategory = drugCategory;
    if (dosageForm) data.dosageForm = dosageForm;
    if (dosageStrength) data.dosageStrength = dosageStrength;
    if (corporatePrice) data.corporatePrice = parseFloat(corporatePrice);
    if (hmoPrice) data.hmoPrice = parseFloat(hmoPrice);

    // Create inventory item
    const item = await prisma.inventory.create({
      data,
    });

    console.log('✅ Item created with stockQuantity:', item.stockQuantity);
    console.log('✅ Full item:', item);

    return apiResponse(item, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
