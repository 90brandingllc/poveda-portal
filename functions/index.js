const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Initialize Stripe with environment-based key selection
// Default to LIVE keys for production. Set NODE_ENV=development to use test keys.
const getStripeKey = () => {
  const nodeEnv = process.env.NODE_ENV;
  const isDevelopment = nodeEnv === 'development';
  
  let key;
  if (isDevelopment) {
    key = functions.config().stripe?.test_secret_key || 
          process.env.STRIPE_TEST_SECRET_KEY || 
          functions.config().stripe?.live_secret_key;
  } else {
    key = functions.config().stripe?.live_secret_key || 
          process.env.STRIPE_LIVE_SECRET_KEY;
  }
  
  // Log configuration status (without exposing the full key)
  console.log('🔧 Stripe Configuration:');
  console.log(`   Environment: ${nodeEnv || 'not set (defaulting to production)'}`);
  console.log(`   Using ${isDevelopment ? 'TEST' : 'LIVE'} keys`);
  console.log(`   Key found: ${key ? `Yes (${key.substring(0, 12)}...)` : 'NO - CRITICAL ERROR'}`);
  
  if (!key) {
    console.error('❌ CRITICAL: No Stripe key configured!');
    console.error('   Please set either:');
    console.error('   - Firebase: firebase functions:config:set stripe.live_secret_key="sk_live_..."');
    console.error('   - Or ENV: export STRIPE_LIVE_SECRET_KEY="sk_live_..."');
  }
  
  return key;
};

const stripe = require('stripe')(getStripeKey());

admin.initializeApp();

// Email configuration - Poveda Portal email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'povedaportal@gmail.com', // Poveda Portal email
    pass: 'xzbi vnch pldc mdrf'  // App password for Poveda Portal
  }
});

// Google Calendar configuration
// You'll need to replace these with your actual Google Calendar API credentials
const GOOGLE_CALENDAR_CREDENTIALS = {
  type: "service_account",
  project_id: "your-project-id",
  private_key_id: "your-private-key-id",
  private_key: "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  client_email: "your-service-account@your-project-id.iam.gserviceaccount.com",
  client_id: "your-client-id",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com"
};

const ADMIN_CALENDAR_ID = 'your-admin-calendar@gmail.com'; // Replace with admin's calendar ID

// Helper function to get the phone number from an appointment object
function getPhoneNumber(appointment) {
  return appointment.userPhone || appointment.phoneNumber || 'Not provided';
}

// Helper function to get services from an appointment object
// Handles both old format (service: string) and new format (services: array)
function getServices(appointment) {
  if (appointment.services && Array.isArray(appointment.services)) {
    // New format: array of service names
    return appointment.services.join(', ');
  } else if (appointment.service) {
    // Old format: single service string
    return appointment.service;
  } else if (appointment.servicePackage) {
    // Alternative field name
    return appointment.servicePackage;
  }
  return 'Service details not available';
}

// Helper function to load email template from Firestore
async function getEmailTemplate(templateId) {
  try {
    const templateDoc = await admin.firestore()
      .collection('emailTemplates')
      .doc(templateId)
      .get();
    
    if (!templateDoc.exists) {
      console.warn(`Template ${templateId} not found, using fallback`);
      return null;
    }
    
    const template = templateDoc.data();
    if (!template.isActive) {
      console.warn(`Template ${templateId} is inactive, using fallback`);
      return null;
    }
    
    return template;
  } catch (error) {
    console.error(`Error loading template ${templateId}:`, error);
    return null;
  }
}

// Helper function to replace template variables
function replaceTemplateVariables(htmlContent, variables) {
  let processedContent = htmlContent;
  
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, variables[key] || '');
  });
  
  return processedContent;
}

// Helper function to create Google Calendar event
async function createCalendarEvent(appointment) {
  try {
    // Create JWT auth client
    const jwtClient = new google.auth.JWT(
      GOOGLE_CALENDAR_CREDENTIALS.client_email,
      null,
      GOOGLE_CALENDAR_CREDENTIALS.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );

    // Authorize the client
    await jwtClient.authorize();

    // Create calendar API instance
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    // Calculate appointment start and end times
    const appointmentDate = appointment.date.toDate();
    const timeString = appointment.time || '09:00';
    const [hours, minutes] = timeString.split(':');
    
    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Assume 2-hour duration for car detailing services
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

    // Create event object
    const event = {
      summary: `Car Detailing - ${getServices(appointment)}`,
      description: `
Client: ${appointment.userName}
Email: ${appointment.userEmail}
Phone: ${getPhoneNumber(appointment)}
Service: ${getServices(appointment)}
Category: ${appointment.category}
Location: ${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state} ${appointment.address.zipCode}
Price: $${appointment.finalPrice || appointment.estimatedPrice}
Status: ${appointment.status}
Notes: ${appointment.notes || 'No additional notes'}

Payment Status: ${appointment.paymentStatus}
${appointment.paymentId ? `Payment ID: ${appointment.paymentId}` : ''}
      `.trim(),
      location: `${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state} ${appointment.address.zipCode}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        {
          email: appointment.userEmail,
          displayName: appointment.userName,
        },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 120 }, // 2 hours before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // Insert the event
    const response = await calendar.events.insert({
      calendarId: ADMIN_CALENDAR_ID,
      resource: event,
    });

    console.log(`Calendar event created: ${response.data.htmlLink}`);
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Send appointment confirmation email and create calendar event
exports.sendAppointmentConfirmation = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointment = snap.data();
    const appointmentId = context.params.appointmentId;
    
    // 🔍 DEBUG: Log appointment data
    console.log('========================================');
    console.log('📧 SENDING CONFIRMATION EMAIL');
    console.log('========================================');
    console.log('Appointment ID:', appointmentId);
    console.log('services (array):', appointment.services);
    console.log('service (string):', appointment.service);
    console.log('category:', appointment.category);
    console.log('time:', appointment.time);
    console.log('timeSlot:', appointment.timeSlot);
    console.log('getServices() result:', getServices(appointment));
    console.log('========================================');
    
    // Send email if email reminders are enabled
    if (appointment.emailReminders) {
      try {
        // Load template from Firestore
        const template = await getEmailTemplate('appointment_confirmation');
        
        let emailHtml, emailSubject;
        
        if (template) {
          // Use dynamic template
          const templateVariables = {
            userName: appointment.userName,
            service: getServices(appointment),
            category: appointment.category || 'N/A',
            date: appointment.date ? new Date(appointment.date.toDate()).toLocaleDateString() : 'TBD',
            time: appointment.timeSlot || appointment.time || 'TBD',
            address: `${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state}`,
            phone: getPhoneNumber(appointment), // ✅ Incluir teléfono
            finalPrice: appointment.finalPrice || appointment.estimatedPrice,
            estimatedPrice: appointment.estimatedPrice
          };
          
          emailHtml = replaceTemplateVariables(template.htmlContent, templateVariables);
          emailSubject = template.subject;
        } else {
          // Fallback to hardcoded template
          emailSubject = 'Appointment Confirmation - POVEDA PREMIUM AUTO CARE';
          emailHtml = `
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
                      <td style="padding: 8px 0;">${getServices(appointment)}</td>
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
                      <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                      <td style="padding: 8px 0;">${getPhoneNumber(appointment)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold;">Total Price:</td>
                      <td style="padding: 8px 0; color: #1976d2; font-weight: bold;">$${appointment.finalPrice || appointment.estimatedPrice}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #1976d2;"><strong>What's Next?</strong></p>
                  <p style="margin: 5px 0 0 0;">Our team will review your booking and contact you within 24 hours to confirm the details.</p>
                </div>
                
                <p>If you have any questions, please contact us:</p>
                <ul>
                  <li>Phone: 📞 614 653 5882</li>
                  <li>Email: support@povedapremiumautocare.com</li>
                  <li>Address: 4529 Parkwick Dr, Columbus, OH 43228</li>
                </ul>
                
                <p>Thank you for choosing POVEDA PREMIUM AUTO CARE!</p>
                <p><strong>The POVEDA Team</strong></p>
              </div>
              
              <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE. All rights reserved.</p>
              </div>
            </div>
          `;
        }

        const mailOptions = {
          from: 'POVEDA PREMIUM AUTO CARE <noreply@povedaautocare.com>',
          to: appointment.userEmail,
          subject: emailSubject,
          html: emailHtml
        };

        await transporter.sendMail(mailOptions);
        console.log('Appointment confirmation email sent to user successfully');
      } catch (error) {
        console.error('Error sending email to user:', error);
      }
    }

    // ✅ NUEVO: Enviar email a todos los administradores
    try {
      // 🔍 LOG COMPLETO DEL APPOINTMENT PARA DEBUGGING
      console.log('========================================');
      console.log('📊 APPOINTMENT DATA FOR ADMIN EMAIL:');
      console.log('========================================');
      console.log('userName:', appointment.userName);
      console.log('userEmail:', appointment.userEmail);
      console.log('userPhone:', appointment.userPhone);
      console.log('phoneNumber:', appointment.phoneNumber);
      console.log('phone:', appointment.phone);
      console.log('isGuestBooking:', appointment.isGuestBooking);
      console.log('========================================');
      
      // Buscar todos los usuarios con role 'admin'
      const adminsSnapshot = await admin.firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .get();
      
      if (!adminsSnapshot.empty) {
        console.log(`Found ${adminsSnapshot.size} admin(s), sending notification emails...`);
        
        // Enviar email a cada administrador
        const adminEmailPromises = adminsSnapshot.docs.map(async (adminDoc) => {
          const adminData = adminDoc.data();
          const adminEmail = adminData.email;
          
          if (!adminEmail) {
            console.warn(`Admin ${adminDoc.id} has no email address`);
            return;
          }
          
          const adminMailOptions = {
            from: 'POVEDA PORTAL SYSTEM <povedaportal@gmail.com>',
            to: adminEmail,
            subject: `🆕 NEW APPOINTMENT REQUEST - ${appointment.userName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px;">🆕 NEW APPOINTMENT REQUEST</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px;">A new customer has requested an appointment</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                  <div style="background: #2196f3; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h2 style="margin: 0;">NEW APPOINTMENT ALERT</h2>
                  </div>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                    <h3 style="color: #1976d2; margin-top: 0;">👤 Customer Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #1976d2; font-weight: 600;">Name:</td>
                        <td style="padding: 8px 0; color: #333;">${appointment.userName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #1976d2; font-weight: 600;">Email:</td>
                        <td style="padding: 8px 0; color: #333;"><a href="mailto:${appointment.userEmail}">${appointment.userEmail || 'N/A'}</a></td>
                      </tr>
                      <tr style="background-color: #fff3cd; border-left: 4px solid #ffc107;">
                        <td style="padding: 12px; color: #856404; font-weight: 700; font-size: 16px;">📞 Phone:</td>
                        <td style="padding: 12px; color: #856404; font-weight: 700; font-size: 16px;">
                          <a href="tel:${appointment.userPhone || ''}" style="color: #856404; text-decoration: none;">
                            ${appointment.userPhone || appointment.phoneNumber || appointment.phone || 'NOT PROVIDED ⚠️'}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #1976d2; font-weight: 600;">Guest Booking:</td>
                        <td style="padding: 8px 0; color: #333;">${appointment.isGuestBooking ? 'Yes' : 'No'}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                    <h3 style="color: #4caf50; margin-top: 0;">Appointment Details</h3>
                    <p><strong>Service:</strong> ${getServices(appointment)}</p>
                    <p><strong>Category:</strong> ${appointment.category || 'N/A'}</p>
                    <p><strong>Date:</strong> ${appointment.date ? new Date(appointment.date.toDate()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}</p>
                    <p><strong>Time:</strong> ${appointment.time || 'TBD'}</p>
                    <p><strong>Location:</strong> ${appointment.address ? `${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state} ${appointment.address.zipCode}` : 'N/A'}</p>
                    <p><strong>Price:</strong> <span style="color: #4caf50; font-size: 1.2em; font-weight: bold;">$${appointment.finalPrice || appointment.estimatedPrice || 'N/A'}</span></p>
                  </div>
                  
                  ${appointment.vehicleInfo ? `
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                      <h3 style="color: #ff9800; margin-top: 0;">🚗 Vehicle Information</h3>
                      <p><strong>Make:</strong> ${appointment.vehicleInfo.make || 'N/A'}</p>
                      <p><strong>Model:</strong> ${appointment.vehicleInfo.model || 'N/A'}</p>
                      <p><strong>Year:</strong> ${appointment.vehicleInfo.year || 'N/A'}</p>
                      <p><strong>Color:</strong> ${appointment.vehicleInfo.color || 'N/A'}</p>
                    </div>
                  ` : ''}
                  
                  ${appointment.notes ? `
                    <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #e65100;"><strong>📝 Customer Notes:</strong></p>
                      <p style="margin: 5px 0 0 0;">${appointment.notes}</p>
                    </div>
                  ` : ''}
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9c27b0;">
                    <h3 style="color: #9c27b0; margin-top: 0;">💳 Payment Information</h3>
                    <p><strong>Payment Status:</strong> <span style="color: ${appointment.paymentStatus === 'paid' ? '#4caf50' : '#ff9800'}; font-weight: bold; text-transform: uppercase;">${appointment.paymentStatus || 'PENDING'}</span></p>
                    ${appointment.paymentMethod ? `<p><strong>Payment Method:</strong> ${appointment.paymentMethod}</p>` : ''}
                    ${appointment.paymentId ? `<p><strong>Payment ID:</strong> ${appointment.paymentId}</p>` : ''}
                    ${appointment.depositAmount ? `<p><strong>Deposit Amount:</strong> $${appointment.depositAmount}</p>` : ''}
                  </div>
                  
                  <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #1976d2;"><strong>💡 Next Steps:</strong></p>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                      <li>Review the appointment details</li>
                      <li>Check your calendar availability</li>
                      <li><strong>Approve or reject the appointment in the admin portal</strong></li>
                      <li>Customer will be notified automatically</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://poveda-portal.vercel.app/admin/appointments" 
                       style="display: inline-block; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      🔍 VIEW IN ADMIN PORTAL
                    </a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    This is an automated notification from the POVEDA Portal System.
                    <br>Appointment ID: ${appointmentId}
                    <br>Created: ${new Date().toLocaleString()}
                  </p>
                </div>
                
                <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
                  <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE - Internal System Notification</p>
                </div>
              </div>
            `
          };
          
          try {
            await transporter.sendMail(adminMailOptions);
            console.log(`✅ New appointment notification sent to admin: ${adminEmail}`);
          } catch (emailError) {
            console.error(`❌ Error sending email to admin ${adminEmail}:`, emailError);
          }
        });
        
        await Promise.all(adminEmailPromises);
        console.log('✅ All admin notification emails sent successfully');
        
      } else {
        console.warn('⚠️ No admin users found in the system');
      }
    } catch (adminEmailError) {
      console.error('❌ Error sending admin notification emails:', adminEmailError);
      // Don't fail the whole function if admin emails fail
    }

    // Create Google Calendar event for admin
    try {
      const calendarEvent = await createCalendarEvent(appointment);
      console.log(`Calendar event created successfully for appointment ${appointmentId}`);
      
      // Optionally store the calendar event ID in the appointment document
      await snap.ref.update({
        calendarEventId: calendarEvent.id,
        calendarEventUrl: calendarEvent.htmlLink
      });
    } catch (error) {
      console.error(`Error creating calendar event for appointment ${appointmentId}:`, error);
      // Don't fail the entire function if calendar creation fails
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
      case 'cancelled':
        subject = 'Appointment Cancelled - POVEDA PREMIUM AUTO CARE';
        statusMessage = 'Your appointment has been cancelled as requested.';
        statusColor = '#9e9e9e';
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
              <li>Phone: (614) 653-5882</li>
              <li>Email: support@povedapremiumautocare.com</li>
              <li>Address: 4529 Parkwick Dr, Columbus, OH 43228</li>
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
      // Send email to user
      await transporter.sendMail(mailOptions);
      console.log(`Status update email sent to user for appointment ${context.params.appointmentId}`);
      
      // ✅ NUEVO: Si la cita fue cancelada, enviar email adicional al soporte
      if (after.status === 'cancelled') {
        const cancelledBy = after.cancelledBy || 'Unknown';
        const cancelledAt = after.cancelledAt ? new Date(after.cancelledAt.toDate()).toLocaleString() : 'N/A';
        
        const supportMailOptions = {
          from: 'POVEDA PORTAL SYSTEM <povedaportal@gmail.com>',
          to: 'support@povedapremiumautocare.com',
          subject: `🚨 APPOINTMENT CANCELLED - ${after.userName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🚨 APPOINTMENT CANCELLED</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">A customer has cancelled their appointment</p>
              </div>
              
              <div style="padding: 30px; background: #f8f9fa;">
                <div style="background: #ff9800; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <h2 style="margin: 0;">CANCELLATION ALERT</h2>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                  <h3 style="color: #d32f2f; margin-top: 0;">Customer Information</h3>
                  <p><strong>Name:</strong> ${after.userName}</p>
                  <p><strong>Email:</strong> ${after.userEmail}</p>
                  <p><strong>Phone:</strong> ${getPhoneNumber(after)}</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
                  <h3 style="color: #1976d2; margin-top: 0;">Appointment Details</h3>
                  <p><strong>Service:</strong> ${after.service}</p>
                  <p><strong>Date:</strong> ${after.date ? new Date(after.date.toDate()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}</p>
                  <p><strong>Time:</strong> ${after.time || 'TBD'}</p>
                  <p><strong>Location:</strong> ${after.address ? `${after.address.street}, ${after.address.city}, ${after.address.state} ${after.address.zipCode}` : 'N/A'}</p>
                  <p><strong>Price:</strong> $${after.finalPrice || after.estimatedPrice || 'N/A'}</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9e9e9e;">
                  <h3 style="color: #9e9e9e; margin-top: 0;">Cancellation Details</h3>
                  <p><strong>Cancelled By:</strong> <span style="text-transform: uppercase; font-weight: bold;">${cancelledBy}</span></p>
                  <p><strong>Cancelled At:</strong> ${cancelledAt}</p>
                  <p><strong>Previous Status:</strong> ${before.status}</p>
                </div>
                
                ${after.notes ? `
                  <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #e65100;"><strong>Customer Notes:</strong></p>
                    <p style="margin: 5px 0 0 0;">${after.notes}</p>
                  </div>
                ` : ''}
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #1976d2;"><strong>💡 Next Steps:</strong></p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Review the cancellation reason (if provided)</li>
                    <li>Update your calendar/schedule</li>
                    <li>Consider following up with the customer if needed</li>
                    ${after.paymentStatus === 'paid' ? '<li style="color: #d32f2f; font-weight: bold;">⚠️ Payment was received - verify refund policy</li>' : ''}
                  </ul>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  This is an automated notification from the POVEDA Portal System.
                  <br>Appointment ID: ${context.params.appointmentId}
                </p>
              </div>
              
              <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE - Internal System Notification</p>
              </div>
            </div>
          `
        };
        
        try {
          await transporter.sendMail(supportMailOptions);
          console.log(`✅ Cancellation notification email sent to support@povedapremiumautocare.com for appointment ${context.params.appointmentId}`);
        } catch (supportEmailError) {
          console.error('❌ Error sending cancellation notification to support:', supportEmailError);
          // Don't fail the whole function if support email fails
        }
      }
      
    } catch (error) {
      console.error('Error sending status update email:', error);
    }

    return null;
  });

// Update or delete calendar event when appointment status changes
exports.updateCalendarEvent = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const appointmentId = context.params.appointmentId;
    
    // Only process if status changed and there's a calendar event ID
    if (before.status === after.status || !after.calendarEventId) {
      return null;
    }

    try {
      // Create JWT auth client
      const jwtClient = new google.auth.JWT(
        GOOGLE_CALENDAR_CREDENTIALS.client_email,
        null,
        GOOGLE_CALENDAR_CREDENTIALS.private_key,
        ['https://www.googleapis.com/auth/calendar']
      );

      // Authorize the client
      await jwtClient.authorize();

      // Create calendar API instance
      const calendar = google.calendar({ version: 'v3', auth: jwtClient });

      if (after.status === 'cancelled' || after.status === 'rejected') {
        // Delete the calendar event
        await calendar.events.delete({
          calendarId: ADMIN_CALENDAR_ID,
          eventId: after.calendarEventId,
        });
        
        console.log(`Calendar event deleted for ${after.status} appointment ${appointmentId}`);
        
        // Remove calendar event references from appointment
        await change.after.ref.update({
          calendarEventId: admin.firestore.FieldValue.delete(),
          calendarEventUrl: admin.firestore.FieldValue.delete()
        });
      } else if (after.status === 'approved' || after.status === 'confirmed') {
        // Update the calendar event summary to reflect the new status
        const updatedEvent = {
          summary: `[${after.status.toUpperCase()}] Car Detailing - ${after.service}`,
          description: `
Client: ${after.userName}
Email: ${after.userEmail}
Service: ${after.service}
Category: ${after.category}
Location: ${after.address.street}, ${after.address.city}, ${after.address.state} ${after.address.zipCode}
Price: $${after.finalPrice || after.estimatedPrice}
Status: ${after.status}
Notes: ${after.notes || 'No additional notes'}

Payment Status: ${after.paymentStatus}
${after.paymentId ? `Payment ID: ${after.paymentId}` : ''}
          `.trim(),
        };

        await calendar.events.patch({
          calendarId: ADMIN_CALENDAR_ID,
          eventId: after.calendarEventId,
          resource: updatedEvent,
        });
        
        console.log(`Calendar event updated for ${after.status} appointment ${appointmentId}`);
      }
    } catch (error) {
      console.error(`Error updating calendar event for appointment ${appointmentId}:`, error);
      // Don't fail the entire function if calendar update fails
    }

    return null;
  });

// Send appointment reminder (24 hours before)
exports.send24HourReminder = functions.pubsub
  .schedule('every hour')
  .timeZone('America/New_York')
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
          
          try {
            // Load template from Firestore
            const template = await getEmailTemplate('appointment_reminder_24h');
            
            let emailHtml, emailSubject;
            
            if (template) {
              // Use dynamic template
              const templateVariables = {
                userName: appointment.userName,
                service: getServices(appointment),
                date: new Date(appointment.date.toDate()).toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                }),
                time: appointment.time,
                address: `${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state}`,
                finalPrice: appointment.finalPrice || appointment.estimatedPrice,
                estimatedPrice: appointment.estimatedPrice
              };
              
              emailHtml = replaceTemplateVariables(template.htmlContent, templateVariables);
              emailSubject = template.subject;
            } else {
              // Fallback to existing template function
              emailSubject = 'Appointment Reminder - Tomorrow - POVEDA PREMIUM AUTO CARE';
              emailHtml = getReminderEmailTemplate(appointment, '24 hours', 'tomorrow');
            }

            const mailOptions = {
              from: 'POVEDA PREMIUM AUTO CARE <noreply@povedaautocare.com>',
              to: appointment.userEmail,
              subject: emailSubject,
              html: emailHtml
            };

            // Send email and mark as sent
            await transporter.sendMail(mailOptions);
            await doc.ref.update({ reminder24hSent: true });
            
            console.log(`24h reminder sent for appointment ${doc.id}`);
            return true;
          } catch (error) {
            console.error(`Error sending 24h reminder for appointment ${doc.id}:`, error);
            return false;
          }
        });

      await Promise.all(promises);
      console.log(`Processed ${promises.length} 24-hour reminders`);
    } catch (error) {
      console.error('Error sending 24-hour reminders:', error);
    }

    return null;
  });

// Note: 2-hour reminder system removed - only using 24-hour reminder

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
              <td style="padding: 8px 0;">${getServices(appointment)}</td>
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
            <li>📱 Phone: (614) 653-5882</li>
            <li>📧 Email: support@povedapremiumautocare.com</li>
            <li>📍 Address: 4529 Parkwick Dr, Columbus, OH 43228</li>
            <li>🕒 Hours: Mon-Sun 7AM-6PM (Summer: 7AM-9PM)</li>
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

// Sync appointment to admin's connected Google Calendar (OAuth-based)
exports.syncToAdminCalendar = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointment = snap.data();
    const appointmentId = context.params.appointmentId;
    
    try {
      // Get admin user with calendar sync enabled
      const adminQuery = await admin.firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .where('adminCalendarSync.isConnected', '==', true)
        .where('adminCalendarSync.autoSync', '==', true)
        .limit(1)
        .get();
      
      if (adminQuery.empty) {
        console.log('No admin with calendar sync enabled found');
        return null;
      }
      
      const adminDoc = adminQuery.docs[0];
      const adminData = adminDoc.data();
      const calendarSync = adminData.adminCalendarSync;
      
      if (!calendarSync.googleAccessToken) {
        console.log('No valid access token found for admin calendar sync');
        return null;
      }
      
      // Create OAuth2 client with stored access token
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: calendarSync.googleAccessToken
      });
      
      // Create calendar API instance
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      // Calculate appointment start and end times
      const appointmentDate = appointment.date.toDate();
      const timeString = appointment.timeSlot || appointment.time || '09:00 AM';
      
      // Parse time string (handles both "9:00 AM" and "09:00" formats)
      let hours, minutes;
      if (timeString.includes('AM') || timeString.includes('PM')) {
        const time = timeString.replace(/\s/g, '');
        const isPM = time.includes('PM');
        const [hourStr, minuteStr] = time.replace(/[AP]M/, '').split(':');
        hours = parseInt(hourStr);
        minutes = parseInt(minuteStr) || 0;
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
      } else {
        [hours, minutes] = timeString.split(':').map(num => parseInt(num));
      }
      
      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      // Default 2-hour duration for car detailing
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
      
      // Create event object with custom color
      const event = {
        summary: `🚗 ${getServices(appointment)}`,
        description: `
POVEDA Premium Auto Care - Client Appointment

👤 Customer: ${appointment.userName}
📧 Email: ${appointment.userEmail}
📞 Phone: ${getPhoneNumber(appointment)}
🚗 Service: ${getServices(appointment)}
📦 Package: ${appointment.category || 'Standard'}
📍 Location: ${appointment.address ? `${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state} ${appointment.address.zipCode}` : 'Mobile Service'}
💰 Price: $${appointment.finalPrice || appointment.estimatedPrice || appointment.totalAmount}
📋 Status: ${appointment.status}
📝 Notes: ${appointment.notes || 'No additional notes'}

💳 Payment: ${appointment.paymentStatus || 'Pending'}
${appointment.paymentId ? `💳 Payment ID: ${appointment.paymentId}` : ''}

Created via POVEDA Admin Portal
        `.trim(),
        location: appointment.address ? `${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state} ${appointment.address.zipCode}` : 'Mobile Service',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: [
          {
            email: appointment.userEmail,
            displayName: appointment.userName,
            responseStatus: 'needsAction'
          }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours
            { method: 'popup', minutes: 120 }, // 2 hours
            { method: 'popup', minutes: 30 }, // 30 minutes
          ],
        },
        colorId: getColorIdFromHex(calendarSync.syncColor || '#4285f4'),
        source: {
          title: 'POVEDA Premium Auto Care',
          url: 'https://povedaautocare.com'
        }
      };
      
      // Insert the event
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all' // Send email to attendees
      });
      
      // Store calendar event info in the appointment
      await snap.ref.update({
        calendarEventId: response.data.id,
        calendarEventUrl: response.data.htmlLink,
        syncedToAdminCalendar: true,
        syncedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Calendar event created: ${response.data.htmlLink} for appointment ${appointmentId}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Error syncing appointment ${appointmentId} to calendar:`, error);
      
      // Store sync error info
      await snap.ref.update({
        calendarSyncError: error.message,
        lastSyncAttempt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });

// Update calendar event when appointment status changes
exports.updateAdminCalendarEvent = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const appointmentId = context.params.appointmentId;
    
    // Only process if there's a calendar event and status/important details changed
    if (!after.calendarEventId || 
        (before.status === after.status && 
         before.timeSlot === after.timeSlot && 
         before.service === after.service)) {
      return null;
    }
    
    try {
      // Get admin with calendar sync
      const adminQuery = await admin.firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .where('adminCalendarSync.isConnected', '==', true)
        .limit(1)
        .get();
      
      if (adminQuery.empty) {
        console.log('No admin with calendar sync found for update');
        return null;
      }
      
      const adminData = adminQuery.docs[0].data();
      const calendarSync = adminData.adminCalendarSync;
      
      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: calendarSync.googleAccessToken
      });
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      if (after.status === 'cancelled' || after.status === 'rejected') {
        // Delete the calendar event
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: after.calendarEventId,
          sendUpdates: 'all'
        });
        
        // Clear calendar references
        await change.after.ref.update({
          calendarEventId: admin.firestore.FieldValue.delete(),
          calendarEventUrl: admin.firestore.FieldValue.delete(),
          syncedToAdminCalendar: false,
          deletedFromCalendar: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`🗑️ Calendar event deleted for ${after.status} appointment ${appointmentId}`);
        
      } else {
        // Update the calendar event
        const statusEmoji = {
          'pending': '⏳',
          'approved': '✅',
          'confirmed': '🎯',
          'completed': '🏆',
          'in-progress': '🔄'
        };
        
        const updatedEvent = {
          summary: `${statusEmoji[after.status] || '🚗'} ${after.service || 'Car Detailing'} [${after.status.toUpperCase()}]`,
          description: `
POVEDA Premium Auto Care - Client Appointment

👤 Customer: ${after.userName}
📧 Email: ${after.userEmail}
📞 Phone: ${getPhoneNumber(after)}
🚗 Service: ${after.service || after.servicePackage}
📦 Package: ${after.category || 'Standard'}
📍 Location: ${after.address ? `${after.address.street}, ${after.address.city}, ${after.address.state} ${after.address.zipCode}` : 'Mobile Service'}
💰 Price: $${after.finalPrice || after.estimatedPrice || after.totalAmount}
📋 Status: ${after.status}
📝 Notes: ${after.notes || 'No additional notes'}

💳 Payment: ${after.paymentStatus || 'Pending'}
${after.paymentId ? `💳 Payment ID: ${after.paymentId}` : ''}

Last Updated: ${new Date().toLocaleString()}
Created via POVEDA Admin Portal
          `.trim(),
          colorId: getColorIdFromHex(calendarSync.syncColor || '#4285f4')
        };
        
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: after.calendarEventId,
          resource: updatedEvent,
          sendUpdates: 'all'
        });
        
        console.log(`📅 Calendar event updated for ${after.status} appointment ${appointmentId}`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating calendar event for appointment ${appointmentId}:`, error);
      
      await change.after.ref.update({
        calendarSyncError: error.message,
        lastSyncAttempt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return null;
  });

// Helper function to convert hex color to Google Calendar color ID
function getColorIdFromHex(hexColor) {
  const colorMap = {
    '#4285f4': '1', // Google Blue
    '#34a853': '2', // Success Green  
    '#fbbc04': '5', // Business Orange
    '#ea4335': '4', // Alert Red
    '#9c27b0': '3', // Premium Purple
    '#009688': '6', // Professional Teal
  };
  return colorMap[hexColor] || '1'; // Default to blue
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
        if (appointment.reminder24hSent) {
          batch.update(doc.ref, {
            reminder24hSent: admin.firestore.FieldValue.delete()
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
    
    // Only reset if status changed to cancelled or rejected
    if (before.status === after.status) {
      return null;
    }
    
    if (after.status === 'cancelled' || after.status === 'rejected') {
      try {
        await change.after.ref.update({
          reminder24hSent: admin.firestore.FieldValue.delete()
        });
        console.log(`Reminder flag reset for ${after.status} appointment ${context.params.appointmentId}`);
      } catch (error) {
        console.error('Error resetting reminder flag:', error);
      }
    }
    
    return null;
  });

// ========== STRIPE PAYMENT FUNCTIONS ==========

// Create payment intent for deposit - PUBLIC HTTP endpoint
exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  // Enable CORS - using origin from request header or allowing all origins as fallback
  const origin = req.headers.origin || '*';
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // 🔍 DEBUGGING LOGS - START
    console.log('='.repeat(60));
    console.log('🔍 CREATE PAYMENT INTENT - DEBUG INFO');
    console.log('='.repeat(60));
    console.log('Environment:', process.env.NODE_ENV || 'not set');
    console.log('Stripe API Key configured:', !!stripe.apiKey);
    console.log('Request method:', req.method);
    console.log('Request origin:', req.headers.origin);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request metadata:', JSON.stringify(req.body.metadata || req.body.data?.metadata || {}, null, 2));
    console.log('='.repeat(60));
    // 🔍 DEBUGGING LOGS - END
    
    let amount, currency, metadata;
    
    // Intentar extraer datos de diferentes estructuras posibles
    if (req.body.data) {
      // Si los datos vienen en req.body.data
      ({ amount, currency = 'usd', metadata = {} } = req.body.data);
    } else if (req.body.amount !== undefined) {
      // Si los datos están directamente en req.body
      amount = req.body.amount;
      currency = req.body.currency || 'usd';
      metadata = req.body.metadata || {};
    } else {
      console.error('❌ No se pudo encontrar los datos de cantidad en la solicitud');
      res.status(400).json({ error: 'Missing payment amount data' });
      return;
    }
    
    console.log(`Processing payment intent: amount=${amount}, currency=${currency}`);
    
    // Validate amount (should be in cents)
    if (!amount || amount < 50) {
      console.error(`❌ Invalid amount: ${amount}`);
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    // Ensure phone number is properly captured in metadata
    const phoneNumber = metadata.userPhone || metadata.phoneNumber || metadata.phone || null;
    if (phoneNumber) {
      console.log(`✅ Phone number found in metadata: ${phoneNumber}`);
    } else {
      console.log('⚠️  No phone number found in metadata');
    }
    
    // Create payment intent with automatic capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      capture_method: 'automatic',
      confirmation_method: 'automatic',
      metadata: {
        ...metadata,
        userPhone: phoneNumber, // Ensure consistent field name
        source: 'POVEDA_AUTO_CARE',
        environment: process.env.NODE_ENV || 'development'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`✅ Payment Intent created: ${paymentIntent.id} for $${amount/100}`);

    res.status(200).json({
      result: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    // Log detallado del error
    console.error('❌ Error creating payment intent:', error);
    console.error('Error details:', JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
      type: error.type,
      decline_code: error.decline_code,
      param: error.param,
      stack: error.stack
    }));
    
    // Respuesta más descriptiva
    res.status(500).json({
      error: 'Unable to create payment intent',
      details: error.message,
      code: error.code || 'unknown_error',
      type: error.type || 'server_error',
      // Enviar detalles adicionales sólo en modo de desarrollo
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
    });
  }
});

// Confirm payment and update appointment - PUBLIC HTTP endpoint
exports.confirmPayment = functions.https.onRequest(async (req, res) => {
  // Enable CORS - using origin from request header or allowing all origins as fallback
  const origin = req.headers.origin || '*';
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { paymentIntentId, appointmentId } = req.body.data || req.body;
    
    if (!paymentIntentId || !appointmentId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      res.status(400).json({ error: 'Payment not completed' });
      return;
    }

    // Update appointment with payment info
    const appointmentRef = admin.firestore().collection('appointments').doc(appointmentId);
    
    // First get the current appointment data to ensure we have the phone number
    const appointmentDoc = await appointmentRef.get();
    const appointmentData = appointmentDoc.data();
    
    // Make sure we have the phone number from the metadata or existing data
    const userPhone = paymentIntent.metadata.userPhone || appointmentData.userPhone || paymentIntent.metadata.phoneNumber || appointmentData.phoneNumber || null;
    
    // Log phone number information for debugging
    console.log(`Phone number information for appointment ${appointmentId}:`);
    console.log(`- From metadata.userPhone: ${paymentIntent.metadata.userPhone || 'Not found'}`);
    console.log(`- From appointmentData.userPhone: ${appointmentData.userPhone || 'Not found'}`);
    console.log(`- From metadata.phoneNumber: ${paymentIntent.metadata.phoneNumber || 'Not found'}`);
    console.log(`- From appointmentData.phoneNumber: ${appointmentData.phoneNumber || 'Not found'}`);
    console.log(`- Final userPhone value: ${userPhone || 'Not found'}`);
    
    await appointmentRef.update({
      paymentStatus: 'deposit_paid',
      paymentId: paymentIntentId,
      depositAmount: paymentIntent.amount / 100,
      remainingBalance: (paymentIntent.metadata.totalAmount || 0) - (paymentIntent.amount / 100),
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: paymentIntent.payment_method ? 'card' : 'unknown',
      userPhone: userPhone // Ensure the phone number is properly stored
    });

    console.log(`Payment confirmed for appointment ${appointmentId}: ${paymentIntentId}`);
    
    res.status(200).json({
      result: {
        success: true,
        paymentId: paymentIntentId,
        amount: paymentIntent.amount / 100
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Unable to confirm payment', details: error.message });
  }
});
