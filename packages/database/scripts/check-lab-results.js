const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking lab results data...\n');

  // Get all released results
  const releasedResults = await prisma.labResult.findMany({
    where: {
      releasedToPatient: true,
    },
    include: {
      labOrder: {
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      releaser: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`Total released results: ${releasedResults.length}\n`);

  releasedResults.forEach((result) => {
    console.log(`ID: ${result.id}`);
    console.log(`Patient: ${result.labOrder.patient?.firstName} ${result.labOrder.patient?.lastName}`);
    console.log(`Test Type: ${result.labOrder.orderType}`);
    console.log(`Released To Patient: ${result.releasedToPatient}`);
    console.log(`Released At: ${result.releasedAt ? result.releasedAt.toISOString() : 'NULL'}`);
    console.log(`Released By: ${result.releaser?.name || 'N/A'}`);
    console.log(`Created At: ${result.createdAt?.toISOString() || 'N/A'}`);
    console.log(`Updated At: ${result.updatedAt?.toISOString() || 'N/A'}`);
    console.log('---');
  });

  // Calculate recent results (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  console.log(`\n30 days ago: ${thirtyDaysAgo.toISOString()}`);
  console.log(`Today: ${new Date().toISOString()}\n`);

  const recentResults = releasedResults.filter(
    (result) =>
      result.releasedAt &&
      new Date(result.releasedAt) > thirtyDaysAgo
  );

  console.log(`Recent results (last 30 days): ${recentResults.length}`);
  
  if (recentResults.length > 0) {
    console.log('\nRecent results details:');
    recentResults.forEach((result) => {
      console.log(`- ID ${result.id}: Released at ${result.releasedAt.toISOString()}`);
    });
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
