import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏥 Creating Front Desk/Receptionist User...\n');

  // Get the hospital
  const hospital = await prisma.hospital.findFirst();
  
  if (!hospital) {
    console.error('❌ No hospital found. Please seed the database first.');
    return;
  }

  console.log(`✅ Found hospital: ${hospital.name}`);

  // Hash password
  const hashedPassword = await bcrypt.hash('receptionist123', 10);

  // Create receptionist user
  const receptionist = await prisma.user.create({
    data: {
      email: 'receptionist@citygeneralhospital.com',
      name: 'Sarah Martinez',
      password: hashedPassword,
      role: 'receptionist',
      hospitalId: hospital.id,
      contactInfo: {
        phone: '+234-1-234-5690',
        address: '45 Front Desk Lane, Lagos, Nigeria',
      },
      active: true,
    },
  });

  console.log('\n✅ Front Desk/Receptionist user created successfully!\n');
  console.log('📋 Login Credentials:');
  console.log('━'.repeat(50));
  console.log(`Email:    ${receptionist.email}`);
  console.log(`Password: receptionist123`);
  console.log(`Name:     ${receptionist.name}`);
  console.log(`Role:     ${receptionist.role}`);
  console.log('━'.repeat(50));
  console.log('\n✨ Front Desk Permissions:');
  console.log('  ✅ Patient Registration (Create/Edit)');
  console.log('  ✅ Appointments (Create/Edit)');
  console.log('  ✅ Patient Queue Management');
  console.log('  ✅ Health Insurance Information (Edit)');
  console.log('  ✅ Billing (Create invoices)');
  console.log('  ✅ Order Lab Tests');
  console.log('  ✅ Admission & Discharge (View only)');
  console.log('  ✅ Patient\'s Last Visit (View only)\n');

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
