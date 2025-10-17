import { PrismaClient, UserRole, PatientType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.$transaction([
      prisma.labResultValue.deleteMany(),
      prisma.labResult.deleteMany(),
      prisma.labOrder.deleteMany(),
      prisma.patientSurvey.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.invoice.deleteMany(),
      prisma.inventory.deleteMany(),
      prisma.prescriptionItem.deleteMany(),
      prisma.prescription.deleteMany(),
      prisma.medicalRecord.deleteMany(),
      prisma.appointment.deleteMany(),
      prisma.patient.deleteMany(),
      prisma.corporateClient.deleteMany(),
      prisma.hmo.deleteMany(),
      prisma.user.deleteMany(),
      prisma.analyticsMetric.deleteMany(),
      prisma.analyticsReport.deleteMany(),
      prisma.analyticsDashboard.deleteMany(),
      prisma.hospital.deleteMany(),
    ]);
  }

  // 1. Create Hospitals
  console.log('🏥 Creating hospitals...');
  const hospital1 = await prisma.hospital.create({
    data: {
      name: 'City General Hospital',
      address: '123 Main Street, Lagos, Nigeria',
      contactEmail: 'info@citygeneralhospital.com',
      phoneNumber: '+234-1-234-5678',
      subscriptionPlan: 'premium',
      active: true,
    },
  });

  const hospital2 = await prisma.hospital.create({
    data: {
      name: 'St. Mary Medical Center',
      address: '456 Healthcare Ave, Abuja, Nigeria',
      contactEmail: 'contact@stmarymedical.com',
      phoneNumber: '+234-9-876-5432',
      subscriptionPlan: 'standard',
      active: true,
    },
  });

  // 2. Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Super Admin (Platform-level admin for Momentum)
  const superAdmin = await prisma.user.create({
    data: {
      hospitalId: hospital1.id, // Associated with first hospital but has global access
      name: 'Momentum Super Admin',
      email: 'superadmin@momentum.com',
      hashedPassword,
      role: UserRole.super_admin,
      active: true,
    },
  });

  // Hospital Admin (Hospital-level admin)
  const admin = await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Admin User',
      email: 'admin@citygeneralhospital.com',
      hashedPassword,
      role: UserRole.admin,
      active: true,
    },
  });

  const doctor1 = await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@citygeneralhospital.com',
      hashedPassword,
      role: UserRole.doctor,
      active: true,
    },
  });

  const doctor2 = await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Dr. Michael Chen',
      email: 'michael.chen@citygeneralhospital.com',
      hashedPassword,
      role: UserRole.doctor,
      active: true,
    },
  });

  const nurse1 = await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Nurse Emily Williams',
      email: 'emily.williams@citygeneralhospital.com',
      hashedPassword,
      role: UserRole.nurse,
      active: true,
    },
  });

  const pharmacist = await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Pharmacist David Brown',
      email: 'david.brown@citygeneralhospital.com',
      hashedPassword,
      role: UserRole.pharmacist,
      active: true,
    },
  });

  const cashier = await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Cashier Lisa Anderson',
      email: 'lisa.anderson@citygeneralhospital.com',
      hashedPassword,
      role: UserRole.cashier,
      active: true,
    },
  });

  const labTech = await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Lab Tech James Wilson',
      email: 'james.wilson@citygeneralhospital.com',
      hashedPassword,
      role: UserRole.lab_tech,
      active: true,
    },
  });

  // Additional Doctors
  console.log('👨‍⚕️ Creating additional doctors...');
  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Sylvia Aputazie',
      email: 'aputaziesylvia@gmail.com',
      hashedPassword,
      role: UserRole.doctor,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Eneyi Odey',
      email: 'vivieneneyiodey@gmail.com',
      hashedPassword,
      role: UserRole.doctor,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Glorious Kate Akpegah',
      email: 'gloriouskateakpegah@gmail.com',
      hashedPassword,
      role: UserRole.doctor,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Hope Adeyi',
      email: 'ayoigbala15@gmail.com',
      hashedPassword,
      role: UserRole.doctor,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Goroti Samuel',
      email: 'gorotisunkanmi@gmail.com',
      hashedPassword,
      role: UserRole.doctor,
      active: true,
    },
  });

  // Additional Pharmacists
  console.log('💊 Creating additional pharmacists...');
  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Babalola Oluwafemi',
      email: 'oluwafemibabalola99@gmail.com',
      hashedPassword,
      role: UserRole.pharmacist,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Shehu Arafah',
      email: 'missarafah@gmail.com',
      hashedPassword,
      role: UserRole.pharmacist,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Sadiq Abdulkadir',
      email: 'sadiqdahir323@gmail.com',
      hashedPassword,
      role: UserRole.pharmacist,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Tormene',
      email: 'torinco2020@gmail.com',
      hashedPassword,
      role: UserRole.pharmacist,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Ukeme Udo',
      email: 'ukemeudo72@gmail.com',
      hashedPassword,
      role: UserRole.pharmacist,
      active: true,
    },
  });

  // Additional Lab Scientists
  console.log('🔬 Creating additional lab scientists...');
  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Baridueh Badon',
      email: 'baridueh@gmail.com',
      hashedPassword,
      role: UserRole.lab_tech,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Samuel Ajewole',
      email: 'samuelajewolesa@gmail.com',
      hashedPassword,
      role: UserRole.lab_tech,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Nnorom Iheoma',
      email: 'nnoromiheoma33@gmail.com',
      hashedPassword,
      role: UserRole.lab_tech,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Jumoke Johnson',
      email: 'damilolaj442@gmail.com',
      hashedPassword,
      role: UserRole.lab_tech,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Oluwanifemi Lanre-Adigun',
      email: 'nifemiadewura@gmail.com',
      hashedPassword,
      role: UserRole.lab_tech,
      active: true,
    },
  });

  // Patient Accounts
  console.log('🧑‍🤝‍🧑 Creating patient accounts...');
  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Olaide Olawuwo',
      email: 'truorganicafricafoundation@gmail.com',
      hashedPassword,
      role: UserRole.patient,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Olajide Adara',
      email: 'olajideadara@yahoo.com',
      hashedPassword,
      role: UserRole.patient,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'David Adeyinka',
      email: 'adeyinkad46@gmail.com',
      hashedPassword,
      role: UserRole.patient,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Bello Ibrahim',
      email: 'ayindebolaji97@gmail.com',
      hashedPassword,
      role: UserRole.patient,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      hospitalId: hospital1.id,
      name: 'Igbayilola Ruth',
      email: 'ruthigbayilola@gmail.com',
      hashedPassword,
      role: UserRole.patient,
      active: true,
    },
  });

  // 3. Create HMO Policies
  console.log('🏥 Creating HMO policies...');
  const hmo1 = await prisma.hmo.create({
    data: {
      hospitalId: hospital1.id,
      policyName: 'Premium Health Plus',
      provider: 'HealthGuard Insurance',
      coverageDetails: {
        maxCoverage: 5000000,
        copayPercentage: 10,
        services: ['OPD', 'IPD', 'Surgery', 'Lab Tests', 'Pharmacy'],
      },
      active: true,
    },
  });

  const hmo2 = await prisma.hmo.create({
    data: {
      hospitalId: hospital1.id,
      policyName: 'Basic Care',
      provider: 'MediCare Nigeria',
      coverageDetails: {
        maxCoverage: 1000000,
        copayPercentage: 20,
        services: ['OPD', 'Lab Tests', 'Pharmacy'],
      },
      active: true,
    },
  });

  // 4. Create Corporate Clients
  console.log('🏢 Creating corporate clients...');
  const corporate1 = await prisma.corporateClient.create({
    data: {
      hospitalId: hospital1.id,
      companyName: 'Tech Solutions Ltd',
      contactPerson: 'HR Manager',
      contactEmail: 'hr@techsolutions.com',
      contactPhone: '+234-1-111-2222',
      billingAddress: '789 Corporate Plaza, Lagos',
      paymentTerms: 'NET30',
      discountRate: 15.0,
      creditLimit: 10000000,
      active: true,
    },
  });

  const corporate2 = await prisma.corporateClient.create({
    data: {
      hospitalId: hospital1.id,
      companyName: 'Global Finance Corp',
      contactPerson: 'Benefits Coordinator',
      contactEmail: 'benefits@globalfinance.com',
      contactPhone: '+234-1-333-4444',
      billingAddress: '321 Banking Street, Lagos',
      paymentTerms: 'NET60',
      discountRate: 20.0,
      creditLimit: 20000000,
      active: true,
    },
  });

  // 5. Create Patients
  console.log('👨‍⚕️ Creating patients...');
  
  // HMO Patient
  const patient1 = await prisma.patient.create({
    data: {
      hospitalId: hospital1.id,
      patientType: PatientType.hmo,
      insuranceId: hmo1.id,
      firstName: 'John',
      lastName: 'Doe',
      dob: new Date('1985-06-15'),
      gender: 'Male',
      contactInfo: {
        phone: '+234-802-123-4567',
        email: 'john.doe@email.com',
      },
      address: '12 Residential Close, Ikeja, Lagos',
      emergencyContact: 'Jane Doe - Wife - +234-802-765-4321',
    },
  });

  // Corporate Patient
  const patient2 = await prisma.patient.create({
    data: {
      hospitalId: hospital1.id,
      patientType: PatientType.corporate,
      corporateClientId: corporate1.id,
      firstName: 'Mary',
      lastName: 'Smith',
      dob: new Date('1990-03-22'),
      gender: 'Female',
      contactInfo: {
        phone: '+234-803-987-6543',
        email: 'mary.smith@email.com',
      },
      address: '45 Garden Estate, Victoria Island, Lagos',
      emergencyContact: 'Peter Smith - Husband - +234-803-111-2222',
    },
  });

  // Self-Pay Patient
  const patient3 = await prisma.patient.create({
    data: {
      hospitalId: hospital1.id,
      patientType: PatientType.self_pay,
      firstName: 'Ahmed',
      lastName: 'Ibrahim',
      dob: new Date('1978-11-08'),
      gender: 'Male',
      contactInfo: {
        phone: '+234-805-222-3333',
        email: 'ahmed.ibrahim@email.com',
      },
      address: '78 Independence Way, Abuja',
      emergencyContact: 'Fatima Ibrahim - Sister - +234-805-444-5555',
    },
  });

  // 6. Create Appointments
  console.log('📅 Creating appointments...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      hospitalId: hospital1.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      department: 'Cardiology',
      appointmentType: 'OPD',
      status: 'scheduled',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000), // 30 minutes later
    },
  });

  // 7. Create Inventory Items
  console.log('💊 Creating inventory items...');
  await prisma.inventory.createMany({
    data: [
      {
        hospitalId: hospital1.id,
        itemName: 'Paracetamol 500mg',
        itemCode: 'PARA500',
        stockQuantity: 500,
        reorderLevel: 100,
        unitPrice: 50.0,
        expiryDate: new Date('2026-12-31'),
      },
      {
        hospitalId: hospital1.id,
        itemName: 'Amoxicillin 250mg',
        itemCode: 'AMOX250',
        stockQuantity: 300,
        reorderLevel: 80,
        unitPrice: 150.0,
        expiryDate: new Date('2026-06-30'),
      },
      {
        hospitalId: hospital1.id,
        itemName: 'Surgical Gloves (Box)',
        itemCode: 'GLOVE-L',
        stockQuantity: 50,
        reorderLevel: 20,
        unitPrice: 2500.0,
        expiryDate: new Date('2027-12-31'),
      },
      {
        hospitalId: hospital1.id,
        itemName: 'Insulin Syringes',
        itemCode: 'SYR-INS',
        stockQuantity: 8,
        reorderLevel: 15,
        unitPrice: 1200.0,
        expiryDate: new Date('2028-03-31'),
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Login credentials (all users use password: password123):');
  console.log('\n👑 Admin:');
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
  console.log('   - emily.williams@citygeneralhospital.com (Nurse)');
  console.log('   - lisa.anderson@citygeneralhospital.com (Cashier)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
