import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Creates a notification for a user
 * @param {string} userId - The user ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type: 'success', 'info', 'warning', 'error'
 * @param {Object} metadata - Additional metadata for the notification
 */
export const createNotification = async (userId, title, message, type = 'info', metadata = {}) => {
  try {
    const notification = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
      metadata,
      icon: type // Default icon matches type
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Predefined notification creators for common events
 */
export const NotificationTypes = {
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_COMPLETED: 'appointment_completed',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  ESTIMATE_READY: 'estimate_ready',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  WELCOME: 'welcome',
  SERVICE_REMINDER: 'service_reminder'
};

/**
 * Create appointment confirmation notification
 */
export const createAppointmentConfirmedNotification = async (userId, appointmentData) => {
  const { service, date, timeSlot, address } = appointmentData;
  const appointmentDate = date.toDate ? date.toDate() : new Date(date);
  
  return createNotification(
    userId,
    'Appointment Confirmed',
    `Your ${service} appointment on ${appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })} at ${timeSlot} has been confirmed. Our team will arrive at ${address.street}, ${address.city}.`,
    'success',
    {
      type: NotificationTypes.APPOINTMENT_CONFIRMED,
      appointmentId: appointmentData.id,
      service,
      date: appointmentDate.toISOString(),
      timeSlot
    }
  );
};

/**
 * Create estimate ready notification
 */
export const createEstimateReadyNotification = async (userId, estimateData) => {
  const { subject, totalCost } = estimateData;
  
  return createNotification(
    userId,
    'Estimate Ready',
    `Your estimate for ${subject} is ready for review. ${totalCost ? `Total estimated cost: $${totalCost}` : 'Please check your estimates page for details.'}`,
    'info',
    {
      type: NotificationTypes.ESTIMATE_READY,
      estimateId: estimateData.id,
      subject,
      totalCost
    }
  );
};

/**
 * Create payment received notification
 */
export const createPaymentReceivedNotification = async (userId, paymentData) => {
  const { amount, remaining, service } = paymentData;
  
  return createNotification(
    userId,
    'Payment Received',
    `We have received your ${amount ? `payment of $${amount}` : 'payment'} for your ${service || 'upcoming appointment'}. ${remaining ? `Remaining balance: $${remaining}` : 'Thank you!'}`,
    'success',
    {
      type: NotificationTypes.PAYMENT_RECEIVED,
      paymentId: paymentData.id,
      amount,
      remaining,
      service
    }
  );
};

/**
 * Create appointment reminder notification
 */
export const createAppointmentReminderNotification = async (userId, appointmentData) => {
  const { service, date, timeSlot } = appointmentData;
  const appointmentDate = date.toDate ? date.toDate() : new Date(date);
  
  return createNotification(
    userId,
    'Appointment Reminder',
    `Reminder: Your ${service} appointment is scheduled for ${appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })} at ${timeSlot}. Please ensure your vehicle is accessible.`,
    'warning',
    {
      type: NotificationTypes.APPOINTMENT_REMINDER,
      appointmentId: appointmentData.id,
      service,
      date: appointmentDate.toISOString(),
      timeSlot
    }
  );
};

/**
 * Create service completed notification
 */
export const createServiceCompletedNotification = async (userId, appointmentData) => {
  const { service } = appointmentData;
  
  return createNotification(
    userId,
    'Service Completed',
    `Your ${service} service has been completed! Thank you for choosing POVEDA PREMIUM AUTO CARE. We'd love to hear about your experience.`,
    'success',
    {
      type: NotificationTypes.APPOINTMENT_COMPLETED,
      appointmentId: appointmentData.id,
      service
    }
  );
};

/**
 * Create welcome notification for new users
 */
export const createWelcomeNotification = async (userId, userName) => {
  return createNotification(
    userId,
    'Welcome to POVEDA AUTO CARE',
    `Welcome ${userName}! Your account has been created successfully. Explore our premium detailing services and book your first appointment to get started.`,
    'info',
    {
      type: NotificationTypes.WELCOME,
      userName
    }
  );
};

/**
 * Create service reminder notification
 */
export const createServiceReminderNotification = async (userId, vehicleData) => {
  const { make, model, year } = vehicleData;
  
  return createNotification(
    userId,
    'Service Reminder',
    `It's been a while since your ${year} ${make} ${model} had a professional detail. Book your next service to keep your vehicle looking its best!`,
    'info',
    {
      type: NotificationTypes.SERVICE_REMINDER,
      vehicleId: vehicleData.id,
      make,
      model,
      year
    }
  );
};

export default {
  createNotification,
  createAppointmentConfirmedNotification,
  createEstimateReadyNotification,
  createPaymentReceivedNotification,
  createAppointmentReminderNotification,
  createServiceCompletedNotification,
  createWelcomeNotification,
  createServiceReminderNotification,
  NotificationTypes
};
