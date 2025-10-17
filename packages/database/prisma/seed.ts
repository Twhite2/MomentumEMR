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

  // Create super admin user (platform-level admin)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@momentum.com' },
    update: {},
    create: {
      name: 'Momentum Super Admin',
      email: 'superadmin@momentum.com',
      hashedPassword,
      role: 'super_admin',
      hospitalId: hospital.id,
      active: true,
    },
  });

  console.log('✅ Super Admin user created:', superAdmin.email);

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

  // Additional Doctors
  console.log('👨‍⚕️ Creating additional doctors...');
  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Dr. Michael Chen',
      email: 'michael.chen@citygeneralhospital.com',
      hashedPassword,
      role: 'doctor',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Sylvia Aputazie',
      email: 'aputaziesylvia@gmail.com',
      hashedPassword,
      role: 'doctor',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Eneyi Odey',
      email: 'vivieneneyiodey@gmail.com',
      hashedPassword,
      role: 'doctor',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Glorious Kate Akpegah',
      email: 'gloriouskateakpegah@gmail.com',
      hashedPassword,
      role: 'doctor',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Hope Adeyi',
      email: 'ayoigbala15@gmail.com',
      hashedPassword,
      role: 'doctor',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Goroti Samuel',
      email: 'gorotisunkanmi@gmail.com',
      hashedPassword,
      role: 'doctor',
      active: true,
    },
  });

  // Pharmacists
  console.log('💊 Creating pharmacists...');
  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Pharmacist David Brown',
      email: 'david.brown@citygeneralhospital.com',
      hashedPassword,
      role: 'pharmacist',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Babalola Oluwafemi',
      email: 'oluwafemibabalola99@gmail.com',
      hashedPassword,
      role: 'pharmacist',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Shehu Arafah',
      email: 'missarafah@gmail.com',
      hashedPassword,
      role: 'pharmacist',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Sadiq Abdulkadir',
      email: 'sadiqdahir323@gmail.com',
      hashedPassword,
      role: 'pharmacist',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Tormene',
      email: 'torinco2020@gmail.com',
      hashedPassword,
      role: 'pharmacist',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Ukeme Udo',
      email: 'ukemeudo72@gmail.com',
      hashedPassword,
      role: 'pharmacist',
      active: true,
    },
  });

  // Lab Scientists
  console.log('🔬 Creating lab scientists...');
  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Lab Tech James Wilson',
      email: 'james.wilson@citygeneralhospital.com',
      hashedPassword,
      role: 'lab_tech',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Baridueh Badon',
      email: 'baridueh@gmail.com',
      hashedPassword,
      role: 'lab_tech',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Samuel Ajewole',
      email: 'samuelajewolesa@gmail.com',
      hashedPassword,
      role: 'lab_tech',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Nnorom Iheoma',
      email: 'nnoromiheoma33@gmail.com',
      hashedPassword,
      role: 'lab_tech',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Jumoke Johnson',
      email: 'damilolaj442@gmail.com',
      hashedPassword,
      role: 'lab_tech',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Oluwanifemi Lanre-Adigun',
      email: 'nifemiadewura@gmail.com',
      hashedPassword,
      role: 'lab_tech',
      active: true,
    },
  });

  // Cashier
  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Cashier Lisa Anderson',
      email: 'lisa.anderson@citygeneralhospital.com',
      hashedPassword,
      role: 'cashier',
      active: true,
    },
  });

  // Patient Accounts
  console.log('🧑‍🤝‍🧑 Creating patient accounts...');
  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Olaide Olawuwo',
      email: 'truorganicafricafoundation@gmail.com',
      hashedPassword,
      role: 'patient',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Olajide Adara',
      email: 'olajideadara@yahoo.com',
      hashedPassword,
      role: 'patient',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'David Adeyinka',
      email: 'adeyinkad46@gmail.com',
      hashedPassword,
      role: 'patient',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Bello Ibrahim',
      email: 'ayindebolaji97@gmail.com',
      hashedPassword,
      role: 'patient',
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      name: 'Igbayilola Ruth',
      email: 'ruthigbayilola@gmail.com',
      hashedPassword,
      role: 'patient',
      active: true,
    },
  });

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📝 Login credentials (all users use password: password123):');
  console.log('\n👑 Super Admin (Platform):');
  console.log('   - superadmin@momentum.com');
  console.log('\n👑 Hospital Admin:');
  console.log('   - admin@citygeneralhospital.com');
  console.log('\n👨‍⚕️ Doctors (7 total):');
  console.log('   - sarah.johnson@citygeneralhospital.com');
  console.log('   - michael.chen@citygeneralhospital.com');
  console.log('   - aputaziesylvia@gmail.com');
  console.log('   - vivieneneyiodey@gmail.com');
  console.log('   - gloriouskateakpegah@gmail.com');
  console.log('   - ayoigbala15@gmail.com');
  console.log('   - gorotisunkanmi@gmail.com');
  console.log('\n💊 Pharmacists (6 total):');
  console.log('   - david.brown@citygeneralhospital.com');
  console.log('   - oluwafemibabalola99@gmail.com');
  console.log('   - missarafah@gmail.com');
  console.log('   - sadiqdahir323@gmail.com');
  console.log('   - torinco2020@gmail.com');
  console.log('   - ukemeudo72@gmail.com');
  console.log('\n🔬 Lab Scientists (6 total):');
  console.log('   - james.wilson@citygeneralhospital.com');
  console.log('   - baridueh@gmail.com');
  console.log('   - samuelajewolesa@gmail.com');
  console.log('   - nnoromiheoma33@gmail.com');
  console.log('   - damilolaj442@gmail.com');
  console.log('   - nifemiadewura@gmail.com');
  console.log('\n🧑‍🤝‍🧑 Patients (5 total):');
  console.log('   - truorganicafricafoundation@gmail.com');
  console.log('   - olajideadara@yahoo.com');
  console.log('   - adeyinkad46@gmail.com');
  console.log('   - ayindebolaji97@gmail.com');
  console.log('   - ruthigbayilola@gmail.com');
  console.log('\n👩‍⚕️ Nurses & Cashiers:');
  console.log('   - nurse@citygeneralhospital.com (Nurse)');
  console.log('   - lisa.anderson@citygeneralhospital.com (Cashier)');
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
