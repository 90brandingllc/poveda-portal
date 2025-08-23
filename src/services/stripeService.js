import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export const getStripe = () => stripePromise;

// Calculate deposit amount (50% of service price)
export const calculateDepositAmount = (servicePrice) => {
  return Math.round(servicePrice * 0.5 * 100); // Convert to cents for Stripe
};

// Format amount for display
export const formatCurrency = (amountInCents) => {
  return (amountInCents / 100).toFixed(2);
};

// Create payment intent for deposit
export const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    // In a real app, this would be a call to your backend
    // For now, we'll simulate this with the frontend
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

const stripeService = {
  getStripe,
  calculateDepositAmount,
  formatCurrency,
  createPaymentIntent,
};

export default stripeService;
