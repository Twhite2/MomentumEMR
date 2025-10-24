import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: lab_tech -> nurse');
  
  try {
    // Count users with lab_tech role
    const labTechCount = await prisma.user.count({
      where: {
        role: 'lab_tech',
      },
    });
    
    console.log(`Found ${labTechCount} users with lab_tech role`);
    
    if (labTechCount === 0) {
      console.log('No users to migrate');
      return;
    }
    
    // Update all lab_tech users to nurse
    const result = await prisma.user.updateMany({
      where: {
        role: 'lab_tech',
      },
      data: {
        role: 'nurse',
      },
    });
    
    console.log(`✅ Successfully migrated ${result.count} users from lab_tech to nurse`);
    
    // Verify the migration
    const remainingLabTech = await prisma.user.count({
      where: {
        role: 'lab_tech',
      },
    });
    
    if (remainingLabTech === 0) {
      console.log('✅ Migration verified: No lab_tech users remaining');
    } else {
      console.warn(`⚠️ Warning: ${remainingLabTech} lab_tech users still exist`);
    }
    
    // Count new nurse users
    const nurseCount = await prisma.user.count({
      where: {
        role: 'nurse',
      },
    });
    
    console.log(`Total nurse users: ${nurseCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
