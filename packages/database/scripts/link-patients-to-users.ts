import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkPatientsToUsers() {
  try {
    console.log('🔗 Starting to link patient records to user accounts...\n');

    // Get all users with patient role
    const patientUsers = await prisma.user.findMany({
      where: { role: 'patient' },
    });

    console.log(`📋 Found ${patientUsers.length} patient users\n`);

    let linkedCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;
    let createdCount = 0;

    for (const user of patientUsers) {
      // Check if user already has a patient profile linked
      const existingLink = await prisma.patient.findFirst({
        where: { userId: user.id },
      });

      if (existingLink) {
        console.log(`⏭️  User ${user.email} already linked to patient #${existingLink.id}`);
        skippedCount++;
        continue;
      }

      // Try to find patient record by email in contactInfo
      let patient = await prisma.patient.findFirst({
        where: {
          hospitalId: user.hospitalId,
          contactInfo: {
            path: ['email'],
            equals: user.email,
          },
        },
      });

      // If not found by email, try to find by matching name
      if (!patient) {
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;
        
        patient = await prisma.patient.findFirst({
          where: {
            hospitalId: user.hospitalId,
            firstName: {
              contains: firstName,
              mode: 'insensitive',
            },
            userId: null, // Only match unlinked patients
          },
        });
      }

      if (patient) {
        // Link the patient to the user
        await prisma.patient.update({
          where: { id: patient.id },
          data: { userId: user.id },
        });

        console.log(
          `✅ Linked user ${user.email} (ID: ${user.id}) to patient ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`
        );
        linkedCount++;
      } else {
        // Create a new patient profile for this user
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const newPatient = await prisma.patient.create({
          data: {
            hospitalId: user.hospitalId,
            userId: user.id,
            firstName,
            lastName,
            dob: new Date('2000-01-01'), // Default DOB - should be updated
            patientType: 'self_pay',
            contactInfo: { email: user.email },
          },
        });

        console.log(
          `✨ Created new patient profile for user ${user.email} (ID: ${user.id}) - Patient ID: ${newPatient.id}`
        );
        console.log(`   ⚠️  Note: Please update patient details (DOB, etc.) via admin panel`);
        createdCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully linked: ${linkedCount}`);
    console.log(`   ✨ Newly created: ${createdCount}`);
    console.log(`   ⏭️  Already linked: ${skippedCount}`);
    console.log(`   📝 Total processed: ${patientUsers.length}`);

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error linking patients to users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

linkPatientsToUsers();
