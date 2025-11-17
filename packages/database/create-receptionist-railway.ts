import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createReceptionist() {
  try {
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash('receptionist123', 10);

    console.log('👤 Creating receptionist user in Railway database...');
    
    const user = await prisma.user.upsert({
      where: {
        email: 'receptionist@citygeneralhospital.com',
      },
      update: {
        name: 'Sarah Martinez',
        role: 'receptionist',
        active: true,
        hashedPassword,
        mustChangePassword: false,
      },
      create: {
        hospitalId: 1, // City General Hospital
        name: 'Sarah Martinez',
        email: 'receptionist@citygeneralhospital.com',
        hashedPassword,
        role: 'receptionist',
        active: true,
        mustChangePassword: false,
      },
    });

    console.log('✅ Receptionist user created successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🔑 Role:', user.role);
    console.log('\n🎉 You can now log in with:');
    console.log('   Email: receptionist@citygeneralhospital.com');
    console.log('   Password: receptionist123');
  } catch (error) {
    console.error('❌ Error creating receptionist:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createReceptionist();
