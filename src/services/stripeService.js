import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export const getStripe = () => stripePromise;

// Calculate deposit amount ($45 fixed deposit)
export const calculateDepositAmount = (servicePrice) => {
  return 45 * 100; // $45 converted to cents for Stripe
};

// Format amount for display
export const formatCurrency = (amountInCents) => {
  return (amountInCents / 100).toFixed(2);
};

// Create payment intent for deposit using Firebase Functions
export const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    // Import Firebase Functions
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
    
    // Call Firebase Function
    const result = await createPaymentIntentFn({
      amount: Math.round(amount), // Ensure integer (cents)
      currency,
      metadata
    });

    return result.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Confirm payment using Firebase Functions
export const confirmPayment = async (paymentIntentId, appointmentId) => {
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const confirmPaymentFn = httpsCallable(functions, 'confirmPayment');
    
    const result = await confirmPaymentFn({
      paymentIntentId,
      appointmentId
    });

    return result.data;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

const stripeService = {
  getStripe,
  calculateDepositAmount,
  formatCurrency,
  createPaymentIntent,
  confirmPayment,
};

export default stripeService;
