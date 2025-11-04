const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Make sure to use the existing admin instance from index.js
// This file assumes admin.initializeApp() is called in the main index.js

// Email configuration - Poveda Portal email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'povedaportal@gmail.com',
    pass: 'xzbi vnch pldc mdrf'  // App password for Poveda Portal
  }
});

/**
 * Send reminder email to user
 * @param {Object} appointment - Appointment data
 * @param {Object} emailData - Email template data (name, service, date, time, location, phone)
 */
async function sendReminderEmail(appointment, emailData) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">⏰ Appointment Reminder</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Your appointment is tomorrow!</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello <strong>${emailData.name}</strong>,</p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          This is a friendly reminder that your appointment for <strong>${emailData.service}</strong> is scheduled for <strong>tomorrow</strong>.
        </p>
        
        <!-- Appointment Details Box -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #f59e0b;">
          <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">📋 Appointment Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">📅 Date:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;"><strong>${emailData.date}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">🕒 Time:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;"><strong>${emailData.time}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">📍 Location:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;">${emailData.location}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">📞 Your Phone:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;">${emailData.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">🚗 Service:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;">${emailData.service}</td>
            </tr>
          </table>
        </div>
        
        <!-- Important Notes -->
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #fcd34d;">
          <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">⚠️ Important Reminders:</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #78350f; line-height: 1.8;">
            <li>Please ensure your vehicle is accessible at the scheduled location</li>
            <li>Have your keys ready for our team</li>
            <li>Clear any personal belongings from your vehicle</li>
            <li>If you need to reschedule, please contact us as soon as possible</li>
          </ul>
        </div>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 25px 0;">
          We're looking forward to servicing your vehicle tomorrow! If you have any questions or need to make changes to your appointment, please don't hesitate to contact us.
        </p>
        
        <!-- Action Buttons -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${emailData.rescheduleLink}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 5px;">View Appointment</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 25px; text-align: center; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          <strong>POVEDA PREMIUM AUTO CARE</strong><br>
          Professional Mobile Detailing Service<br>
          📧 povedaportal@gmail.com
        </p>
        <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px;">
          This is an automated reminder. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: 'Poveda Auto Care <povedaportal@gmail.com>',
    to: appointment.userEmail,
    subject: '⏰ Reminder: Your Appointment is Tomorrow - Poveda Auto Care',
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
}

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
      const userPhone = appointmentData.userPhone || 'Not provided'; // ✅ Extraer teléfono
      
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
          timeSlot,
          userPhone // ✅ Incluir teléfono en metadata
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
      const userPhone = after.userPhone || 'Not provided'; // ✅ Extraer teléfono
      
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
          currentStatus: after.status,
          userPhone // ✅ Incluir teléfono en metadata
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
 * Sends both in-app notifications AND email reminders
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
      let emailsSent = 0;
      let emailsFailed = 0;
      
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
        const userPhone = appointment.userPhone || 'Not provided'; // ✅ Extraer teléfono
        
        // Create in-app notification (only for registered users, not guests)
        if (appointment.userId !== 'guest') {
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
              timeSlot,
              userPhone // ✅ Incluir teléfono en metadata
            }
          ).catch(error => {
            console.error(`Error creating reminder notification for appointment ${doc.id}:`, error);
          });
          
          reminderPromises.push(notificationPromise);
        }
        
        // ✅ SEND EMAIL REMINDER (for ALL users - registered AND guests)
        if (appointment.userEmail) {
          const emailPromise = sendReminderEmail(appointment, {
            name: appointment.userName || 'Valued Customer',
            service: service,
            date: formattedDate,
            time: timeSlot,
            location: appointment.address ? 
              `${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state} ${appointment.address.zipCode}` : 
              'Your specified location',
            phone: userPhone,
            rescheduleLink: 'https://poveda-portal.vercel.app/appointments'
          }).then(() => {
            emailsSent++;
            console.log(`✅ Reminder email sent to ${appointment.userEmail}`);
          }).catch(error => {
            emailsFailed++;
            console.error(`❌ Error sending reminder email to ${appointment.userEmail}:`, error);
          });
          
          reminderPromises.push(emailPromise);
        } else {
          console.warn(`⚠️  No email address for appointment ${doc.id}, skipping email reminder`);
        }
        
        // Mark the appointment as having received a reminder
        doc.ref.update({
          reminderSent: true,
          reminderSentAt: admin.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
          console.error(`Error updating appointment ${doc.id} reminder status:`, error);
        });
      });
      
      await Promise.all(reminderPromises);
      
      console.log(`📧 Email reminders summary: ${emailsSent} sent, ${emailsFailed} failed`);
      
      return { 
        success: true, 
        count: snapshot.size,
        emailsSent: emailsSent,
        emailsFailed: emailsFailed
      };
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
