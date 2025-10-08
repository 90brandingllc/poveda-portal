const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Make sure to use the existing admin instance from index.js
// This file assumes admin.initializeApp() is called in the main index.js

/**
 * Create a notification in Firestore
 * @param {string} userId - User ID to send notification to
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {Object} metadata - Additional metadata for the notification
 * @returns {Promise<string>} - ID of the created notification
 */
async function createNotification(userId, title, message, type = 'info', metadata = {}) {
  try {
    const notification = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata,
      icon: type
    };

    const docRef = await admin.firestore().collection('notifications').add(notification);
    console.log(`Notification created: ${docRef.id} for user: ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Creates an appointment confirmation notification when a new appointment is created
 */
exports.createAppointmentConfirmationNotification = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snapshot, context) => {
    try {
      const appointmentData = snapshot.data();
      const userId = appointmentData.userId;
      
      if (!userId) {
        console.log('No user ID found for this appointment. Skipping notification.');
        return null;
      }
      
      // Format appointment date
      const appointmentDate = appointmentData.date.toDate ? 
        appointmentData.date.toDate() : 
        new Date(appointmentData.date);
      
      const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const timeSlot = appointmentData.timeSlot || appointmentData.time || 'the scheduled time';
      const service = Array.isArray(appointmentData.services) ? 
        appointmentData.services.join(', ') : 
        appointmentData.service || 'your service';
      
      // Create notification
      await createNotification(
        userId,
        'Appointment Confirmed',
        `Your ${service} appointment on ${formattedDate} at ${timeSlot} has been created. Our team will review and confirm your booking shortly.`,
        'info',
        {
          type: 'appointment_created',
          appointmentId: context.params.appointmentId,
          service,
          date: appointmentDate.toISOString(),
          timeSlot
        }
      );
      
      console.log(`Confirmation notification created for appointment: ${context.params.appointmentId}`);
      return null;
    } catch (error) {
      console.error('Error creating appointment confirmation notification:', error);
      return null;
    }
  });

/**
 * Creates a notification when an appointment status changes
 */
exports.createAppointmentStatusChangeNotification = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      
      // Only proceed if status has changed
      if (before.status === after.status) {
        return null;
      }
      
      const userId = after.userId;
      if (!userId) {
        console.log('No user ID found for this appointment. Skipping notification.');
        return null;
      }
      
      // Format appointment date
      const appointmentDate = after.date.toDate ? 
        after.date.toDate() : 
        new Date(after.date);
      
      const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const service = Array.isArray(after.services) ? 
        after.services.join(', ') : 
        after.service || 'your service';
      
      let title, message, type;
      
      switch (after.status) {
        case 'approved':
          title = 'Appointment Approved';
          message = `Great news! Your ${service} appointment on ${formattedDate} has been approved.`;
          type = 'success';
          break;
        case 'completed':
          title = 'Service Completed';
          message = `Your ${service} service has been completed successfully! Thank you for choosing POVEDA PREMIUM AUTO CARE.`;
          type = 'success';
          break;
        case 'rejected':
          title = 'Appointment Requires Rescheduling';
          message = `Unfortunately, your ${service} appointment on ${formattedDate} could not be accommodated. Please contact us or book a new appointment.`;
          type = 'warning';
          break;
        default:
          title = 'Appointment Status Update';
          message = `Your ${service} appointment status has been updated to: ${after.status}.`;
          type = 'info';
      }
      
      // Create notification
      await createNotification(
        userId,
        title,
        message,
        type,
        {
          type: `appointment_${after.status}`,
          appointmentId: context.params.appointmentId,
          service,
          date: appointmentDate.toISOString(),
          previousStatus: before.status,
          currentStatus: after.status
        }
      );
      
      console.log(`Status change notification created for appointment: ${context.params.appointmentId}`);
      return null;
    } catch (error) {
      console.error('Error creating appointment status change notification:', error);
      return null;
    }
  });

/**
 * Create appointment reminder notifications (1 day before)
 */
exports.createDayBeforeReminders = functions.pubsub
  .schedule('0 9 * * *')  // 9am every day
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      // Calculate tomorrow's date range
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);
      
      // Query for tomorrow's appointments
      const snapshot = await admin.firestore()
        .collection('appointments')
        .where('date', '>=', tomorrow)
        .where('date', '<=', tomorrowEnd)
        .where('status', '==', 'approved')
        .get();
      
      console.log(`Found ${snapshot.size} appointments scheduled for tomorrow`);
      
      const reminderPromises = [];
      
      snapshot.forEach((doc) => {
        const appointment = { id: doc.id, ...doc.data() };
        
        if (!appointment.userId) return;
        
        // Format appointment date
        const appointmentDate = appointment.date.toDate ? 
          appointment.date.toDate() : 
          new Date(appointment.date);
        
        const formattedDate = appointmentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });
        
        const service = Array.isArray(appointment.services) ? 
          appointment.services.join(', ') : 
          appointment.service || 'your service';
        
        const timeSlot = appointment.timeSlot || appointment.time || 'the scheduled time';
        
        // Create notification
        const notificationPromise = createNotification(
          appointment.userId,
          'Appointment Tomorrow',
          `Reminder: Your ${service} appointment is tomorrow (${formattedDate}) at ${timeSlot}. Please ensure your vehicle is accessible.`,
          'warning',
          {
            type: 'appointment_reminder',
            appointmentId: appointment.id,
            service,
            date: appointmentDate.toISOString(),
            timeSlot
          }
        ).catch(error => {
          console.error(`Error creating reminder notification for appointment ${doc.id}:`, error);
        });
        
        reminderPromises.push(notificationPromise);
        
        // Mark the appointment as having received a reminder
        doc.ref.update({
          reminderSent: true,
          reminderSentAt: admin.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
          console.error(`Error updating appointment ${doc.id} reminder status:`, error);
        });
      });
      
      await Promise.all(reminderPromises);
      return { success: true, count: snapshot.size };
    } catch (error) {
      console.error('Error sending day-before reminders:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Create service follow-up notification (3 months after service)
 */
exports.createServiceFollowUps = functions.pubsub
  .schedule('0 10 * * 1')  // 10am every Monday
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      // Calculate date 3 months ago
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      // Get range for the week (between 12-13 weeks ago)
      const threeMonthsAgoPlusWeek = new Date(threeMonthsAgo);
      threeMonthsAgoPlusWeek.setDate(threeMonthsAgoPlusWeek.getDate() + 7);
      
      // Query for completed appointments from ~3 months ago
      const snapshot = await admin.firestore()
        .collection('appointments')
        .where('status', '==', 'completed')
        .where('updatedAt', '>=', threeMonthsAgo)
        .where('updatedAt', '<=', threeMonthsAgoPlusWeek)
        .where('followUpSent', '==', false) // Only send if not already sent
        .get();
      
      console.log(`Found ${snapshot.size} completed appointments from ~3 months ago`);
      
      // Group by user to avoid multiple notifications
      const userAppointments = {};
      
      snapshot.forEach((doc) => {
        const appointment = { id: doc.id, ...doc.data() };
        if (!appointment.userId) return;
        
        if (!userAppointments[appointment.userId]) {
          userAppointments[appointment.userId] = [];
        }
        userAppointments[appointment.userId].push(appointment);
      });
      
      // Send notifications and update appointments
      for (const [userId, appointments] of Object.entries(userAppointments)) {
        if (appointments.length === 0) continue;
        
        // Get the most recent appointment
        const latestAppointment = appointments.sort((a, b) => {
          return b.updatedAt.seconds - a.updatedAt.seconds;
        })[0];
        
        // Get vehicle details if available
        const vehicleDetails = latestAppointment.vehicleDetails || 'your vehicle';
        
        // Send notification
        await createNotification(
          userId,
          'Time for Another Detail',
          `It's been about 3 months since your last detailing service. Your ${vehicleDetails} would benefit from another professional detail to maintain its condition and appearance. Book your next appointment today!`,
          'info',
          {
            type: 'service_reminder',
            appointmentIds: appointments.map(a => a.id)
          }
        ).catch(error => {
          console.error(`Error sending follow-up notification to user ${userId}:`, error);
        });
        
        // Mark all appointments as having received follow-up
        const updatePromises = appointments.map(appointment => {
          return admin.firestore()
            .collection('appointments')
            .doc(appointment.id)
            .update({
              followUpSent: true,
              followUpSentAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await Promise.all(updatePromises);
      }
      
      return { success: true, count: Object.keys(userAppointments).length };
    } catch (error) {
      console.error('Error sending service follow-ups:', error);
      return { success: false, error: error.message };
    }
  });

// Export for direct access in index.js
exports.createNotification = createNotification;
