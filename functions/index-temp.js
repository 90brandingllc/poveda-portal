// Import existing functions to maintain compatibility
const mainFunctions = require('./index.js');

// Import our email service
const emailService = require('./email-service');

// Export all functions, adding our new sendEmail function
module.exports = {
  ...mainFunctions,
  sendEmail: emailService.sendEmail
};
