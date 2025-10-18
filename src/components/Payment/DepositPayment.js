import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  Apple,
  PhoneIphone,
  CloudUpload,
  CheckCircle,
  AttachFile
} from '@mui/icons-material';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, calculateDepositAmount, formatCurrency } from '../../services/stripeService';
import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';

const CheckoutForm = ({ servicePrice, servicePackage, onPaymentSuccess, onPaymentError, customerName, customerEmail }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(0); // 0: Card, 1: Zelle, 2: Apple Pay, 3: Cash App
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [zelleReceipt, setZelleReceipt] = useState(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [cashAppReceipt, setCashAppReceipt] = useState(null);
  const [cashAppReceiptUrl, setCashAppReceiptUrl] = useState('');

  const depositAmount = calculateDepositAmount(servicePrice);
  const depositDisplay = formatCurrency(depositAmount);
  const remainingAmount = servicePrice - parseFloat(depositDisplay);

  // Check if Apple Pay is available on load
  React.useEffect(() => {
    const checkApplePay = async () => {
      if (!stripe) return;
      
      const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Deposit Payment',
          amount: depositAmount,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      const canMakePayment = await paymentRequest.canMakePayment();
      setApplePayAvailable(!!canMakePayment?.applePay);
    };

    checkApplePay();
  }, [stripe, depositAmount]);

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

  const handleReceiptUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('❌ Only images (JPG, PNG, GIF) and PDF files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('❌ File size must be less than 5MB');
      return;
    }

    setReceiptUploading(true);
    setError('');

    try {
      const userId = currentUser?.uid || 'guest';
      const timestamp = Date.now();
      const fileName = `zelle_receipt_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `payment-receipts/${userId}/${fileName}`);

      console.log('Uploading receipt to:', `payment-receipts/${userId}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      console.log('✅ Receipt uploaded successfully:', downloadUrl);
      
      setZelleReceipt(file);
      setReceiptUrl(downloadUrl);
      setReceiptUploading(false);
    } catch (err) {
      console.error('Error uploading receipt:', err);
      setError(`❌ Failed to upload receipt: ${err.message}`);
      setReceiptUploading(false);
    }
  };

  const handleCashAppReceiptUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('❌ Only images (JPG, PNG, GIF) and PDF files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('❌ File size must be less than 5MB');
      return;
    }

    setReceiptUploading(true);
    setError('');

    try {
      const userId = currentUser?.uid || 'guest';
      const timestamp = Date.now();
      const fileName = `cashapp_receipt_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `payment-receipts/${userId}/${fileName}`);

      console.log('Uploading Cash App receipt to:', `payment-receipts/${userId}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      console.log('✅ Cash App receipt uploaded successfully:', downloadUrl);
      
      setCashAppReceipt(file);
      setCashAppReceiptUrl(downloadUrl);
      setReceiptUploading(false);
    } catch (err) {
      console.error('Error uploading Cash App receipt:', err);
      setError(`❌ Failed to upload receipt: ${err.message}`);
      setReceiptUploading(false);
    }
  };

  const handleZellePayment = async () => {
    // Validate that receipt is uploaded
    if (!zelleReceipt || !receiptUrl) {
      setError('❌ Please upload your Zelle payment receipt first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate Zelle payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful Zelle payment with receipt URL
      const mockPaymentResult = {
        id: `zelle_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: depositAmount,
        payment_method: 'zelle',
        method: 'zelle',
        receiptUrl: receiptUrl,
        receiptFileName: zelleReceipt.name
      };

      console.log('✅ Zelle payment confirmed with receipt:', mockPaymentResult);
      onPaymentSuccess(mockPaymentResult);
    } catch (err) {
      setError('Zelle payment failed. Please try again.');
      onPaymentError(err);
    }

    setIsProcessing(false);
  };

  const handleCashAppPayment = async () => {
    // Validate that receipt is uploaded
    if (!cashAppReceipt || !cashAppReceiptUrl) {
      setError('❌ Please upload your Cash App payment receipt first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate Cash App payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful Cash App payment with receipt URL
      const mockPaymentResult = {
        id: `cashapp_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        amount: depositAmount,
        payment_method: 'cashapp',
        method: 'cashapp',
        receiptUrl: cashAppReceiptUrl,
        receiptFileName: cashAppReceipt.name
      };

      console.log('✅ Cash App payment confirmed with receipt:', mockPaymentResult);
      onPaymentSuccess(mockPaymentResult);
    } catch (err) {
      setError('Cash App payment failed. Please try again.');
      onPaymentError(err);
    }

    setIsProcessing(false);
  };

  const handleApplePayment = async () => {
    if (!stripe) {
      setError('Stripe is not initialized. Please check your configuration.');
      return;
    }

    console.log('🍎 Iniciando Apple Pay...');
    console.log('Apple Pay disponible:', applePayAvailable);
    
    if (!applePayAvailable) {
      setError('Apple Pay no está disponible en este dispositivo. Usa Safari en un dispositivo Apple o prueba otro método de pago.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('🍎 Creando Payment Request...');
      
      // Create Payment Request
      const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: `Depósito - ${servicePackage || 'Servicio de Detailing'}`,
          amount: depositAmount,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Verificar si Apple Pay está disponible
      const canMakePayment = await paymentRequest.canMakePayment();
      console.log('🍎 Can Make Payment:', canMakePayment);
      
      if (!canMakePayment || !canMakePayment.applePay) {
        setError('Apple Pay no está disponible en este dispositivo o navegador. Por favor usa Safari en un dispositivo Apple.');
        setIsProcessing(false);
        return;
      }

      console.log('🍎 Creando Payment Intent en backend...');
      
      // Create Payment Intent on backend
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
      
      const paymentIntentResult = await createPaymentIntentFn({
        amount: depositAmount,
        currency: 'usd',
        metadata: {
          servicePackage: servicePackage || 'Auto Detailing Service',
          servicePrice: servicePrice,
          depositAmount: depositDisplay,
          customerEmail: customerEmail || 'customer@example.com',
          customerName: customerName || 'Customer',
          paymentMethod: 'apple_pay'
        }
      });

      const { clientSecret } = paymentIntentResult.data;
      console.log('🍎 Payment Intent creado, client secret recibido');

      // Handle payment method
      paymentRequest.on('paymentmethod', async (ev) => {
        console.log('🍎 Payment method recibido, confirmando pago...');
        
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          console.error('❌ Error confirmando pago:', confirmError);
          ev.complete('fail');
          setError(confirmError.message);
          onPaymentError(confirmError);
          setIsProcessing(false);
        } else {
          console.log('✅ Pago confirmado exitosamente:', paymentIntent.status);
          ev.complete('success');
          
          if (paymentIntent.status === 'succeeded') {
            const paymentResult = {
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount: paymentIntent.amount,
              payment_method: ev.paymentMethod.id,
              method: 'apple_pay',
              created: paymentIntent.created,
              currency: paymentIntent.currency
            };

            console.log('✅ Notificando éxito del pago');
            onPaymentSuccess(paymentResult);
          }
          setIsProcessing(false);
        }
      });

      // Show Apple Pay sheet
      console.log('🍎 Mostrando Apple Pay sheet...');
      const result = await paymentRequest.show();
      console.log('🍎 Apple Pay sheet resultado:', result);

    } catch (err) {
      console.error('❌ Apple Pay error:', err);
      
      // Mensajes de error más claros
      let errorMessage = 'Error procesando Apple Pay. ';
      
      if (err.message.includes('not available')) {
        errorMessage = 'Apple Pay no está disponible. Por favor usa Safari en un iPhone, iPad o Mac.';
      } else if (err.message.includes('canceled') || err.message.includes('cancelled')) {
        errorMessage = 'Pago con Apple Pay cancelado.';
      } else {
        errorMessage = err.message || 'Error inesperado con Apple Pay. Por favor intenta otro método de pago.';
      }
      
      setError(errorMessage);
      onPaymentError(err);
      setIsProcessing(false);
    }
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
              <CreditCard sx={{ fontSize: '1.5rem' }} />
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
                  <CreditCard fontSize="small" />
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
                  Deposit Required ($50)
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
              <CreditCard sx={{ fontSize: '1.5rem' }} />
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
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                { 
                  id: 0, 
                  icon: <CreditCard />, 
                  label: 'Credit/Debit Card', 
                  color: '#1565c0', 
                  desc: 'Visa, Mastercard, Amex',
                  badge: 'Secure & Instant',
                  available: true
                },
                { 
                  id: 1, 
                  icon: <PhoneIphone />, 
                  label: 'Zelle', 
                  color: '#6b21a8', 
                  desc: 'Fast Bank Transfer',
                  badge: 'Quick Pay',
                  available: true
                },
                { 
                  id: 2, 
                  icon: <Apple />, 
                  label: 'Apple Pay', 
                  color: '#000000', 
                  desc: 'One-tap checkout',
                  badge: applePayAvailable ? 'Available' : 'Device Not Supported',
                  available: true // Always show
                },
                { 
                  id: 3, 
                  icon: <AccountBalance />, 
                  label: 'Cash App', 
                  color: '#00d54b', 
                  desc: '$Cashtag Payment',
                  badge: 'Popular',
                  available: true
                }
              ].map((method) => (
                <Grid item xs={12} sm={6} md={4} key={method.id}>
                  <Paper
                    elevation={paymentMethod === method.id ? 6 : 2}
                    sx={{
                      p: 3,
                      height: '100%',
                      cursor: 'pointer',
                      border: paymentMethod === method.id ? `3px solid ${method.color}` : '2px solid #e2e8f0',
                      borderRadius: '20px',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      background: paymentMethod === method.id ? 
                        `linear-gradient(135deg, ${method.color}08 0%, ${method.color}15 100%)` : 
                        'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                      backdropFilter: 'blur(20px)',
                      '&:hover': {
                        boxShadow: `0 12px 24px ${method.color}30`,
                        transform: 'translateY(-4px)',
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
                        width: 64,
                        height: 64,
                        borderRadius: '16px',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${method.color} 0%, ${method.color}dd 100%)`,
                        color: 'white',
                        boxShadow: paymentMethod === method.id ? `0 6px 20px ${method.color}50` : `0 4px 12px ${method.color}30`,
                      }}>
                        {React.cloneElement(method.icon, { sx: { fontSize: '2rem' } })}
                      </Box>
                        
                      {/* Payment Label */}
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: paymentMethod === method.id ? method.color : '#0f172a',
                        mb: 0.5,
                        fontSize: '1.1rem'
                      }}>
                        {method.label}
                      </Typography>
                        
                      {/* Payment Description */}
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.875rem',
                        color: '#64748b',
                        lineHeight: 1.4,
                        fontWeight: 500
                      }}>
                        {method.desc}
                      </Typography>

                      {/* Radio indicator */}
                      <Box sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${paymentMethod === method.id ? method.color : '#cbd5e1'}`,
                        backgroundColor: 'white',
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
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
                        top: -10,
                        left: 16,
                        backgroundColor: method.id === 0 ? '#10b981' : method.id === 1 ? '#6b21a8' : '#000000',
                        color: 'white',
                        px: 2,
                        py: 0.75,
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        boxShadow: method.id === 0 ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 
                                  method.id === 1 ? '0 4px 12px rgba(107, 33, 168, 0.4)' : 
                                  '0 4px 12px rgba(0, 0, 0, 0.4)',
                        border: '2px solid rgba(255, 255, 255, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        letterSpacing: '0.5px'
                      }}>
                        <Box component="span" sx={{ fontSize: '0.9rem' }}>
                          {method.id === 0 ? '🔒' : method.id === 1 ? '⚡' : '🍎'}
                        </Box>
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
            <Box>
              <Typography variant="subtitle2" sx={{ 
                mb: 2, 
                fontWeight: 600, 
                color: '#6b21a8',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <PhoneIphone fontSize="small" />
                Pay with Zelle
              </Typography>
              
              <Alert severity="info" icon={<Box component="span" sx={{ fontSize: '1.3rem' }}>📱</Box>} sx={{ mb: 3, borderRadius: '12px' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  <strong>Fast & Secure</strong> - Send your deposit directly from your bank app using Zelle.
                </Typography>
              </Alert>
              
              <Paper variant="outlined" sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(107, 33, 168, 0.03) 0%, rgba(107, 33, 168, 0.08) 100%)',
                border: '2px solid rgba(107, 33, 168, 0.2)'
              }}>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 700, color: '#6b21a8', fontSize: '1rem' }}>
                  📲 Send ${depositDisplay} via Zelle to:
                </Typography>
                
                <Box sx={{ 
                  p: 2.5, 
                  bgcolor: 'white', 
                  borderRadius: '12px',
                  border: '2px dashed #6b21a8',
                  mb: 2
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIphone sx={{ color: '#6b21a8' }} />
                    614-653-5882
                </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                    Poveda Premium Auto Care
                </Typography>
                </Box>

                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', mb: 1.5 }}>
                  📝 Instructions:
                </Typography>
                <Box component="ol" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1, color: '#64748b' }}>
                    Open your bank app and select Zelle
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1, color: '#64748b' }}>
                    Send <strong>${depositDisplay}</strong> to <strong>614-653-5882</strong>
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1, color: '#64748b' }}>
                    Add your name in the memo/note field
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ color: '#64748b' }}>
                    Click the button below once sent
                  </Typography>
                </Box>
              </Paper>
              
              {/* Upload Receipt Section */}
              <Paper variant="outlined" sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '16px',
                background: receiptUrl ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%)' : 'linear-gradient(135deg, rgba(107, 33, 168, 0.03) 0%, rgba(107, 33, 168, 0.08) 100%)',
                border: receiptUrl ? '2px solid rgba(16, 185, 129, 0.3)' : '2px dashed rgba(107, 33, 168, 0.3)',
                textAlign: 'center'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: receiptUrl ? '#10b981' : '#6b21a8', mb: 2, fontSize: '1rem' }}>
                  {receiptUrl ? '✅ Receipt Uploaded!' : '📎 Upload Payment Receipt (Required)'}
                </Typography>
                
                {receiptUrl ? (
                  <Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: 1,
                      mb: 2,
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: '10px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <CheckCircle sx={{ color: '#10b981', fontSize: '2rem' }} />
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                          {zelleReceipt?.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {(zelleReceipt?.size / 1024).toFixed(2)} KB
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      component="label"
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: '#10b981',
                        color: '#10b981',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          borderColor: '#059669',
                          bgcolor: 'rgba(16, 185, 129, 0.04)'
                        }
                      }}
                    >
                      Change Receipt
                      <input
                        type="file"
                        hidden
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        disabled={receiptUploading}
                      />
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Button
                      component="label"
                      variant="contained"
                      startIcon={receiptUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                      disabled={receiptUploading}
                      sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6b21a8 0%, #581c87 100%)',
                        boxShadow: '0 4px 12px rgba(107, 33, 168, 0.3)',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #581c87 0%, #4c1d95 100%)',
                          boxShadow: '0 6px 16px rgba(107, 33, 168, 0.4)',
                        }
                      }}
                    >
                      {receiptUploading ? 'Uploading...' : 'Choose File'}
                      <input
                        type="file"
                        hidden
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        disabled={receiptUploading}
                      />
                    </Button>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#64748b' }}>
                      Accepted formats: JPG, PNG, GIF, PDF (max 5MB)
                    </Typography>
                  </Box>
                )}
              </Paper>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleZellePayment}
                disabled={isProcessing || !receiptUrl}
                sx={{
                  py: 2,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6b21a8 0%, #581c87 100%)',
                  boxShadow: '0 8px 16px rgba(107, 33, 168, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  letterSpacing: '0.2px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #581c87 0%, #4c1d95 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 20px rgba(107, 33, 168, 0.4)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {isProcessing ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <CircularProgress size={22} color="inherit" />
                    <Typography sx={{ fontWeight: 600 }}>Processing...</Typography>
                  </Box>
                ) : receiptUrl ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <Box component="span" sx={{ fontSize: '1.3rem' }}>✅</Box>
                    <Typography sx={{ fontWeight: 600 }}>Confirm Payment</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <Box component="span" sx={{ fontSize: '1.3rem' }}>📎</Box>
                    <Typography sx={{ fontWeight: 600 }}>Upload Receipt First</Typography>
                  </Box>
                )}
              </Button>
            </Box>
          )}

          {paymentMethod === 2 && (
            <Box>
              <Typography variant="subtitle2" sx={{ 
                mb: 2, 
                fontWeight: 600, 
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Apple fontSize="small" />
                Pay with Apple Pay
              </Typography>
              
              <Alert severity="success" icon={<Box component="span" sx={{ fontSize: '1.3rem' }}>🍎</Box>} sx={{ mb: 3, borderRadius: '12px' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  <strong>One-Tap Checkout</strong> - Fast, secure, and private payment with Face ID or Touch ID.
                </Typography>
              </Alert>
              
              <Paper variant="outlined" sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.05) 100%)',
                border: '2px solid rgba(0, 0, 0, 0.1)'
              }}>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Apple sx={{ fontSize: '4rem', mb: 2 }} />
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Click the button below to complete your payment with Apple Pay
                  </Typography>
                </Box>
              </Paper>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleApplePayment}
                disabled={isProcessing || !applePayAvailable}
                sx={{
                  py: 2,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  letterSpacing: '0.2px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.4)',
                  },
                  '&:disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8'
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {isProcessing ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <CircularProgress size={22} color="inherit" />
                    <Typography sx={{ fontWeight: 600 }}>Processing...</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <Apple />
                    <Typography sx={{ fontWeight: 600 }}>Pay ${depositDisplay}</Typography>
                  </Box>
                )}
              </Button>
            </Box>
          )}

          {paymentMethod === 3 && (
            <Box>
              <Typography variant="subtitle2" sx={{ 
                mb: 2, 
                fontWeight: 600, 
                color: '#00d54b',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <AccountBalance fontSize="small" />
                Pay with Cash App
              </Typography>
              
              <Alert severity="success" icon={<Box component="span" sx={{ fontSize: '1.3rem' }}>💵</Box>} sx={{ mb: 3, borderRadius: '12px' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Send payment to our Cash App and upload the receipt:
                </Typography>
              </Alert>

              {/* Cash App Payment Details */}
              <Paper sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '16px', 
                background: 'linear-gradient(135deg, rgba(0, 213, 75, 0.05) 0%, rgba(0, 213, 75, 0.08) 100%)',
                border: '2px dashed #00d54b'
              }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#00d54b', mb: 1 }}>
                    Cash App Details
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.1rem' }}>
                    $PovedaDetailing
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                    Poveda Premium Auto Care
                  </Typography>
                </Box>

                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(0, 213, 75, 0.1)', 
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 213, 75, 0.2)'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#00d54b', mb: 1 }}>
                    📋 Instructions:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 0.5 }}>
                    1. Open Cash App and send <strong>${depositDisplay}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 0.5 }}>
                    2. To: <strong>$PovedaDetailing</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    3. Take a screenshot of your payment confirmation
                  </Typography>
                </Box>
              </Paper>

              {/* Cash App Receipt Upload */}
              <Paper sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '16px',
                border: '2px solid',
                borderColor: cashAppReceiptUrl ? '#22c55e' : '#e2e8f0',
                background: cashAppReceiptUrl ? 
                  'linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, rgba(34, 197, 94, 0.08) 100%)' : 
                  'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  mb: 2, 
                  fontWeight: 600, 
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <AttachFile fontSize="small" />
                  Upload Cash App Receipt
                </Typography>

                <input
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  id="cashapp-receipt-upload"
                  type="file"
                  onChange={handleCashAppReceiptUpload}
                />
                <label htmlFor="cashapp-receipt-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    disabled={receiptUploading}
                    startIcon={receiptUploading ? <CircularProgress size={20} /> : (cashAppReceiptUrl ? <CheckCircle /> : <CloudUpload />)}
                    sx={{
                      py: 2,
                      borderRadius: '12px',
                      borderColor: cashAppReceiptUrl ? '#22c55e' : '#cbd5e1',
                      color: cashAppReceiptUrl ? '#22c55e' : '#64748b',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: cashAppReceiptUrl ? '#16a34a' : '#94a3b8',
                        bgcolor: cashAppReceiptUrl ? 'rgba(34, 197, 94, 0.04)' : 'rgba(148, 163, 184, 0.04)'
                      }
                    }}
                  >
                    {receiptUploading ? 'Uploading...' : 
                     cashAppReceiptUrl ? `✅ ${cashAppReceipt.name}` : 
                     'Choose File (Image or PDF)'}
                  </Button>
                </label>

                {cashAppReceiptUrl && (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: '12px' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      ✅ Receipt uploaded successfully! Click "Confirm Payment" below.
                    </Typography>
                  </Alert>
                )}

                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#64748b', textAlign: 'center' }}>
                  Max file size: 5MB • Formats: JPG, PNG, GIF, PDF
                </Typography>
              </Paper>

              {/* Submit Cash App Payment */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleCashAppPayment}
                disabled={isProcessing || !cashAppReceiptUrl}
                sx={{
                  py: 2,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #00d54b 0%, #00b341 100%)',
                  boxShadow: '0 8px 16px rgba(0, 213, 75, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  letterSpacing: '0.2px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00b341 0%, #009938 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 20px rgba(0, 213, 75, 0.4)',
                  },
                  '&:disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8'
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {isProcessing ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <CircularProgress size={22} color="inherit" />
                    <Typography sx={{ fontWeight: 600 }}>Processing...</Typography>
                  </Box>
                ) : cashAppReceiptUrl ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <Box component="span" sx={{ fontSize: '1.3rem' }}>✅</Box>
                    <Typography sx={{ fontWeight: 600 }}>Confirm Payment</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <AccountBalance />
                    <Typography sx={{ fontWeight: 600 }}>Upload Receipt First</Typography>
                  </Box>
                )}
              </Button>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
            🔒 All payments are secure and encrypted with industry-leading security
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
