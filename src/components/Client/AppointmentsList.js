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
  Save
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';
import { Link } from 'react-router-dom';
import { DatePicker, DesktopTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

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
    let unsubscribe = null;
    
    const fetchAppointments = async () => {
      if (!currentUser?.uid) {
        console.log('AppointmentsList - No current user, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        console.log('AppointmentsList - Fetching appointments for user:', currentUser.uid);
        
        // Use a targeted query for the user's appointments
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', currentUser.uid)
        );
        
        unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
          console.log('AppointmentsList - Got snapshot with', snapshot.size, 'documents for user');
          
          const userAppointments = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const appointment = { id: doc.id, ...data };
            userAppointments.push(appointment);
            console.log('AppointmentsList - Found appointment:', appointment.service, appointment.status, appointment.id);
          });
          
          console.log('AppointmentsList - User appointments found:', userAppointments.length);
          console.log('AppointmentsList - User appointments:', userAppointments);
          
          // Sort by creation date (newest first)
          userAppointments.sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() || new Date(0);
            const bDate = b.createdAt?.toDate?.() || new Date(0);
            return bDate - aDate;
          });
          
          setAppointments(userAppointments);
          setLoading(false);
        }, (error) => {
          console.error('AppointmentsList - Error fetching appointments:', error);
          console.error('AppointmentsList - Error code:', error.code);
          console.error('AppointmentsList - Error message:', error.message);
          
          // If there's a permission error, try a fallback approach
          if (error.code === 'permission-denied') {
            console.log('AppointmentsList - Permission denied, checking auth state');
            console.log('AppointmentsList - Current user:', currentUser);
            console.log('AppointmentsList - Auth state:', currentUser ? 'logged in' : 'not logged in');
          }
          
          setLoading(false);
        });
        
      } catch (error) {
        console.error('AppointmentsList - Error setting up listener:', error);
        setLoading(false);
      }
    };

    fetchAppointments();

    return () => {
      if (unsubscribe) {
        unsubscribe();
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
      
      // Delete the appointment from Firestore
      await deleteDoc(doc(db, 'appointments', appointmentToCancel.id));
      
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
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 8,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          p: { xs: 3, md: 5 },
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
        }}>
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.875rem', md: '2.25rem' },
                color: '#1e293b',
                mb: 1,
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              My Appointments
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#64748b',
                fontWeight: 400,
                fontSize: '1.125rem'
              }}
            >
              Manage your service appointments
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/book-appointment"
            sx={{
              background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
              color: '#1e293b',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: '0 10px 25px rgba(234, 179, 8, 0.3)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 30px rgba(234, 179, 8, 0.4)'
              }
            }}
            startIcon={<CalendarToday />}
          >
            Book New Service
          </Button>
        </Box>

        {appointments.length === 0 ? (
          <Box sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            p: 8,
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
          }}>
            <Box 
              sx={{
                width: 120,
                height: 120,
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 4,
                fontSize: '3rem'
              }}
            >
              🚗
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                mb: 2,
                fontSize: '1.5rem'
              }}
            >
              No appointments found
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#64748b',
                mb: 4,
                maxWidth: 400,
                mx: 'auto',
                fontSize: '1.125rem',
                lineHeight: 1.6
              }}
            >
              {currentUser ? 
                "You haven't booked any appointments yet. Book your first service to get started with premium car care." :
                "Please log in to view your appointments."
              }
            </Typography>
            {currentUser && (
              <Button
                component={Link}
                to="/book-appointment"
                sx={{
                  background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                  color: '#1e293b',
                  fontWeight: 600,
                  fontSize: '1rem',
                  px: 6,
                  py: 2,
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0 10px 25px rgba(234, 179, 8, 0.3)',
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 15px 30px rgba(234, 179, 8, 0.4)'
                  }
                }}
              >
                Book Your First Service
              </Button>
            )}
          </Box>
        ) : (
        <Grid container spacing={3}>
          {appointments.map((appointment) => (
            <Grid item xs={12} md={6} lg={4} key={appointment.id}>
              <Box 
                sx={{ 
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  p: 4,
                  height: '100%',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(135deg, ${getStatusColor(appointment.status)} 0%, ${getStatusColor(appointment.status)}80 100%)`,
                    borderRadius: '20px 20px 0 0'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Chip 
                    label={appointment.status || 'pending'} 
                    size="small"
                    sx={{
                      height: '24px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: `${getStatusColor(appointment.status)}15`,
                      color: getStatusColor(appointment.status),
                      border: `1px solid ${getStatusColor(appointment.status)}30`,
                      textTransform: 'capitalize'
                    }}
                  />
                  <IconButton 
                    size="small"
                    onClick={(e) => handleMenuOpen(e, appointment)}
                    sx={{
                      '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.1)' }
                    }}
                  >
                    <MoreVert sx={{ color: '#64748b' }} />
                  </IconButton>
                </Box>

                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#1e293b',
                    mb: 3,
                    fontSize: '1.125rem'
                  }}
                >
                  {appointment.service || 'Car Detailing Service'}
                </Typography>

                <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        fontSize: '1rem'
                      }}
                    >
                      📅
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', mb: 0.5 }}>
                        Date
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem' }}>
                        {formatDate(appointment.date)}
                      </Typography>
                    </Box>
                  </Box>

                  {appointment.time && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          fontSize: '1rem'
                        }}
                      >
                        ⏰
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', mb: 0.5 }}>
                          Time
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem' }}>
                          {appointment.time}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {appointment.address && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          fontSize: '1rem',
                          flexShrink: 0
                        }}
                      >
                        📍
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', mb: 0.5 }}>
                          Location
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.4 }}>
                          {appointment.address.street}<br />
                          {appointment.address.city}, {appointment.address.state}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 3,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', mb: 0.5 }}>
                      Total Price
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '1.25rem' }}>
                      ${appointment.finalPrice || appointment.estimatedPrice || 'TBD'}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}
                  >
                    💰
                  </Box>
                </Box>

                  {appointment.status === 'pending' && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Waiting for approval from our team
                    </Alert>
                  )}

                  {(appointment.status === 'approved' || appointment.status === 'confirmed') && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Appointment confirmed! We'll see you soon.
                    </Alert>
                  )}

                  {appointment.status === 'completed' && (
                    <Box sx={{ mt: 2 }}>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Service completed successfully!
                      </Alert>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<Star />}
                      >
                        Rate Service
                      </Button>
                    </Box>
                  )}

                  {appointment.status === 'rejected' && (
                    <Box sx={{ 
                      mt: 3,
                      p: 2,
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                      <Typography variant="body2" sx={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>
                        ❌ Unfortunately, we couldn't accommodate this appointment.
                      </Typography>
                    </Box>
                  )}
              </Box>
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
