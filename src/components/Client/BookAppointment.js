import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  CheckCircle,
  Schedule,
  Block
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import DepositPayment from '../Payment/DepositPayment';
import { calculateDepositAmount, formatCurrency } from '../../services/stripeService';
import ClientLayout from '../Layout/ClientLayout';

const BookAppointment = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [formData, setFormData] = useState({
    serviceCategory: '',
    servicePackage: '',
    date: null,
    timeSlot: null,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    notes: '',
    emailReminders: true,
    estimatedPrice: 0
  });

  const steps = ['Select Service', 'Choose Date & Time', 'Location Details', 'Review & Payment'];

  // Generate time slots for business hours (9 AM - 5 PM, Monday to Friday)
  const generateTimeSlots = (selectedDate) => {
    if (!selectedDate) return [];
    
    const slots = [];
    const date = dayjs(selectedDate);
    
    // Check if it's a weekend
    if (date.day() === 0 || date.day() === 6) {
      return []; // No slots on weekends
    }
    
    // Generate 1-hour slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      const slotTime = date.hour(hour).minute(0).second(0);
      
      // Don't show past time slots for today
      if (date.isSame(dayjs(), 'day') && slotTime.isBefore(dayjs())) {
        continue;
      }
      
      slots.push({
        time: slotTime,
        label: slotTime.format('h:mm A'),
        available: true // Will be updated when checking against booked appointments
      });
    }
    
    return slots;
  };

  // Check slot availability against existing appointments and admin-blocked slots
  const checkSlotAvailability = async (selectedDate) => {
    if (!selectedDate) return;
    
    setLoadingSlots(true);
    try {
      const dayStart = dayjs(selectedDate).startOf('day').toDate();
      const dayEnd = dayjs(selectedDate).endOf('day').toDate();
      
      // Query appointments for the selected date
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('date', '>=', dayStart),
        where('date', '<=', dayEnd)
      );
      
      // Query admin-blocked slots for the selected date (using same Date object approach as admin)
      const blockedSlotsQuery = query(
        collection(db, 'blockedSlots'),
        where('date', '>=', dayStart),
        where('date', '<=', dayEnd)
      );
      
      const [appointmentsSnapshot, blockedSlotsSnapshot] = await Promise.all([
        getDocs(appointmentsQuery),
        getDocs(blockedSlotsQuery)
      ]);
      
      const bookedSlots = [];
      const blockedSlots = [];
      
      // Get booked slots from appointments
      appointmentsSnapshot.forEach((doc) => {
        const appointment = doc.data();
        if (appointment.timeSlot) {
          bookedSlots.push(appointment.timeSlot);
        }
      });
      
      // Get admin-blocked slots
      blockedSlotsSnapshot.forEach((doc) => {
        const blockedSlot = doc.data();
        if (blockedSlot.timeSlot) {
          blockedSlots.push(blockedSlot.timeSlot);
        }
      });
      
      console.log('Booked slots:', bookedSlots);
      console.log('Blocked slots:', blockedSlots);
      
      // Generate slots and mark availability
      const slots = generateTimeSlots(selectedDate);
      const availableSlots = slots.map(slot => ({
        ...slot,
        available: slot.available && 
                  !bookedSlots.includes(slot.label) && 
                  !blockedSlots.includes(slot.label)
      }));
      
      setAvailableSlots(availableSlots);
    } catch (error) {
      console.error('Error checking slot availability:', error);
      setError('Failed to load available time slots. Please try again.');
    }
    setLoadingSlots(false);
  };

  // Effect to check availability when date changes
  useEffect(() => {
    if (formData.date) {
      checkSlotAvailability(formData.date);
      setSelectedSlot(null);
      setFormData(prev => ({ ...prev, timeSlot: null }));
    } else {
      setAvailableSlots([]);
    }
  }, [formData.date]);

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    if (!slot.available) return;
    
    setSelectedSlot(slot);
    setFormData(prev => ({ 
      ...prev, 
      timeSlot: slot.label,
      time: slot.time // Keep for backward compatibility
    }));
  };





  const serviceCategories = {
    general: {
      name: 'General Services',
      services: [
        { name: 'Mobile Service', price: 89, description: 'Basic mobile wash and clean' },
        { name: 'Protection Package', price: 149, description: 'Paint protection and preservation' },
        { name: 'Headlight Restoration', price: 79, description: 'Restore clarity and visibility' }
      ]
    },
    interior: {
      name: 'Interior Services',
      services: [
        { name: 'Steam Cleaning', price: 129, description: 'Deep steam cleaning and decontamination' },
        { name: 'Thorough Vacuuming', price: 59, description: 'Complete interior vacuuming' },
        { name: 'Leather Treatment', price: 99, description: 'Premium leather care and conditioning' }
      ]
    },
    exterior: {
      name: 'Exterior Services',
      services: [
        { name: 'Hand Wash Premium', price: 79, description: 'Complete hand wash and detailing' },
        { name: 'Paint Correction', price: 299, description: 'Professional paint restoration' },
        { name: 'Ceramic Coating', price: 599, description: 'Long-lasting paint protection' }
      ]
    },
    packages: {
      name: 'Service Packages',
      services: [
        { name: 'Silver Package', price: 89, description: 'Interior maintenance and basic exterior' },
        { name: 'Gold Package', price: 149, description: 'Deep cleaning inside and out' },
        { name: 'Diamond Package', price: 249, description: 'Complete restoration and protection' }
      ]
    }
  };



  const handleServiceSelect = (category, service) => {
    setFormData({
      ...formData,
      serviceCategory: category,
      servicePackage: service.name,
      estimatedPrice: service.price
    });
  };



  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePaymentSuccess = async (paymentResult) => {
    setPaymentResult(paymentResult);
    setError('');
    
    // Automatically book appointment after successful payment
    setLoading(true);
    
    try {
      // Validate required fields before booking
      if (!formData.date) {
        setError('Please select a date for your appointment.');
        setLoading(false);
        return;
      }

      if (!formData.timeSlot) {
        setError('Please select a time slot for your appointment.');
        setLoading(false);
        return;
      }

      if (!formData.address.street?.trim() || !formData.address.city?.trim() || !formData.address.state?.trim() || !formData.address.zipCode?.trim()) {
        setError('Please provide a complete service address (street, city, state, and zip code).');
        setLoading(false);
        return;
      }

      const depositAmount = parseFloat(formatCurrency(calculateDepositAmount(formData.estimatedPrice)));
      const remainingBalance = formData.estimatedPrice - depositAmount;

      const appointmentData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        service: formData.servicePackage,
        category: formData.serviceCategory,
        date: formData.date.toDate(),
        timeSlot: formData.timeSlot,
        time: formData.time ? formData.time.format('HH:mm') : formData.timeSlot,
        address: formData.address,
        notes: formData.notes || '',
        emailReminders: formData.emailReminders,
        estimatedPrice: formData.estimatedPrice,
        finalPrice: formData.estimatedPrice,
        depositAmount: depositAmount,
        remainingBalance: remainingBalance,
        paymentStatus: 'deposit_paid',
        paymentId: paymentResult.id,
        status: 'pending', // Requires admin approval
        createdAt: serverTimestamp()
      };

      console.log('Auto-booking appointment after payment:', appointmentData);
      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      console.log('Appointment booked with ID:', docRef.id);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
      
    } catch (error) {
      setError(`Failed to book appointment: ${error.message}`);
      console.error('Auto-booking error:', error);
    }
    
    setLoading(false);
  };

  const handlePaymentError = (error) => {
    setError('Payment failed. Please try again.');
    console.error('Payment error:', error);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      navigate('/dashboard');
    } else {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  // Note: handleSubmit is no longer used since booking happens automatically after payment
  // Keeping it for potential future use or fallback scenarios

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {Object.entries(serviceCategories).map(([key, category]) => (
              <Grid item xs={12} key={key}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                  {category.name}
                </Typography>
                <Grid container spacing={2}>
                  {category.services.map((service, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: formData.servicePackage === service.name ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                        }}
                        onClick={() => handleServiceSelect(key, service)}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {service.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {service.description}
                          </Typography>
                          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                            ${service.price}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>
        );

      case 1:
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={3}>
              {/* Date Selection */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Select Date"
                  value={formData.date}
                  onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                  minDate={dayjs()}
                  maxDate={dayjs().add(30, 'day')}
                  shouldDisableDate={(date) => {
                    // Disable weekends
                    return date.day() === 0 || date.day() === 6;
                  }}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </Grid>



              {/* Time Slot Selection */}
              {formData.date && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Available Time Slots for {dayjs(formData.date).format('dddd, MMMM D, YYYY')}
                  </Typography>
                  
                  {loadingSlots ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Loading available slots...</Typography>
                    </Box>
                  ) : availableSlots.length === 0 ? (
                    <Alert severity="warning">
                      No available slots for this date. Please select a different date.
                    </Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {availableSlots.map((slot, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Chip
                            label={slot.label}
                            onClick={() => handleSlotSelect(slot)}
                            color={selectedSlot?.label === slot.label ? 'primary' : 'default'}
                            variant={selectedSlot?.label === slot.label ? 'filled' : 'outlined'}
                            disabled={!slot.available}
                            icon={slot.available ? <Schedule /> : <Block />}
                            sx={{
                              width: '100%',
                              height: 48,
                              fontSize: '0.875rem',
                              cursor: slot.available ? 'pointer' : 'not-allowed',
                              opacity: slot.available ? 1 : 0.5,
                              '&:hover': {
                                backgroundColor: slot.available ? 'primary.light' : 'inherit'
                              }
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Service Info */}
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 3 }}>
                  📍 We provide mobile service! Our team will come to your specified location at the scheduled time.
                </Alert>
              </Grid>
            </Grid>
          </LocalizationProvider>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Zip Code"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes"
                placeholder="Any special instructions or requests..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.emailReminders}
                    onChange={(e) => setFormData({ ...formData, emailReminders: e.target.checked })}
                  />
                }
                label="Send me email reminders about this appointment"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    📋 Booking Summary
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1">Service:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formData.servicePackage}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1">Date:</Typography>
                      <Typography variant="body1">
                        {formData.date?.format('MMMM DD, YYYY')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1">Time:</Typography>
                      <Typography variant="body1">
                        {formData.timeSlot || 'Not selected'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1">Location:</Typography>
                      <Typography variant="body1" sx={{ textAlign: 'right' }}>
                        {formData.address.street}<br />
                        {formData.address.city}, {formData.address.state} {formData.address.zipCode}
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1">Total Service Price:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ${formData.estimatedPrice}
                      </Typography>
                    </Box>
                    
                    {/* Payment Structure Information */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
                        💳 Payment Structure
                      </Typography>
                      
                      {/* Online Deposit */}
                      <Box sx={{ 
                        bgcolor: '#e3f2fd', 
                        p: 2, 
                        borderRadius: 1,
                        border: '1px solid #bbdefb',
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                            Step 1: Online Deposit (50%)
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                          ${formatCurrency(calculateDepositAmount(formData.estimatedPrice))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Secure payment processed through Stripe
                        </Typography>
                      </Box>

                      {/* Remaining Payment */}
                      <Box sx={{ 
                        bgcolor: '#fff3e0', 
                        p: 2, 
                        borderRadius: 1,
                        border: '1px solid #ffcc02'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#f57c00' }}>
                            Step 2: Final Payment (50%)
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                          ${(formData.estimatedPrice - parseFloat(formatCurrency(calculateDepositAmount(formData.estimatedPrice)))).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pay directly to our technician upon service completion
                        </Typography>
                      </Box>

                      {/* Info Alert */}
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Why split payments?</strong> The deposit secures your booking, while the final payment ensures you're 100% satisfied before completing the transaction.
                        </Typography>
                      </Alert>
                    </Box>
                    
                    {paymentResult && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        ✅ Payment successful! Payment ID: {paymentResult.id}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {!paymentResult ? (
                <DepositPayment
                  servicePrice={formData.estimatedPrice}
                  servicePackage={formData.servicePackage}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              ) : (
              <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
                      Payment Completed! 
                  </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Your deposit has been processed successfully and your appointment is being booked automatically.
                    </Typography>
                    <Alert severity="success">
                      ✅ Appointment booking in progress... You'll be redirected shortly!
                    </Alert>
                </CardContent>
              </Card>
              )}
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  if (success) {
    return (
      <ClientLayout>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
            Booking Submitted!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Your appointment request has been successfully submitted.
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Your deposit has been processed and your appointment is pending approval. Our team will review and confirm your booking shortly. You can track your appointment status in your dashboard.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/appointments')}
          >
            View My Appointments
          </Button>
        </Paper>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
        {/* Modern Header */}
        <Box sx={{ 
          mb: 8,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.875rem', md: '2.25rem' },
              color: '#1e293b',
              mb: 2,
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Book Your Service
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#64748b',
              fontWeight: 400,
              fontSize: '1.125rem',
              mb: 4
            }}
          >
            Premium car care at your location
          </Typography>

          {/* Modern Progress Steps */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            {steps.map((label, index) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    background: index <= activeStep 
                      ? 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)'
                      : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: index <= activeStep ? '#1e293b' : '#94a3b8',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s',
                    boxShadow: index <= activeStep ? '0 4px 12px rgba(234, 179, 8, 0.3)' : 'none'
                  }}
                >
                  {index + 1}
                </Box>
                {index < steps.length - 1 && (
                  <Box 
                    sx={{
                      width: { xs: 24, md: 48 },
                      height: 2,
                      background: index < activeStep 
                        ? 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)'
                        : '#e2e8f0',
                      mx: 1,
                      borderRadius: 1
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 2 }}>
            {steps.map((label, index) => (
              <Typography 
                key={label}
                variant="caption" 
                sx={{ 
                  color: index <= activeStep ? '#1e293b' : '#94a3b8',
                  fontWeight: index === activeStep ? 600 : 400,
                  fontSize: '0.75rem'
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Modern Step Content */}
        <Box sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          p: { xs: 4, md: 6 },
          mb: 4,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
        }}>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            variant="outlined"
          >
            {activeStep === 0 ? 'Back to Dashboard' : 'Back'}
          </Button>
          
          {activeStep === steps.length - 1 ? (
            paymentResult ? (
              <Button
                variant="contained"
                disabled={true}
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                  opacity: 0.8
                }}
              >
                {loading ? '🔄 Booking Appointment...' : '✅ Appointment Booked!'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                disabled={true}
                size="large"
                sx={{
                  borderColor: '#1565c0',
                  color: '#1565c0',
                  opacity: 0.6
                }}
              >
                💳 Complete Payment to Book
              </Button>
            )
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !formData.servicePackage) ||
                (activeStep === 1 && (!formData.date || !formData.timeSlot)) ||
                (activeStep === 2 && (!formData.address.street?.trim() || !formData.address.city?.trim() || !formData.address.state?.trim() || !formData.address.zipCode?.trim()))
              }
              sx={{
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 100%)'
                }
              }}
            >
              Next
            </Button>
          )}
        </Box>
        </Box>
    </ClientLayout>
  );
};

export default BookAppointment;
