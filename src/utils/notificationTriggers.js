import { 
  createNotification, 
  createAppointmentConfirmedNotification, 
  createServiceCompletedNotification,
  createEstimateApprovedNotification,
  createEstimateDeclinedNotification
} from './notificationService';
import { sendAppointmentStatusEmail } from './emailService';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * A centralized service to handle notification triggers throughout the application
 * This service helps ensure notifications are sent consistently regardless of where status changes occur
 */

/**
 * Sends appropriate notifications when an appointment status changes
 * @param {string} appointmentId - The ID of the appointment
 * @param {string} newStatus - The new status ('approved', 'rejected', 'completed', etc.)
 * @param {Object} [appointmentData] - Optional appointment data if already available
 * @returns {Promise<boolean>} - Whether notifications were successfully sent
 */
export const handleAppointmentStatusChange = async (appointmentId, newStatus, appointmentData = null) => {
  try {
    console.log(`Sending notifications for appointment ${appointmentId} with new status: ${newStatus}`);
    
    // Get appointment data if not provided
    if (!appointmentData) {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      
      if (!appointmentSnap.exists()) {
        console.error('Appointment not found for notification', appointmentId);
        return false;
      }
      
      appointmentData = { id: appointmentId, ...appointmentSnap.data() };
    } else if (!appointmentData.id) {
      appointmentData = { ...appointmentData, id: appointmentId };
    }
    
    // Verificar si el userId existe y es válido, si no, no enviar notificación
    // pero no fallar la función completa
    if (!appointmentData.userId || appointmentData.userId === 'system_notification') {
      console.warn('No valid userId found for appointment notification', appointmentId);
      return true; // Retornar true para que la función principal no falle
    }
    
    // Normalizar datos de la cita para evitar errores
    const normalizedData = {
      ...appointmentData,
      service: appointmentData.service || 
               (Array.isArray(appointmentData.services) && appointmentData.services.length > 0 ? 
                appointmentData.services[0] : 'requested service'),
      userEmail: appointmentData.userEmail || appointmentData.customerEmail
    };
    
    // Asegurar que la fecha tiene un formato utilizable
    if (normalizedData.date) {
      if (typeof normalizedData.date === 'string') {
        try {
          normalizedData.date = new Date(normalizedData.date);
        } catch (e) {
          console.warn('Error parsing appointment date:', e);
        }
      } else if (normalizedData.date.seconds) {
        // Ya es un timestamp de Firestore, convertir a Date para mayor compatibilidad
        normalizedData.date = new Date(normalizedData.date.seconds * 1000);
      }
    }
    
    // Create appropriate notification based on status
    try {
      if (newStatus === 'approved') {
        await createAppointmentConfirmedNotification(normalizedData.userId, normalizedData);
      } else if (newStatus === 'completed') {
        await createServiceCompletedNotification(normalizedData.userId, normalizedData);
      } else if (newStatus === 'rejected') {
        // Custom notification for rejected appointments
        const dateDisplay = normalizedData.date instanceof Date ? 
          normalizedData.date.toLocaleDateString() : 'the scheduled date';
          
        await createNotification(
          normalizedData.userId,
          'Appointment Rescheduling Required',
          `Unfortunately, your appointment for ${Array.isArray(normalizedData.services) ? normalizedData.services.join(', ') : (normalizedData.service || 'requested service')} on ${dateDisplay} needs to be rescheduled. Please contact us or book a new appointment.`,
          'warning',
          {
            type: 'appointment_rejected',
            appointmentId: appointmentId,
          }
        );
      }
      
      // Send email notification if enabled
      if (normalizedData.emailReminders && normalizedData.userEmail) {
        try {
          await sendAppointmentStatusEmail(normalizedData, newStatus);
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail if email sending fails
        }
      }
      
      console.log(`Successfully sent notifications for appointment ${appointmentId}`);
      return true;
    } catch (error) {
      console.error('Error sending notifications:', error);
      // No reenviar el error, sólo registrar y retornar false
      return false;
    }
  } catch (error) {
    console.error('Error in handleAppointmentStatusChange:', error);
    return false;
  }
};

/**
 * Set up listeners for appointment status changes
 * This function can be called on app initialization to monitor all appointments
 * @param {function} onStatusChange - Optional callback when statuses change
 * @returns {function} - Unsubscribe function to stop listening
 */
export const listenForAppointmentStatusChanges = (onStatusChange = null) => {
  console.log('Setting up listeners for appointment status changes');
  
  const appointmentsQuery = query(
    collection(db, 'appointments'),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(appointmentsQuery, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      // We're only interested in modifications, not new or deleted appointments
      if (change.type === 'modified') {
        const appointment = { id: change.doc.id, ...change.doc.data() };
        const status = appointment.status;
        
        // Only handle certain status changes
        if (['approved', 'rejected', 'completed'].includes(status)) {
          console.log(`Detected status change to ${status} for appointment ${appointment.id}`);
          
          // Trigger notifications
          await handleAppointmentStatusChange(appointment.id, status, appointment);
          
          // Call the callback if provided
          if (onStatusChange) {
            onStatusChange(appointment.id, status, appointment);
          }
        }
      }
    });
  }, (error) => {
    console.error('Error listening for appointment changes:', error);
  });
};

/**
 * Sends appropriate notifications when an estimate status changes
 * @param {string} estimateId - The ID of the estimate
 * @param {string} newStatus - The new status ('approved', 'declined', etc.)
 * @param {Object} [estimateData] - Optional estimate data if already available
 * @returns {Promise<boolean>} - Whether notifications were successfully sent
 */
export const handleEstimateStatusChange = async (estimateId, newStatus, estimateData = null) => {
  try {
    console.log(`Sending notifications for estimate ${estimateId} with new status: ${newStatus}`);
    
    // Get estimate data if not provided
    if (!estimateData) {
      const estimateRef = doc(db, 'estimates', estimateId);
      const estimateSnap = await getDoc(estimateRef);
      
      if (!estimateSnap.exists()) {
        console.error('Estimate not found for notification', estimateId);
        return false;
      }
      
      estimateData = { id: estimateId, ...estimateSnap.data() };
    } else if (!estimateData.id) {
      estimateData = { ...estimateData, id: estimateId };
    }
    
    if (!estimateData.userId) {
      console.error('No userId found for estimate notification', estimateId);
      return false;
    }
    
    // Create appropriate notification based on status
    try {
      if (newStatus === 'approved') {
        await createEstimateApprovedNotification(estimateData.userId, estimateData);
      } else if (newStatus === 'declined') {
        await createEstimateDeclinedNotification(estimateData.userId, estimateData);
      }
      
      console.log(`Successfully sent notifications for estimate ${estimateId}`);
      return true;
    } catch (error) {
      console.error('Error sending notifications:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in handleEstimateStatusChange:', error);
    return false;
  }
};

export default {
  handleAppointmentStatusChange,
  listenForAppointmentStatusChanges,
  handleEstimateStatusChange
};
