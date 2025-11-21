import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

const prisma = new PrismaClient();

// Parse currency string to number
function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[₦,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function importAxaMansardTariffs() {
  console.log('\n📋 Importing AXA Mansard Tariffs...');
  
  const csvPath = path.join(__dirname, '../../../docs/Axa Mansard Tariff.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Get all AXA Mansard HMOs
  const axaHMOs = await prisma.hmo.findMany({
    where: { name: 'AXA Mansard Health' },
  });

  let imported = 0;
  let skipped = 0;

  for (const hmo of axaHMOs) {
    for (const record of records) {
      try {
        const code = `AXA-${record.Code}`;
        const name = record.Name;
        const category = record.Category || 'General';
        const preAuthRequired = record.IsPARequired === 'TRUE';
        const basePrice = parseCurrency(record.Tariff);

        // Check if already exists
        const existing = await prisma.hmoTariff.findUnique({
          where: {
            hmoId_code: { hmoId: hmo.id, code },
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.hmoTariff.create({
          data: {
            hmoId: hmo.id,
            code,
            name,
            category,
            basePrice,
            isPARequired: preAuthRequired,
          },
        });
        imported++;
      } catch (error: any) {
        console.error(`   ❌ Error importing ${record.Code}: ${error.message}`);
      }
    }
  }

  console.log(`   ✅ Imported: ${imported}, Skipped: ${skipped}`);
}

async function importLeadwayTariffs() {
  console.log('\n📋 Importing Leadway Health Tariffs...');
  
  const csvPath = path.join(__dirname, '../../../docs/Leadway Provider Network.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    from_line: 2, // Skip the title row
  });

  // Get all Leadway HMOs
  const leadwayHMOs = await prisma.hmo.findMany({
    where: { name: 'Leadway Health' },
  });

  let imported = 0;
  let skipped = 0;

  for (const hmo of leadwayHMOs) {
    for (const record of records) {
      try {
        const code = `LWY-${record['Proceedure Code']}`;
        const name = record['Proceedure Name'];
        const basePrice = parseCurrency(record['Amount']);

        if (!name || !code) continue;

        // Check if already exists
        const existing = await prisma.hmoTariff.findUnique({
          where: {
            hmoId_code: { hmoId: hmo.id, code },
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.hmoTariff.create({
          data: {
            hmoId: hmo.id,
            code,
            name,
            category: 'Procedure',
            basePrice,
          },
        });
        imported++;
      } catch (error: any) {
        console.error(`   ❌ Error importing ${record['Proceedure Code']}: ${error.message}`);
      }
    }
  }

  console.log(`   ✅ Imported: ${imported}, Skipped: ${skipped}`);
}

async function importRelianceTariffs() {
  console.log('\n📋 Importing Reliance HMO Tariffs...');
  
  const csvPath = path.join(__dirname, '../../../docs/Reliance Tariff.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: '\t', // Tab-delimited file
    relax_quotes: true, // Handle quotes flexibly
    trim: true, // Trim whitespace
  });

  // Get all Reliance HMOs
  const relianceHMOs = await prisma.hmo.findMany({
    where: { name: 'Reliance HMO' },
  });

  let imported = 0;
  let updated = 0;

  for (const hmo of relianceHMOs) {
    for (const record of records) {
      try {
        const code = `REL-${record['S/N']}`;
        const name = record['LINE ITEM'];
        const unit = record['Unit'];
        
        if (!name) continue;

        // Parse tiered pricing
        const tier0Price = parseCurrency(record['Tier 0']);
        const tier1Price = parseCurrency(record['Tier 1']);
        const tier2Price = parseCurrency(record['Tier 2']);
        const tier3Price = parseCurrency(record['Tier 3']);
        const tier4Price = parseCurrency(record['Tier 4']);
        const basePrice = tier0Price || tier1Price || 0;

        // Upsert - create or update
        const tariff = await prisma.hmoTariff.upsert({
          where: {
            hmoId_code: { hmoId: hmo.id, code },
          },
          create: {
            hmoId: hmo.id,
            code,
            name,
            unit,
            category: 'Medication',
            basePrice,
            tier0Price,
            tier1Price,
            tier2Price,
            tier3Price,
            tier4Price,
          },
          update: {
            name,
            unit,
            basePrice,
            tier0Price,
            tier1Price,
            tier2Price,
            tier3Price,
            tier4Price,
          },
        });
        
        if (tariff.createdAt.getTime() === tariff.updatedAt.getTime()) {
          imported++;
        } else {
          updated++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error importing ${record['S/N']}: ${error.message}`);
      }
    }
  }

  console.log(`   ✅ Imported: ${imported}, Updated: ${updated}`);
}

async function main() {
  try {
    console.log('🏥 Starting HMO Tariff Import...\n');
    console.log('This will import tariff data for:');
    console.log('  - AXA Mansard Health');
    console.log('  - Leadway Health');
    console.log('  - Reliance HMO\n');

    await importAxaMansardTariffs();
    await importLeadwayTariffs();
    await importRelianceTariffs();

    console.log('\n✨ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
