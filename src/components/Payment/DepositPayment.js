import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  Payment,
  CreditCard,
  AccountBalance
} from '@mui/icons-material';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, calculateDepositAmount, formatCurrency } from '../../services/stripeService';

const CheckoutForm = ({ servicePrice, servicePackage, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(0); // 0: Card, 1: PayPal, 2: CashApp

  const depositAmount = calculateDepositAmount(servicePrice);
  const depositDisplay = formatCurrency(depositAmount);
  const remainingAmount = servicePrice - parseFloat(depositDisplay);

  const handleCardPayment = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError('');

    const card = elements.getElement(CardElement);

    // Create payment method
    const { error: paymentError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: card,
      billing_details: {
        name: 'Customer', // You can pass customer name here
      },
    });

    if (paymentError) {
      setError(paymentError.message);
      setIsProcessing(false);
      return;
    }

    // For demo purposes, we'll simulate a successful payment
    // In a real app, you'd send this to your backend to create a payment intent
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful payment
      const mockPaymentResult = {
        id: `pi_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: depositAmount,
        payment_method: paymentMethod.id,
        method: 'card'
      };

      onPaymentSuccess(mockPaymentResult);
    } catch (err) {
      setError('Payment failed. Please try again.');
      onPaymentError(err);
    }

    setIsProcessing(false);
  };

  const handlePayPalPayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Simulate PayPal payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful PayPal payment
      const mockPaymentResult = {
        id: `pp_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: depositAmount,
        payment_method: 'paypal',
        method: 'paypal'
      };

      onPaymentSuccess(mockPaymentResult);
    } catch (err) {
      setError('PayPal payment failed. Please try again.');
      onPaymentError(err);
    }

    setIsProcessing(false);
  };

  const handleCashAppPayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Simulate CashApp payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful CashApp payment
      const mockPaymentResult = {
        id: `ca_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: depositAmount,
        payment_method: 'cashapp',
        method: 'cashapp'
      };

      onPaymentSuccess(mockPaymentResult);
    } catch (err) {
      setError('CashApp payment failed. Please try again.');
      onPaymentError(err);
    }

    setIsProcessing(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Payment sx={{ mr: 1 }} />
            Payment Summary
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Service: <strong>{servicePackage}</strong>
            </Typography>
            <Typography variant="body1" gutterBottom>
              Total Service Price: <strong>${servicePrice}</strong>
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            p: 2, 
            borderRadius: 1,
            mb: 2
          }}>
            <Typography variant="h6" gutterBottom>
              💳 Deposit Required ($45)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              ${depositDisplay}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Remaining balance (${remainingAmount.toFixed(2)}) due upon service completion
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Secure Payment:</strong> Your payment information is encrypted and processed securely through Stripe.
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Payment sx={{ mr: 1 }} />
            Choose Payment Method
          </Typography>
          
          <Tabs 
            value={paymentMethod} 
            onChange={(e, newValue) => setPaymentMethod(newValue)}
            sx={{ mb: 3 }}
            variant="fullWidth"
          >
            <Tab 
              icon={<CreditCard />} 
              label="Credit/Debit Card" 
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              icon={<AccountBalance />} 
              label="PayPal" 
              sx={{ textTransform: 'none', color: '#0070ba' }}
            />
            <Tab 
              icon={<Payment />} 
              label="CashApp" 
              sx={{ textTransform: 'none', color: '#00d632' }}
            />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {paymentMethod === 0 && (
            <Box component="form" onSubmit={handleCardPayment}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 3,
                  '& .StripeElement': {
                    height: '40px',
                    padding: '10px 12px',
                    color: '#32325d',
                  }
                }}
              >
                <CardElement options={cardElementOptions} />
              </Paper>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={!stripe || isProcessing}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 100%)'
                  }
                }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard sx={{ mr: 1 }} />
                    Pay ${depositDisplay} with Card
                  </>
                )}
              </Button>
            </Box>
          )}

          {paymentMethod === 1 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  You'll be redirected to PayPal to complete your ${depositDisplay} deposit payment securely.
                </Typography>
              </Alert>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handlePayPalPayment}
                disabled={isProcessing}
                sx={{
                  py: 1.5,
                  backgroundColor: '#0070ba',
                  '&:hover': {
                    backgroundColor: '#005ea6'
                  }
                }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Redirecting to PayPal...
                  </>
                ) : (
                  <>
                    <AccountBalance sx={{ mr: 1 }} />
                    Pay ${depositDisplay} with PayPal
                  </>
                )}
              </Button>
            </Box>
          )}

          {paymentMethod === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  You'll be redirected to CashApp to complete your ${depositDisplay} deposit payment securely.
                </Typography>
              </Alert>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleCashAppPayment}
                disabled={isProcessing}
                sx={{
                  py: 1.5,
                  backgroundColor: '#00d632',
                  color: '#000',
                  '&:hover': {
                    backgroundColor: '#00c12a'
                  }
                }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={20} sx={{ color: '#000', mr: 1 }} />
                    Redirecting to CashApp...
                  </>
                ) : (
                  <>
                    <Payment sx={{ mr: 1 }} />
                    Pay ${depositDisplay} with CashApp
                  </>
                )}
              </Button>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            🔒 All payments are secure and encrypted • Multiple payment options available
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

const DepositPayment = ({ servicePrice, servicePackage, onPaymentSuccess, onPaymentError }) => {
  const stripePromise = getStripe();

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        servicePrice={servicePrice}
        servicePackage={servicePackage}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
};

export default DepositPayment;
