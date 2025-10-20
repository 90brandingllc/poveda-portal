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
    console.log(`Creando Payment Intent para: $${amount/100} ${currency}`);
    
    const response = await fetch('https://us-central1-clients-portal-a3fdf.cloudfunctions.net/createPaymentIntent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        data: {
          amount: Math.round(amount),
          currency,
          metadata
        }
      })
    });
    
    // Mejorar manejo de errores con más detalles
    if (!response.ok) {
      console.error(`Error en respuesta HTTP: ${response.status} ${response.statusText}`);
      
      try {
        const errorData = await response.json();
        console.error('Detalles del error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Fallo al crear payment intent');
      } catch (parseError) {
        console.error('Error al procesar respuesta JSON:', parseError);
        throw new Error(`Error ${response.status}: ${response.statusText || 'Fallo al crear payment intent'}`);
      }
    }
    
    try {
      const data = await response.json();
      console.log('Payment intent creado exitosamente:', data);
      return data.result;
    } catch (parseError) {
      console.error('Error al procesar respuesta JSON exitosa:', parseError);
      throw new Error('Formato de respuesta incorrecto');
    }
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Confirm payment using Firebase Functions HTTP endpoint
export const confirmPayment = async (paymentIntentId, appointmentId) => {
  try {
    console.log(`Confirmando pago: ${paymentIntentId} para cita ${appointmentId}`);
    
    const response = await fetch('https://us-central1-clients-portal-a3fdf.cloudfunctions.net/confirmPayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        data: {
          paymentIntentId,
          appointmentId
        }
      })
    });
    
    // Mejorar manejo de errores con más detalles
    if (!response.ok) {
      console.error(`Error en respuesta HTTP: ${response.status} ${response.statusText}`);
      
      try {
        const errorData = await response.json();
        console.error('Detalles del error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Fallo al confirmar el pago');
      } catch (parseError) {
        console.error('Error al procesar respuesta JSON:', parseError);
        throw new Error(`Error ${response.status}: ${response.statusText || 'Fallo al confirmar el pago'}`);
      }
    }
    
    try {
      const data = await response.json();
      console.log('Pago confirmado exitosamente:', data);
      return data.result;
    } catch (parseError) {
      console.error('Error al procesar respuesta JSON exitosa:', parseError);
      throw new Error('Formato de respuesta incorrecto');
    }
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
