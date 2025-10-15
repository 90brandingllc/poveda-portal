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
        <p><strong>💲 Deposit Paid:</strong> ${data.depositAmount || 'Deposit amount'}</p>
        <p><strong>💰 Remaining Balance:</strong> ${data.remainingBalance || 'Remaining balance'}</p>
        <p><strong>💵 Total Price:</strong> ${data.estimatedPrice || 'Total price'}</p>
      </div>
      
      <p>We're looking forward to servicing your vehicle.</p>
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
