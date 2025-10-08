const functions = require('firebase-functions');
const admin = require('firebase-admin');
const notificationsModule = require('./notifications');
const remindersModule = require('./reminders');

// Initialize Firebase admin if not already initialized in the parent context
// This is only necessary if this file is used as a standalone entry point
try {
  admin.initializeApp();
} catch (e) {
  console.log('Firebase admin already initialized in parent context');
}

// Export notifications functions
exports.createAppointmentConfirmationNotification = notificationsModule.createAppointmentConfirmationNotification;
exports.createAppointmentStatusChangeNotification = notificationsModule.createAppointmentStatusChangeNotification;
exports.createDayBeforeReminders = notificationsModule.createDayBeforeReminders;
exports.createServiceFollowUps = notificationsModule.createServiceFollowUps;

// Export reminders functions
exports.sendDayBeforeReminders = remindersModule.sendDayBeforeReminders;
exports.sendSameDayReminders = remindersModule.sendSameDayReminders;
exports.sendServiceFollowUpReminders = remindersModule.sendServiceFollowUpReminders;

// For testing purposes
exports.testNotifications = functions.https.onRequest(async (req, res) => {
  try {
    // Get request parameters
    const type = req.query.type || 'appointment_confirmation';
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }
    
    let result;
    
    switch (type) {
      case 'appointment_confirmation':
        // Create a test appointment confirmation notification
        result = await notificationsModule.createNotification(
          userId,
          'Test Appointment Confirmation',
          'This is a test appointment confirmation notification.',
          'success',
          {
            type: 'appointment_confirmed',
            appointmentId: 'test-appointment-id',
            service: 'Test Service',
            date: new Date().toISOString(),
            timeSlot: '10:00 AM - 12:00 PM'
          }
        );
        break;
      case 'appointment_reminder':
        // Create a test appointment reminder notification
        result = await notificationsModule.createNotification(
          userId,
          'Test Appointment Reminder',
          'This is a test appointment reminder notification.',
          'warning',
          {
            type: 'appointment_reminder',
            appointmentId: 'test-appointment-id',
            service: 'Test Service',
            date: new Date().toISOString(),
            timeSlot: '10:00 AM - 12:00 PM'
          }
        );
        break;
      case 'service_completed':
        // Create a test service completed notification
        result = await notificationsModule.createNotification(
          userId,
          'Test Service Completed',
          'This is a test service completed notification.',
          'success',
          {
            type: 'appointment_completed',
            appointmentId: 'test-appointment-id',
            service: 'Test Service'
          }
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid notification type' });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Test ${type} notification sent successfully`,
      notificationId: result
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return res.status(500).json({
      error: 'Failed to send test notification',
      details: error.message
    });
  }
});
