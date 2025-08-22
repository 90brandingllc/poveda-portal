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
exports.sendAppointmentReminder = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    try {
      const appointmentsSnapshot = await admin.firestore()
        .collection('appointments')
        .where('status', '==', 'approved')
        .where('emailReminders', '==', true)
        .where('date', '>=', tomorrow)
        .where('date', '<', dayAfterTomorrow)
        .get();

      const promises = appointmentsSnapshot.docs.map(async (doc) => {
        const appointment = doc.data();
        
        const mailOptions = {
          from: 'POVEDA PREMIUM AUTO CARE <noreply@povedaautocare.com>',
          to: appointment.userEmail,
          subject: 'Appointment Reminder - Tomorrow - POVEDA PREMIUM AUTO CARE',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">POVEDA PREMIUM AUTO CARE</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Appointment Reminder</p>
              </div>
              
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #1976d2; margin-top: 0;">Hello ${appointment.userName}!</h2>
                <p style="font-size: 16px;">This is a friendly reminder that your car detailing appointment is scheduled for <strong>tomorrow</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #1976d2; margin-top: 0;">Appointment Details</h3>
                  <p><strong>Service:</strong> ${appointment.service}</p>
                  <p><strong>Date:</strong> ${new Date(appointment.date.toDate()).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> ${appointment.time}</p>
                  <p><strong>Location:</strong> ${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state}</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;"><strong>Preparation Checklist:</strong></p>
                  <ul style="margin: 10px 0 0 0; color: #856404;">
                    <li>Remove all personal items from your vehicle</li>
                    <li>Ensure your vehicle is accessible</li>
                    <li>Have a water source available nearby</li>
                    <li>Clear any obstacles around the vehicle</li>
                  </ul>
                </div>
                
                <p>Our team will arrive promptly at the scheduled time. If you need to reschedule or have any questions, please contact us immediately.</p>
                
                <p>Contact Information:</p>
                <ul>
                  <li>Phone: (555) 123-4567</li>
                  <li>Email: info@povedaautocare.com</li>
                </ul>
                
                <p>We look forward to making your vehicle shine!</p>
                <p><strong>The POVEDA Team</strong></p>
              </div>
              
              <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE. All rights reserved.</p>
              </div>
            </div>
          `
        };

        return transporter.sendMail(mailOptions);
      });

      await Promise.all(promises);
      console.log(`Sent ${promises.length} appointment reminders`);
    } catch (error) {
      console.error('Error sending appointment reminders:', error);
    }

    return null;
  });
