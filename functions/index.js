const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Email configuration - replace with your SMTP settings
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().email.user, // Set using: firebase functions:config:set email.user="your-email@gmail.com"
    pass: functions.config().email.pass  // Set using: firebase functions:config:set email.pass="your-app-password"
  }
});

// Send appointment confirmation email
exports.sendAppointmentConfirmation = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointment = snap.data();
    
    if (!appointment.emailReminders) {
      return null;
    }

    const mailOptions = {
      from: 'POVEDA PREMIUM AUTO CARE <noreply@povedaautocare.com>',
      to: appointment.userEmail,
      subject: 'Appointment Confirmation - POVEDA PREMIUM AUTO CARE',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">POVEDA PREMIUM AUTO CARE</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your Appointment is Confirmed!</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #1976d2; margin-top: 0;">Hello ${appointment.userName}!</h2>
            <p>Thank you for choosing POVEDA PREMIUM AUTO CARE. Your appointment has been successfully booked and is pending approval.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Appointment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Service:</td>
                  <td style="padding: 8px 0;">${appointment.service}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                  <td style="padding: 8px 0;">${appointment.date ? new Date(appointment.date.toDate()).toLocaleDateString() : 'TBD'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0;">${appointment.time || 'TBD'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0;">${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Total Price:</td>
                  <td style="padding: 8px 0; color: #1976d2; font-weight: bold;">$${appointment.finalPrice || appointment.estimatedPrice}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1976d2;"><strong>What's Next?</strong></p>
              <p style="margin: 5px 0 0 0;">Our team will review your booking and contact you within 24 hours to confirm the details. You'll receive another email once your appointment is approved.</p>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us:</p>
            <ul>
              <li>Phone: (555) 123-4567</li>
              <li>Email: info@povedaautocare.com</li>
            </ul>
            
            <p>Thank you for choosing POVEDA PREMIUM AUTO CARE!</p>
            <p><strong>The POVEDA Team</strong></p>
          </div>
          
          <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE. All rights reserved.</p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Appointment confirmation email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }

    return null;
  });

// Send appointment status update email
exports.sendStatusUpdate = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Only send email if status changed and email reminders are enabled
    if (before.status === after.status || !after.emailReminders) {
      return null;
    }

    let subject, statusMessage, statusColor;
    
    switch (after.status) {
      case 'approved':
        subject = 'Appointment Approved - POVEDA PREMIUM AUTO CARE';
        statusMessage = 'Great news! Your appointment has been approved.';
        statusColor = '#2e7d32';
        break;
      case 'completed':
        subject = 'Service Completed - POVEDA PREMIUM AUTO CARE';
        statusMessage = 'Your service has been completed successfully!';
        statusColor = '#1976d2';
        break;
      case 'rejected':
        subject = 'Appointment Update - POVEDA PREMIUM AUTO CARE';
        statusMessage = 'Unfortunately, we couldn\'t accommodate your appointment at this time.';
        statusColor = '#d32f2f';
        break;
      default:
        return null;
    }

    const mailOptions = {
      from: 'POVEDA PREMIUM AUTO CARE <noreply@povedaautocare.com>',
      to: after.userEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">POVEDA PREMIUM AUTO CARE</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Appointment Status Update</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #1976d2; margin-top: 0;">Hello ${after.userName}!</h2>
            
            <div style="background: ${statusColor}; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0; text-transform: uppercase;">${after.status}</h3>
            </div>
            
            <p style="font-size: 16px;">${statusMessage}</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Appointment Details</h3>
              <p><strong>Service:</strong> ${after.service}</p>
              <p><strong>Date:</strong> ${after.date ? new Date(after.date.toDate()).toLocaleDateString() : 'TBD'}</p>
              <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${after.status}</span></p>
            </div>
            
            ${after.status === 'approved' ? `
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #2e7d32;"><strong>Next Steps:</strong></p>
                <p style="margin: 5px 0 0 0;">We'll arrive at your location at the scheduled time. Please ensure your vehicle is accessible and remove any personal items.</p>
              </div>
            ` : ''}
            
            ${after.status === 'completed' ? `
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1976d2;"><strong>Thank You!</strong></p>
                <p style="margin: 5px 0 0 0;">We hope you're satisfied with our service. Please consider leaving us a review and don't hesitate to book again!</p>
              </div>
            ` : ''}
            
            <p>If you have any questions, please contact us:</p>
            <ul>
              <li>Phone: (555) 123-4567</li>
              <li>Email: info@povedaautocare.com</li>
            </ul>
            
            <p>Thank you for choosing POVEDA PREMIUM AUTO CARE!</p>
            <p><strong>The POVEDA Team</strong></p>
          </div>
          
          <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE. All rights reserved.</p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Status update email sent for appointment ${context.params.appointmentId}`);
    } catch (error) {
      console.error('Error sending status update email:', error);
    }

    return null;
  });

// Send appointment reminder (24 hours before)
exports.send24HourReminder = functions.pubsub
  .schedule('every hour')
  .timeZone('America/New_York') // Set your timezone
  .onRun(async (context) => {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    try {
      const appointmentsSnapshot = await admin.firestore()
        .collection('appointments')
        .where('status', 'in', ['approved', 'confirmed'])
        .where('emailReminders', '==', true)
        .get();

      const promises = appointmentsSnapshot.docs
        .filter(doc => {
          const appointment = doc.data();
          if (!appointment.date || !appointment.time) return false;
          
          const appointmentDateTime = getAppointmentDateTime(appointment);
          const timeDiff = appointmentDateTime.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // Send reminder if appointment is between 24-25 hours away and no 24h reminder sent yet
          return hoursDiff >= 24 && hoursDiff < 25 && !appointment.reminder24hSent;
        })
        .map(async (doc) => {
          const appointment = doc.data();
          const appointmentDateTime = getAppointmentDateTime(appointment);
          
          const mailOptions = {
            from: 'POVEDA PREMIUM AUTO CARE <noreply@povedaautocare.com>',
            to: appointment.userEmail,
            subject: 'Appointment Reminder - Tomorrow - POVEDA PREMIUM AUTO CARE',
            html: getReminderEmailTemplate(appointment, '24 hours', 'tomorrow')
          };

          // Send email and mark as sent
          await transporter.sendMail(mailOptions);
          await doc.ref.update({ reminder24hSent: true });
          
          console.log(`24h reminder sent for appointment ${doc.id}`);
          return true;
        });

      await Promise.all(promises);
      console.log(`Processed ${promises.length} 24-hour reminders`);
    } catch (error) {
      console.error('Error sending 24-hour reminders:', error);
    }

    return null;
  });

// Send appointment reminder (2 hours before)
exports.send2HourReminder = functions.pubsub
  .schedule('every 30 minutes')
  .timeZone('America/New_York') // Set your timezone
  .onRun(async (context) => {
    const now = new Date();

    try {
      const appointmentsSnapshot = await admin.firestore()
        .collection('appointments')
        .where('status', 'in', ['approved', 'confirmed'])
        .where('emailReminders', '==', true)
        .get();

      const promises = appointmentsSnapshot.docs
        .filter(doc => {
          const appointment = doc.data();
          if (!appointment.date || !appointment.time) return false;
          
          const appointmentDateTime = getAppointmentDateTime(appointment);
          const timeDiff = appointmentDateTime.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // Send reminder if appointment is between 2-2.5 hours away and no 2h reminder sent yet
          return hoursDiff >= 2 && hoursDiff < 2.5 && !appointment.reminder2hSent;
        })
        .map(async (doc) => {
          const appointment = doc.data();
          
          const mailOptions = {
            from: 'POVEDA PREMIUM AUTO CARE <noreply@povedaautocare.com>',
            to: appointment.userEmail,
            subject: 'Appointment Reminder - In 2 Hours - POVEDA PREMIUM AUTO CARE',
            html: getReminderEmailTemplate(appointment, '2 hours', 'in about 2 hours')
          };

          // Send email and mark as sent
          await transporter.sendMail(mailOptions);
          await doc.ref.update({ reminder2hSent: true });
          
          console.log(`2h reminder sent for appointment ${doc.id}`);
          return true;
        });

      await Promise.all(promises);
      console.log(`Processed ${promises.length} 2-hour reminders`);
    } catch (error) {
      console.error('Error sending 2-hour reminders:', error);
    }

    return null;
  });

// Helper function to combine date and time into a proper DateTime
function getAppointmentDateTime(appointment) {
  const appointmentDate = appointment.date.toDate();
  const timeString = appointment.time || '09:00';
  const [hours, minutes] = timeString.split(':');
  
  const dateTime = new Date(appointmentDate);
  dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return dateTime;
}

// Helper function for reminder email template
function getReminderEmailTemplate(appointment, timeFrame, timeDescription) {
  const isUrgent = timeFrame === '2 hours';
  const urgentStyle = isUrgent ? 'background: #fff3cd; border-left: 4px solid #ffc107;' : 'background: #e3f2fd; border-left: 4px solid #1976d2;';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">POVEDA PREMIUM AUTO CARE</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">⏰ Appointment Reminder - ${timeFrame}</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #1976d2; margin-top: 0;">Hello ${appointment.userName}!</h2>
        <p style="font-size: 18px;">Your car detailing appointment is scheduled for <strong>${timeDescription}</strong>.</p>
        
        <div style="${urgentStyle} padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: ${isUrgent ? '#856404' : '#1976d2'}; font-weight: bold;">
            ${isUrgent ? '🚨 Final Reminder - Please prepare your vehicle now!' : '📅 Don\'t forget about your appointment tomorrow!'}
          </p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="color: #1976d2; margin-top: 0;">📋 Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">🚗 Service:</td>
              <td style="padding: 8px 0;">${appointment.service}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">📅 Date:</td>
              <td style="padding: 8px 0;">${new Date(appointment.date.toDate()).toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">⏰ Time:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1976d2;">${appointment.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">📍 Location:</td>
              <td style="padding: 8px 0;">${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">💰 Total:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #2e7d32;">$${appointment.finalPrice || appointment.estimatedPrice}</td>
            </tr>
          </table>
        </div>
        
        ${isUrgent ? `
          <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
            <p style="margin: 0; color: #c62828; font-weight: bold;">⚠️ Last-Minute Preparation:</p>
            <ul style="margin: 10px 0 0 0; color: #c62828;">
              <li>Move your vehicle to an accessible location NOW</li>
              <li>Remove all personal items immediately</li>
              <li>Unlock any gates or barriers</li>
              <li>Be available to answer our call</li>
            </ul>
          </div>
        ` : `
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-weight: bold;">✅ Preparation Checklist:</p>
            <ul style="margin: 10px 0 0 0; color: #856404;">
              <li>Remove all personal items from your vehicle</li>
              <li>Ensure your vehicle is accessible</li>
              <li>Have a water source available nearby</li>
              <li>Clear any obstacles around the vehicle</li>
              <li>Make sure gates/driveways are accessible</li>
            </ul>
          </div>
        `}
        
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32; font-weight: bold;">📞 Need to Reschedule or Have Questions?</p>
          <p style="margin: 5px 0 0 0; color: #2e7d32;">Contact us immediately:</p>
          <ul style="margin: 5px 0 0 0; color: #2e7d32;">
            <li>📱 Phone: (555) 123-4567</li>
            <li>📧 Email: info@povedaautocare.com</li>
          </ul>
        </div>
        
        <p style="text-align: center; font-size: 16px;">We look forward to making your vehicle shine! ✨</p>
        <p style="text-align: center;"><strong>The POVEDA Team</strong></p>
      </div>
      
      <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE. All rights reserved.</p>
      </div>
    </div>
  `;
}

// Clean up reminder flags for past appointments (runs daily)
exports.cleanupReminderFlags = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const now = new Date();
    const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    yesterdayStart.setHours(0, 0, 0, 0);

    try {
      const appointmentsSnapshot = await admin.firestore()
        .collection('appointments')
        .where('date', '<', yesterdayStart)
        .get();

      const batch = admin.firestore().batch();
      
      appointmentsSnapshot.docs.forEach(doc => {
        const appointment = doc.data();
        if (appointment.reminder24hSent || appointment.reminder2hSent) {
          batch.update(doc.ref, {
            reminder24hSent: admin.firestore.FieldValue.delete(),
            reminder2hSent: admin.firestore.FieldValue.delete()
          });
        }
      });

      if (appointmentsSnapshot.docs.length > 0) {
        await batch.commit();
        console.log(`Cleaned up reminder flags for ${appointmentsSnapshot.docs.length} past appointments`);
      }
    } catch (error) {
      console.error('Error cleaning up reminder flags:', error);
    }

    return null;
  });

// Reset reminder flags when appointment status changes to cancelled/rejected
exports.resetReminderFlags = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Reset reminder flags if appointment was cancelled or rejected
    if (before.status !== after.status && 
        (after.status === 'cancelled' || after.status === 'rejected')) {
      
      const updates = {};
      if (after.reminder24hSent) updates.reminder24hSent = admin.firestore.FieldValue.delete();
      if (after.reminder2hSent) updates.reminder2hSent = admin.firestore.FieldValue.delete();
      
      if (Object.keys(updates).length > 0) {
        await change.after.ref.update(updates);
        console.log(`Reset reminder flags for cancelled/rejected appointment ${context.params.appointmentId}`);
      }
    }
    
    return null;
  });
