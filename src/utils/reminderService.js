import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createAppointmentReminderNotification } from './notificationService';
import { sendAppointmentReminderEmail } from './emailService';

/**
 * Service for managing appointment reminders
 * These functions would typically be run on a schedule using Cloud Functions
 */

/**
 * Send reminders for appointments scheduled for tomorrow
 * This should be run once a day (e.g. at 9am)
 */
export const sendDayBeforeReminders = async () => {
  try {
    // Calculate tomorrow's date (start and end)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);
    
    // Query for tomorrow's appointments
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('date', '>=', Timestamp.fromDate(tomorrow)),
      where('date', '<=', Timestamp.fromDate(tomorrowEnd)),
      where('status', '==', 'approved')
    );
    
    const snapshot = await getDocs(appointmentsQuery);
    console.log(`Found ${snapshot.size} appointments scheduled for tomorrow`);
    
    const reminderPromises = [];
    
    snapshot.forEach((doc) => {
      const appointment = { id: doc.id, ...doc.data() };
      
      // Send in-app notification
      const notificationPromise = createAppointmentReminderNotification(
        appointment.userId,
        appointment
      ).catch(error => {
        console.error(`Error sending in-app notification for appointment ${doc.id}:`, error);
      });
      
      // Send email if enabled
      let emailPromise = Promise.resolve();
      if (appointment.emailReminders && appointment.userEmail) {
        emailPromise = sendAppointmentReminderEmail(appointment).catch(error => {
          console.error(`Error sending email reminder for appointment ${doc.id}:`, error);
        });
      }
      
      reminderPromises.push(notificationPromise, emailPromise);
    });
    
    await Promise.all(reminderPromises);
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error sending day-before reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send reminders for appointments scheduled for today
 * This should be run once a day (e.g. at 7am)
 */
export const sendSameDayReminders = async () => {
  try {
    // Calculate today's date (start and end)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Query for today's appointments
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('date', '>=', Timestamp.fromDate(today)),
      where('date', '<=', Timestamp.fromDate(todayEnd)),
      where('status', '==', 'approved')
    );
    
    const snapshot = await getDocs(appointmentsQuery);
    console.log(`Found ${snapshot.size} appointments scheduled for today`);
    
    const reminderPromises = [];
    
    snapshot.forEach((doc) => {
      const appointment = { id: doc.id, ...doc.data() };
      
      // Create a special notification for today's appointments
      const notificationPromise = createNotification(
        appointment.userId,
        'Your Appointment is Today',
        `Your ${appointment.services?.join(', ') || 'service'} is scheduled for today at ${appointment.timeSlot || appointment.time}. Please ensure your vehicle is accessible.`,
        'warning',
        {
          type: 'appointment_today',
          appointmentId: appointment.id
        }
      ).catch(error => {
        console.error(`Error sending in-app notification for appointment ${doc.id}:`, error);
      });
      
      // Send email if enabled with a special subject for urgency
      let emailPromise = Promise.resolve();
      if (appointment.emailReminders && appointment.userEmail) {
        emailPromise = sendAppointmentReminderEmail({
          ...appointment,
          isToday: true  // Add a flag for the email template
        }).catch(error => {
          console.error(`Error sending email reminder for appointment ${doc.id}:`, error);
        });
      }
      
      reminderPromises.push(notificationPromise, emailPromise);
    });
    
    await Promise.all(reminderPromises);
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error sending same-day reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Function to schedule sending of service follow-up reminders
 * This should run weekly to find vehicles that need service
 */
export const sendServiceFollowUpReminders = async () => {
  try {
    // Calculate date threshold (e.g. 3 months ago)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Query for completed appointments from ~3 months ago
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('status', '==', 'completed'),
      where('updatedAt', '<=', Timestamp.fromDate(threeMonthsAgo))
    );
    
    const snapshot = await getDocs(appointmentsQuery);
    console.log(`Found ${snapshot.size} vehicles due for service follow-up`);
    
    // Group by user to avoid multiple reminders
    const userVehicles = {};
    
    snapshot.forEach((doc) => {
      const appointment = { id: doc.id, ...doc.data() };
      if (!userVehicles[appointment.userId]) {
        userVehicles[appointment.userId] = [];
      }
      userVehicles[appointment.userId].push(appointment);
    });
    
    const reminderPromises = [];
    
    // For each user, send a notification about their vehicles due for service
    for (const [userId, appointments] of Object.entries(userVehicles)) {
      if (appointments.length === 0) continue;
      
      // Take the first appointment to get user details
      const userAppointment = appointments[0];
      
      // Send notification with vehicle list
      const notificationPromise = createNotification(
        userId,
        'Time for a Service Check-Up',
        `It's been about 3 months since your last service. Your vehicle would benefit from another detailing session to maintain its condition.`,
        'info',
        {
          type: 'service_reminder',
          appointmentIds: appointments.map(a => a.id)
        }
      ).catch(error => {
        console.error(`Error sending service follow-up notification for user ${userId}:`, error);
      });
      
      reminderPromises.push(notificationPromise);
      
      // Could also send email here if desired
    }
    
    await Promise.all(reminderPromises);
    return { success: true, count: Object.keys(userVehicles).length };
  } catch (error) {
    console.error('Error sending service follow-up reminders:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendDayBeforeReminders,
  sendSameDayReminders,
  sendServiceFollowUpReminders
};
