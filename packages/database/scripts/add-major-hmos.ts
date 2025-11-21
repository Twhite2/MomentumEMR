import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const majorHMOs = [
  {
    name: 'AXA Mansard Health',
    provider: 'AXA Mansard Health Limited',
    submissionMethod: 'email_pdf' as const,
    submissionEmail: 'healthcare@axamansard.com',
    codingStandard: 'icd10' as const,
    requiresAuthorization: true,
    coverageDetails: {
      description: 'AXA Mansard Health is the Health Maintenance Organization (HMO) arm of the AXA Mansard group',
      contactPhone: '0700AXAMANSARD',
      alternatePhones: ['02012773490', '02014608420', '02013301999', '02018889799'],
      internationalEmail: 'internationalhealth@axamansard.com',
      website: 'https://corporate.axamansard.com/subsidiaries/axa-health/'
    }
  },
  {
    name: 'Leadway Health',
    provider: 'Leadway Health Limited',
    submissionMethod: 'email_pdf' as const,
    submissionEmail: 'claims@leadwayhealth.com',
    codingStandard: 'icd10' as const,
    requiresAuthorization: true,
    coverageDetails: {
      description: 'Leadway Health Limited - Nigeria\'s top-tier Health Insurer (HMO)',
      address: '121/123, Funso Williams Avenue, Iponri, Surulere, Lagos',
      contactPhone: '0201-2801-051',
      alternatePhones: ['0708-0627-051'],
      whatsapp: '+234 916 562 9569',
      website: 'https://leadwayhealth.com/'
    }
  },
  {
    name: 'Reliance HMO',
    provider: 'Reliance Health HMO Limited',
    submissionMethod: 'email_pdf' as const,
    submissionEmail: 'hellonigeria@getreliancehealth.com',
    codingStandard: 'icd10' as const,
    requiresAuthorization: true,
    coverageDetails: {
      description: 'Reliance Health - Opening up access to quality, reliable health plans',
      address: '32 Lanre Awolokun Street, Gbagada 100234, Lagos, Nigeria',
      contactPhone: '0700-RELIANCE',
      whatsapp: '2017001580',
      website: 'https://getreliancehealth.com/nigeria/'
    }
  }
];

async function addMajorHMOs() {
  try {
    console.log('🏥 Adding major HMOs to all hospitals...\n');

    // Get all hospitals
    const hospitals = await prisma.hospital.findMany({
      select: { id: true, name: true }
    });

    if (hospitals.length === 0) {
      console.log('❌ No hospitals found in the database');
      return;
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    // Add each HMO to each hospital
    for (const hospital of hospitals) {
      console.log(`\n📍 Processing ${hospital.name}...`);
      
      for (const hmoData of majorHMOs) {
        try {
          // Check if HMO already exists for this hospital
          const existing = await prisma.hmo.findFirst({
            where: {
              hospitalId: hospital.id,
              name: hmoData.name
            }
          });

          if (existing) {
            console.log(`   ⏭️  ${hmoData.name} - Already exists`);
            totalSkipped++;
            continue;
          }

          // Create HMO
          await prisma.hmo.create({
            data: {
              hospitalId: hospital.id,
              ...hmoData
            }
          });

          console.log(`   ✅ ${hmoData.name} - Created`);
          totalCreated++;
        } catch (error: any) {
          console.error(`   ❌ ${hmoData.name} - Error: ${error.message}`);
        }
      }
    }

    console.log(`\n\n🎉 Summary:`);
    console.log(`   Hospitals processed: ${hospitals.length}`);
    console.log(`   HMOs created: ${totalCreated}`);
    console.log(`   HMOs skipped (already exist): ${totalSkipped}`);
    console.log(`\n✨ Major HMOs added successfully!`);
  } catch (error) {
    console.error('❌ Error adding HMOs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMajorHMOs()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
