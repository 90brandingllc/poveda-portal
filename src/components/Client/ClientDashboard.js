import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Stack,
  Divider
} from '@mui/material';
import {
  CalendarToday,
  DirectionsCar,
  ContactSupport,
  RequestQuote,
  LocalOffer,
  Add,
  CheckCircle,
  Schedule,
  Cancel,
  Star,
  Notifications
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ClientDashboard = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalSpent: 0
  });

  useEffect(() => {
    if (currentUser) {
      // Real-time listener for user's appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
        const appointmentData = [];
        let totalSpent = 0;
        let pending = 0;
        let completed = 0;

        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          appointmentData.push(data);
          
          if (data.status === 'pending') pending++;
          if (data.status === 'completed') {
            completed++;
            totalSpent += data.price || 0;
          }
        });

        setAppointments(appointmentData);
        setStats({
          totalAppointments: snapshot.size,
          pendingAppointments: pending,
          completedAppointments: completed,
          totalSpent
        });
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const quickActions = [
    {
      title: 'Book Appointment',
      description: 'Schedule a new service',
      icon: <CalendarToday />,
      color: '#1976d2',
      link: '/book-appointment'
    },
    {
      title: 'My Appointments',
      description: 'View booking history',
      icon: <DirectionsCar />,
      color: '#2e7d32',
      link: '/appointments'
    },
    {
      title: 'Contact Support',
      description: 'Get help or ask questions',
      icon: <ContactSupport />,
      color: '#ed6c02',
      link: '/contact'
    },
    {
      title: 'Get Estimate',
      description: 'Request custom pricing',
      icon: <RequestQuote />,
      color: '#9c27b0',
      link: '/estimate'
    },
    {
      title: 'View Coupons',
      description: 'Available discounts',
      icon: <LocalOffer />,
      color: '#d32f2f',
      link: '/coupons'
    }
  ];

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '2rem',
                fontWeight: 600
              }}
            >
              {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Welcome back, {currentUser?.displayName || 'Valued Client'}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Ready to keep your vehicle looking its best?
            </Typography>
          </Grid>
          <Grid item>
            <Button
              component={Link}
              to="/book-appointment"
              variant="contained"
              size="large"
              startIcon={<Add />}
              sx={{
                bgcolor: '#FFD700',
                color: '#000',
                fontWeight: 600,
                '&:hover': { bgcolor: '#FFC107' }
              }}
            >
              Book Service
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Total Appointments', value: stats.totalAppointments, icon: <CalendarToday />, color: '#1976d2' },
          { title: 'Pending', value: stats.pendingAppointments, icon: <Schedule />, color: '#ed6c02' },
          { title: 'Completed', value: stats.completedAppointments, icon: <CheckCircle />, color: '#2e7d32' },
          { title: 'Total Spent', value: `$${stats.totalSpent}`, icon: <Star />, color: '#9c27b0' }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card className="stats-card" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card 
                  component={Link}
                  to={action.link}
                  sx={{
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: action.color, mr: 2 }}>
                        {action.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Recent Appointments */}
        <Grid item xs={12} md={4}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Recent Appointments
          </Typography>
          <Card>
            <CardContent>
              {appointments.length > 0 ? (
                <Stack spacing={2}>
                  {appointments.map((appointment, index) => (
                    <Box key={appointment.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton 
                            size="small" 
                            sx={{ color: getStatusColor(appointment.status), mr: 1 }}
                          >
                            {getStatusIcon(appointment.status)}
                          </IconButton>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {appointment.service || 'Car Detailing'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appointment.date ? new Date(appointment.date.seconds * 1000).toLocaleDateString() : 'Date TBD'}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={appointment.status || 'pending'} 
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(appointment.status),
                            color: 'white',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                      {index < appointments.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                  <Button
                    component={Link}
                    to="/appointments"
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    View All Appointments
                  </Button>
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <DirectionsCar sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No appointments yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Book your first service to get started
                  </Typography>
                  <Button
                    component={Link}
                    to="/book-appointment"
                    variant="contained"
                    size="small"
                  >
                    Book Now
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Service Reminder */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: '#f8f9fa' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Notifications sx={{ color: '#1976d2', fontSize: 32 }} />
          </Grid>
          <Grid item xs>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Keep Your Car Looking Great!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Regular detailing helps maintain your vehicle's value and appearance. 
              Book your next service to keep your car in pristine condition.
            </Typography>
          </Grid>
          <Grid item>
            <Button
              component={Link}
              to="/book-appointment"
              variant="contained"
              color="primary"
            >
              Schedule Service
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ClientDashboard;
