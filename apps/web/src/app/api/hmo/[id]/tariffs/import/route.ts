import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';

// POST /api/hmo/[id]/tariffs/import - Import HMO tariff data
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireRole(['super_admin', 'admin']);
    const hospitalId = parseInt(session.user.hospitalId);
    const hmoId = parseInt(params.id);

    // Verify HMO belongs to hospital
    const hmo = await prisma.hmo.findFirst({
      where: { id: hmoId, hospitalId },
    });

    if (!hmo) {
      return apiResponse({ error: 'HMO not found' }, 404);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const hmoType = formData.get('hmoType') as string; // 'reliance', 'leadway', 'axa'

    if (!file || !hmoType) {
      return apiResponse({ error: 'File and HMO type are required' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let importResults = {
      success: 0,
      failed: 0,
      updated: 0,
      errors: [] as any[],
    };

    // Process based on HMO type
    if (hmoType === 'reliance') {
      // Reliance: Drug tariff with tiered pricing
      for (const row of data) {
        const rowData = row as any;
        try {
          const code = `REL-${rowData['S/N']}`.trim();
          const name = rowData['LINE ITEM']?.toString().trim();
          const unit = rowData['Unit']?.toString().trim();
          
          if (!name) continue;

          // Parse prices (remove commas and currency symbols)
          const parsePrice = (val: any) => {
            if (!val) return null;
            const str = val.toString().replace(/[₦,\s]/g, '');
            const num = parseFloat(str);
            return isNaN(num) ? null : num;
          };

          const tariff = await (prisma as any).hmoTariff.upsert({
            where: {
              hmoId_code: { hmoId, code },
            },
            create: {
              hmoId,
              code,
              name,
              category: 'Medication',
              unit,
              basePrice: parsePrice(rowData['Tier 0']) || 0,
              tier0Price: parsePrice(rowData['Tier 0']),
              tier1Price: parsePrice(rowData['Tier 1']),
              tier2Price: parsePrice(rowData['Tier 2']),
              tier3Price: parsePrice(rowData['Tier 3']),
              tier4Price: parsePrice(rowData['Tier 4']),
            },
            update: {
              name,
              unit,
              basePrice: parsePrice(rowData['Tier 0']) || 0,
              tier0Price: parsePrice(rowData['Tier 0']),
              tier1Price: parsePrice(rowData['Tier 1']),
              tier2Price: parsePrice(rowData['Tier 2']),
              tier3Price: parsePrice(rowData['Tier 3']),
              tier4Price: parsePrice(rowData['Tier 4']),
            },
          });

          if (tariff) importResults.success++;
        } catch (error: any) {
          importResults.failed++;
          importResults.errors.push({
            row: rowData['S/N'],
            error: error.message,
          });
        }
      }
    } else if (hmoType === 'leadway') {
      // Leadway: Procedure codes with single pricing
      for (const row of data) {
        const rowData = row as any;
        try {
          const code = rowData['Proceedure Code']?.toString().trim();
          const name = rowData['Proceedure Name']?.toString().trim();
          const amount = rowData['Amount']?.toString().trim();

          if (!code || !name) continue;

          // Parse price
          const parsePrice = (val: any) => {
            if (!val) return 0;
            const str = val.toString().replace(/[₦,\s]/g, '');
            const num = parseFloat(str);
            return isNaN(num) ? 0 : num;
          };

          const tariff = await (prisma as any).hmoTariff.upsert({
            where: {
              hmoId_code: { hmoId, code },
            },
            create: {
              hmoId,
              code,
              name,
              category: 'Procedure',
              basePrice: parsePrice(amount),
            },
            update: {
              name,
              basePrice: parsePrice(amount),
            },
          });

          if (tariff) importResults.success++;
        } catch (error: any) {
          importResults.failed++;
          importResults.errors.push({
            row: rowData['Proceedure Code'],
            error: error.message,
          });
        }
      }
    } else if (hmoType === 'axa') {
      // AXA: Service packages with categories and PA requirements
      for (const row of data) {
        const rowData = row as any;
        try {
          const code = rowData['Code']?.toString().trim();
          const name = rowData['Name']?.toString().trim();
          const category = rowData['Category']?.toString().trim();
          const isPARequired = rowData['IsPARequired']?.toString().toUpperCase() === 'TRUE';
          const tariff = rowData['Tariff']?.toString().trim();
          const effectiveDate = rowData['EffectiveDate']?.toString().trim();

          if (!code || !name) continue;

          // Parse price
          const parsePrice = (val: any) => {
            if (!val) return 0;
            const str = val.toString().replace(/[₦,\s]/g, '');
            const num = parseFloat(str);
            return isNaN(num) ? 0 : num;
          };

          const tariffData = await prisma.hmoTariff.upsert({
            where: {
              hmoId_code: { hmoId, code },
            },
            create: {
              hmoId,
              code,
              name,
              category,
              basePrice: parsePrice(tariff),
              isPARequired,
              effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
            },
            update: {
              name,
              category,
              basePrice: parsePrice(tariff),
              isPARequired,
              effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
            },
          });

          if (tariffData) importResults.success++;
        } catch (error: any) {
          importResults.failed++;
          importResults.errors.push({
            row: rowData['Code'],
            error: error.message,
          });
        }
      }
    } else {
      return apiResponse({ error: 'Invalid HMO type' }, 400);
    }

    return apiResponse({
      success: true,
      message: `Imported ${importResults.success} tariffs successfully`,
      ...importResults,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
