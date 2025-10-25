import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importData() {
  console.log('📦 Importing database data...');
  
  try {
    // Read exported data
    const exportPath = path.join(__dirname, '..', 'data-export.json');
    
    if (!fs.existsSync(exportPath)) {
      throw new Error(`Export file not found at: ${exportPath}`);
    }
    
    const fileContent = fs.readFileSync(exportPath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    console.log('\n📊 Import Summary:');
    console.log(`  Hospitals: ${data.hospitals?.length || 0}`);
    console.log(`  Users: ${data.users?.length || 0}`);
    console.log(`  Patients: ${data.patients?.length || 0}`);
    console.log(`  Appointments: ${data.appointments?.length || 0}`);
    console.log(`  Prescriptions: ${data.prescriptions?.length || 0}`);
    console.log(`  Medical Records: ${data.medicalRecords?.length || 0}`);
    console.log(`  Invoices: ${data.invoices?.length || 0}`);
    console.log(`  Inventory: ${data.inventory?.length || 0}`);
    console.log(`  Lab Orders: ${data.labOrders?.length || 0}`);
    console.log(`  Notifications: ${data.notifications?.length || 0}`);
    console.log(`  HMOs: ${data.hmos?.length || 0}`);
    
    console.log('\n🔄 Starting import...');
    
    // Import in order to respect foreign key constraints
    if (data.hospitals?.length) {
      console.log(`  Importing ${data.hospitals.length} hospitals...`);
      for (const item of data.hospitals) {
        await prisma.hospital.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.users?.length) {
      console.log(`  Importing ${data.users.length} users...`);
      for (const item of data.users) {
        await prisma.user.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.patients?.length) {
      console.log(`  Importing ${data.patients.length} patients...`);
      for (const item of data.patients) {
        await prisma.patient.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.hmos?.length) {
      console.log(`  Importing ${data.hmos.length} HMOs...`);
      for (const item of data.hmos) {
        await prisma.hmo.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.appointments?.length) {
      console.log(`  Importing ${data.appointments.length} appointments...`);
      for (const item of data.appointments) {
        await prisma.appointment.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.prescriptions?.length) {
      console.log(`  Importing ${data.prescriptions.length} prescriptions...`);
      for (const item of data.prescriptions) {
        await prisma.prescription.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.prescriptionItems?.length) {
      console.log(`  Importing ${data.prescriptionItems.length} prescription items...`);
      for (const item of data.prescriptionItems) {
        await prisma.prescriptionItem.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.medicalRecords?.length) {
      console.log(`  Importing ${data.medicalRecords.length} medical records...`);
      for (const item of data.medicalRecords) {
        await prisma.medicalRecord.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.invoices?.length) {
      console.log(`  Importing ${data.invoices.length} invoices...`);
      for (const item of data.invoices) {
        await prisma.invoice.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.invoiceItems?.length) {
      console.log(`  Importing ${data.invoiceItems.length} invoice items...`);
      for (const item of data.invoiceItems) {
        await prisma.invoiceItem.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.payments?.length) {
      console.log(`  Importing ${data.payments.length} payments...`);
      for (const item of data.payments) {
        await prisma.payment.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.inventory?.length) {
      console.log(`  Importing ${data.inventory.length} inventory items...`);
      for (const item of data.inventory) {
        await prisma.inventory.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.labOrders?.length) {
      console.log(`  Importing ${data.labOrders.length} lab orders...`);
      for (const item of data.labOrders) {
        await prisma.labOrder.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.labResults?.length) {
      console.log(`  Importing ${data.labResults.length} lab results...`);
      for (const item of data.labResults) {
        await prisma.labResult.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    if (data.notifications?.length) {
      console.log(`  Importing ${data.notifications.length} notifications...`);
      for (const item of data.notifications) {
        await prisma.notification.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
    
    console.log('\n✅ Data imported successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData();
