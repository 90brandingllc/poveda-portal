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
  DialogActions
} from '@mui/material';
import {
  Schedule,
  CheckCircle,
  Cancel,
  Star,
  MoreVert,
  LocationOn,
  CalendarToday,
  DirectionsCar
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

const AppointmentsList = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    if (currentUser) {
      try {
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
          const appointmentData = [];
          snapshot.forEach((docSnap) => {
            appointmentData.push({ id: docSnap.id, ...docSnap.data() });
          });
          setAppointments(appointmentData);
          setLoading(false);
          clearTimeout(timer);
        }, (error) => {
          console.error('Error fetching appointments:', error);
          // Still set loading to false even if there's an error
          setLoading(false);
          clearTimeout(timer);
        });

        return () => {
          unsubscribe();
          clearTimeout(timer);
        };
      } catch (error) {
        console.error('Error setting up appointments listener:', error);
        setLoading(false);
      }
    } else {
      // If no user, still set loading to false
      setLoading(false);
    }

    return () => clearTimeout(timer);
  }, [currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'approved': return '#2e7d32';
      case 'completed': return '#1976d2';
      case 'rejected': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Schedule />;
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
            No appointments yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Book your first service to get started with premium car care.
          </Typography>
          <Button
            component={Link}
            to="/book-appointment"
            variant="contained"
            size="large"
          >
            Book Your First Service
          </Button>
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

                  {appointment.status === 'approved' && (
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
          <MenuItem onClick={handleMenuClose}>
            Cancel Appointment
          </MenuItem>
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Appointment Details
        </DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Service
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedAppointment.service}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={selectedAppointment.status} 
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(selectedAppointment.status),
                    color: 'white',
                    textTransform: 'capitalize'
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedAppointment.date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedAppointment.time || 'TBD'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedAppointment.address?.street}<br />
                  {selectedAppointment.address?.city}, {selectedAppointment.address?.state} {selectedAppointment.address?.zipCode}
                </Typography>
              </Grid>
              {selectedAppointment.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedAppointment.notes}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                  ${selectedAppointment.finalPrice || selectedAppointment.estimatedPrice}
                </Typography>
              </Grid>
              {selectedAppointment.couponCode && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Coupon Used
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedAppointment.couponCode}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AppointmentsList;
