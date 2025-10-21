const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking lab orders data...\n');

  // Get all lab orders
  const allOrders = await prisma.labOrder.findMany({
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      doctor: {
        select: {
          name: true,
        },
      },
      labResults: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Total lab orders: ${allOrders.length}\n`);

  // Count by status
  const byStatus = {
    pending: 0,
    in_progress: 0,
    completed: 0,
  };

  allOrders.forEach((order) => {
    if (order.status in byStatus) {
      byStatus[order.status]++;
    }
    
    console.log(`ID: ${order.id}`);
    console.log(`Patient: ${order.patient?.firstName} ${order.patient?.lastName}`);
    console.log(`Doctor: ${order.doctor?.name}`);
    console.log(`Test Type: ${order.orderType}`);
    console.log(`Status: ${order.status}`);
    console.log(`Created At: ${order.createdAt.toISOString()}`);
    console.log(`Updated At: ${order.updatedAt.toISOString()}`);
    console.log(`Lab Results: ${order.labResults?.length || 0}`);
    
    if (order.labResults && order.labResults.length > 0) {
      order.labResults.forEach((result) => {
        console.log(`  - Result ID ${result.id}: finalized=${result.finalized}, released=${result.releasedToPatient}`);
      });
    }
    console.log('---');
  });

  console.log('\nSummary by Status:');
  console.log(`Pending: ${byStatus.pending}`);
  console.log(`In Progress: ${byStatus.in_progress}`);
  console.log(`Completed: ${byStatus.completed}`);

  // Check completed today
  const today = new Date();
  const completedToday = allOrders.filter((order) => {
    if (order.status !== 'completed') return false;
    const orderDate = new Date(order.updatedAt);
    return orderDate.toDateString() === today.toDateString();
  });
  
  console.log(`Completed Today: ${completedToday.length}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
