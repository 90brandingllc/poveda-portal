import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  DirectionsCar,
  LocationOn,
  Schedule,
  Payment,
  CheckCircle
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';

const BookAppointment = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    serviceCategory: '',
    servicePackage: '',
    date: null,
    time: null,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    notes: '',
    couponCode: '',
    emailReminders: true,
    estimatedPrice: 0,
    discount: 0
  });

  const steps = ['Select Service', 'Choose Date & Time', 'Location Details', 'Review & Book'];

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

  const coupons = {
    'FIRST20': { discount: 20, description: 'First time customer 20% off' },
    'SUMMER15': { discount: 15, description: 'Summer special 15% off' },
    'VIP10': { discount: 10, description: 'VIP member 10% off' }
  };

  const handleServiceSelect = (category, service) => {
    setFormData({
      ...formData,
      serviceCategory: category,
      servicePackage: service.name,
      estimatedPrice: service.price
    });
  };

  const handleCouponApply = () => {
    const coupon = coupons[formData.couponCode.toUpperCase()];
    if (coupon) {
      const discount = (formData.estimatedPrice * coupon.discount) / 100;
      setFormData({
        ...formData,
        discount: discount
      });
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      navigate('/dashboard');
    } else {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const appointmentData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        service: formData.servicePackage,
        category: formData.serviceCategory,
        date: formData.date?.toDate(),
        time: formData.time?.format('HH:mm'),
        address: formData.address,
        notes: formData.notes,
        couponCode: formData.couponCode,
        emailReminders: formData.emailReminders,
        estimatedPrice: formData.estimatedPrice,
        discount: formData.discount,
        finalPrice: formData.estimatedPrice - formData.discount,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'appointments'), appointmentData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 3000);
    } catch (error) {
      setError('Failed to book appointment. Please try again.');
      console.error('Booking error:', error);
    }
    setLoading(false);
  };

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
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Select Date"
                  value={formData.date}
                  onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                  minDate={dayjs()}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Select Time"
                  value={formData.time}
                  onChange={(newValue) => setFormData({ ...formData, time: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  We provide mobile service! Our team will come to your specified location at the scheduled time.
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
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Booking Summary
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
                        {formData.time?.format('h:mm A')}
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
                      <Typography variant="body1">Service Price:</Typography>
                      <Typography variant="body1">${formData.estimatedPrice}</Typography>
                    </Box>
                    
                    {formData.discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                        <Typography variant="body1">Discount:</Typography>
                        <Typography variant="body1">-${formData.discount}</Typography>
                      </Box>
                    )}
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Total:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ${formData.estimatedPrice - formData.discount}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Apply Coupon
                  </Typography>
                  <TextField
                    fullWidth
                    label="Coupon Code"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleCouponApply}
                  >
                    Apply Coupon
                  </Button>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Available Coupons:
                    </Typography>
                    {Object.entries(coupons).map(([code, coupon]) => (
                      <Chip
                        key={code}
                        label={`${code} - ${coupon.discount}% off`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                        onClick={() => setFormData({ ...formData, couponCode: code })}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
            Booking Confirmed!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Your appointment has been successfully booked.
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            We'll contact you soon to confirm the details. You can track your appointment status in your dashboard.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/appointments')}
          >
            View My Appointments
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Book Your Service
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

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
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              size="large"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !formData.servicePackage) ||
                (activeStep === 1 && (!formData.date || !formData.time)) ||
                (activeStep === 2 && (!formData.address.street || !formData.address.city))
              }
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default BookAppointment;
