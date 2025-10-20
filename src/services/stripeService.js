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
export const calculateDepositAmount = (servicePrice) => {
  return 50 * 100; // $50 converted to cents for Stripe
};

// Format amount for display
export const formatCurrency = (amountInCents) => {
  return (amountInCents / 100).toFixed(2);
};

// Create payment intent for deposit using Firebase Functions HTTP endpoint
export const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const response = await fetch('https://us-central1-clients-portal-a3fdf.cloudfunctions.net/createPaymentIntent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({
        data: {
          amount: Math.round(amount),
          currency,
          metadata
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to create payment intent');
    }
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Confirm payment using Firebase Functions HTTP endpoint
export const confirmPayment = async (paymentIntentId, appointmentId) => {
  try {
    const response = await fetch('https://us-central1-clients-portal-a3fdf.cloudfunctions.net/confirmPayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({
        data: {
          paymentIntentId,
          appointmentId
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to confirm payment');
    }
    
    const data = await response.json();
    return data.result;
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
