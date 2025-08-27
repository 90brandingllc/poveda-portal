import { createNotification } from './notificationService';

/**
 * Centralized error handling utility
 */

export const ErrorTypes = {
  NETWORK_ERROR: 'network_error',
  AUTHENTICATION_ERROR: 'auth_error',
  PERMISSION_ERROR: 'permission_error',
  VALIDATION_ERROR: 'validation_error',
  FIREBASE_ERROR: 'firebase_error',
  PAYMENT_ERROR: 'payment_error',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * Get user-friendly error message based on error type and code
 */
export const getErrorMessage = (error) => {
  // Firebase Auth errors
  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      
      // Firestore errors
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'not-found':
        return 'The requested data was not found.';
      case 'already-exists':
        return 'This data already exists.';
      case 'resource-exhausted':
        return 'Service temporarily unavailable. Please try again later.';
      case 'deadline-exceeded':
        return 'Request timeout. Please try again.';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again.';
      
      // Payment errors (Stripe)
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'insufficient_funds':
        return 'Insufficient funds. Please try a different card.';
      case 'incorrect_cvc':
        return 'Incorrect security code. Please check your card details.';
      case 'expired_card':
        return 'Your card has expired. Please use a different card.';
      case 'processing_error':
        return 'Payment processing error. Please try again.';
      
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return error.message || 'Please check your input and try again.';
  }

  // Generic error fallback
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Get error type based on error object
 */
export const getErrorType = (error) => {
  if (error.code) {
    if (error.code.startsWith('auth/')) {
      return ErrorTypes.AUTHENTICATION_ERROR;
    }
    if (['permission-denied'].includes(error.code)) {
      return ErrorTypes.PERMISSION_ERROR;
    }
    if (['not-found', 'already-exists', 'resource-exhausted', 'deadline-exceeded', 'unavailable'].includes(error.code)) {
      return ErrorTypes.FIREBASE_ERROR;
    }
    if (['card_declined', 'insufficient_funds', 'incorrect_cvc', 'expired_card', 'processing_error'].includes(error.code)) {
      return ErrorTypes.PAYMENT_ERROR;
    }
  }

  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return ErrorTypes.NETWORK_ERROR;
  }

  if (error.name === 'ValidationError') {
    return ErrorTypes.VALIDATION_ERROR;
  }

  return ErrorTypes.UNKNOWN_ERROR;
};

/**
 * Log error to console with structured data
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    code: error.code,
    name: error.name,
    stack: error.stack,
    type: getErrorType(error),
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('Error logged:', errorInfo);

  // In production, you might want to send this to an external logging service
  // logToExternalService(errorInfo);
  
  return errorInfo;
};

/**
 * Handle error with user feedback
 */
export const handleError = async (error, context = {}, options = {}) => {
  const {
    showNotification = false,
    userId = null,
    fallbackMessage = null,
    silent = false
  } = options;

  // Log the error
  const errorInfo = logError(error, context);

  // Get user-friendly message
  const userMessage = fallbackMessage || getErrorMessage(error);

  // Show notification if requested and userId is available
  if (showNotification && userId) {
    try {
      await createNotification(
        userId,
        'Error Occurred',
        userMessage,
        'error',
        {
          errorType: errorInfo.type,
          errorCode: error.code || 'unknown',
          context
        }
      );
    } catch (notificationError) {
      console.error('Failed to create error notification:', notificationError);
    }
  }

  // Return structured error info for UI handling
  return {
    message: userMessage,
    type: errorInfo.type,
    code: error.code,
    canRetry: ['network_error', 'firebase_error'].includes(errorInfo.type),
    shouldReload: errorInfo.type === 'authentication_error'
  };
};

/**
 * Retry wrapper for async operations
 */
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry certain error types
      const errorType = getErrorType(error);
      if ([ErrorTypes.AUTHENTICATION_ERROR, ErrorTypes.PERMISSION_ERROR, ErrorTypes.VALIDATION_ERROR].includes(errorType)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

/**
 * Async error boundary wrapper for React components
 */
export const withErrorHandling = (asyncFunction, errorHandler) => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      if (errorHandler) {
        return errorHandler(error);
      }
      throw error;
    }
  };
};

/**
 * Network status checker
 */
export const checkNetworkStatus = () => {
  return {
    online: navigator.onLine,
    connection: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || null
  };
};

/**
 * Graceful degradation helper
 */
export const withFallback = async (primaryOperation, fallbackOperation) => {
  try {
    return await primaryOperation();
  } catch (error) {
    console.warn('Primary operation failed, using fallback:', error.message);
    return await fallbackOperation();
  }
};

export default {
  ErrorTypes,
  getErrorMessage,
  getErrorType,
  logError,
  handleError,
  withRetry,
  withErrorHandling,
  checkNetworkStatus,
  withFallback
};
