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
    if (!userId) {
      console.error('Error: userId is required for notifications');
      return null;
    }
    
    // Limpiar cualquier valor undefined de metadata
    const cleanMetadata = {};
    Object.keys(metadata).forEach(key => {
      if (metadata[key] !== undefined) {
        cleanMetadata[key] = metadata[key];
      }
    });
    
    // Crear el objeto de notificación con valores limpios
    const notification = {
      userId,
      title: title || 'Notification',
      message: message || '',
      type: type || 'info',
      read: false,
      createdAt: serverTimestamp(),
      metadata: cleanMetadata,
      icon: type || 'info' // Default icon matches type
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);
    console.log(`Notification created successfully: ${docRef.id}`);
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
  ESTIMATE_APPROVED: 'estimate_approved',
  ESTIMATE_DECLINED: 'estimate_declined',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  WELCOME: 'welcome',
  SERVICE_REMINDER: 'service_reminder'
};

/**
 * Create appointment confirmation notification
 */
export const createAppointmentConfirmedNotification = async (userId, appointmentData) => {
  // Extraer datos con valores predeterminados para evitar undefined
  const { 
    service = 'requested',
    date, 
    timeSlot = 'scheduled time', 
    address = {}, 
    id: appointmentId 
  } = appointmentData;
  
  // Asegurarse que date sea un objeto Date válido
  const appointmentDate = date ? (date.toDate ? date.toDate() : new Date(date)) : new Date();
  
  // Extraer dirección con valores predeterminados
  const { street = 'your location', city = '' } = address;
  
  // Mensaje con validación
  const message = `Your ${service} appointment on ${appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })} at ${timeSlot} has been confirmed. Our team will arrive at ${street}${city ? ', ' + city : ''}.`;
  
  // Metadata limpia
  const metadata = {
    type: NotificationTypes.APPOINTMENT_CONFIRMED,
    ...(appointmentId ? { appointmentId } : {}),
    ...(service !== 'requested' ? { service } : {}),
    date: appointmentDate.toISOString(),
    ...(timeSlot !== 'scheduled time' ? { timeSlot } : {})
  };
  
  return createNotification(
    userId,
    'Appointment Confirmed',
    message,
    'success',
    metadata
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
  // Extraer y asegurar que no haya valores undefined
  const { amount, remaining, service, id: paymentId } = paymentData;
  
  // Crear un objeto de metadata limpio sin valores undefined
  const metadata = {
    type: NotificationTypes.PAYMENT_RECEIVED,
    ...(paymentId ? { paymentId } : {}),
    ...(amount ? { amount } : {}),
    ...(remaining !== undefined ? { remaining } : {}),
    ...(service ? { service } : {})
  };
  
  return createNotification(
    userId,
    'Payment Received',
    `We have received your ${amount ? `payment of $${amount}` : 'payment'} for your ${service || 'upcoming appointment'}. ${remaining ? `Remaining balance: $${remaining}` : 'Thank you!'}`,
    'success',
    metadata
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

/**
 * Create estimate approved notification
 */
export const createEstimateApprovedNotification = async (userId, estimateData) => {
  const { subject, projectTitle, quotedPrice, id: estimateId } = estimateData;
  const title = subject || projectTitle || 'your project';
  
  const metadata = {
    type: NotificationTypes.ESTIMATE_APPROVED,
    ...(estimateId ? { estimateId } : {}),
    ...(quotedPrice ? { quotedPrice } : {})
  };
  
  return createNotification(
    userId,
    'Estimate Approved',
    `Great news! Your estimate for ${title} has been approved${quotedPrice ? ` with a quoted price of $${quotedPrice}` : ''}. We'll be in touch soon to schedule the work.`,
    'success',
    metadata
  );
};

/**
 * Create estimate declined notification
 */
export const createEstimateDeclinedNotification = async (userId, estimateData) => {
  const { subject, projectTitle, id: estimateId } = estimateData;
  const title = subject || projectTitle || 'your project';
  
  const metadata = {
    type: NotificationTypes.ESTIMATE_DECLINED,
    ...(estimateId ? { estimateId } : {})
  };
  
  return createNotification(
    userId,
    'Estimate Status Update',
    `Unfortunately, we are unable to proceed with the estimate for ${title} at this time. Please feel free to reach out if you have any questions or would like to discuss alternative options.`,
    'warning',
    metadata
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
  createEstimateApprovedNotification,
  createEstimateDeclinedNotification,
  NotificationTypes
};
