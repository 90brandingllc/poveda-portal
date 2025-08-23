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
    approvedAppointments: 0,
    completedAppointments: 0,
    totalSpent: 0
  });

  useEffect(() => {
    if (currentUser) {
      console.log('ClientDashboard - Setting up appointments listener for user:', currentUser.uid);
      
      // Real-time listener for user's appointments (remove orderBy to avoid index issues)
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
        console.log('ClientDashboard - Received', snapshot.size, 'appointments');
        
        const appointmentData = [];
        let totalSpent = 0;
        let pending = 0;
        let completed = 0;
        let approved = 0;

        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          appointmentData.push(data);
          
          console.log('ClientDashboard - Processing appointment:', data.service, data.status, data.finalPrice || data.estimatedPrice);
          
          // Count by status
          if (data.status === 'pending') pending++;
          if (data.status === 'approved' || data.status === 'confirmed') approved++;
          if (data.status === 'completed') completed++;
          
          // Calculate total spent - simpler approach
          const appointmentCost = data.finalPrice || data.estimatedPrice || data.price || 0;
          const depositPaid = data.depositAmount || 0;
          
          console.log(`ClientDashboard - Processing ${data.service}:`, {
            id: data.id,
            status: data.status,
            paymentStatus: data.paymentStatus,
            appointmentCost: appointmentCost,
            depositPaid: depositPaid,
            finalPrice: data.finalPrice,
            estimatedPrice: data.estimatedPrice
          });
          
          // Add to total spent based on what was actually paid
          let amountToAdd = 0;
          
          if (data.status === 'completed') {
            // For completed services, count the full amount
            amountToAdd = appointmentCost;
          } else if (data.paymentStatus === 'deposit_paid' && depositPaid > 0) {
            // For services with deposit paid, count the deposit
            amountToAdd = depositPaid;
          } else if (data.depositAmount > 0) {
            // Fallback: if there's a deposit amount, count it
            amountToAdd = depositPaid;
          }
          
          totalSpent += amountToAdd;
          
          console.log(`ClientDashboard - Added $${amountToAdd} to total. New total: $${totalSpent}`);
        });

        // Sort by creation date (newest first) on client side
        appointmentData.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return bDate - aDate;
        });

        // Take only the first 5 for recent appointments display
        const recentAppointments = appointmentData.slice(0, 5);

        console.log('=== ClientDashboard - FINAL STATS ===');
        console.log('Total appointments found:', appointmentData.length);
        console.log('Pending appointments:', pending);
        console.log('Approved/Confirmed appointments:', approved);
        console.log('Completed appointments:', completed);
        console.log('Total spent calculated:', `$${totalSpent.toFixed(2)}`);
        
        console.log('=== APPOINTMENT DETAILS ===');
        appointmentData.forEach((apt, index) => {
          console.log(`Appointment ${index + 1}:`, {
            service: apt.service,
            status: apt.status,
            paymentStatus: apt.paymentStatus,
            depositAmount: apt.depositAmount,
            finalPrice: apt.finalPrice,
            estimatedPrice: apt.estimatedPrice,
            id: apt.id
          });
        });
        
        // Manual verification - let's calculate step by step
        console.log('=== MANUAL VERIFICATION ===');
        let manualTotal = 0;
        appointmentData.forEach((apt, index) => {
          if (apt.status === 'completed') {
            const amount = apt.finalPrice || apt.estimatedPrice || apt.price || 0;
            manualTotal += amount;
            console.log(`✅ Appointment ${index + 1} (${apt.service}) - COMPLETED: +$${amount} (total: $${manualTotal})`);
          } else if (apt.depositAmount > 0) {
            manualTotal += apt.depositAmount;
            console.log(`💳 Appointment ${index + 1} (${apt.service}) - DEPOSIT: +$${apt.depositAmount} (total: $${manualTotal})`);
          } else {
            console.log(`⏳ Appointment ${index + 1} (${apt.service}) - NO PAYMENT: +$0 (total: $${manualTotal})`);
          }
        });
        console.log(`Manual calculation result: $${manualTotal}`);
        console.log(`Auto calculation result: $${totalSpent}`);
        console.log('=== END VERIFICATION ===');

        setAppointments(recentAppointments);
        setStats({
          totalAppointments: appointmentData.length,
          pendingAppointments: pending,
          approvedAppointments: approved,
          completedAppointments: completed,
          totalSpent
        });
      }, (error) => {
        console.error('ClientDashboard - Error fetching appointments:', error);
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
      link: '/get-estimate'
    },
    {
      title: 'My Estimates',
      description: 'View estimate requests',
      icon: <Star />,
      color: '#ff9800',
      link: '/my-estimates'
    }

  ];

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
          { title: 'Approved', value: stats.approvedAppointments, icon: <CheckCircle />, color: '#2e7d32' },
          { title: 'Money Spent', value: `$${stats.totalSpent.toFixed(2)}`, icon: <Star />, color: '#9c27b0' }
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
                              {appointment.date ? 
                                (appointment.date.toDate ? appointment.date.toDate().toLocaleDateString() : 
                                 appointment.date.seconds ? new Date(appointment.date.seconds * 1000).toLocaleDateString() : 
                                 'Date TBD') : 'Date TBD'}
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
