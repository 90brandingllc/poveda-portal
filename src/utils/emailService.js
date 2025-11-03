import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

/**
 * Service for sending email notifications
 * This service uses Firebase Cloud Functions to send emails
 */

/**
 * Send an appointment confirmation email
 * @param {Object} appointmentData - The appointment data
 */
export const sendAppointmentConfirmationEmail = async (appointmentData) => {
  try {
    if (!appointmentData.userEmail) {
      console.error('Cannot send email: No recipient email provided');
      return;
    }

    const sendEmail = httpsCallable(functions, 'sendEmail');
    
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

    // Determine template based on user context
    let templateName = appointmentData.template || 'appointment_confirmation';
    let additionalData = {};
    
    // Si se solicita explícitamente la plantilla guest_url_appointment o es un usuario no logueado desde URL
    if (templateName === 'guest_url_appointment' || (appointmentData.isGuestBooking && appointmentData.fromUrl)) {
      console.log('Preparing special email for guest from URL');
      templateName = 'guest_url_appointment'; // Asegurar que siempre sea esta plantilla
      
      // Agregar datos adicionales para este tipo de correo
      additionalData = {
        registerUrl: 'https://poveda-portal.vercel.app/register',
        urlSource: appointmentData.urlService || 'direct link',
        serviceFromUrl: appointmentData.urlServiceName || 'selected service',
        // Mensaje especial para usuarios no registrados
        specialMessage: 'We noticed you booked this appointment from a direct service link. ' + 
                        'Create an account to keep track of your appointment history and receive updates.'  
      };
    }
    
    console.log(`Using email template: ${templateName}`);

    // Prepare email data
    const emailData = {
      to: appointmentData.userEmail,
      template: {
        name: templateName,
        data: {
          name: appointmentData.userName || 'Valued Customer',
          service: Array.isArray(appointmentData.services) ? 
            appointmentData.services.join(', ') : 
            appointmentData.service || 'your service',
          date: formattedDate,
          time: appointmentData.timeSlot || appointmentData.time || 'the scheduled time',
          location: `${appointmentData.address.street}, ${appointmentData.address.city}, ${appointmentData.address.state} ${appointmentData.address.zipCode}`,
          phone: appointmentData.userPhone || 'Not provided', // ✅ Incluir número de teléfono
          depositAmount: appointmentData.depositAmount ? 
            `$${parseFloat(appointmentData.depositAmount).toFixed(2)}` : 
            'the deposit',
          remainingBalance: appointmentData.remainingBalance ? 
            `$${parseFloat(appointmentData.remainingBalance).toFixed(2)}` : 
            'the remaining balance',
          estimatedPrice: appointmentData.estimatedPrice ? 
            `$${parseFloat(appointmentData.estimatedPrice).toFixed(2)}` : 
            'the total',
          // Incluir los datos adicionales si existen
          ...additionalData
        }
      }
    };
    
    // Send the email
    const result = await sendEmail(emailData);
    console.log(`Email (${templateName}) sent successfully to ${appointmentData.userEmail}:`, result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a service completion email
 * @param {Object} appointmentData - The appointment data
 */
export const sendServiceCompletedEmail = async (appointmentData) => {
  try {
    if (!appointmentData.userEmail) {
      console.error('Cannot send email: No recipient email provided');
      return;
    }

    const sendEmail = httpsCallable(functions, 'sendEmail');
    
    // Prepare email data
    const emailData = {
      to: appointmentData.userEmail,
      template: {
        name: 'service_completed',
        data: {
          name: appointmentData.userName || 'Valued Customer',
          service: Array.isArray(appointmentData.services) ? 
            appointmentData.services.join(', ') : 
            appointmentData.service || 'your service',
          feedbackLink: `https://poveda-portal.web.app/feedback/${appointmentData.id}`
        }
      }
    };
    
    // Send the email
    const result = await sendEmail(emailData);
    console.log('Email sent successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send an appointment reminder email
 * @param {Object} appointmentData - The appointment data
 */
export const sendAppointmentReminderEmail = async (appointmentData) => {
  try {
    if (!appointmentData.userEmail) {
      console.error('Cannot send email: No recipient email provided');
      return;
    }

    const sendEmail = httpsCallable(functions, 'sendEmail');
    
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

    // Prepare email data
    const emailData = {
      to: appointmentData.userEmail,
      template: {
        name: 'appointment_reminder',
        data: {
          name: appointmentData.userName || 'Valued Customer',
          service: Array.isArray(appointmentData.services) ? 
            appointmentData.services.join(', ') : 
            appointmentData.service || 'your service',
          date: formattedDate,
          time: appointmentData.timeSlot || appointmentData.time || 'the scheduled time',
          location: `${appointmentData.address.street}, ${appointmentData.address.city}, ${appointmentData.address.state} ${appointmentData.address.zipCode}`,
          rescheduleLink: `https://poveda-portal.web.app/appointments`
        }
      }
    };
    
    // Send the email
    const result = await sendEmail(emailData);
    console.log('Email sent successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send an appointment status change email
 * @param {Object} appointmentData - The appointment data
 * @param {string} status - New status ('approved', 'rejected', 'completed')
 */
export const sendAppointmentStatusEmail = async (appointmentData, status) => {
  try {
    if (!appointmentData.userEmail) {
      console.error('Cannot send email: No recipient email provided');
      return;
    }

    const sendEmail = httpsCallable(functions, 'sendEmail');
    
    // Different templates based on status
    let templateName;
    const data = {
      name: appointmentData.userName || 'Valued Customer',
      service: Array.isArray(appointmentData.services) ? 
        appointmentData.services.join(', ') : 
        appointmentData.service || 'your service'
    };
    
    // Format appointment date for use in templates
    const appointmentDate = appointmentData.date.toDate ? 
      appointmentData.date.toDate() : 
      new Date(appointmentData.date);
    
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Set template and additional data based on status
    switch (status) {
      case 'approved':
        templateName = 'appointment_approved';
        data.date = formattedDate;
        data.time = appointmentData.timeSlot || appointmentData.time;
        data.location = `${appointmentData.address.street}, ${appointmentData.address.city}, ${appointmentData.address.state} ${appointmentData.address.zipCode}`;
        break;
      case 'rejected':
        templateName = 'appointment_rejected';
        data.rebookLink = 'https://poveda-portal.web.app/book-appointment';
        data.supportEmail = 'support@povedaautocare.com';
        break;
      case 'completed':
        templateName = 'service_completed';
        data.feedbackLink = `https://poveda-portal.web.app/feedback/${appointmentData.id}`;
        break;
      default:
        templateName = 'appointment_update';
        data.status = status;
        data.date = formattedDate;
    }

    // Prepare email data
    const emailData = {
      to: appointmentData.userEmail,
      template: {
        name: templateName,
        data
      }
    };
    
    // Send the email
    const result = await sendEmail(emailData);
    console.log(`Status email (${status}) sent successfully:`, result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending status email:', error);
    throw error;
  }
};

export default {
  sendAppointmentConfirmationEmail,
  sendServiceCompletedEmail,
  sendAppointmentReminderEmail,
  sendAppointmentStatusEmail
};
