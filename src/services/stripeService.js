import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe only if we have a key
const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? 
  loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) : 
  new Promise((resolve) => {
    console.warn('No Stripe publishable key found. Stripe functionality will be disabled.');
    resolve(null);
  });

export const getStripe = () => stripePromise;

// Calculate deposit amount ($50 fixed deposit)
// eslint-disable-next-line no-unused-vars
export const calculateDepositAmount = (servicePrice) => {
  return 50 * 100; // $50 converted to cents for Stripe
};

// Format amount for display
export const formatCurrency = (amountInCents) => {
  return (amountInCents / 100).toFixed(2);
};

// Create payment intent for deposit using Firebase Functions (httpsCallable)
export const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    console.log(`Creando Payment Intent para: $${amount/100} ${currency}`);

    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');

    const result = await createPaymentIntentFn({
      amount: Math.round(amount),
      currency,
      metadata
    });

    console.log('Payment intent creado exitosamente:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    // Extract meaningful error message from Firebase Functions error
    const errorMessage = error.message || 'Fallo al crear payment intent';
    throw new Error(errorMessage);
  }
};

// Confirm payment using Firebase Functions (httpsCallable)
export const confirmPayment = async (paymentIntentId, appointmentId) => {
  try {
    console.log(`Confirmando pago: ${paymentIntentId} para cita ${appointmentId}`);

    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const confirmPaymentFn = httpsCallable(functions, 'confirmPayment');

    const result = await confirmPaymentFn({
      paymentIntentId,
      appointmentId
    });

    console.log('Pago confirmado exitosamente:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error confirming payment:', error);
    // Extract meaningful error message from Firebase Functions error
    const errorMessage = error.message || 'Fallo al confirmar el pago';
    throw new Error(errorMessage);
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
