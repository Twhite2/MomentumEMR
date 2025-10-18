import notificationapi from 'notificationapi-node-server-sdk';
import { prisma, NotificationType, DeliveryMethod, NotificationStatus } from '@momentum/database';

// Initialize NotificationAPI with EU region
let notificationClient: any;
try {
  notificationClient = notificationapi.init(
    process.env.NOTIFICATIONAPI_CLIENT_ID || '',
    process.env.NOTIFICATIONAPI_CLIENT_SECRET || '',
    {
      baseURL: 'https://api.eu.notificationapi.com' // EU region
    }
  );
} catch (error) {
  console.error('Failed to initialize NotificationAPI:', error);
}

export interface NotificationOptions {
  userId: string;
  hospitalId: string;
  userEmail: string;
  userName?: string;
  notificationId: string; // Template ID from NotificationAPI dashboard
  notificationType: NotificationType;
  message: string;
  referenceId?: number;
  referenceTable?: string;
  parameters?: Record<string, any>;
}

/**
 * Send notification via NotificationAPI (email/SMS) AND store in database (in-app)
 */
export async function sendNotification(options: NotificationOptions) {
  const { userId, hospitalId, userEmail, userName, notificationId, notificationType, message, referenceId, referenceTable, parameters } = options;

  try {
    // 1. Send via NotificationAPI (email, SMS, push)
    if (notificationClient) {
      await notificationClient.send({
        templateId: notificationId, // Template ID from dashboard
        to: {
          id: userEmail, // Use email as ID
          email: userEmail,
          number: parameters?.phone, // Optional for SMS
        },
        parameters: {
          userName: userName || 'User',
          message,
          ...parameters,
        },
      });
    }

    // 2. Store in database for in-app notifications
    await prisma.notification.create({
      data: {
        hospitalId: parseInt(hospitalId),
        userId: parseInt(userId),
        notificationType,
        message,
        referenceId,
        referenceTable,
        deliveryMethod: DeliveryMethod.in_app,
        status: NotificationStatus.sent,
        sentAt: new Date(),
      },
    });

    console.log(`Notification sent to user ${userId}: ${notificationType}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send notification:', error);
    
    // Even if external notification fails, try to save to database
    try {
      await prisma.notification.create({
        data: {
          hospitalId: parseInt(hospitalId),
          userId: parseInt(userId),
          notificationType,
          message,
          referenceId,
          referenceTable,
          deliveryMethod: DeliveryMethod.in_app,
          status: NotificationStatus.failed,
        },
      });
      console.log('Notification saved to database as fallback');
    } catch (dbError) {
      console.error('Failed to save notification to database:', dbError);
    }
    
    throw error;
  }
}

/**
 * Send bulk notifications to multiple users
 */
export async function sendBulkNotifications(notifications: NotificationOptions[]) {
  const results = await Promise.allSettled(
    notifications.map((notif) => sendNotification(notif))
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { successful, failed, total: notifications.length };
}

/**
 * Set user notification preferences
 */
export async function setUserPreferences(
  userId: string,
  notificationId: string,
  channel: 'EMAIL' | 'SMS' | 'INAPP_WEB' | 'PUSH',
  enabled: boolean
) {
  try {
    if (!notificationClient) {
      throw new Error('NotificationAPI client not initialized');
    }
    await notificationClient.setUserPreference(
      userId,
      notificationId,
      channel,
      enabled
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to set user preferences:', error);
    throw error;
  }
}

/**
 * Delete user notification data (for GDPR compliance)
 */
export async function deleteUserNotificationData(userId: string) {
  try {
    // Delete from NotificationAPI
    if (notificationClient) {
      await notificationClient.deleteUser(userId);
    }
    
    // Delete from our database
    await prisma.notification.deleteMany({
      where: { userId: parseInt(userId) },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user notification data:', error);
    throw error;
  }
}

// Pre-configured notification templates (NotificationAPI IDs)
export const NotificationTemplates = {
  LAB_RESULTS_READY: 'lab_results_ready',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  PRESCRIPTION_READY: 'prescription_ready',
  INVOICE_GENERATED: 'invoice_generated',
  PAYMENT_RECEIVED: 'payment_received',
  TEST_ORDERED: 'test_ordered',
  VITAL_SIGNS_ALERT: 'vital_signs_alert',
  MEDICATION_DUE: 'medication_due',
  PATIENT_CHECKED_IN: 'patient_checked_in',
};

export default notificationClient;
