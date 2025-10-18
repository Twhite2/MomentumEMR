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
  metadata?: Record<string, any>;
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
          notificationType: data.type as any, // Map type to notificationType
          message: `${data.title}\n${data.message}`, // Combine title and message
          deliveryMethod: 'in_app',
          status: 'pending',
          referenceTable: data.metadata?.referenceTable || null,
          referenceId: data.metadata?.referenceId || null,
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
          notificationType: n.type as any,
          message: `${n.title}\n${n.message}`,
          deliveryMethod: 'in_app' as any,
          status: 'pending' as any,
          referenceTable: n.metadata?.referenceTable || null,
          referenceId: n.metadata?.referenceId || null,
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
   * TODO: Fix schema field mismatches throughout notification service
   */
  static async sendAppointmentReminder(appointmentId: number) {
    try {
      // TODO: Disabled pending notification schema cleanup
      console.log('Appointment reminder disabled pending schema updates');
      return;
    } catch (error) {
      console.error('Failed to send appointment reminder:', error);
    }
  }

  /**
   * Notify about low stock
   * TODO: Disabled pending schema updates
   */
  static async notifyLowStock(inventoryId: number) {
    try {
      console.log('Low stock notification disabled pending schema updates');
      return;
      /* const item = await prisma.inventory.findUnique({
        where: { id: inventoryId },
      });

      if (!item || item.stockQuantity > item.reorderLevel) return;

      // Get all pharmacists in the hospital
      const pharmacists = await prisma.user.findMany({
        where: {
          hospitalId: item.hospitalId,
          role: 'pharmacist',
          active: true,
        },
      });

      const notifications: NotificationData[] = pharmacists.map((user: { id: number }) => ({
        userId: user.id,
        hospitalId: item.hospitalId,
        type: 'low_stock_alert',
        title: 'Low Stock Alert',
        message: `${item.itemName} is running low. Current stock: ${item.stockQuantity}, Reorder level: ${item.reorderLevel}`,
        link: `/inventory/${item.id}`,
        metadata: { inventoryId: item.id },
      }));

      await this.createBulkNotifications(notifications);
      */
    } catch (error) {
      console.error('Failed to send low stock notification:', error);
    }
  }

  /**
   * Notify about expiring medication
   * TODO: Disabled pending schema updates
   */
  static async notifyExpiringMedication(inventoryId: number) {
    try {
      console.log('Expiring medication notification disabled pending schema updates');
      return;
    } catch (error) {
      console.error('Failed to send expiring medication notification:', error);
    }
  }

  /**
   * Notify when prescription is ready
   * TODO: Disabled pending schema updates
   */
  static async notifyPrescriptionReady(prescriptionId: number) {
    console.log('Prescription notification disabled pending schema updates');
  }

  /**
   * Notify when lab results are available
   * TODO: Disabled pending schema updates
   */
  static async notifyLabResultReady(labOrderId: number) {
    console.log('Lab result notification disabled pending schema updates');
  }

  /**
   * Notify when invoice is generated
   * TODO: Disabled pending schema updates
   */
  static async notifyInvoiceGenerated(invoiceId: number) {
    console.log('Invoice notification disabled pending schema updates');
  }

  /**
   * Notify when payment is received
   * TODO: Disabled pending schema updates
   */
  static async notifyPaymentReceived(invoiceId: number, paymentAmount: number) {
    console.log('Payment notification disabled pending schema updates');
  }
}
