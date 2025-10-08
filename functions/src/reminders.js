const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Configuración de email (normalmente esto estaría en environment variables)
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});

// Helper para crear notificaciones
const createNotification = async (userId, title, message, type = 'info', metadata = {}) => {
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

  return admin.firestore().collection('notifications').add(notification);
};

// Función para enviar correos electrónicos
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: '"Poveda Auto Care" <appointments@povedaautocare.com>',
    to,
    subject,
    html
  };

  return mailTransport.sendMail(mailOptions);
};

// Recordatorios del día anterior
exports.sendDayBeforeReminders = functions.pubsub.schedule('0 9 * * *')  // 9am todos los días
  .timeZone('America/New_York')  // Ajusta a tu zona horaria
  .onRun(async (context) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);
      
      // Consulta para las citas de mañana
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
        
        // Crear notificación en la app
        const notificationPromise = createNotification(
          appointment.userId,
          'Appointment Reminder',
          `Reminder: Your ${appointment.services?.join(', ') || 'service'} appointment is scheduled for tomorrow at ${appointment.timeSlot || appointment.time}. Please ensure your vehicle is accessible.`,
          'warning',
          {
            type: 'appointment_reminder',
            appointmentId: appointment.id
          }
        ).catch(error => {
          console.error(`Error creating notification for appointment ${doc.id}:`, error);
        });
        
        // Enviar correo electrónico si está habilitado
        let emailPromise = Promise.resolve();
        if (appointment.emailReminders && appointment.userEmail) {
          // Formatear fecha para el email
          const appointmentDate = appointment.date.toDate ? 
            appointment.date.toDate() : 
            new Date(appointment.date);
          
          const formattedDate = appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          // Template básico de email de recordatorio
          const html = `
            <h2>Appointment Reminder</h2>
            <p>Hello ${appointment.userName || 'Valued Customer'},</p>
            <p>This is a friendly reminder about your appointment scheduled for <strong>${formattedDate}</strong> 
            at <strong>${appointment.timeSlot || appointment.time}</strong> for the following service(s):</p>
            <p><strong>${appointment.services?.join(', ') || appointment.service || 'Scheduled service'}</strong></p>
            <p>Location: ${appointment.address.street}, ${appointment.address.city}, ${appointment.address.state} ${appointment.address.zipCode}</p>
            <p>Please ensure your vehicle is accessible at the scheduled time.</p>
            <p>If you need to reschedule, please contact us as soon as possible or visit your <a href="https://poveda-portal.web.app/appointments">account dashboard</a>.</p>
            <p>Thank you for choosing Poveda Premium Auto Care!</p>
          `;
          
          emailPromise = sendEmail(
            appointment.userEmail,
            'Reminder: Your appointment is tomorrow',
            html
          ).catch(error => {
            console.error(`Error sending email for appointment ${doc.id}:`, error);
          });
        }
        
        reminderPromises.push(notificationPromise, emailPromise);
      });
      
      await Promise.all(reminderPromises);
      console.log('Successfully sent day-before reminders');
      return null;
    } catch (error) {
      console.error('Error sending day-before reminders:', error);
      return null;
    }
  });

// Recordatorios del mismo día
exports.sendSameDayReminders = functions.pubsub.schedule('0 7 * * *')  // 7am todos los días
  .timeZone('America/New_York')  // Ajusta a tu zona horaria
  .onRun(async (context) => {
    // Implementación similar a la anterior, pero para el mismo día
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      // Consulta para las citas de hoy
      const snapshot = await admin.firestore()
        .collection('appointments')
        .where('date', '>=', today)
        .where('date', '<=', todayEnd)
        .where('status', '==', 'approved')
        .get();
      
      console.log(`Found ${snapshot.size} appointments scheduled for today`);
      
      // Resto de la implementación (similar a la anterior)
      // ...
      
      console.log('Successfully sent same-day reminders');
      return null;
    } catch (error) {
      console.error('Error sending same-day reminders:', error);
      return null;
    }
  });

// Recordatorios de seguimiento de servicio (cada semana)
exports.sendServiceFollowUpReminders = functions.pubsub.schedule('0 10 * * 1')  // Cada lunes a las 10am
  .timeZone('America/New_York')  // Ajusta a tu zona horaria
  .onRun(async (context) => {
    // Implementación de recordatorios de seguimiento de servicio
    // ...
    return null;
  });

// Función HTTP para probar los recordatorios (solo para desarrollo)
exports.testReminders = functions.https.onRequest(async (req, res) => {
  try {
    const type = req.query.type || 'day-before';
    let result;
    
    switch (type) {
      case 'day-before':
        result = await exports.sendDayBeforeReminders.run();
        break;
      case 'same-day':
        result = await exports.sendSameDayReminders.run();
        break;
      case 'follow-up':
        result = await exports.sendServiceFollowUpReminders.run();
        break;
      default:
        return res.status(400).send('Invalid reminder type');
    }
    
    return res.status(200).send({
      message: `Test ${type} reminders triggered successfully`,
      result
    });
  } catch (error) {
    console.error('Error testing reminders:', error);
    return res.status(500).send({
      error: 'Failed to test reminders',
      details: error.message
    });
  }
});
