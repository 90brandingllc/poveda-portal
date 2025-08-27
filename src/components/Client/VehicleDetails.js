import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Grid
} from '@mui/material';
import {
  ArrowBack,
  DirectionsCar,
  CalendarToday,
  AttachMoney,
  CheckCircle,
  Schedule,
  Cancel,
  Info
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';

const VehicleDetails = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch vehicle details
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
        if (vehicleDoc.exists()) {
          setVehicle({ id: vehicleDoc.id, ...vehicleDoc.data() });
        } else {
          setError('Vehicle not found');
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        setError('Failed to load vehicle details');
      }
    };

    if (vehicleId) {
      fetchVehicle();
    }
  }, [vehicleId]);

  // Fetch service history (appointments linked to this vehicle)
  useEffect(() => {
    if (currentUser && vehicleId) {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', currentUser.uid),
        where('vehicleId', '==', vehicleId)
      );

      const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
        const vehicleAppointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort client-side by creation date (newest first)
        vehicleAppointments.sort((a, b) => {
          const aTime = a.createdAt?.seconds ? a.createdAt.seconds : 0;
          const bTime = b.createdAt?.seconds ? b.createdAt.seconds : 0;
          return bTime - aTime;
        });
        
        setAppointments(vehicleAppointments);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching appointments:', error);
        // If the vehicleId field doesn't exist in appointments yet, just show empty
        setAppointments([]);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [currentUser, vehicleId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'approved':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'approved':
        return <Schedule />;
      case 'pending':
        return <Info />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <Info />;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !vehicle) {
    return (
      <ClientLayout>
        <Box sx={{ flexGrow: 1, p: 4, textAlign: 'center' }}>
          <Typography>Loading vehicle details...</Typography>
        </Box>
      </ClientLayout>
    );
  }

  if (error) {
    return (
      <ClientLayout>
        <Box sx={{ flexGrow: 1, p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button onClick={() => navigate('/my-garage')} sx={{ mt: 2 }}>
            Back to Garage
          </Button>
        </Box>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={() => navigate('/my-garage')} 
            sx={{ mr: 2, color: '#0891b2' }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              {vehicle?.year} {vehicle?.make} {vehicle?.model}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Service history and vehicle details
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Vehicle Info Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              height: 'fit-content'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DirectionsCar sx={{ color: '#0891b2', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Vehicle Details
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  {vehicle?.nickname && (
                    <Chip 
                      label={vehicle.nickname} 
                      size="small" 
                      sx={{ 
                        mb: 2,
                        background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                        color: 'white',
                        fontWeight: 500
                      }} 
                    />
                  )}
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Make:</strong> {vehicle?.make}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Model:</strong> {vehicle?.model}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Year:</strong> {vehicle?.year}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Color:</strong> {vehicle?.color || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>License:</strong> {vehicle?.licensePlate || 'Not specified'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ 
                  p: 2, 
                  background: 'rgba(8, 145, 178, 0.1)', 
                  borderRadius: '12px'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Service Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Services: {appointments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Service: {appointments.length > 0 ? formatDate(appointments[0].createdAt) : 'None yet'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent: {formatCurrency(appointments.reduce((sum, apt) => sum + (apt.finalPrice || apt.estimatedPrice || 0), 0))}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Service History */}
          <Grid item xs={12} md={8}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Service History
                </Typography>

                {appointments.length === 0 ? (
                  <Paper sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    background: 'rgba(8, 145, 178, 0.05)',
                    border: '1px solid rgba(8, 145, 178, 0.1)'
                  }}>
                    <CalendarToday sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#6b7280', mb: 1 }}>
                      No Service History Yet
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#9ca3af', mb: 3 }}>
                      This vehicle hasn't had any services yet. Book your first appointment to start tracking service history.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/book-appointment')}
                      sx={{
                        background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Book First Service
                    </Button>
                  </Paper>
                ) : (
                  <List sx={{ p: 0 }}>
                    {appointments.map((appointment, index) => (
                      <React.Fragment key={appointment.id}>
                        <ListItem 
                          sx={{ 
                            px: 0, 
                            py: 2,
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: { sm: 2 }, mb: { xs: 1, sm: 0 } }}>
                            {getStatusIcon(appointment.status)}
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {appointment.service || appointment.category}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(appointment.date || appointment.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Chip 
                                label={appointment.status}
                                color={getStatusColor(appointment.status)}
                                size="small"
                                sx={{ textTransform: 'capitalize' }}
                              />
                              {appointment.notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 300 }}>
                                  {appointment.notes}
                                </Typography>
                              )}
                            </Box>
                            
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0891b2' }}>
                              {formatCurrency(appointment.finalPrice || appointment.estimatedPrice)}
                            </Typography>
                          </Box>
                        </ListItem>
                        {index < appointments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ClientLayout>
  );
};

export default VehicleDetails;
