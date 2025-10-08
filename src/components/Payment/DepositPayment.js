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

const CheckoutForm = ({ servicePrice, servicePackage, onPaymentSuccess, onPaymentError, customerName, customerEmail }) => {
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
      setError('Stripe is not initialized. Please check your configuration.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const card = elements.getElement(CardElement);

      // Step 1: Create Payment Intent on backend
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
      
      const paymentIntentResult = await createPaymentIntentFn({
        amount: depositAmount, // Amount in cents
        currency: 'usd',
        metadata: {
          servicePackage: servicePackage || 'Auto Detailing Service',
          servicePrice: servicePrice,
          depositAmount: depositDisplay,
          customerEmail: customerEmail || 'customer@example.com',
          customerName: customerName || 'Customer'
        }
      });

      const { clientSecret, paymentIntentId } = paymentIntentResult.data;

      // Step 2: Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: customerName || 'Customer',
            email: customerEmail || 'customer@example.com',
          },
        },
      });

      if (confirmError) {
        setError(confirmError.message);
        onPaymentError(confirmError);
        setIsProcessing(false);
        return;
      }

      // Step 3: Verify payment succeeded
      if (paymentIntent.status === 'succeeded') {
        const paymentResult = {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          payment_method: paymentIntent.payment_method,
          method: 'card',
          created: paymentIntent.created,
          currency: paymentIntent.currency
        };

        onPaymentSuccess(paymentResult);
      } else {
        setError(`Payment status: ${paymentIntent.status}. Please try again.`);
        onPaymentError(new Error(`Payment status: ${paymentIntent.status}`));
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
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
      <Card sx={{ 
        mb: 3,
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header Section */}
          <Box sx={{
            py: 2,
            px: 3,
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(245, 158, 11, 0.12) 100%)',
            borderBottom: '1px solid rgba(234, 179, 8, 0.15)',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
              color: 'white'
            }}>
              <Payment sx={{ fontSize: '1.5rem' }} />
            </Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: '#92400e',
              letterSpacing: '-0.3px'
            }}>
              Payment Summary
            </Typography>
          </Box>
          
          <Box sx={{ px: 3, pb: 3 }}>
            {/* Service Details */}
            <Box sx={{ 
              mb: 4,
              p: 2.5,
              borderRadius: '16px',
              bgcolor: 'rgba(241, 245, 249, 0.6)',
              border: '1px solid #e2e8f0',
              position: 'relative'
            }}>
              <Typography variant="subtitle2" sx={{ 
                mb: 2, 
                fontWeight: 700, 
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{ 
                  color: '#f59e0b', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <AccountBalanceWallet fontSize="small" />
                </Box>
                Service Information
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Service:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {servicePackage || 'Headlight Restoration'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Total Service Price:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                  ${servicePrice}
                </Typography>
              </Box>
            </Box>

            {/* Deposit Box */}
            <Box sx={{ 
              mb: 3,
              p: 3,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f59e0b10 0%, #eab30815 100%)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0) 70%)',
                zIndex: 0
              }} />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="subtitle1" sx={{ 
                  mb: 0.5, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#92400e',
                  fontWeight: 600
                }}>
                  <Box component="span" sx={{ fontSize: '1.3rem' }}>💳</Box>
                  Deposit Required ($45)
                </Typography>

                <Typography variant="h3" sx={{ 
                  fontWeight: 800,
                  color: '#92400e',
                  mb: 1,
                  fontSize: '2.5rem',
                }}>
                  ${depositDisplay}
                </Typography>

                <Box sx={{ 
                  p: 1.5, 
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '10px',
                  border: '1px solid #fde68a',
                  mt: 2
                }}>
                  <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span" sx={{ fontSize: '1rem' }}>🔍</Box>
                    Remaining balance <Box component="span" sx={{ fontWeight: 700 }}>(${remainingAmount.toFixed(2)})</Box> due upon service completion
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Alert 
              severity="info" 
              icon={<Box component="span" sx={{ fontSize: '1.3rem' }}>🔒</Box>}
              sx={{ 
                mb: 1,
                borderRadius: '12px',
                border: '1px solid rgba(3, 105, 161, 0.2)',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Your payment information is encrypted and processed securely through Stripe.
              </Typography>
            </Alert>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ 
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header Section */}
          <Box sx={{
            py: 2,
            px: 3,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.12) 100%)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
              color: 'white'
            }}>
              <Payment sx={{ fontSize: '1.5rem' }} />
            </Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: '#1e40af',
              letterSpacing: '-0.3px'
            }}>
              Choose Payment Method
            </Typography>
          </Box>

          <Box sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { id: 0, icon: <CreditCard />, label: 'Card', color: '#1976d2', desc: 'Credit/Debit Cards' },
                { id: 1, icon: <AccountBalance />, label: 'PayPal', color: '#0070ba', desc: 'PayPal Account' },
                { id: 2, icon: <Payment />, label: 'Cash App Pay', color: '#00c853', desc: 'CashApp Payment' },
                { id: 3, icon: <MonetizationOn />, label: 'Klarna', color: '#ffb3d9', desc: 'Buy Now, Pay Later' },
                { id: 4, icon: <Savings />, label: 'Afterpay', color: '#b2f2bb', desc: 'Split in 4 payments' },
                { id: 5, icon: <AccountBalanceWallet />, label: 'Affirm', color: '#0099ff', desc: 'Monthly payments' },
                { id: 6, icon: <Business />, label: 'Bank', color: '#28a745', desc: 'Bank Transfer', badge: '$5 USD Refund' }
              ].map((method) => (
                <Grid item xs={6} sm={4} md={4} lg={3} key={method.id}>
                  <Paper
                    elevation={paymentMethod === method.id ? 4 : 0}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      height: '100%',
                      cursor: 'pointer',
                      border: paymentMethod === method.id ? `2px solid ${method.color}` : '1px solid #e2e8f0',
                      borderRadius: '16px',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      background: paymentMethod === method.id ? 
                        `linear-gradient(135deg, ${method.color}05 0%, ${method.color}10 100%)` : 
                        'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        boxShadow: `0 8px 16px rgba(0, 0, 0, 0.08)`,
                        transform: 'translateY(-2px)',
                        borderColor: method.color,
                      }
                    }}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}>
                      {/* Payment Icon */}
                      <Box sx={{
                        width: { xs: 40, sm: 48 },
                        height: { xs: 40, sm: 48 },
                        borderRadius: '12px',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${method.color} 0%, ${method.color}dd 100%)`,
                        color: 'white',
                        boxShadow: paymentMethod === method.id ? `0 4px 12px ${method.color}40` : 'none',
                      }}>
                        {React.cloneElement(method.icon, { sx: { fontSize: '1.5rem' } })}
                      </Box>
                        
                      {/* Payment Label */}
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 700, 
                        color: paymentMethod === method.id ? method.color : '#334155',
                        mb: 0.5
                      }}>
                        {method.label}
                      </Typography>
                        
                      {/* Payment Description */}
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.7rem',
                        color: '#64748b',
                        lineHeight: 1.2
                      }}>
                        {method.desc}
                      </Typography>

                      {/* Radio indicator */}
                      <Box sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `2px solid ${paymentMethod === method.id ? method.color : '#cbd5e1'}`,
                        backgroundColor: 'white',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {paymentMethod === method.id && (
                          <Box sx={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            backgroundColor: method.color,
                          }} />
                        )}
                      </Box>
                    </Box>

                    {method.badge && (
                      <Box sx={{
                        position: 'absolute',
                        top: -8,
                        left: -8,
                        backgroundColor: '#28a745',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <Box component="span" sx={{ fontSize: '0.8rem' }}>🎁</Box>
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
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 1, 
                  fontWeight: 600, 
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8
                }}>
                  <CreditCard fontSize="small" />
                  Enter Card Details
                </Typography>
                
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    mb: 3,
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    },
                    '& .StripeElement': {
                      height: '40px',
                      padding: '12px 16px',
                      color: '#0f172a',
                      fontSize: '1rem',
                      fontWeight: '500',
                    }
                  }}
                >
                  <CardElement options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#0f172a',
                        fontWeight: '500',
                        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
                        '::placeholder': {
                          color: '#94a3b8',
                        },
                        iconColor: '#3b82f6',
                      },
                      invalid: {
                        color: '#ef4444',
                        iconColor: '#ef4444',
                      },
                    },
                  }} />
                </Paper>
                
                {/* Secure payment message */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 3,
                  p: 1.5,
                  borderRadius: '10px',
                  background: 'rgba(241, 245, 249, 0.5)',
                }}>
                  <Box component="span" sx={{ color: '#64748b', fontSize: '1rem' }}>🔒</Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Your card information is secure and encrypted
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!stripe || isProcessing}
                  sx={{
                    py: 2,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                    boxShadow: '0 8px 16px rgba(13, 71, 161, 0.3)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    letterSpacing: '0.2px',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 20px rgba(13, 71, 161, 0.4)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isProcessing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                      <CircularProgress size={22} color="inherit" />
                      <Typography sx={{ fontWeight: 600 }}>Processing Payment...</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                      <Box component="span" sx={{ fontSize: '1.3rem' }}>💳</Box>
                      <Typography sx={{ fontWeight: 600 }}>Pay ${depositDisplay} with Card</Typography>
                    </Box>
                  )}
                </Button>
              </Box>
            </Box>
          )}

          {paymentMethod === 1 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ 
                mb: 1, 
                fontWeight: 600, 
                color: '#0070ba',
                display: 'flex',
                alignItems: 'center',
                gap: 0.8
              }}>
                <AccountBalance fontSize="small" />
                PayPal Secure Checkout
              </Typography>
              
              <Paper sx={{
                p: 3,
                mb: 3,
                borderRadius: '16px',
                border: '1px solid rgba(0, 112, 186, 0.2)',
                background: 'linear-gradient(135deg, rgba(0, 112, 186, 0.02) 0%, rgba(0, 112, 186, 0.08) 100%)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Box sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff',
                    border: '1px solid #e1e7ed',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <Box 
                      component="img" 
                      src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-color.svg" 
                      alt="PayPal" 
                      sx={{ width: 40, height: 'auto' }}
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', mb: 0.5 }}>
                      Fast, safe, and secure payments
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      You'll be redirected to PayPal to complete your payment of ${depositDisplay}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handlePayPalPayment}
                disabled={isProcessing}
                sx={{
                  py: 2,
                  borderRadius: '16px',
                  backgroundColor: '#0070ba',
                  boxShadow: '0 8px 16px rgba(0, 112, 186, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  letterSpacing: '0.2px',
                  '&:hover': {
                    backgroundColor: '#005ea6',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 20px rgba(0, 112, 186, 0.4)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {isProcessing ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <CircularProgress size={22} color="inherit" />
                    <Typography sx={{ fontWeight: 600 }}>Redirecting to PayPal...</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <AccountBalance />
                    <Typography sx={{ fontWeight: 600 }}>Pay ${depositDisplay} with PayPal</Typography>
                  </Box>
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
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

const DepositPayment = ({ servicePrice, servicePackage, onPaymentSuccess, onPaymentError, customerName, customerEmail }) => {
  const stripePromise = getStripe();

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        servicePrice={servicePrice}
        servicePackage={servicePackage}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        customerName={customerName}
        customerEmail={customerEmail}
      />
    </Elements>
  );
};

export default DepositPayment;
