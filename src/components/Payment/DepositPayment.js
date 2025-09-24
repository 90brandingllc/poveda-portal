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
  AccountBalance,
  MonetizationOn,
  Savings,
  AccountBalanceWallet,
  Business
} from '@mui/icons-material';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, calculateDepositAmount, formatCurrency } from '../../services/stripeService';

const CheckoutForm = ({ servicePrice, servicePackage, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(0); // 0: Card, 1: PayPal, 2: CashApp, 3: Klarna, 4: Afterpay, 5: Affirm, 6: Bank

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

  const handleKlarnaPayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Simulate Klarna payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful Klarna payment
      const mockPaymentResult = {
        id: `klarna_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: depositAmount,
        payment_method: 'klarna',
        method: 'klarna'
      };

      onPaymentSuccess(mockPaymentResult);
    } catch (err) {
      setError('Klarna payment failed. Please try again.');
      onPaymentError(err);
    }

    setIsProcessing(false);
  };

  const handleAfterpayPayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Simulate Afterpay payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful Afterpay payment
      const mockPaymentResult = {
        id: `afterpay_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: depositAmount,
        payment_method: 'afterpay',
        method: 'afterpay'
      };

      onPaymentSuccess(mockPaymentResult);
    } catch (err) {
      setError('Afterpay payment failed. Please try again.');
      onPaymentError(err);
    }

    setIsProcessing(false);
  };

  const handleAffirmPayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Simulate Affirm payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful Affirm payment
      const mockPaymentResult = {
        id: `affirm_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: depositAmount,
        payment_method: 'affirm',
        method: 'affirm'
      };

      onPaymentSuccess(mockPaymentResult);
    } catch (err) {
      setError('Affirm payment failed. Please try again.');
      onPaymentError(err);
    }

    setIsProcessing(false);
  };

  const handleBankPayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Simulate Bank transfer processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful Bank payment
      const mockPaymentResult = {
        id: `bank_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: depositAmount,
        payment_method: 'bank_transfer',
        method: 'bank'
      };

      onPaymentSuccess(mockPaymentResult);
    } catch (err) {
      setError('Bank transfer failed. Please try again.');
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
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { id: 0, icon: <CreditCard />, label: 'Card', color: '#1976d2', desc: 'Credit/Debit Cards' },
              { id: 1, icon: <AccountBalance />, label: 'PayPal', color: '#0070ba', desc: 'PayPal Account' },
              { id: 2, icon: <Payment />, label: 'Cash App Pay', color: '#00d632', desc: 'CashApp Payment' },
              { id: 3, icon: <MonetizationOn />, label: 'Klarna', color: '#ffb3d9', desc: 'Buy Now, Pay Later' },
              { id: 4, icon: <Savings />, label: 'Afterpay', color: '#b2f2bb', desc: 'Split in 4 payments' },
              { id: 5, icon: <AccountBalanceWallet />, label: 'Affirm', color: '#0099ff', desc: 'Monthly payments' },
              { id: 6, icon: <Business />, label: 'Bank', color: '#28a745', desc: 'Bank Transfer', badge: '$5 USD Refund' }
            ].map((method) => (
              <Grid item xs={6} sm={4} md={3} key={method.id}>
                <Paper
                  elevation={paymentMethod === method.id ? 3 : 1}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: paymentMethod === method.id ? `2px solid ${method.color}` : '2px solid transparent',
                    borderRadius: 2,
                    textAlign: 'center',
                    position: 'relative',
                    '&:hover': {
                      elevation: 2,
                      borderColor: method.color
                    }
                  }}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        border: `2px solid ${paymentMethod === method.id ? method.color : '#ccc'}`,
                        backgroundColor: paymentMethod === method.id ? method.color : 'transparent',
                        mr: 1,
                        flexShrink: 0
                      }}
                    />
                    <Box sx={{ color: method.color, mr: 1 }}>
                      {method.icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                      {method.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {method.desc}
                  </Typography>
                  {method.badge && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: '#28a745',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.6rem',
                        fontWeight: 600
                      }}
                    >
                      {method.badge}
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>

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

          {paymentMethod === 3 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Buy now, pay later with Klarna!</strong> Split your ${depositDisplay} payment into 4 interest-free installments.
                </Typography>
              </Alert>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleKlarnaPayment}
                disabled={isProcessing}
                sx={{
                  py: 1.5,
                  backgroundColor: '#ffb3d9',
                  color: '#000',
                  '&:hover': {
                    backgroundColor: '#ff9dd1'
                  }
                }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={20} sx={{ color: '#000', mr: 1 }} />
                    Redirecting to Klarna...
                  </>
                ) : (
                  <>
                    <MonetizationOn sx={{ mr: 1 }} />
                    Pay ${depositDisplay} with Klarna
                  </>
                )}
              </Button>
            </Box>
          )}

          {paymentMethod === 4 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Split it into 4 payments with Afterpay!</strong> Pay ${(parseFloat(depositDisplay) / 4).toFixed(2)} today and the rest over 6 weeks.
                </Typography>
              </Alert>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleAfterpayPayment}
                disabled={isProcessing}
                sx={{
                  py: 1.5,
                  backgroundColor: '#b2f2bb',
                  color: '#000',
                  '&:hover': {
                    backgroundColor: '#9ceaa7'
                  }
                }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={20} sx={{ color: '#000', mr: 1 }} />
                    Redirecting to Afterpay...
                  </>
                ) : (
                  <>
                    <Savings sx={{ mr: 1 }} />
                    Pay ${depositDisplay} with Afterpay
                  </>
                )}
              </Button>
            </Box>
          )}

          {paymentMethod === 5 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Monthly payments with Affirm!</strong> Choose your payment plan for your ${depositDisplay} deposit.
                </Typography>
              </Alert>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleAffirmPayment}
                disabled={isProcessing}
                sx={{
                  py: 1.5,
                  backgroundColor: '#0099ff',
                  '&:hover': {
                    backgroundColor: '#0077cc'
                  }
                }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Redirecting to Affirm...
                  </>
                ) : (
                  <>
                    <AccountBalanceWallet sx={{ mr: 1 }} />
                    Pay ${depositDisplay} with Affirm
                  </>
                )}
              </Button>
            </Box>
          )}

          {paymentMethod === 6 && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Bank Transfer - Get $5 USD Refund!</strong> Transfer ${depositDisplay} directly from your bank account and receive a $5 refund.
                </Typography>
              </Alert>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#f8f9fa' }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Bank Transfer Details:
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Account: POVEDA PREMIUM AUTO CARE
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Amount: ${depositDisplay}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Reference: Your booking ID will be provided
                </Typography>
              </Paper>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleBankPayment}
                disabled={isProcessing}
                sx={{
                  py: 1.5,
                  backgroundColor: '#28a745',
                  '&:hover': {
                    backgroundColor: '#218838'
                  }
                }}
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Processing Bank Transfer...
                  </>
                ) : (
                  <>
                    <Business sx={{ mr: 1 }} />
                    Confirm Bank Transfer ${depositDisplay}
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
