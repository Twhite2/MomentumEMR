import { prisma } from '@momentum/database';

export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'prescription_ready'
  | 'lab_result_ready'
  | 'invoice_generated'
  | 'payment_received'
  | 'low_stock_alert'
  | 'medication_expiring'
  | 'medication_expired'
  | 'user_account_created'
  | 'user_account_deactivated';

interface NotificationData {
  userId: number;
  hospitalId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * Create an in-app notification
   */
  static async createNotification(data: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          hospitalId: data.hospitalId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          metadata: data.metadata || null,
          read: false,
        },
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications(notifications: NotificationData[]) {
    try {
      const created = await prisma.notification.createMany({
        data: notifications.map((n) => ({
          userId: n.userId,
          hospitalId: n.hospitalId,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link || null,
          metadata: n.metadata || null,
          read: false,
        })),
      });

      return created;
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Send appointment reminder notifications
   */
  static async sendAppointmentReminder(appointmentId: number) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: true,
          doctor: true,
        },
      });

      if (!appointment) return;

      // Create notification for patient (if they have an account)
      const patientUser = await prisma.user.findFirst({
        where: {
          email: appointment.patient.contactInfo?.email,
          hospitalId: appointment.hospitalId,
        },
      });

      if (patientUser) {
        await this.createNotification({
          userId: patientUser.id,
          hospitalId: appointment.hospitalId,
          type: 'appointment_reminder',
          title: 'Appointment Reminder',
          message: `You have an appointment with Dr. ${appointment.doctor.name} tomorrow at ${new Date(
            appointment.appointmentDate
          ).toLocaleTimeString()}.`,
          link: `/appointments/${appointment.id}`,
          metadata: { appointmentId: appointment.id },
        });
      }

      // Notify doctor
      await this.createNotification({
        userId: appointment.doctorId,
        hospitalId: appointment.hospitalId,
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        message: `Appointment with ${appointment.patient.firstName} ${
          appointment.patient.lastName
        } tomorrow at ${new Date(appointment.appointmentDate).toLocaleTimeString()}.`,
        link: `/appointments/${appointment.id}`,
        metadata: { appointmentId: appointment.id },
      });
    } catch (error) {
      console.error('Failed to send appointment reminder:', error);
    }
  }

  /**
   * Notify about low stock
   */
  static async notifyLowStock(inventoryId: number) {
    try {
      const item = await prisma.inventory.findUnique({
        where: { id: inventoryId },
      });

      if (!item || item.quantity > item.reorderLevel) return;

      // Get all pharmacists in the hospital
      const pharmacists = await prisma.user.findMany({
        where: {
          hospitalId: item.hospitalId,
          role: 'pharmacist',
          active: true,
        },
      });

      const notifications: NotificationData[] = pharmacists.map((user) => ({
        userId: user.id,
        hospitalId: item.hospitalId,
        type: 'low_stock_alert',
        title: 'Low Stock Alert',
        message: `${item.drugName} is running low. Current stock: ${item.quantity}, Reorder level: ${item.reorderLevel}`,
        link: `/inventory/${item.id}`,
        metadata: { inventoryId: item.id },
      }));

      await this.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Failed to send low stock notification:', error);
    }
  }

  /**
   * Notify about expiring medication
   */
  static async notifyExpiringMedication(inventoryId: number) {
    try {
      const item = await prisma.inventory.findUnique({
        where: { id: inventoryId },
      });

      if (!item || !item.expiryDate) return;

      const daysToExpiry = Math.ceil(
        (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysToExpiry > 90) return; // Only notify if expiring within 90 days

      // Get all pharmacists and admins
      const users = await prisma.user.findMany({
        where: {
          hospitalId: item.hospitalId,
          role: { in: ['pharmacist', 'admin'] },
          active: true,
        },
      });

      const notifications: NotificationData[] = users.map((user) => ({
        userId: user.id,
        hospitalId: item.hospitalId,
        type: daysToExpiry <= 0 ? 'medication_expired' : 'medication_expiring',
        title: daysToExpiry <= 0 ? 'Medication Expired' : 'Medication Expiring Soon',
        message:
          daysToExpiry <= 0
            ? `${item.drugName} has expired. Please remove from inventory.`
            : `${item.drugName} will expire in ${daysToExpiry} days.`,
        link: `/inventory/${item.id}`,
        metadata: { inventoryId: item.id, daysToExpiry },
      }));

      await this.createBulkNotifications(notifications);
    } catch (error) {
      console.error('Failed to send expiring medication notification:', error);
    }
  }

  /**
   * Notify when prescription is ready
   */
  static async notifyPrescriptionReady(prescriptionId: number) {
    try {
      const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: { patient: true },
      });

      if (!prescription) return;

      // Notify patient if they have an account
      const patientUser = await prisma.user.findFirst({
        where: {
          email: prescription.patient.contactInfo?.email,
          hospitalId: prescription.hospitalId,
        },
      });

      if (patientUser) {
        await this.createNotification({
          userId: patientUser.id,
          hospitalId: prescription.hospitalId,
          type: 'prescription_ready',
          title: 'Prescription Ready',
          message: 'Your prescription is ready for pickup at the pharmacy.',
          link: `/prescriptions/${prescription.id}`,
          metadata: { prescriptionId: prescription.id },
        });
      }
    } catch (error) {
      console.error('Failed to send prescription ready notification:', error);
    }
  }

  /**
   * Notify when lab results are available
   */
  static async notifyLabResultReady(labOrderId: number) {
    try {
      const labOrder = await prisma.labOrder.findUnique({
        where: { id: labOrderId },
        include: {
          patient: true,
          doctor: true,
        },
      });

      if (!labOrder) return;

      // Notify doctor
      await this.createNotification({
        userId: labOrder.orderedBy,
        hospitalId: labOrder.hospitalId,
        type: 'lab_result_ready',
        title: 'Lab Results Available',
        message: `Lab results for ${labOrder.patient.firstName} ${labOrder.patient.lastName} are now available.`,
        link: `/lab-orders/${labOrder.id}`,
        metadata: { labOrderId: labOrder.id },
      });

      // Notify patient if they have an account
      const patientUser = await prisma.user.findFirst({
        where: {
          email: labOrder.patient.contactInfo?.email,
          hospitalId: labOrder.hospitalId,
        },
      });

      if (patientUser) {
        await this.createNotification({
          userId: patientUser.id,
          hospitalId: labOrder.hospitalId,
          type: 'lab_result_ready',
          title: 'Lab Results Available',
          message: 'Your lab test results are now available.',
          link: `/lab-orders/${labOrder.id}`,
          metadata: { labOrderId: labOrder.id },
        });
      }
    } catch (error) {
      console.error('Failed to send lab result notification:', error);
    }
  }

  /**
   * Notify when invoice is generated
   */
  static async notifyInvoiceGenerated(invoiceId: number) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { patient: true },
      });

      if (!invoice) return;

      // Notify patient if they have an account
      const patientUser = await prisma.user.findFirst({
        where: {
          email: invoice.patient.contactInfo?.email,
          hospitalId: invoice.hospitalId,
        },
      });

      if (patientUser) {
        await this.createNotification({
          userId: patientUser.id,
          hospitalId: invoice.hospitalId,
          type: 'invoice_generated',
          title: 'New Invoice',
          message: `An invoice of ₦${invoice.totalAmount.toLocaleString()} has been generated for your account.`,
          link: `/invoices/${invoice.id}`,
          metadata: { invoiceId: invoice.id },
        });
      }
    } catch (error) {
      console.error('Failed to send invoice notification:', error);
    }
  }

  /**
   * Notify when payment is received
   */
  static async notifyPaymentReceived(invoiceId: number, paymentAmount: number) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { patient: true },
      });

      if (!invoice) return;

      // Notify patient if they have an account
      const patientUser = await prisma.user.findFirst({
        where: {
          email: invoice.patient.contactInfo?.email,
          hospitalId: invoice.hospitalId,
        },
      });

      if (patientUser) {
        await this.createNotification({
          userId: patientUser.id,
          hospitalId: invoice.hospitalId,
          type: 'payment_received',
          title: 'Payment Received',
          message: `Your payment of ₦${paymentAmount.toLocaleString()} has been received. Thank you!`,
          link: `/invoices/${invoice.id}`,
          metadata: { invoiceId: invoice.id, amount: paymentAmount },
        });
      }
    } catch (error) {
      console.error('Failed to send payment notification:', error);
    }
  }
}
