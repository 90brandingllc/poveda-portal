import { createNotification, createAppointmentConfirmedNotification, createServiceCompletedNotification } from './notificationService';
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
    
    if (!appointmentData.userId) {
      console.error('No userId found for appointment notification', appointmentId);
      return false;
    }
    
    // Create appropriate notification based on status
    try {
      if (newStatus === 'approved') {
        await createAppointmentConfirmedNotification(appointmentData.userId, appointmentData);
      } else if (newStatus === 'completed') {
        await createServiceCompletedNotification(appointmentData.userId, appointmentData);
      } else if (newStatus === 'rejected') {
        // Custom notification for rejected appointments
        const dateDisplay = appointmentData.date?.seconds ? 
          new Date(appointmentData.date.seconds * 1000).toLocaleDateString() : 
          'the scheduled date';
          
        await createNotification(
          appointmentData.userId,
          'Appointment Rescheduling Required',
          `Unfortunately, your appointment for ${Array.isArray(appointmentData.services) ? appointmentData.services.join(', ') : (appointmentData.service || 'requested service')} on ${dateDisplay} needs to be rescheduled. Please contact us or book a new appointment.`,
          'warning',
          {
            type: 'appointment_rejected',
            appointmentId: appointmentId,
          }
        );
      }
      
      // Send email notification if enabled
      if (appointmentData.emailReminders && appointmentData.userEmail) {
        try {
          await sendAppointmentStatusEmail(appointmentData, newStatus);
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail if email sending fails
        }
      }
      
      console.log(`Successfully sent notifications for appointment ${appointmentId}`);
      return true;
    } catch (error) {
      console.error('Error sending notifications:', error);
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

export default {
  handleAppointmentStatusChange,
  listenForAppointmentStatusChanges
};
