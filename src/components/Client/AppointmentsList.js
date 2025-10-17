import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Box,
  Button,
  Alert,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material';
import {
  Schedule,
  CheckCircle,
  Cancel,
  Star,
  MoreVert,
  LocationOn,
  CalendarToday,
  Edit,
  Save,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';
import { Link } from 'react-router-dom';
import { DatePicker, DesktopTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { handleAppointmentCancellation, handleAppointmentStatusChange } from '../../utils/notificationTriggers';

const AppointmentsList = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    date: null,
    time: null
  });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  useEffect(() => {
    let unsubscribeUserId = null;
    let unsubscribeEmail = null;
    
    const fetchAppointments = async () => {
      if (!currentUser?.uid || !currentUser?.email) {
        console.log('AppointmentsList - No current user, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        console.log('========================================');
        console.log('🔍 APPOINTMENTS DIAGNOSIS');
        console.log('========================================');
        console.log('✅ Current User ID:', currentUser.uid);
        console.log('✅ Current User Email:', currentUser.email);
        console.log('✅ Current User Name:', currentUser.displayName);
        console.log('========================================');
        
        const allAppointments = new Map(); // Use Map to avoid duplicates
        
        // Query 1: Get appointments linked to user ID
        const appointmentsByUserIdQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', currentUser.uid)
        );
        
        // Query 2: Get guest appointments with the same email (in case linking hasn't happened yet)
        const appointmentsByEmailQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', 'guest'),
          where('userEmail', '==', currentUser.email)
        );
        
        // Subscribe to appointments by userId
        unsubscribeUserId = onSnapshot(appointmentsByUserIdQuery, (snapshot) => {
          console.log('📋 Query 1 Result (by userId):', snapshot.size, 'appointment(s)');
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('  ➜ Appointment ID:', doc.id);
            console.log('    - Status:', data.status);
            console.log('    - Date:', data.date?.toDate?.()?.toLocaleDateString() || data.date);
            console.log('    - Services:', data.services?.join?.(', ') || data.service);
            console.log('    - UserId match:', data.userId === currentUser.uid ? '✅' : '❌');
            allAppointments.set(doc.id, { id: doc.id, ...data });
          });
          
          updateAppointmentsList();
        }, (error) => {
          console.error('❌ Error fetching appointments by userId:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          setLoading(false);
        });
        
        // Subscribe to guest appointments by email
        unsubscribeEmail = onSnapshot(appointmentsByEmailQuery, (snapshot) => {
          console.log('📋 Query 2 Result (guest by email):', snapshot.size, 'appointment(s)');
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('  ➜ Guest Appointment ID:', doc.id);
            console.log('    - Status:', data.status);
            console.log('    - Email match:', data.userEmail === currentUser.email ? '✅' : '❌');
            // Only add if not already in the map (avoid duplicates)
            if (!allAppointments.has(doc.id)) {
              allAppointments.set(doc.id, { id: doc.id, ...data });
            }
          });
          
          updateAppointmentsList();
        }, (error) => {
          console.error('❌ Error fetching guest appointments:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          setLoading(false);
        });
        
        const updateAppointmentsList = () => {
          const userAppointments = Array.from(allAppointments.values());
          
          console.log('========================================');
          console.log('📊 FINAL RESULTS');
          console.log('Total appointments found:', userAppointments.length);
          console.log('========================================');
          
          if (userAppointments.length > 0) {
            userAppointments.forEach((apt, index) => {
              console.log(`${index + 1}. ID: ${apt.id}`);
              console.log(`   Status: ${apt.status}`);
              console.log(`   Services: ${apt.services?.join?.(', ') || apt.service}`);
              console.log(`   Date: ${apt.date?.toDate?.()?.toLocaleDateString() || apt.date}`);
              console.log('---');
            });
          } else {
            console.log('⚠️  NO APPOINTMENTS FOUND!');
            console.log('This could mean:');
            console.log('1. No appointments exist for this user');
            console.log('2. Firestore security rules are blocking the query');
            console.log('3. UserId mismatch in database');
          }
          console.log('========================================');
          
          // Sort by creation date (newest first)
          userAppointments.sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() || new Date(0);
            const bDate = b.createdAt?.toDate?.() || new Date(0);
            return bDate - aDate;
          });
          
          setAppointments(userAppointments);
          setLoading(false);
        };
        
      } catch (error) {
        console.error('❌ CRITICAL ERROR setting up listener:', error);
        console.error('Error stack:', error.stack);
        setLoading(false);
      }
    };

    fetchAppointments();

    return () => {
      if (unsubscribeUserId) {
        unsubscribeUserId();
      }
      if (unsubscribeEmail) {
        unsubscribeEmail();
      }
    };
  }, [currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'confirmed':
      case 'approved': return '#2e7d32';
      case 'completed': return '#1976d2';
      case 'rejected': return '#d32f2f';
      case 'cancelled': return '#757575';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'confirmed':
      case 'approved': return <CheckCircle />;
      case 'completed': return <Star />;
      case 'rejected': return <Cancel />;
      case 'cancelled': return <Cancel />;
      default: return <Schedule />;
    }
  };

  const handleMenuOpen = (event, appointment) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAppointment(null);
  };

  const handleViewDetails = () => {
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleReschedule = () => {
    if (!selectedAppointment) {
      setSnackbar({
        open: true,
        message: 'No appointment selected. Please try again.',
        severity: 'error'
      });
      return;
    }

    // Store the appointment for rescheduling
    setRescheduleAppointment(selectedAppointment);

    // Initialize reschedule data with current appointment data
    const currentDate = selectedAppointment.date ? dayjs(selectedAppointment.date.toDate()) : dayjs();
    const currentTime = selectedAppointment.time ? 
      dayjs().hour(parseInt(selectedAppointment.time.split(':')[0])).minute(parseInt(selectedAppointment.time.split(':')[1])) :
      dayjs();

    setRescheduleData({
      date: currentDate,
      time: currentTime
    });
    setRescheduleOpen(true);
    handleMenuClose();
  };

  const handleCancelAppointment = (appointment = null) => {
    const appointmentToCancel = appointment || selectedAppointment;
    
    // Check if we have an appointment to cancel
    if (!appointmentToCancel) {
      setSnackbar({
        open: true,
        message: 'No appointment selected. Please try again.',
        severity: 'error'
      });
      return;
    }

    // Set the appointment to cancel and show confirmation dialog
    setAppointmentToCancel(appointmentToCancel);
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) {
      setCancelConfirmOpen(false);
      return;
    }

    try {
      console.log('Cancelling appointment:', appointmentToCancel.id);
      
      const appointmentRef = doc(db, 'appointments', appointmentToCancel.id);
      
      // Get full appointment data before updating
      const appointmentSnap = await getDoc(appointmentRef);
      if (!appointmentSnap.exists()) {
        throw new Error('Appointment not found');
      }
      
      const fullAppointmentData = {
        id: appointmentToCancel.id,
        ...appointmentSnap.data()
      };
      
      // Update status to 'cancelled' instead of deleting
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'client',
        updatedAt: serverTimestamp()
      });
      
      console.log('Appointment status changed to cancelled');
      
      // Send notifications to admin users
      try {
        await handleAppointmentCancellation(appointmentToCancel.id, fullAppointmentData, 'client');
        console.log('Admin notified about cancellation');
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }
      
      setSnackbar({
        open: true,
        message: 'Appointment cancelled successfully!',
        severity: 'success'
      });
      
      // Close all dialogs and reset state
      setCancelConfirmOpen(false);
      setDetailsOpen(false);
      setSelectedAppointment(null);
      setAppointmentToCancel(null);
      setMenuAnchor(null);
      
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to cancel appointment. Please try again.',
        severity: 'error'
      });
      setCancelConfirmOpen(false);
    }
  };

  const handleCancelConfirmClose = () => {
    setCancelConfirmOpen(false);
    setAppointmentToCancel(null);
  };


  const handleRescheduleSubmit = async () => {
    // Check if we have a reschedule appointment
    if (!rescheduleAppointment) {
      setSnackbar({
        open: true,
        message: 'No appointment selected. Please try again.',
        severity: 'error'
      });
      setRescheduleOpen(false);
      return;
    }

    if (!rescheduleData.date || !rescheduleData.time) {
      setSnackbar({
        open: true,
        message: 'Please select both date and time for rescheduling.',
        severity: 'error'
      });
      return;
    }

    // Check if appointment is still pending
    if (rescheduleAppointment.status !== 'pending') {
      setSnackbar({
        open: true,
        message: 'Only pending appointments can be rescheduled. Please contact support for confirmed appointments.',
        severity: 'error'
      });
      return;
    }

    setRescheduleLoading(true);

    try {
      console.log('=== RESCHEDULE DEBUG INFO ===');
      console.log('Appointment ID:', rescheduleAppointment.id);
      console.log('Current user ID:', currentUser.uid);
      console.log('Appointment user ID:', rescheduleAppointment.userId);
      console.log('Current appointment status:', rescheduleAppointment.status);
      console.log('User IDs match:', currentUser.uid === rescheduleAppointment.userId);
      console.log('Status is pending:', rescheduleAppointment.status === 'pending');
      console.log('New date:', rescheduleData.date.toDate());
      console.log('New time:', rescheduleData.time.format('HH:mm'));
      console.log('=== END DEBUG INFO ===');

      const appointmentRef = doc(db, 'appointments', rescheduleAppointment.id);
      
      await updateDoc(appointmentRef, {
        date: rescheduleData.date.toDate(),
        time: rescheduleData.time.format('HH:mm'),
        updatedAt: serverTimestamp(),
        rescheduleCount: (rescheduleAppointment.rescheduleCount || 0) + 1
      });

      console.log('Reschedule successful!');

      setSnackbar({
        open: true,
        message: 'Appointment rescheduled successfully!',
        severity: 'success'
      });

      setRescheduleOpen(false);
      setRescheduleAppointment(null);
      setRescheduleData({ date: null, time: null });

    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to reschedule appointment. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Only pending appointments can be rescheduled.';
      } else if (error.code === 'not-found') {
        errorMessage = 'Appointment not found. Please refresh the page and try again.';
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }

    setRescheduleLoading(false);
  };

  const handleCancelReschedule = () => {
    setRescheduleOpen(false);
    setRescheduleAppointment(null);
    setRescheduleData({ date: null, time: null });
  };

  const formatDate = (date) => {
    if (!date) return 'Date TBD';
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <ClientLayout>
        <Typography variant="h4" gutterBottom>
          Loading appointments...
        </Typography>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
        {/* Modern Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: { xs: 2, sm: 0 },
          mb: { xs: 4, sm: 5 },
          pb: { xs: 2, sm: 3 },
          borderBottom: '1px solid rgba(203, 213, 225, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 1.5 
            }}>
              <Box sx={{ 
                width: 50, 
                height: 50, 
                borderRadius: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
                position: 'relative'
              }}>
                <CalendarToday sx={{ 
                  fontSize: '2rem', 
                  color: '#f59e0b',
                  filter: 'drop-shadow(0 4px 6px rgba(245, 158, 11, 0.3))'
                }} />
                <Box sx={{ 
                  position: 'absolute', 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bottom: -4, 
                  right: -4, 
                  background: '#f59e0b',
                  boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.8)'
                }}></Box>
              </Box>
              
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #eab308 0%, #d97706 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.75rem', sm: '2.25rem' },
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}
              >
                My Appointments
              </Typography>
            </Box>
            
            <Typography variant="body1" sx={{ 
              color: '#475569',
              maxWidth: '500px',
              fontWeight: 500
            }}>
              View and manage your scheduled service appointments
            </Typography>
            
          </Box>
          
          <Button
            component={Link}
            to="/book-appointment"
            sx={{
              background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              color: 'white',
              boxShadow: '0 10px 20px rgba(245, 158, 11, 0.25)',
              position: 'relative',
              zIndex: 2,
              '&:hover': {
                boxShadow: '0 12px 25px rgba(245, 158, 11, 0.35)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
            startIcon={<Schedule />}
          >
            Book New Service
          </Button>
          
          {/* Decorative elements */}
          <Box sx={{ 
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.03) 0%, rgba(245, 158, 11, 0) 70%)',
            borderRadius: '50%',
            zIndex: 1
          }} />
          <Box sx={{ 
            position: 'absolute',
            bottom: -20,
            left: '20%',
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(234, 179, 8, 0.02) 0%, rgba(234, 179, 8, 0) 70%)',
            borderRadius: '50%',
            zIndex: 1
          }} />
        </Box>

        {appointments.length === 0 ? (
          <Card sx={{ 
            p: { xs: 4, sm: 6 }, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 20px 30px rgba(0, 0, 0, 0.07)',
            position: 'relative',
            overflow: 'hidden',
            maxWidth: '900px',
            mx: 'auto'
          }}>
            <Box sx={{
              position: 'relative',
              zIndex: 2
            }}>
              <Box sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fde68a 0%, #fef3c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 15px 25px rgba(245, 158, 11, 0.1)',
                position: 'relative',
                border: '6px solid rgba(255, 255, 255, 0.8)'
              }}>
                <Box sx={{ 
                  fontSize: '4rem', 
                  filter: 'drop-shadow(0 2px 5px rgba(245, 158, 11, 0.2))'
                }}>
                  📅
                </Box>
                <Box sx={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  border: '3px solid rgba(255, 255, 255, 0.8)'
                }}>
                  <Box sx={{ fontSize: '1.2rem' }}>
                    🚗
                  </Box>
                </Box>
              </Box>
              
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                color: '#334155', 
                mb: 2,
                fontSize: '1.75rem'
              }}>
                No Appointments Found
              </Typography>
              
              <Typography variant="body1" sx={{ 
                color: '#64748b', 
                mb: 4, 
                maxWidth: '550px', 
                mx: 'auto',
                lineHeight: 1.7,
                fontSize: '1.1rem'
              }}>
                {currentUser ? 
                  "You haven't scheduled any service appointments yet. Book your first appointment now to experience premium automotive care for your vehicle." :
                  "Please log in to view your appointments and schedule your vehicle service."
                }
              </Typography>
              
              {currentUser && (
                <Button
                  component={Link}
                  to="/book-appointment"
                  sx={{
                    background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 6,
                    py: 1.8,
                    borderRadius: '14px',
                    textTransform: 'none',
                    boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 30px rgba(245, 158, 11, 0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                  startIcon={<Schedule sx={{ fontSize: '1.3rem' }} />}
                >
                  Book Your First Service
                </Button>
              )}
              
              {!currentUser && (
                <Button
                  component={Link}
                  to="/login"
                  sx={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1rem',
                    px: 6,
                    py: 1.8,
                    borderRadius: '14px',
                    textTransform: 'none',
                    boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 30px rgba(59, 130, 246, 0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Log In to Continue
                </Button>
              )}
            </Box>
            
            {/* Decorative Elements */}
            <Box sx={{ 
              position: 'absolute',
              top: -50,
              left: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.04) 0%, rgba(245, 158, 11, 0) 70%)',
              zIndex: 1
            }} />
            <Box sx={{ 
              position: 'absolute',
              bottom: -30,
              right: -30,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(234, 179, 8, 0.05) 0%, rgba(234, 179, 8, 0) 70%)',
              zIndex: 1
            }} />
            <Box sx={{ 
              position: 'absolute',
              top: '40%',
              right: '20%',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#f59e0b',
              opacity: 0.5,
              boxShadow: '0 0 15px 5px rgba(245, 158, 11, 0.2)',
              zIndex: 1
            }} />
          </Card>
        ) : (
        <Grid container spacing={3}>
          {appointments.map((appointment) => (
            <Grid item xs={12} md={6} lg={4} key={appointment.id}>
              <Card
                elevation={0}
                sx={{ 
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  border: appointment.hidden ? '1px solid rgba(203, 213, 225, 0.5)' : '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: appointment.hidden ? 0.85 : 1,
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 25px 35px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                {/* Status Bar at the top */}
                <Box
                  sx={{
                    height: 8,
                    background: `linear-gradient(to right, ${getStatusColor(appointment.status)} 30%, ${getStatusColor(appointment.status)}90 100%)`,
                    width: '100%'
                  }}
                />
                
                {/* Header with service name and status */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  p: 3,
                  pb: 0
                }}>
                  <Box sx={{ maxWidth: '80%' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#1e293b',
                        mb: 1,
                        fontSize: '1.15rem',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {appointment.service || 'Car Detailing Service'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Chip 
                        icon={getStatusIcon(appointment.status)}
                        label={appointment.status || 'pending'} 
                        size="small"
                        sx={{
                          height: '26px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${getStatusColor(appointment.status)}15`,
                          color: getStatusColor(appointment.status),
                          border: `1px solid ${getStatusColor(appointment.status)}30`,
                          textTransform: 'capitalize',
                          '& .MuiChip-icon': {
                            color: getStatusColor(appointment.status)
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <IconButton 
                    size="small"
                    onClick={(e) => handleMenuOpen(e, appointment)}
                    sx={{
                      bgcolor: 'rgba(241, 245, 249, 0.7)',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      '&:hover': { 
                        bgcolor: 'rgba(226, 232, 240, 0.8)' 
                      }
                    }}
                  >
                    <MoreVert sx={{ fontSize: '1.1rem', color: '#64748b' }} />
                  </IconButton>
                </Box>

                <CardContent sx={{ pt: 2, px: 3 }}>
                  {/* Date, Time and Location section */}
                  <Box sx={{ mb: 3 }}>
                    {/* Date row */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        p: 2, 
                        mb: 1.5, 
                        bgcolor: 'rgba(241, 245, 249, 0.7)', 
                        borderRadius: '12px',
                        border: '1px solid rgba(226, 232, 240, 0.8)'
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          flexShrink: 0,
                          boxShadow: '0 4px 6px rgba(56, 189, 248, 0.2)'
                        }}
                      >
                        <CalendarToday sx={{ color: 'white', fontSize: '1.1rem' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                          Scheduled Date
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>
                          {formatDate(appointment.date)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Time and Location in a row */}
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      {appointment.time && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 2, 
                            flex: 1,
                            bgcolor: 'rgba(241, 245, 249, 0.7)', 
                            borderRadius: '12px',
                            border: '1px solid rgba(226, 232, 240, 0.8)'
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                              flexShrink: 0,
                              boxShadow: '0 4px 6px rgba(167, 139, 250, 0.2)'
                            }}
                          >
                            <Schedule sx={{ color: 'white', fontSize: '1rem' }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                              Time
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                              {appointment.time}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {appointment.address && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            p: 2, 
                            flex: 2,
                            bgcolor: 'rgba(241, 245, 249, 0.7)', 
                            borderRadius: '12px',
                            border: '1px solid rgba(226, 232, 240, 0.8)'
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 1.5,
                              flexShrink: 0,
                              boxShadow: '0 4px 6px rgba(251, 113, 133, 0.2)',
                              mt: 0.2
                            }}
                          >
                            <LocationOn sx={{ color: 'white', fontSize: '1rem' }} />
                          </Box>
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                              Location
                            </Typography>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: '#0f172a', 
                                fontWeight: 700, 
                                fontSize: '0.9rem', 
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {appointment.address.street}, {appointment.address.city}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Price and Status Info */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: 2,
                      mt: 2
                    }}
                  >
                    <Box 
                      sx={{ 
                        flex: '1 1 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        p: 2,
                        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(245, 158, 11, 0.1) 100%)',
                        borderRadius: '14px',
                        border: '1px solid rgba(245, 158, 11, 0.15)'
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 42, 
                          height: 42, 
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 4px 8px rgba(245, 158, 11, 0.25)'
                        }}
                      >
                        <Box component="span" sx={{ color: 'white', fontSize: '1.3rem', fontWeight: 'bold' }}>$</Box>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 500 }}>
                          Total Price
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: '#92400e', 
                          fontWeight: 800, 
                          fontSize: '1.25rem', 
                          lineHeight: 1.1 
                        }}>
                          ${appointment.finalPrice || appointment.estimatedPrice || 'TBD'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Status Messages and Actions */}
                  {appointment.status === 'pending' && (
                    <Alert 
                      severity="info" 
                      icon={<Schedule sx={{ color: '#0369a1' }} />}
                      sx={{ 
                        mt: 2, 
                        borderRadius: '12px',
                        border: '1px solid rgba(3, 105, 161, 0.2)',
                        '& .MuiAlert-icon': {
                          color: '#0369a1'
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Waiting for confirmation from our team
                      </Typography>
                    </Alert>
                  )}

                  {(appointment.status === 'approved' || appointment.status === 'confirmed') && (
                    <Alert 
                      severity="success" 
                      icon={<CheckCircle sx={{ color: '#15803d' }} />}
                      sx={{ 
                        mt: 2, 
                        borderRadius: '12px',
                        border: '1px solid rgba(21, 128, 61, 0.2)',
                        '& .MuiAlert-icon': {
                          color: '#15803d'
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Your appointment is confirmed! We'll see you soon.
                      </Typography>
                    </Alert>
                  )}

                  {appointment.status === 'completed' && (
                    <Box sx={{ mt: 2 }}>
                      <Alert 
                        severity="success" 
                        icon={<Star sx={{ color: '#15803d' }} />}
                        sx={{ 
                          mb: 2, 
                          borderRadius: '12px',
                          border: '1px solid rgba(21, 128, 61, 0.2)',
                          '& .MuiAlert-icon': {
                            color: '#15803d'
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Service completed successfully!
                        </Typography>
                      </Alert>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<Star />}
                        sx={{
                          borderRadius: '10px',
                          borderColor: '#f59e0b',
                          color: '#f59e0b',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: '#d97706',
                            backgroundColor: 'rgba(245, 158, 11, 0.04)'
                          }
                        }}
                      >
                        Rate Service
                      </Button>
                    </Box>
                  )}

                  {appointment.status === 'rejected' && (
                    <Alert 
                      severity="error" 
                      icon={<Cancel sx={{ color: '#b91c1c' }} />}
                      sx={{ 
                        mt: 2, 
                        borderRadius: '12px',
                        border: '1px solid rgba(185, 28, 28, 0.2)',
                        '& .MuiAlert-icon': {
                          color: '#b91c1c'
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Unfortunately, we couldn't accommodate this appointment.
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

        {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          View Details
        </MenuItem>
        {selectedAppointment?.status === 'pending' && (
          <>
            <MenuItem onClick={handleReschedule}>
              <Edit sx={{ mr: 1 }} />
              Reschedule
            </MenuItem>
            <MenuItem 
              onClick={() => {
                handleMenuClose();
                handleCancelAppointment();
              }}
              sx={{ color: 'error.main' }}
            >
              <Cancel sx={{ mr: 1 }} />
              Cancel Appointment
            </MenuItem>
          </>
        )}
        {selectedAppointment?.status === 'completed' && (
          <MenuItem onClick={handleMenuClose}>
            Book Again
          </MenuItem>
        )}
        
        <Divider />
        
        {/* Opción para eliminar citas en cualquier estado */}
        {selectedAppointment && selectedAppointment.status !== 'pending' && (
          <MenuItem 
            onClick={() => {
              handleMenuClose();
              handleCancelAppointment();
            }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} />
            Delete Appointment
          </MenuItem>
        )}
      </Menu>

      {/* Appointment Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            📋 Appointment Details
          </Typography>
          <IconButton
            onClick={() => setDetailsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <Cancel />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedAppointment && (
            <Box>
              {/* Status Banner */}
              <Box sx={{ 
                bgcolor: getStatusColor(selectedAppointment.status), 
                color: 'white', 
                p: 2, 
                textAlign: 'center' 
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {getStatusIcon(selectedAppointment.status)} Status: {selectedAppointment.status}
                </Typography>
                {selectedAppointment.status === 'pending' && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Your appointment is awaiting approval from our team
                  </Typography>
                )}
                {selectedAppointment.status === 'approved' && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Your appointment has been confirmed! We'll see you soon.
                  </Typography>
                )}
                {selectedAppointment.status === 'completed' && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Service completed successfully. Thank you for choosing us!
                  </Typography>
                )}
                {selectedAppointment.status === 'rejected' && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    Unfortunately, we couldn't accommodate this appointment.
                  </Typography>
                )}
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={4}>
                  {/* Service Information */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ h: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          🚗 Service Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Service Package
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {selectedAppointment.service}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Service Category
                          </Typography>
                          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                            {selectedAppointment.category || 'General Services'}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Price
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            ${selectedAppointment.finalPrice || selectedAppointment.estimatedPrice}
                          </Typography>
                        </Box>

                        {selectedAppointment.depositAmount && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="success.contrastText">
                              💳 Payment Information
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="success.contrastText">
                                Deposit Paid: <strong>${selectedAppointment.depositAmount}</strong>
                              </Typography>
                              <Typography variant="body2" color="success.contrastText">
                                Remaining: <strong>${selectedAppointment.remainingBalance || 0}</strong>
                              </Typography>
                              <Typography variant="body2" color="success.contrastText">
                                Status: <strong>{selectedAppointment.paymentStatus?.replace('_', ' ') || 'Pending'}</strong>
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Appointment Details */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ h: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          📅 Appointment Details
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Scheduled Date
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {formatDate(selectedAppointment.date)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Scheduled Time
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {selectedAppointment.time || 'TBD'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Service Location
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 0.5 }}>
                            <LocationOn sx={{ mr: 1, color: 'primary.main', mt: 0.2 }} />
                            <Box>
                              <Typography variant="body1">
                                {selectedAppointment.address?.street}
                              </Typography>
                              <Typography variant="body1">
                                {selectedAppointment.address?.city}, {selectedAppointment.address?.state} {selectedAppointment.address?.zipCode}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Email Reminders
                          </Typography>
                          <Typography variant="body1">
                            {selectedAppointment.emailReminders ? '✅ Enabled' : '❌ Disabled'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Additional Information */}
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          📝 Additional Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={3}>
                          {selectedAppointment.notes && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Special Notes
                              </Typography>
                              <Box sx={{ 
                                p: 2, 
                                bgcolor: 'grey.50', 
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'grey.200'
                              }}>
                                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                  "{selectedAppointment.notes}"
                                </Typography>
                              </Box>
                            </Grid>
                          )}

                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Booking Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Booking ID:</strong> {selectedAppointment.id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Created:</strong> {selectedAppointment.createdAt?.toDate?.()?.toLocaleString() || 'Recently'}
                            </Typography>
                            {selectedAppointment.updatedAt && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Last Updated:</strong> {selectedAppointment.updatedAt?.toDate?.()?.toLocaleString()}
                              </Typography>
                            )}
                            {selectedAppointment.paymentId && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Payment ID:</strong> {selectedAppointment.paymentId}
                              </Typography>
                            )}
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button 
            onClick={() => setDetailsOpen(false)} 
            variant="outlined"
            size="large"
          >
            Close
          </Button>
          {selectedAppointment?.status === 'pending' && (
            <Button 
              variant="contained" 
              color="error"
              size="large"
              startIcon={<Cancel />}
              onClick={handleCancelAppointment}
            >
              Cancel Appointment
            </Button>
          )}
          {selectedAppointment?.status === 'completed' && (
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              startIcon={<Star />}
            >
              Book Again
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={rescheduleOpen}
        onClose={handleCancelReschedule}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 1 }} />
            Reschedule Appointment
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Note:</strong> Only pending appointments can be rescheduled. 
                  Once confirmed by our team, changes require contacting support.
                </Alert>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {rescheduleAppointment?.service} - {rescheduleAppointment?.status}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current: {formatDate(rescheduleAppointment?.date)} at {rescheduleAppointment?.time || 'TBD'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="New Date"
                  value={rescheduleData.date}
                  onChange={(newValue) => setRescheduleData({ ...rescheduleData, date: newValue })}
                  minDate={dayjs()}
                  maxDate={dayjs().add(30, 'day')}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DesktopTimePicker
                  label="New Time"
                  value={rescheduleData.time}
                  onChange={(newValue) => setRescheduleData({ ...rescheduleData, time: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning">
                  Rescheduling will update your appointment date and time. 
                  Your payment and other details remain unchanged.
                </Alert>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCancelReschedule}
            variant="outlined"
            disabled={rescheduleLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRescheduleSubmit}
            variant="contained"
            disabled={rescheduleLoading || !rescheduleData.date || !rescheduleData.time}
            startIcon={rescheduleLoading ? null : <Save />}
            sx={{
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)'
              }
            }}
          >
            {rescheduleLoading ? 'Rescheduling...' : 'Reschedule Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelConfirmOpen}
        onClose={handleCancelConfirmClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Cancel sx={{ mr: 1 }} />
            Cancel Appointment
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Are you sure you want to cancel your appointment?
          </Typography>
          {appointmentToCancel && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>{appointmentToCancel.service}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(appointmentToCancel.date)} at {appointmentToCancel.time || 'TBD'}
              </Typography>
              {appointmentToCancel.address && (
                <Typography variant="body2" color="text.secondary">
                  {appointmentToCancel.address.street}, {appointmentToCancel.address.city}, {appointmentToCancel.address.state} {appointmentToCancel.address.zipCode}
                </Typography>
              )}
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Warning:</strong> This action cannot be undone. Your appointment will be permanently cancelled.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCancelConfirmClose}
            variant="outlined"
            size="large"
          >
            No, Keep Appointment
          </Button>
          <Button
            onClick={handleConfirmCancel}
            variant="contained"
            color="error"
            size="large"
            startIcon={<Cancel />}
          >
            Yes, Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ open: false, message: '', severity: 'info' })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ClientLayout>
  );
};

export default AppointmentsList;
