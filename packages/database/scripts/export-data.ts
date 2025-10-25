import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  console.log('📦 Exporting database data...');
  
  const data: any = {};

  try {
    // Export all data from each table
    data.hospitals = await prisma.hospital.findMany();
    data.users = await prisma.user.findMany();
    data.patients = await prisma.patient.findMany();
    data.appointments = await prisma.appointment.findMany();
    data.prescriptions = await prisma.prescription.findMany();
    data.prescriptionItems = await prisma.prescriptionItem.findMany();
    data.medicalRecords = await prisma.medicalRecord.findMany();
    data.invoices = await prisma.invoice.findMany();
    data.invoiceItems = await prisma.invoiceItem.findMany();
    data.payments = await prisma.payment.findMany();
    data.inventory = await prisma.inventory.findMany();
    data.labOrders = await prisma.labOrder.findMany();
    data.labResults = await prisma.labResult.findMany();
    data.notifications = await prisma.notification.findMany();
    data.hmos = await prisma.hmo.findMany();

    // Save to file
    const exportPath = path.join(__dirname, '..', 'data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    
    console.log('✅ Data exported successfully!');
    console.log(`📄 File saved to: ${exportPath}`);
    console.log('\n📊 Export Summary:');
    console.log(`  Hospitals: ${data.hospitals.length}`);
    console.log(`  Users: ${data.users.length}`);
    console.log(`  Patients: ${data.patients.length}`);
    console.log(`  Appointments: ${data.appointments.length}`);
    console.log(`  Prescriptions: ${data.prescriptions.length}`);
    console.log(`  Medical Records: ${data.medicalRecords.length}`);
    console.log(`  Invoices: ${data.invoices.length}`);
    console.log(`  Inventory: ${data.inventory.length}`);
    console.log(`  Lab Orders: ${data.labOrders.length}`);
    console.log(`  Notifications: ${data.notifications.length}`);
    console.log(`  HMOs: ${data.hmos.length}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
