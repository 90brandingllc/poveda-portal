import { 
  createNotification, 
  createAppointmentConfirmedNotification, 
  createServiceCompletedNotification,
  createEstimateApprovedNotification,
  createEstimateDeclinedNotification
} from './notificationService';
import { sendAppointmentStatusEmail, sendAppointmentConfirmationEmail } from './emailService';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Get admin user IDs to send them notifications
 * @returns {Promise<string[]>} Array of admin user IDs
 */
const getAdminUserIds = async () => {
  try {
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('role', '==', 'admin'));
    const adminSnapshot = await getDocs(adminQuery);
    return adminSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error getting admin users:', error);
    return [];
  }
};

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
        // Only create in-app notification for logged-in users (not guests)
        if (normalizedData.userId && normalizedData.userId !== 'guest') {
          await createAppointmentConfirmedNotification(normalizedData.userId, normalizedData);
        }
        
        // ALWAYS send email notification for approved appointments (both logged in and guests)
        if (normalizedData.userEmail) {
          try {
            console.log(`Sending confirmation email to ${normalizedData.userEmail}, isGuestBooking: ${normalizedData.isGuestBooking}`);
            
            // Always use appointment_confirmation template for all users
            // This ensures consistent email format for everyone
            await sendAppointmentConfirmationEmail({
              ...normalizedData,
              template: 'appointment_confirmation'
            });
            
            console.log(`✅ Confirmation email sent successfully to ${normalizedData.userEmail}`);
          } catch (emailError) {
            console.error('❌ Error sending confirmation email:', emailError);
            console.error('Email error details:', emailError.message);
            // Don't fail if email sending fails
          }
        } else {
          console.warn('⚠️ No email address provided for appointment confirmation');
        }
      } else if (newStatus === 'completed') {
        await createServiceCompletedNotification(normalizedData.userId, normalizedData);
        
        // Send completion email if enabled
        if (normalizedData.emailReminders && normalizedData.userEmail) {
          try {
            await sendAppointmentStatusEmail(normalizedData, newStatus);
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
          }
        }
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
        
        // Send rejection email if enabled
        if (normalizedData.emailReminders && normalizedData.userEmail) {
          try {
            await sendAppointmentStatusEmail(normalizedData, newStatus);
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
          }
        }
      } else if (newStatus === 'cancelled') {
        // Handle cancelled appointments - notify the user
        const dateDisplay = normalizedData.date instanceof Date ? 
          normalizedData.date.toLocaleDateString() : 'the scheduled date';
          
        await createNotification(
          normalizedData.userId,
          'Appointment Cancelled',
          `Your appointment for ${Array.isArray(normalizedData.services) ? normalizedData.services.join(', ') : (normalizedData.service || 'requested service')} on ${dateDisplay} has been cancelled.`,
          'info',
          {
            type: 'appointment_cancelled',
            appointmentId: appointmentId,
          }
        );
        
        // Send cancellation email if user has email
        if (normalizedData.userEmail) {
          try {
            await sendAppointmentStatusEmail(normalizedData, newStatus);
          } catch (emailError) {
            console.error('Error sending cancellation email notification:', emailError);
          }
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
        if (['approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
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

/**
 * Handles appointment cancellation from client side
 * Sends notifications to admin users
 * @param {string} appointmentId - The ID of the appointment
 * @param {Object} appointmentData - The appointment data
 * @param {string} cancelledBy - Who cancelled: 'client' or 'admin'
 * @returns {Promise<boolean>} - Whether notifications were successfully sent
 */
export const handleAppointmentCancellation = async (appointmentId, appointmentData, cancelledBy = 'client') => {
  try {
    console.log(`Processing appointment cancellation by ${cancelledBy} for appointment ${appointmentId}`);
    
    const dateDisplay = appointmentData.date instanceof Date ? 
      appointmentData.date.toLocaleDateString() : 
      (appointmentData.date?.toDate ? appointmentData.date.toDate().toLocaleDateString() : 'the scheduled date');
    
    const services = Array.isArray(appointmentData.services) ? 
      appointmentData.services.join(', ') : 
      (appointmentData.service || 'requested service');
    
    if (cancelledBy === 'client') {
      // Client cancelled - notify all admins
      const adminIds = await getAdminUserIds();
      console.log(`Found ${adminIds.length} admin(s) to notify about client cancellation`);
      
      for (const adminId of adminIds) {
        await createNotification(
          adminId,
          '⚠️ Appointment Cancelled by Client',
          `${appointmentData.userName || 'A client'} cancelled their appointment for ${services} scheduled on ${dateDisplay} at ${appointmentData.timeSlot || appointmentData.time || 'scheduled time'}.`,
          'warning',
          {
            type: 'appointment_cancelled_by_client',
            appointmentId: appointmentId,
            userId: appointmentData.userId,
            userName: appointmentData.userName
          }
        );
      }
      console.log('✅ Admin notifications sent for client cancellation');
    } else if (cancelledBy === 'admin') {
      // Admin cancelled - notify the client (already handled by handleAppointmentStatusChange)
      console.log('Admin cancellation - client notification will be handled by status change');
    }
    
    return true;
  } catch (error) {
    console.error('Error in handleAppointmentCancellation:', error);
    return false;
  }
};

export default {
  handleAppointmentStatusChange,
  listenForAppointmentStatusChanges,
  handleEstimateStatusChange,
  handleAppointmentCancellation
};
