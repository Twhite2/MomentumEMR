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
    const validateOnly = formData.get('validateOnly') === 'true'; // Validation mode

    if (!file || !hmoType) {
      return apiResponse({ error: 'File and HMO type are required' }, 400);
    }

    // Validate HMO type first
    if (!['reliance', 'leadway', 'axa'].includes(hmoType)) {
      return apiResponse({ error: 'Invalid HMO type. Must be: reliance, leadway, or axa' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      // Don't use first row as header if it looks like a title
      raw: false,
    });
    
    let importResults = {
      imported: 0,
      failed: 0,
      errors: [] as any[],
      sheetsProcessed: [] as string[],
    };

    let validationResults = {
      totalRows: 0,
      validRows: 0,
      issues: [] as any[],
      warnings: [] as any[],
      sheetsValidated: [] as string[],
    };

    // Process ALL sheets in the workbook
    console.log(`📊 Found ${workbook.SheetNames.length} sheet(s) in workbook:`, workbook.SheetNames);
    
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n📄 Processing sheet: "${sheetName}"...`);
      const worksheet = workbook.Sheets[sheetName];
      let data = XLSX.utils.sheet_to_json(worksheet);
      
      if (data.length === 0) {
        console.log(`⚠️ Sheet "${sheetName}" is empty, skipping...`);
        continue;
      }
      
      // Debug: Log column names from first row
      if (data.length > 0) {
        const firstRow = data[0] as any;
        const columnNames = Object.keys(firstRow);
        console.log(`📋 Column names detected:`, columnNames);
        
        // DETECT NO HEADERS: If columns have __EMPTY or are data values (numbers, currency)
        const hasNoHeaders = columnNames.some(col => col.includes('__EMPTY')) || 
                           columnNames.some(col => /^\d+$/.test(col) || col.startsWith('₦'));
        
        if (hasNoHeaders) {
          console.log(`⚠️ No header row detected! Reading as raw data...`);
          
          // Read without headers - use column indices
          data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
          
          // Filter out title rows (rows with only 1-2 non-empty cells or merged text)
          data = data.filter((row: any) => {
            const nonEmptyCells = row.filter((cell: any) => cell !== null && cell !== undefined && cell !== '');
            // Keep rows with 3+ cells (data rows) or skip title/header rows
            return nonEmptyCells.length >= 3;
          });
          
          // Map array format to object format with proper column names for Leadway
          if (hmoType === 'leadway') {
            data = data.map((row: any) => ({
              'Procedure Code': row[0]?.toString() || '',
              'Procedure Name': row[1]?.toString() || '',
              'Amount': row[2]?.toString() || '',
            }));
          } else if (hmoType === 'axa') {
            data = data.map((row: any) => ({
              'Code': row[0]?.toString() || '',
              'Name': row[1]?.toString() || '',
              'Category': row[2]?.toString() || '',
              'Tariff': row[3]?.toString() || '',
            }));
          } else if (hmoType === 'reliance') {
            data = data.map((row: any) => ({
              'S/N': row[0]?.toString() || '',
              'LINE ITEM': row[1]?.toString() || '',
              'Unit': row[2]?.toString() || '',
              'Tier 0': row[3]?.toString() || '',
              'Tier 1': row[4]?.toString() || '',
              'Tier 2': row[5]?.toString() || '',
              'Tier 3': row[6]?.toString() || '',
              'Tier 4': row[7]?.toString() || '',
            }));
          }
          
          console.log(`✓ Parsed ${data.length} rows with assigned column names`);
          console.log(`✓ Sample first row:`, data[0]);
        }
      }
      
      importResults.sheetsProcessed.push(sheetName);
      validationResults.sheetsValidated.push(sheetName);
      validationResults.totalRows += data.length;
      console.log(`✓ Sheet "${sheetName}" has ${data.length} data rows`);

      // VALIDATION MODE: Check data quality without importing
      if (validateOnly) {
        let rowNumber = 2; // Excel row (starts at 2 after header)
        for (const row of data) {
          const rowData = row as any;
          
          // Validate based on HMO type
          if (hmoType === 'axa') {
            const code = rowData['Code']?.toString().trim();
            const name = rowData['Name']?.toString().trim();
            const tariff = rowData['Tariff']?.toString().trim();
            const effectiveDate = rowData['EffectiveDate']?.toString().trim();
            
            // Check required fields
            if (!code) {
              validationResults.issues.push({
                sheet: sheetName,
                row: rowNumber,
                field: 'Code',
                issue: 'Missing required field',
                severity: 'error',
              });
            }
            if (!name) {
              validationResults.issues.push({
                sheet: sheetName,
                row: rowNumber,
                field: 'Name',
                issue: 'Missing required field',
                severity: 'error',
              });
            }
            
            // Check date validity
            if (effectiveDate) {
              try {
                const date = new Date(effectiveDate);
                if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
                  validationResults.warnings.push({
                    sheet: sheetName,
                    row: rowNumber,
                    field: 'EffectiveDate',
                    value: effectiveDate,
                    issue: `Invalid date (will be set to null if imported)`,
                    severity: 'warning',
                  });
                }
              } catch (error) {
                validationResults.warnings.push({
                  sheet: sheetName,
                  row: rowNumber,
                  field: 'EffectiveDate',
                  value: effectiveDate,
                  issue: `Cannot parse date (will be set to null if imported)`,
                  severity: 'warning',
                });
              }
            }
            
            // Check price validity
            if (tariff) {
              const str = tariff.toString().replace(/[₦,\s]/g, '');
              const num = parseFloat(str);
              if (isNaN(num)) {
                validationResults.warnings.push({
                  sheet: sheetName,
                  row: rowNumber,
                  field: 'Tariff',
                  value: tariff,
                  issue: `Invalid price format (will be set to 0 if imported)`,
                  severity: 'warning',
                });
              }
            }
            
            // Row is valid if it has code and name
            if (code && name) {
              validationResults.validRows++;
            }
          } else if (hmoType === 'leadway') {
            // Support both spellings: "Procedure" (correct) and "Proceedure" (common misspelling)
            const code = (rowData['Procedure Code'] || rowData['Proceedure Code'])?.toString().trim();
            const name = (rowData['Procedure Name'] || rowData['Proceedure Name'])?.toString().trim();
            const amount = rowData['Amount']?.toString().trim();
            
            // Check required fields
            if (!code) {
              validationResults.issues.push({
                sheet: sheetName,
                row: rowNumber,
                field: 'Procedure Code',
                issue: 'Missing required field',
                severity: 'error',
              });
            }
            if (!name) {
              validationResults.issues.push({
                sheet: sheetName,
                row: rowNumber,
                field: 'Procedure Name',
                issue: 'Missing required field',
                severity: 'error',
              });
            }
            
            // Check price validity
            if (amount) {
              const str = amount.toString().replace(/[₦,\s]/g, '');
              const num = parseFloat(str);
              if (isNaN(num)) {
                validationResults.warnings.push({
                  sheet: sheetName,
                  row: rowNumber,
                  field: 'Amount',
                  value: amount,
                  issue: `Invalid price format (will be set to 0 if imported)`,
                  severity: 'warning',
                });
              }
            }
            
            // Row is valid if it has code and name
            if (code && name) {
              validationResults.validRows++;
            }
          } else if (hmoType === 'reliance') {
            const serialNum = rowData['S/N']?.toString().trim();
            const name = rowData['LINE ITEM']?.toString().trim();
            
            // Check required fields
            if (!serialNum) {
              validationResults.issues.push({
                sheet: sheetName,
                row: rowNumber,
                field: 'S/N',
                issue: 'Missing required field',
                severity: 'error',
              });
            }
            if (!name) {
              validationResults.issues.push({
                sheet: sheetName,
                row: rowNumber,
                field: 'LINE ITEM',
                issue: 'Missing required field',
                severity: 'error',
              });
            }
            
            // Row is valid if it has both
            if (serialNum && name) {
              validationResults.validRows++;
            }
          }
          
          rowNumber++;
        }
        continue; // Skip actual import in validation mode
      }

      // IMPORT MODE: Process based on HMO type
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

          if (tariff) importResults.imported++;
        } catch (error: any) {
          importResults.failed++;
          importResults.errors.push({
            row: rowData['S/N'],
            error: error.message,
            sheet: sheetName,
          });
        }
      }
      } else if (hmoType === 'leadway') {
      // Leadway: Procedure codes with single pricing
      console.log(`\n🔍 Processing Leadway data for sheet: ${sheetName}`);
      let processedCount = 0;
      let skippedCount = 0;
      
      for (const row of data) {
        const rowData = row as any;
        try {
          // Support both spellings: "Procedure" (correct) and "Proceedure" (common misspelling)
          const code = (rowData['Procedure Code'] || rowData['Proceedure Code'])?.toString().trim();
          const name = (rowData['Procedure Name'] || rowData['Proceedure Name'])?.toString().trim();
          const amount = rowData['Amount']?.toString().trim();
          
          // Debug first row
          if (processedCount === 0) {
            console.log(`   First row data:`, { code, name, amount });
            console.log(`   Available keys:`, Object.keys(rowData).slice(0, 5));
          }

          if (!code || !name) {
            skippedCount++;
            if (skippedCount <= 3) {
              console.log(`   ⚠️ Skipping row (no code/name):`, { 
                code: code || 'MISSING', 
                name: name || 'MISSING',
                rawKeys: Object.keys(rowData).slice(0, 3)
              });
            }
            continue;
          }
          
          processedCount++;

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

          if (tariff) importResults.imported++;
        } catch (error: any) {
          importResults.failed++;
          importResults.errors.push({
            row: rowData['Procedure Code'] || rowData['Proceedure Code'] || 'Unknown',
            error: error.message,
            sheet: sheetName,
          });
        }
      }
      
      console.log(`✅ Leadway sheet "${sheetName}" complete:`);
      console.log(`   Processed: ${processedCount}, Skipped: ${skippedCount}, Total rows: ${data.length}`);
      
      } else if (hmoType === 'axa') {
      // AXA: Service packages with categories and PA requirements
      // Use sheet name as default category if not provided in row
      const defaultCategory = sheetName
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .trim(); // "BundledHealthService" → "Bundled Health Service"
      
      for (const row of data) {
        const rowData = row as any;
        try {
          const code = rowData['Code']?.toString().trim();
          const name = rowData['Name']?.toString().trim();
          const category = rowData['Category']?.toString().trim() || defaultCategory; // Use sheet name if no category
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

          // Parse date safely (handle Excel date corruption)
          const parseDate = (val: any) => {
            if (!val) return null;
            try {
              const date = new Date(val);
              // Check if date is valid and within reasonable range (1900-2100)
              if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
                console.warn(`Invalid date value skipped: ${val}`);
                return null;
              }
              return date;
            } catch (error) {
              console.warn(`Failed to parse date: ${val}`, error);
              return null;
            }
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
              effectiveDate: parseDate(effectiveDate),
            },
            update: {
              name,
              category,
              basePrice: parsePrice(tariff),
              isPARequired,
              effectiveDate: parseDate(effectiveDate),
            },
          });

          if (tariffData) importResults.imported++;
        } catch (error: any) {
          importResults.failed++;
          importResults.errors.push({
            row: rowData['Code'],
            error: error.message,
            sheet: sheetName,
          });
        }
      }
      } // End of AXA processing
    
    } // End of sheet processing loop
    
    // Return validation results if in validation mode
    if (validateOnly) {
      const hasErrors = validationResults.issues.length > 0;
      const hasWarnings = validationResults.warnings.length > 0;
      
      console.log(`\n✅ Validation complete!`);
      console.log(`   Total Rows: ${validationResults.totalRows}`);
      console.log(`   Valid Rows: ${validationResults.validRows}`);
      console.log(`   Errors: ${validationResults.issues.length}`);
      console.log(`   Warnings: ${validationResults.warnings.length}`);
      
      return apiResponse({
        mode: 'validation',
        isValid: !hasErrors,
        canImport: !hasErrors, // Can proceed even with warnings
        summary: {
          totalRows: validationResults.totalRows,
          validRows: validationResults.validRows,
          errorCount: validationResults.issues.length,
          warningCount: validationResults.warnings.length,
          sheetsValidated: validationResults.sheetsValidated,
        },
        issues: validationResults.issues,
        warnings: validationResults.warnings,
        message: hasErrors 
          ? `Validation failed: ${validationResults.issues.length} error(s) found. Fix issues in Excel file before importing.`
          : hasWarnings
          ? `Validation passed with ${validationResults.warnings.length} warning(s). Data can be imported but some values will be adjusted.`
          : `Validation passed! All ${validationResults.validRows} rows are ready to import.`,
      });
    }
    
    console.log(`\n✅ Import complete! Processed ${importResults.sheetsProcessed.length} sheet(s)`);

    return apiResponse({
      mode: 'import',
      success: true,
      message: `Imported ${importResults.imported} tariffs from ${importResults.sheetsProcessed.length} sheet(s)`,
      ...importResults,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
