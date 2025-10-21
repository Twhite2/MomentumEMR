const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to fix released dates...');

  // Find all lab results that are released OR finalized but don't have a releasedAt date
  const resultsWithoutDate = await prisma.labResult.findMany({
    where: {
      OR: [
        {
          releasedToPatient: true,
          releasedAt: null,
        },
        {
          finalized: true,
          releasedToPatient: false,
          releasedAt: null,
        },
      ],
    },
    include: {
      labOrder: true,
    },
  });

  console.log(`Found ${resultsWithoutDate.length} results without proper release dates`);

  // Update each result
  for (const result of resultsWithoutDate) {
    const updateData = {};
    
    if (result.releasedToPatient && !result.releasedAt) {
      // If already released to patient, set releasedAt to updatedAt (when it was finalized)
      updateData.releasedAt = result.updatedAt || result.createdAt || new Date();
      console.log(`Fixed released result ID ${result.id} - setting releasedAt to ${updateData.releasedAt}`);
    }
    
    if (Object.keys(updateData).length > 0) {
      await prisma.labResult.update({
        where: { id: result.id },
        data: updateData,
      });
    }
  }

  console.log('Done! All released dates have been fixed.');
  
  // Show summary
  const recentResults = await prisma.labResult.count({
    where: {
      releasedToPatient: true,
      releasedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });
  
  console.log(`\nSummary: ${recentResults} results released in the last 30 days`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
