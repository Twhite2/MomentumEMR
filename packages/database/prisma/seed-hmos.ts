import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏥 Seeding HMO Providers...');

  // Get all hospitals to add HMOs for each
  const hospitals = await prisma.hospital.findMany();

  if (hospitals.length === 0) {
    console.log('⚠️  No hospitals found. Please create a hospital first.');
    return;
  }

  for (const hospital of hospitals) {
    console.log(`\n📍 Adding HMOs for ${hospital.name}...`);

    // 1. Reliance HMO
    const relianceHmo = await prisma.hmo.upsert({
      where: {
        hospitalId_name: {
          hospitalId: hospital.id,
          name: 'Reliance HMO',
        },
      },
      update: {},
      create: {
        hospitalId: hospital.id,
        name: 'Reliance HMO',
        policyName: 'Reliance Health',
        provider: 'Reliance Health Management Services Limited',
        providerCode: 'NA', // Hospital-specific, to be filled
        submissionMethod: 'email_pdf',
        requiredFormat: 'PDF',
        submissionEmail: 'claims@reliancehmo.com',
        submissionPortalUrl: 'https://reliancehmo.com',
        codingStandard: 'icd10',
        requiresAuthorization: true,
        coverageDetails: {
          description: 'Comprehensive healthcare coverage with tiered drug pricing',
          tiers: ['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'],
          features: [
            'Outpatient services',
            'Inpatient services',
            'Surgical procedures',
            'Maternity care',
            'Dental care',
            'Optical care',
            'Drug refills'
          ]
        },
        copaymentRules: {
          outpatient: {
            percentage: 10,
            minAmount: 500
          },
          inpatient: {
            percentage: 10,
            minAmount: 5000
          },
          drugs: {
            percentage: 10,
            minAmount: 200
          }
        },
        active: true,
      },
    });
    console.log(`  ✅ ${relianceHmo.name}`);

    // 2. Leadway HMO
    const leadwayHmo = await prisma.hmo.upsert({
      where: {
        hospitalId_name: {
          hospitalId: hospital.id,
          name: 'Leadway HMO',
        },
      },
      update: {},
      create: {
        hospitalId: hospital.id,
        name: 'Leadway HMO',
        policyName: 'Leadway Health',
        provider: 'Leadway Health Management Limited',
        providerCode: 'NA', // Hospital-specific, to be filled
        submissionMethod: 'portal_excel',
        requiredFormat: 'Excel',
        submissionEmail: 'claims@leadway.com',
        submissionPortalUrl: 'https://leadway.com/health',
        codingStandard: 'local',
        requiresAuthorization: true,
        coverageDetails: {
          description: 'Comprehensive managed healthcare services',
          features: [
            'General consultation',
            'Specialist consultation',
            'Laboratory tests',
            'Radiology services',
            'Physiotherapy',
            'Dental services',
            'Optical services',
            'Preventive care'
          ],
          network: 'Wide network of healthcare providers across Nigeria'
        },
        copaymentRules: {
          outpatient: {
            percentage: 0,
            minAmount: 0
          },
          procedures: {
            percentage: 10,
            minAmount: 1000
          }
        },
        active: true,
      },
    });
    console.log(`  ✅ ${leadwayHmo.name}`);

    // 3. AXA Mansard HMO
    const axaHmo = await prisma.hmo.upsert({
      where: {
        hospitalId_name: {
          hospitalId: hospital.id,
          name: 'AXA Mansard Health',
        },
      },
      update: {},
      create: {
        hospitalId: hospital.id,
        name: 'AXA Mansard Health',
        policyName: 'AXA Mansard Health Insurance',
        provider: 'AXA Mansard Health Limited',
        providerCode: 'NA', // Hospital-specific, to be filled
        submissionMethod: 'email_pdf',
        requiredFormat: 'PDF',
        submissionEmail: 'health.claims@axamansard.com',
        submissionPortalUrl: 'https://www.axamansard.com/health-insurance',
        codingStandard: 'icd10',
        requiresAuthorization: true,
        coverageDetails: {
          description: 'Premium health insurance with comprehensive benefits',
          plans: ['Bronze', 'Silver', 'Gold', 'Platinum', 'International'],
          features: [
            'Unlimited consultations',
            'Comprehensive diagnostics',
            'Surgical procedures',
            'Cancer care',
            'Maternity care',
            'Dental care',
            'Optical care',
            'Wellness programs',
            'Annual health checks',
            'Pre-existing conditions (after waiting period)'
          ]
        },
        copaymentRules: {
          outpatient: {
            percentage: 0,
            minAmount: 0
          },
          inpatient: {
            percentage: 10,
            minAmount: 10000
          },
          preAuthorization: {
            required: true,
            threshold: 50000
          }
        },
        active: true,
      },
    });
    console.log(`  ✅ ${axaHmo.name}`);
  }

  console.log('\n✨ HMO seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding HMOs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
