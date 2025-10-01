import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create hospital
  const hospital = await prisma.hospital.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'City General Hospital',
      address: '123 Medical Center Drive, Health City, HC 12345',
      contactEmail: 'info@citygeneralhospital.com',
      phoneNumber: '+1-555-123-4567',
      subscriptionPlan: 'Premium',
      active: true,
    },
  });

  console.log('✅ Hospital created:', hospital.name);

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@citygeneralhospital.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@citygeneralhospital.com',
      hashedPassword,
      role: 'admin',
      hospitalId: hospital.id,
      active: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create doctor user
  const doctor = await prisma.user.upsert({
    where: { email: 'sarah.johnson@citygeneralhospital.com' },
    update: {},
    create: {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@citygeneralhospital.com',
      hashedPassword,
      role: 'doctor',
      hospitalId: hospital.id,
      active: true,
    },
  });

  console.log('✅ Doctor user created:', doctor.email);

  // Create nurse user
  const nurse = await prisma.user.upsert({
    where: { email: 'nurse@citygeneralhospital.com' },
    update: {},
    create: {
      name: 'Nurse Mary',
      email: 'nurse@citygeneralhospital.com',
      hashedPassword,
      role: 'nurse',
      hospitalId: hospital.id,
      active: true,
    },
  });

  console.log('✅ Nurse user created:', nurse.email);

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📝 Demo Credentials:');
  console.log('   Admin: admin@citygeneralhospital.com');
  console.log('   Doctor: sarah.johnson@citygeneralhospital.com');
  console.log('   Nurse: nurse@citygeneralhospital.com');
  console.log('   Password: password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
