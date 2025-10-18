/**
 * Notification Helper Functions
 * Pre-configured notification senders for common EMR events
 */

import { sendNotification, NotificationTemplates } from './notifications';
import { NotificationType } from '@momentum/database';

interface User {
  id: number;
  email?: string | null;
  name?: string | null;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  userId: number;
  user?: User | null;
}

interface Doctor {
  id: number;
  name?: string | null;
}

/**
 * Notify patient when lab results are ready
 */
export async function notifyLabResultsReady(params: {
  patient: Patient & { hospitalId: number };
  testName: string;
  doctorName?: string;
  labResultId: number;
}) {
  const { patient, testName, doctorName, labResultId } = params;

  if (!patient.user?.email) {
    console.warn(`Patient ${patient.id} has no email, skipping notification`);
    return;
  }

  return sendNotification({
    userId: patient.userId.toString(),
    hospitalId: patient.hospitalId.toString(),
    userEmail: patient.user.email,
    userName: `${patient.firstName} ${patient.lastName}`,
    notificationId: NotificationTemplates.LAB_RESULTS_READY,
    notificationType: NotificationType.lab_result_ready,
    message: `Your ${testName} results are now available. Results were reviewed by ${doctorName || 'your doctor'}.`,
    referenceId: labResultId,
    referenceTable: 'lab_results',
    parameters: {
      patientName: `${patient.firstName} ${patient.lastName}`,
      testName,
      doctorName: doctorName || 'Your doctor',
      resultDate: new Date().toLocaleDateString(),
    },
  });
}

/**
 * Send appointment reminder (24 hours before)
 */
export async function notifyAppointmentReminder(params: {
  patient: Patient & { hospitalId: number };
  appointmentId: number;
  appointmentDate: Date;
  doctor?: Doctor;
  appointmentType: string;
  department?: string;
}) {
  const { patient, appointmentId, appointmentDate, doctor, appointmentType, department } = params;

  if (!patient.user?.email) return;

  return sendNotification({
    userId: patient.userId.toString(),
    hospitalId: patient.hospitalId.toString(),
    userEmail: patient.user.email,
    userName: `${patient.firstName} ${patient.lastName}`,
    notificationId: NotificationTemplates.APPOINTMENT_REMINDER,
    notificationType: NotificationType.appointment_reminder,
    message: `You have an appointment tomorrow at ${appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} with ${doctor?.name || 'your doctor'}.`,
    referenceId: appointmentId,
    referenceTable: 'appointments',
    parameters: {
      patientName: `${patient.firstName} ${patient.lastName}`,
      appointmentDate: appointmentDate.toLocaleDateString(),
      appointmentTime: appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      doctorName: doctor?.name || 'Your doctor',
      appointmentType,
      department: department || 'Outpatient',
    },
  });
}

/**
 * Notify patient when appointment is confirmed
 */
export async function notifyAppointmentConfirmed(params: {
  patient: Patient & { hospitalId: number };
  appointmentId: number;
  appointmentDate: Date;
  doctor?: Doctor;
  appointmentType: string;
  department?: string;
}) {
  const { patient, appointmentId, appointmentDate, doctor, appointmentType, department } = params;

  if (!patient.user?.email) return;

  return sendNotification({
    userId: patient.userId.toString(),
    hospitalId: patient.hospitalId.toString(),
    userEmail: patient.user.email,
    userName: `${patient.firstName} ${patient.lastName}`,
    notificationId: NotificationTemplates.APPOINTMENT_CONFIRMED,
    notificationType: NotificationType.appointment_reminder,
    message: `Your appointment has been scheduled for ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} with ${doctor?.name || 'your doctor'}.`,
    referenceId: appointmentId,
    referenceTable: 'appointments',
    parameters: {
      patientName: `${patient.firstName} ${patient.lastName}`,
      appointmentDate: appointmentDate.toLocaleDateString(),
      appointmentTime: appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      doctorName: doctor?.name || 'Your doctor',
      appointmentType,
      department: department || 'Outpatient',
    },
  });
}

/**
 * Notify patient when prescription is ready for pickup
 */
export async function notifyPrescriptionReady(params: {
  patient: Patient & { hospitalId: number };
  prescriptionId: number;
  medication: string;
  doctorName?: string;
}) {
  const { patient, prescriptionId, medication, doctorName } = params;

  if (!patient.user?.email) return;

  return sendNotification({
    userId: patient.userId.toString(),
    hospitalId: patient.hospitalId.toString(),
    userEmail: patient.user.email,
    userName: `${patient.firstName} ${patient.lastName}`,
    notificationId: NotificationTemplates.PRESCRIPTION_READY,
    notificationType: NotificationType.prescription_issued,
    message: `Your prescription for ${medication} is ready for pickup at the Hospital Pharmacy. Prescribed by ${doctorName || 'your doctor'}.`,
    referenceId: prescriptionId,
    referenceTable: 'prescriptions',
    parameters: {
      patientName: `${patient.firstName} ${patient.lastName}`,
      medication,
      doctorName: doctorName || 'Your doctor',
      pickupLocation: 'Hospital Pharmacy',
    },
  });
}

/**
 * Notify patient when invoice is generated
 */
export async function notifyInvoiceGenerated(params: {
  patient: Patient & { hospitalId: number };
  invoiceId: number;
  amount: number;
  dueDate?: Date;
  description?: string;
}) {
  const { patient, invoiceId, amount, dueDate, description } = params;

  if (!patient.user?.email) return;

  return sendNotification({
    userId: patient.userId.toString(),
    hospitalId: patient.hospitalId.toString(),
    userEmail: patient.user.email,
    userName: `${patient.firstName} ${patient.lastName}`,
    notificationId: NotificationTemplates.INVOICE_GENERATED,
    notificationType: NotificationType.payment_due,
    message: `You have a new invoice (INV-${invoiceId.toString().padStart(6, '0')}) for ₦${amount.toLocaleString()}. ${description || 'Medical services'}. Due: ${dueDate?.toLocaleDateString() || 'Upon receipt'}.`,
    referenceId: invoiceId,
    referenceTable: 'invoices',
    parameters: {
      patientName: `${patient.firstName} ${patient.lastName}`,
      invoiceNumber: `INV-${invoiceId.toString().padStart(6, '0')}`,
      amount: `₦${amount.toLocaleString()}`,
      dueDate: dueDate?.toLocaleDateString() || 'Upon receipt',
      description: description || 'Medical services',
    },
  });
}

/**
 * Notify patient when payment is received
 */
export async function notifyPaymentReceived(params: {
  patient: Patient & { hospitalId: number };
  invoiceId: number;
  amount: number;
  paymentMethod?: string;
  paymentId: number;
}) {
  const { patient, invoiceId, amount, paymentMethod, paymentId } = params;

  if (!patient.user?.email) return;

  return sendNotification({
    userId: patient.userId.toString(),
    hospitalId: patient.hospitalId.toString(),
    userEmail: patient.user.email,
    userName: `${patient.firstName} ${patient.lastName}`,
    notificationId: NotificationTemplates.PAYMENT_RECEIVED,
    notificationType: NotificationType.payment_due,
    message: `Your payment of ₦${amount.toLocaleString()} has been received (Receipt: RCP-${paymentId.toString().padStart(6, '0')}). Payment method: ${paymentMethod || 'Cash'}. Thank you!`,
    referenceId: paymentId,
    referenceTable: 'payments',
    parameters: {
      patientName: `${patient.firstName} ${patient.lastName}`,
      amount: `₦${amount.toLocaleString()}`,
      paymentMethod: paymentMethod || 'Cash',
      receiptNumber: `RCP-${paymentId.toString().padStart(6, '0')}`,
      invoiceNumber: `INV-${invoiceId.toString().padStart(6, '0')}`,
    },
  });
}

/**
 * Notify doctor when patient checks in
 */
export async function notifyDoctorPatientCheckedIn(params: {
  doctor: { userId: number; user?: User | null; name?: string; hospitalId: number };
  patient: Patient;
  appointmentId: number;
  appointmentType: string;
}) {
  const { doctor, patient, appointmentId, appointmentType } = params;

  if (!doctor.user?.email) return;

  return sendNotification({
    userId: doctor.userId.toString(),
    hospitalId: doctor.hospitalId.toString(),
    userEmail: doctor.user.email,
    userName: doctor.name || doctor.user.name || 'Doctor',
    notificationId: NotificationTemplates.PATIENT_CHECKED_IN,
    notificationType: NotificationType.appointment_reminder,
    message: `${patient.firstName} ${patient.lastName} has checked in for their ${appointmentType} appointment.`,
    referenceId: appointmentId,
    referenceTable: 'appointments',
    parameters: {
      doctorName: doctor.name || 'Doctor',
      patientName: `${patient.firstName} ${patient.lastName}`,
      appointmentType,
    },
  });
}

/**
 * Notify staff when lab order is placed
 */
export async function notifyLabOrderPlaced(params: {
  labTechId: number;
  labTechEmail: string;
  labTechName: string;
  hospitalId: number;
  patient: Patient;
  labOrderId: number;
  testType: string;
  priority?: string;
}) {
  const { labTechId, labTechEmail, labTechName, hospitalId, patient, labOrderId, testType, priority } = params;

  return sendNotification({
    userId: labTechId.toString(),
    hospitalId: hospitalId.toString(),
    userEmail: labTechEmail,
    userName: labTechName,
    notificationId: NotificationTemplates.TEST_ORDERED,
    notificationType: NotificationType.lab_order,
    message: `New ${testType} test ordered for ${patient.firstName} ${patient.lastName}${priority === 'urgent' ? ' (URGENT)' : ''}. Priority: ${priority || 'normal'}.`,
    referenceId: labOrderId,
    referenceTable: 'lab_orders',
    parameters: {
      patientName: `${patient.firstName} ${patient.lastName}`,
      testType,
      priority: priority || 'normal',
    },
  });
}
