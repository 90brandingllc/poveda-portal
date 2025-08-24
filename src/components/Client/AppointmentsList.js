import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Box,
  Button,
  Alert,
  Paper,
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
  DirectionsCar,
  Edit,
  Save
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
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

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) {
      setSnackbar({
        open: true,
        message: 'No appointment selected. Please try again.',
        severity: 'error'
      });
      return;
    }

    try {
      console.log('Cancelling appointment:', selectedAppointment.id);
      
      // Delete the appointment from Firestore
      await deleteDoc(doc(db, 'appointments', selectedAppointment.id));
      
      setSnackbar({
        open: true,
        message: 'Appointment cancelled successfully!',
        severity: 'success'
      });
      
      // Close the details dialog
      setDetailsOpen(false);
      setSelectedAppointment(null);
      
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to cancel appointment. Please try again.',
        severity: 'error'
      });
    }
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading appointments...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Appointments
        </Typography>
        <Button
          component={Link}
          to="/book-appointment"
          variant="contained"
          startIcon={<CalendarToday />}
        >
          Book New Service
        </Button>
      </Box>

      {appointments.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <DirectionsCar sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            No appointments found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {currentUser ? 
              "You haven't booked any appointments yet. Book your first service to get started with premium car care." :
              "Please log in to view your appointments."
            }
          </Typography>
          {currentUser && (
            <Button
              component={Link}
              to="/book-appointment"
              variant="contained"
              size="large"
            >
              Book Your First Service
            </Button>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Current User: {currentUser?.uid || 'Not logged in'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {appointments.map((appointment) => (
            <Grid item xs={12} md={6} lg={4} key={appointment.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: getStatusColor(appointment.status), mr: 1 }}
                      >
                        {getStatusIcon(appointment.status)}
                      </IconButton>
                      <Chip 
                        label={appointment.status || 'pending'} 
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(appointment.status),
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, appointment)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {appointment.service || 'Car Detailing Service'}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(appointment.date)}
                    </Typography>
                  </Box>

                  {appointment.time && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {appointment.time}
                      </Typography>
                    </Box>
                  )}

                  {appointment.address && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {appointment.address.street}<br />
                        {appointment.address.city}, {appointment.address.state}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Price
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      ${appointment.finalPrice || appointment.estimatedPrice || 'TBD'}
                    </Typography>
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
                    <Alert severity="error" sx={{ mt: 2 }}>
                      Unfortunately, we couldn't accommodate this appointment.
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
    </Container>
  );
};

export default AppointmentsList;
