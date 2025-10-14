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
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  CheckCircle,
  Schedule,
  Block,
  DirectionsCar,
  Home,
  LocationOn,
  Check,
  ArrowBack,
  ArrowForward,
  Phone,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import DepositPayment from '../Payment/DepositPayment';
import { calculateDepositAmount, formatCurrency } from '../../services/stripeService';
import { createAppointmentConfirmedNotification, createPaymentReceivedNotification } from '../../utils/notificationService';
import { sendAppointmentConfirmationEmail } from '../../utils/emailService';
import { handleError, withRetry } from '../../utils/errorHandler';
import { LoadingSpinner, FormLoadingOverlay } from '../LoadingState';
import ClientLayout from '../Layout/ClientLayout';

const BookAppointment = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  const [formData, setFormData] = useState({
    selectedServices: [], // Array of selected services
    vehicleType: '', // small, suv, threeRow
    vehicleId: '',
    vehiclePhone: '', // Campo para almacenar el teléfono del vehículo
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

  const steps = ['Select Services', 'Select Vehicle Type', 'Select Vehicle', 'Choose Date & Time', 'Location Details', 'Review & Payment'];

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
      await withRetry(async () => {
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
      

      
      // Generate slots and mark availability
      const slots = generateTimeSlots(selectedDate);
      const availableSlots = slots.map(slot => ({
        ...slot,
        available: slot.available && 
                  !bookedSlots.includes(slot.label) && 
                  !blockedSlots.includes(slot.label)
      }));
      
        setAvailableSlots(availableSlots);
      });
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'checking_slot_availability',
        date: selectedDate?.toISOString()
      });
      setError(errorInfo.message);
    }
    setLoadingSlots(false);
  };

  // Fetch user's vehicles
  useEffect(() => {
    if (currentUser) {
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(vehiclesQuery, (snapshot) => {
        const userVehicles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVehicles(userVehicles);
      }, (error) => {
        console.error('Error fetching vehicles:', error);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

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
    interior: {
      name: 'INTERIOR SERVICES',
      services: [
        { 
          name: 'SILVER PACKAGE', 
          price: 75, 
          description: 'Perfect for keeping your vehicle clean and presentable on a daily basis',
          details: 'Air blow, full vacuuming, plastic shine, carpet mat cleaning, trunk cleaning, interior glass cleaning',
          vehicleTypes: { small: 75, suv: 85, threeRow: 95 }
        },
        { 
          name: 'GOLD PACKAGE', 
          price: 145, 
          description: 'A complete cleaning to make your interior look like new',
          details: 'Deep cleaning of seats/carpets/headliner, window cleaning, extractor/steam, plastic conditioning, air freshener',
          vehicleTypes: { small: 145, suv: 165, threeRow: 185 }
        },
        { 
          name: 'DIAMOND PACKAGE', 
          price: 225, 
          description: 'For vehicles with high dirt levels or challenging conditions (50%+ stains, heavy pet hair, strong odors)',
          details: 'All Gold services + intensive stain/odor treatment + deep decontamination + surface restoration',
          vehicleTypes: { small: 225, suv: 245, threeRow: 265 }
        }
      ]
    },
    interior_addons: {
      name: 'INTERIOR PACKAGE ADD-ONS',
      services: [
        { name: 'Light Pet Hair', price: 25, description: 'Professional removal of light pet hair' },
        { name: 'Heavy Pet Hair', price: 50, description: 'Intensive removal of heavy pet hair' },
        { name: 'Baby Seat', price: 25, description: 'Thorough cleaning of baby car seats' },
        { name: 'Full Cleaning for Dirty Headliners', price: 50, description: 'Deep cleaning of headliner surfaces' },
        { name: 'Engine', price: 40, description: 'Thorough cleaning of engine compartment' },
        { name: 'Headlight Restoration', price: 70, description: 'Restore clarity and visibility' }
      ]
    },
    exterior: {
      name: 'EXTERIOR SERVICES',
      services: [
        { 
          name: 'GOLD PACKAGE', 
          price: 55, 
          description: 'Ideal for keeping your vehicle exterior clean, protected, and presentable',
          details: 'Two-bucket wash, wheel cleaning, tire shine, wheel well cleaning, exterior glass, gas cap, hand-dry',
          vehicleTypes: { small: 55, suv: 65, threeRow: 75 }
        }
      ]
    },
    exterior_addons: {
      name: 'EXTERIOR PACKAGE ADD-ONS',
      services: [
        { name: 'Headlight Restoration', price: 70, description: 'Restore clarity and visibility' },
        { name: 'Plastic Restoration', price: 30, description: 'Restore faded plastic trim' },
        { name: 'Engine Cleaning', price: 40, description: 'Thorough cleaning of engine compartment' },
        { name: 'Clay Bar Treatment', price: 45, description: 'Removes contaminants, reduces oxidation risk, and helps wax or ceramic coating last longer' },
        { name: 'Ceramic Protection (3 months) + Clay Bar', price: 75, description: 'Short-term ceramic coating with clay bar treatment' }
      ]
    },
    polishing: {
      name: 'POLISHING & CERAMIC COATING SERVICES',
      services: [
        { 
          name: 'SILVER PACKAGE', 
          price: 220, 
          description: 'Light cleaning and correction to remove small imperfections and enhance shine',
          details: '1 step polishing, shine enhancement, light scratch removal',
          vehicleTypes: { small: 220, suv: 240, threeRow: 270 }
        },
        { 
          name: 'GOLD PACKAGE', 
          price: 300, 
          description: 'Deeper treatment to correct noticeable defects and restore uniform, glossy finish',
          details: '2 polishing steps, moderate scratch/oxidation removal, preparation for ceramic/sealant',
          vehicleTypes: { small: 300, suv: 320, threeRow: 350 }
        },
        { 
          name: 'DIAMOND PACKAGE', 
          price: 650, 
          description: 'Maximum protection and long-lasting shine with ceramic coating',
          details: '2 polishing steps + high-durability ceramic coating (3-year protection)',
          vehicleTypes: { small: 650, suv: 750, threeRow: 850 }
        }
      ]
    },
    packages: {
      name: 'VIEW PACKAGES',
      services: [
        { 
          name: 'SILVER MAINTENANCE PACKAGE', 
          price: 110, 
          description: 'Basic interior and exterior maintenance',
          details: 'Basic cleaning and maintenance for both interior and exterior',
          vehicleTypes: { small: 110, suv: 130, threeRow: 150 }
        },
        { 
          name: 'GOLD FULL CLEANING PACKAGE', 
          price: 185, 
          description: 'Complete interior and exterior cleaning',
          details: 'Deep cleaning for both interior and exterior surfaces',
          vehicleTypes: { small: 185, suv: 210, threeRow: 240 }
        },
        { 
          name: 'XTREME FULL RENOVATION PACKAGE', 
          price: 450, 
          description: 'Complete renovation and restoration for your vehicle',
          details: 'Intensive cleaning, restoration and protection for both interior and exterior',
          vehicleTypes: { small: 450, suv: 480, threeRow: 520 }
        },
        { 
          name: 'XTREME FULL RENOVATION WITH 5-YEAR CERAMIC PACKAGE', 
          price: 765, 
          description: 'Complete renovation with long-lasting ceramic protection',
          details: 'Full renovation package plus premium 5-year ceramic coating protection',
          vehicleTypes: { small: 765, suv: 800, threeRow: 850 }
        }
      ]
    }
  };



  const handleServiceSelect = (category, service) => {
    const serviceWithCategory = { ...service, category };
    // Identificar servicios por nombre Y categoría para evitar mezclas
    const isSelected = formData.selectedServices.some(s => 
      s.name === service.name && s.category === category
    );
    
    let updatedServices;
    if (isSelected) {
      // Remove service if already selected
      updatedServices = formData.selectedServices.filter(s => 
        !(s.name === service.name && s.category === category)
      );
    } else {
      // Add service if not selected
      updatedServices = [...formData.selectedServices, serviceWithCategory];
    }
    
    setFormData({
      ...formData,
      selectedServices: updatedServices,
      estimatedPrice: 0 // Will be calculated when vehicle type is selected
    });
  };

  const handleVehicleTypeSelect = (vehicleType) => {
    // Calculate total price for all selected services based on vehicle type
    let totalPrice = 0;
    
    formData.selectedServices.forEach(service => {
      let servicePrice = service.price; // default price
      
      // Calculate price based on vehicle type if vehicleTypes exist
      if (service.vehicleTypes) {
        switch(vehicleType) {
          case 'small':
            servicePrice = service.vehicleTypes.small;
            break;
          case 'suv':
            servicePrice = service.vehicleTypes.suv;
            break;
          case 'threeRow':
            servicePrice = service.vehicleTypes.threeRow;
            break;
          default:
            servicePrice = service.price;
        }
      }
      
      totalPrice += servicePrice;
    });
    
    setFormData({
      ...formData,
      vehicleType: vehicleType,
      estimatedPrice: totalPrice
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
        services: formData.selectedServices.map(service => `${service.name} (${serviceCategories[service.category].name})`), // Array of service names with categories
        servicesDetails: formData.selectedServices, // Full service objects for reference
        vehicleType: formData.vehicleType,
        vehicleId: formData.vehicleId,
        ...(formData.vehiclePhone ? { vehiclePhone: formData.vehiclePhone } : {}), // Solo incluir si tiene valor
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

      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      
      // Create notifications for the appointment
      try {
        await createAppointmentConfirmedNotification(currentUser.uid, {
          ...appointmentData,
          id: docRef.id
        });
        
        if (paymentResult) {
          await createPaymentReceivedNotification(currentUser.uid, {
            id: paymentResult.id,
            amount: depositAmount,
            remaining: remainingBalance,
            service: formData.selectedServices.map(s => `${s.name} (${serviceCategories[s.category].name})`).join(', ')
          });
        }
        
        // Send confirmation email if email reminders are enabled
        if (formData.emailReminders) {
          try {
            await sendAppointmentConfirmationEmail({
              ...appointmentData,
              id: docRef.id
            });
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail if email sending fails
          }
        }
      } catch (notificationError) {
        console.error('Error creating notifications:', notificationError);
        // Don't fail the whole process if notifications fail
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
      
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'booking_appointment',
        step: 'payment_processing',
        userId: currentUser.uid
      }, {
        showNotification: true,
        userId: currentUser.uid
      });
      
      setError(errorInfo.message);
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
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                Select one or more services for your vehicle. You can choose multiple services to combine them.
              </Typography>
            </Grid>
            {Object.entries(serviceCategories).map(([key, category]) => (
              <Grid item xs={12} key={key}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 700, 
                  color: '#1976d2',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid #1976d2',
                  paddingBottom: 1,
                  marginBottom: 2
                }}>
                  {category.name}
                </Typography>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {category.services.map((service, index) => {
                    const isSelected = formData.selectedServices.some(s => s.name === service.name && s.category === key);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            backgroundColor: isSelected ? '#e3f2fd' : 'white',
                            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                            height: '100%',
                            borderRadius: { xs: '12px', sm: '16px' },
                            position: 'relative'
                          }}
                          onClick={() => handleServiceSelect(key, service)}
                        >
                          {isSelected && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: '#1976d2',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              ✓
                            </Box>
                          )}
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h6" gutterBottom sx={{ 
                              fontWeight: 700,
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              pr: 2,
                              color: key.includes('addons') ? '#555' : '#1976d2',
                              textTransform: key.includes('addons') ? 'none' : 'uppercase'
                            }}>
                              {service.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              mb: 2,
                              fontSize: { xs: '0.875rem', sm: '0.875rem' },
                              lineHeight: 1.4
                            }}>
                              {service.description}
                            </Typography>
                            {service.vehicleTypes ? (
                              <Typography variant="body2" color="primary" sx={{ 
                                fontWeight: 500,
                                fontSize: { xs: '0.75rem', sm: '0.8rem' }
                              }}>
                                💰 Small: ${service.vehicleTypes.small} | SUV: ${service.vehicleTypes.suv} | 3-Row: ${service.vehicleTypes.threeRow}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="primary" sx={{ 
                                fontWeight: 500,
                                fontSize: { xs: '0.75rem', sm: '0.8rem' }
                              }}>
                                💰 ${service.price}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            ))}
            
            {formData.selectedServices.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ mt: 3, p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                    Selected Services ({formData.selectedServices.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.selectedServices.map((service, idx) => (
                      <Chip 
                        key={idx}
                        label={`${service.name} (${serviceCategories[service.category].name})`}
                        onDelete={() => handleServiceSelect(service.category, service)}
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1, maxWidth: '100%' }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Select Your Vehicle Type
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Choose your vehicle type to see the exact pricing for your selected services:
              </Typography>
              
              {/* Show selected services */}
              <Box sx={{ mb: 4, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Selected Services:
                </Typography>
                {formData.selectedServices.map((service, idx) => (
                  <Chip 
                    key={idx}
                    label={`${service.name} (${serviceCategories[service.category].name})`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5, maxWidth: '100%' }}
                  />
                ))}
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {[
                  { 
                    type: 'small', 
                    label: '🚗 Small Car', 
                    description: 'Compact cars, sedans, coupes',
                    price: formData.selectedServices.reduce((total, service) => {
                      return total + (service.vehicleTypes?.small || service.price);
                    }, 0)
                  },
                  { 
                    type: 'suv', 
                    label: '🚙 SUV', 
                    description: 'Standard SUVs, crossovers',
                    price: formData.selectedServices.reduce((total, service) => {
                      return total + (service.vehicleTypes?.suv || service.price);
                    }, 0)
                  },
                  { 
                    type: 'threeRow', 
                    label: '🚐 3-Row Seating', 
                    description: 'Large SUVs, vans, trucks',
                    price: formData.selectedServices.reduce((total, service) => {
                      return total + (service.vehicleTypes?.threeRow || service.price);
                    }, 0)
                  }
                ].map((vehicleOption) => (
                  <Grid item xs={12} sm={4} key={vehicleOption.type}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: formData.vehicleType === vehicleOption.type ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                        height: '100%',
                        borderRadius: { xs: '12px', sm: '16px' }
                      }}
                      onClick={() => handleVehicleTypeSelect(vehicleOption.type)}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                        <Typography variant="h5" gutterBottom sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          mb: 2
                        }}>
                          {vehicleOption.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mb: 3,
                          fontSize: { xs: '0.875rem', sm: '0.875rem' },
                          lineHeight: 1.4
                        }}>
                          {vehicleOption.description}
                        </Typography>
                        <Typography variant="h4" color="primary" sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.5rem', sm: '2rem' }
                        }}>
                          ${vehicleOption.price}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mt: 1,
                          fontSize: { xs: '0.75rem', sm: '0.8rem' }
                        }}>
                          Total for {formData.selectedServices.length} service{formData.selectedServices.length !== 1 ? 's' : ''}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Select Vehicle for Service
              </Typography>
              
              {vehicles.length === 0 ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  You haven't added any vehicles yet. 
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => navigate('/my-garage')}
                    sx={{ ml: 2 }}
                  >
                    Add Vehicle
                  </Button>
                </Alert>
              ) : (
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {vehicles.map((vehicle) => (
                    <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: formData.vehicleId === vehicle.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                          height: '100%',
                          borderRadius: { xs: '12px', sm: '16px' }
                        }}
                        onClick={() => {
                          // Transferir tanto el ID como el teléfono del vehículo al formulario
                          setFormData(prev => ({ 
                            ...prev, 
                            vehicleId: vehicle.id,
                            vehiclePhone: vehicle.phoneNumber // Transferir el teléfono del vehículo
                          }))
                        }}
                      >
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                            <DirectionsCar sx={{ color: '#1976d2', mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.9rem', sm: '1.25rem' },
                              lineHeight: 1.2
                            }}>
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}>
                            <strong>Color:</strong> {vehicle.color || 'Not specified'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
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
                    <TextField 
                      {...params} 
                      fullWidth 
                      required 
                      sx={{
                        '& .MuiInputBase-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                    />
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
                    <Grid container spacing={{ xs: 1, sm: 2 }}>
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
                              height: { xs: 40, sm: 48 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              cursor: slot.available ? 'pointer' : 'not-allowed',
                              opacity: slot.available ? 1 : 0.5,
                              borderRadius: { xs: '8px', sm: '16px' },
                              '& .MuiChip-icon': {
                                fontSize: { xs: '1rem', sm: '1.25rem' }
                              },
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

      case 4:
        return (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
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
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                label="Zip Code"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value }
                })}
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={{ xs: 4, sm: 5 }}
                label="🐾👶 Special Requests & Notes"
                placeholder="Please let us know about any special requests:
• Pet hair cleaning 🐾
• Baby car seat cleaning 👶
• Specific stains or odors
• Access instructions
• Any other special requirements..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.emailReminders}
                    onChange={(e) => setFormData({ ...formData, emailReminders: e.target.checked })}
                    sx={{
                      '& .MuiSvgIcon-root': {
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Send me email reminders about this appointment
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        );

      case 5:
        return (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: { xs: '12px', sm: '16px' } }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.125rem', sm: '1.25rem' }
                  }}>
                    📋 Booking Summary
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Services:
                      </Typography>
                      <Box sx={{ textAlign: 'right', maxWidth: '60%' }}>
                        {formData.selectedServices.map((service, idx) => (
                          <Typography key={idx} variant="body1" sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            mb: idx < formData.selectedServices.length - 1 ? 0.5 : 0
                          }}>
                            {service.name} ({serviceCategories[service.category].name})
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Vehicle Type:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        textAlign: 'right',
                        maxWidth: '60%'
                      }}>
                        {formData.vehicleType === 'small' ? '🚗 Small Car' : 
                         formData.vehicleType === 'suv' ? '🚙 SUV' : 
                         formData.vehicleType === 'threeRow' ? '🚐 3-Row Seating' : 
                         'Not selected'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Vehicle:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        textAlign: 'right',
                        maxWidth: '60%'
                      }}>
                        {vehicles.find(v => v.id === formData.vehicleId) ? 
                          `${vehicles.find(v => v.id === formData.vehicleId).year} ${vehicles.find(v => v.id === formData.vehicleId).make} ${vehicles.find(v => v.id === formData.vehicleId).model}` : 
                          'Not selected'}
                      </Typography>
                    </Box>
                    
                    {formData.vehiclePhone && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, display: 'flex', alignItems: 'center' }}>
                          <Phone fontSize="small" sx={{ mr: 0.5, color: '#0891b2' }} />
                          Vehicle Phone:
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          textAlign: 'right',
                          maxWidth: '60%'
                        }}>
                          {formData.vehiclePhone}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Date:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        textAlign: 'right'
                      }}>
                        {formData.date?.format('MMMM DD, YYYY')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Time:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        textAlign: 'right'
                      }}>
                        {formData.timeSlot || 'Not selected'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Location:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        textAlign: 'right',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        maxWidth: '60%',
                        lineHeight: 1.4
                      }}>
                        {formData.address.street}<br />
                        {formData.address.city}, {formData.address.state} {formData.address.zipCode}
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Total Service Price:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}>
                        ${formData.estimatedPrice}
                      </Typography>
                    </Box>
                    
                    {/* Payment Structure Information */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        color: '#1976d2', 
                        mb: 2,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}>
                        💳 Payment Required
                      </Typography>
                      
                      {/* Online Deposit */}
                      <Box sx={{ 
                        bgcolor: '#e3f2fd', 
                        p: { xs: 1.5, sm: 2 }, 
                        borderRadius: { xs: '8px', sm: '12px' },
                        border: '1px solid #bbdefb',
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 600, 
                            color: '#1976d2',
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}>
                            Online Deposit ($50)
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 'bold', 
                          color: '#1976d2',
                          fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }}>
                          ${formatCurrency(calculateDepositAmount(formData.estimatedPrice))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          Secure payment processed through Stripe
                        </Typography>
                      </Box>

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
                  servicePackage={formData.selectedServices.map(s => `${s.name} (${serviceCategories[s.category].name})`).join(', ')}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  customerName={currentUser?.displayName || currentUser?.email || 'Customer'}
                  customerEmail={currentUser?.email || ''}
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
        <Box sx={{ 
          maxWidth: 600, 
          mx: 'auto', 
          mt: 8,
          p: 6, 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <CheckCircle sx={{ 
            fontSize: 100, 
            color: '#22c55e', 
            mb: 3,
            filter: 'drop-shadow(0 4px 8px rgba(34, 197, 94, 0.3))'
          }} />
          
          <Typography variant="h3" gutterBottom sx={{ 
            fontWeight: 700, 
            color: '#1f2937',
            mb: 2
          }}>
            🎉 Booking Confirmed!
          </Typography>
          
          <Typography variant="h6" sx={{ 
            color: '#6b7280',
            mb: 3,
            fontWeight: 500
          }}>
            Your appointment request has been successfully submitted.
          </Typography>
          
          <Typography variant="body1" sx={{ 
            mb: 4,
            color: '#374151',
            lineHeight: 1.6
          }}>
            Your deposit has been processed and your appointment is pending approval. Our team will review and confirm your booking shortly. You'll receive a notification once confirmed.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/appointments')}
            sx={{
              background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5
            }}
          >
            View My Appointments
          </Button>
        </Box>
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

          {/* Modern Progress Steps - Mobile Responsive */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            px: { xs: 1, sm: 0 }
          }}>
            {steps.map((label, index) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    borderRadius: { xs: '8px', sm: '12px' },
                    background: index <= activeStep 
                      ? 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)'
                      : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: index <= activeStep ? '#1e293b' : '#94a3b8',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    transition: 'all 0.3s',
                    boxShadow: index <= activeStep ? '0 4px 12px rgba(234, 179, 8, 0.3)' : 'none'
                  }}
                >
                  {index + 1}
                </Box>
                {index < steps.length - 1 && (
                  <Box 
                    sx={{
                      width: { xs: 16, sm: 24, md: 48 },
                      height: 2,
                      background: index < activeStep 
                        ? 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)'
                        : '#e2e8f0',
                      mx: { xs: 0.5, sm: 1 },
                      borderRadius: 1
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
          
          {/* Step Labels - Hidden on mobile for space */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            justifyContent: 'center', 
            gap: 4, 
            mt: 2 
          }}>
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
          
          {/* Current Step Label - Visible on mobile */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, textAlign: 'center', mt: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              Step {activeStep + 1}: {steps[activeStep]}
            </Typography>
          </Box>
        </Box>

        {/* Modern Step Content */}
        <Box sx={{ 
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          p: { xs: 4, md: 6 },
          mb: 4,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
        }}>

        {/* Loading overlay */}
        {loading && <FormLoadingOverlay message="Processing your booking..." />}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          gap: { xs: 2, sm: 0 },
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button
            onClick={handleBack}
            variant="outlined"
            size={window.innerWidth < 600 ? 'medium' : 'large'}
            sx={{
              order: { xs: 2, sm: 1 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 }
            }}
          >
            {activeStep === 0 ? 'Back to Dashboard' : 'Back'}
          </Button>
          
          {activeStep === steps.length - 1 ? (
            paymentResult ? (
              <Button
                variant="contained"
                disabled={true}
                size={window.innerWidth < 600 ? 'medium' : 'large'}
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                  opacity: 0.8,
                  order: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1, sm: 1.5 }
                }}
              >
                {loading ? '🔄 Booking Appointment...' : '✅ Appointment Booked!'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                disabled={true}
                size={window.innerWidth < 600 ? 'medium' : 'large'}
                sx={{
                  borderColor: '#1565c0',
                  color: '#1565c0',
                  opacity: 0.6,
                  order: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1, sm: 1.5 }
                }}
              >
                💳 Complete Payment to Book
              </Button>
            )
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              size={window.innerWidth < 600 ? 'medium' : 'large'}
              disabled={
                (activeStep === 0 && formData.selectedServices.length === 0) ||
                (activeStep === 1 && !formData.vehicleType) ||
                (activeStep === 2 && !formData.vehicleId) ||
                (activeStep === 3 && (!formData.date || !formData.timeSlot)) ||
                (activeStep === 4 && (!formData.address.street?.trim() || !formData.address.city?.trim() || !formData.address.state?.trim() || !formData.address.zipCode?.trim()))
              }
              sx={{
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 100%)'
                },
                order: { xs: 1, sm: 2 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 }
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
