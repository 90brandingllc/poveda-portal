const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// Email configuration - Poveda Portal email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'povedaportal@gmail.com', // Poveda Portal email
    pass: 'xzbi vnch pldc mdrf'  // App password for Poveda Portal
  }
});

// General function for sending emails from frontend
exports.sendEmail = functions.https.onCall(async (data, context) => {
  try {
    const { to, template } = data;
    
    if (!to) {
      throw new functions.https.HttpsError('invalid-argument', 'Recipient email is required');
    }

    // Determine template based on user context
    let subject, htmlContent;
    
    switch(template.name) {
      case 'appointment_confirmation':
        subject = '🚗 Appointment Confirmed - Poveda Auto Care';
        htmlContent = createAppointmentConfirmationEmail(template.data);
        break;
      case 'guest_url_appointment':
        subject = '🚗 Your Booking from Quick Link - Poveda Auto Care';
        htmlContent = createGuestUrlAppointmentEmail(template.data);
        break;
      case 'appointment_reminder':
        subject = '⏰ Reminder: Your Appointment is Tomorrow - Poveda Auto Care';
        htmlContent = createAppointmentReminderEmail(template.data);
        break;
      default:
        subject = 'Notification from Poveda Auto Care';
        htmlContent = createDefaultEmail(template.data);
    }

    // Prepare email data
    const mailOptions = {
      from: `Poveda Auto Care <povedaportal@gmail.com>`,
      to,
      subject,
      html: htmlContent,
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email (${template.name}) sent successfully to ${to}:`, info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', `Failed to send email: ${error.message}`);
  }
});

// Email template functions
function createAppointmentConfirmationEmail(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Appointment is Confirmed!</h2>
      <p>Hello ${data.name || 'Valued Customer'},</p>
      <p>Your appointment for <strong>${data.service || 'your selected service'}</strong> has been confirmed.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>📅 Date:</strong> ${data.date || 'Scheduled date'}</p>
        <p><strong>🕒 Time:</strong> ${data.time || 'Scheduled time'}</p>
        <p><strong>📍 Location:</strong> ${data.location || 'Service location'}</p>
        <p><strong>📞 Contact Phone:</strong> ${data.phone || 'Not provided'}</p>
        <p><strong>💲 Deposit Paid:</strong> ${data.depositAmount || 'Deposit amount'}</p>
        <p><strong>💰 Remaining Balance:</strong> ${data.remainingBalance || 'Remaining balance'}</p>
        <p><strong>💵 Total Price:</strong> ${data.estimatedPrice || 'Total price'}</p>
      </div>
      
      <p>We're looking forward to servicing your vehicle.</p>
      <p>If you need to make any changes, please contact us.</p>
    </div>
  `;
}

function createGuestUrlAppointmentEmail(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Quick Booking is Confirmed!</h2>
      <p>Hello ${data.name || 'Valued Customer'},</p>
      <p>Your appointment for <strong>${data.service || 'your selected service'}</strong> has been confirmed.</p>
      
      <div style="background-color: #f8f4ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6200ee;">
        <p style="color: #6200ee; font-weight: bold;">💡 ${data.specialMessage || "We noticed you booked this appointment from a direct service link."}</p>
        <p>You selected: <strong>${data.serviceFromUrl || data.service || 'a service'}</strong></p>
        <a href="${data.registerUrl || "https://poveda-portal.vercel.app/register"}" style="background-color: #6200ee; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Create Your Account</a>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>📅 Date:</strong> ${data.date || 'Scheduled date'}</p>
        <p><strong>🕒 Time:</strong> ${data.time || 'Scheduled time'}</p>
        <p><strong>📍 Location:</strong> ${data.location || 'Service location'}</p>
        <p><strong>📞 Contact Phone:</strong> ${data.phone || 'Not provided'}</p>
        <p><strong>💲 Deposit Paid:</strong> ${data.depositAmount || 'Deposit amount'}</p>
        <p><strong>💰 Remaining Balance:</strong> ${data.remainingBalance || 'Remaining balance'}</p>
        <p><strong>💵 Total Price:</strong> ${data.estimatedPrice || 'Total price'}</p>
      </div>
      
      <p>We're looking forward to servicing your vehicle.</p>
    </div>
  `;
}

function createAppointmentReminderEmail(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">⏰ Appointment Reminder</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Your appointment is tomorrow!</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello <strong>${data.name || 'Valued Customer'}</strong>,</p>
        
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          This is a friendly reminder that your appointment for <strong>${data.service || 'your selected service'}</strong> is scheduled for <strong>tomorrow</strong>.
        </p>
        
        <!-- Appointment Details Box -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #f59e0b;">
          <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">📋 Appointment Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">📅 Date:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;"><strong>${data.date || 'Scheduled date'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">🕒 Time:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;"><strong>${data.time || 'Scheduled time'}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">📍 Location:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;">${data.location || 'Service location'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">📞 Your Phone:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;">${data.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #92400e; font-weight: 600; font-size: 15px;">🚗 Service:</td>
              <td style="padding: 8px 0; color: #451a03; font-size: 15px;">${data.service || 'Your service'}</td>
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
          <a href="${data.rescheduleLink || 'https://poveda-portal.vercel.app/appointments'}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 5px;">View Appointment</a>
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
}

function createDefaultEmail(data) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Notification from Poveda Auto Care</h2>
      <p>Hello ${data.name || 'Valued Customer'},</p>
      <p>${data.message || 'Thank you for choosing Poveda Auto Care.'}</p>
    </div>
  `;
}
