import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
  Stack
} from '@mui/material';

import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import WeatherWidget from '../WeatherWidget';

const ClientDashboard = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    completedAppointments: 0,
    totalSpent: 0,
    totalEstimates: 0,
    pendingEstimates: 0
  });

  useEffect(() => {
    if (currentUser) {
      // Fetch appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
        const userAppointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAppointments(userAppointments);

        // Calculate stats
        const totalAppointments = userAppointments.length;
        const pendingAppointments = userAppointments.filter(app => app.status === 'pending').length;
        const approvedAppointments = userAppointments.filter(app => app.status === 'approved').length;
        const completedAppointments = userAppointments.filter(app => app.status === 'completed').length;
        const totalSpent = userAppointments
          .reduce((sum, app) => {
            // Check multiple possible price fields from any appointment with a price
            const price = app.totalAmount || app.finalPrice || app.estimatedPrice || app.price || app.amount || 0;
            
            // Handle different price formats (strings with $, numbers, etc.)
            let numericPrice = 0;
            if (typeof price === 'string') {
              // Remove currency symbols and convert to number
              numericPrice = parseFloat(price.replace(/[$,]/g, '')) || 0;
            } else {
              numericPrice = parseFloat(price) || 0;
            }
            
            return sum + numericPrice;
          }, 0);

        setStats({
          totalAppointments,
          pendingAppointments,
          approvedAppointments,
          completedAppointments,
          totalSpent
        });
      });

      // Fetch estimates
      const estimatesQuery = query(
        collection(db, 'estimates'),
        where('userId', '==', currentUser.uid)
      );



      const unsubscribeEstimates = onSnapshot(
        estimatesQuery, 
        (snapshot) => {
          const userEstimates = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          

          
          setEstimates(userEstimates);
          
          // Update stats with estimates data
          setStats(prevStats => ({
            ...prevStats,
            totalEstimates: userEstimates.length,
            pendingEstimates: userEstimates.filter(est => est.status === 'pending').length
          }));
        },
        (error) => {
          console.error('Error fetching estimates:', error);
        }
      );

      // Fetch tickets
      const ticketsQuery = query(
        collection(db, 'tickets'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
        const userTickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTickets(userTickets);
      });

      return () => {
        unsubscribeAppointments();
        unsubscribeEstimates();
        unsubscribeTickets();
      };
    }
  }, [currentUser]);

  const quickActions = [
    {
      title: 'Book Service',
      description: 'Schedule your next appointment',
      icon: '📅',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea',
      count: 0,
      subtitle: 'new booking',
      link: '/book-appointment'
    },
    {
      title: 'My Appointments',
      description: 'View and manage bookings',
      icon: '📅',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f093fb',
      count: stats.totalAppointments,
      subtitle: stats.pendingAppointments > 0 ? `${stats.pendingAppointments} pending` : 'appointments',
      link: '/appointments'
    },
    {
      title: 'Get Estimate',
      description: 'Request pricing for services',
      icon: '💵',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#4facfe',
      count: 0,
      subtitle: 'new request',
      link: '/get-estimate'
    },
    {
      title: 'My Estimates',
      description: 'View your estimate requests',
      icon: '📋',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea',
      count: stats.totalEstimates,
      subtitle: stats.pendingEstimates > 0 ? `${stats.pendingEstimates} pending` : 'estimates',
      link: '/my-estimates'
    },
    {
      title: 'Support Center',
      description: 'Get help and assistance',
      icon: '💬',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      color: '#43e97b',
      count: tickets.length,
      subtitle: 'tickets',
      link: '/contact'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'approved': return '#2e7d32';
      case 'confirmed': return '#1976d2';
      case 'completed': return '#9c27b0';
      case 'cancelled': return '#d32f2f';
      case 'in-progress': return '#1976d2';
      case 'quoted': return '#2e7d32';
      case 'declined': return '#d32f2f';
      default: return '#757575';
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      pb: 6
    }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {/* Modern Header */}
        <Box sx={{ 
          mb: 8,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          p: { xs: 3, md: 5 },
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
        }}>
          <Grid container spacing={4} alignItems="center">
          <Grid item>
              <Box sx={{ position: 'relative' }}>
            <Avatar 
              sx={{ 
                    width: 72, 
                    height: 72, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)'
              }}
            >
              {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
            </Avatar>
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: -2, 
                  right: -2, 
                  width: 20, 
                  height: 20, 
                  background: '#22c55e', 
                  borderRadius: '50%',
                  border: '3px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }} />
              </Box>
          </Grid>
          <Grid item xs>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  color: '#1e293b',
                  mb: 1,
                  background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Friend'}
            </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#64748b',
                  fontWeight: 400,
                  fontSize: '1.125rem'
                }}
              >
                Ready to get your service scheduled?
            </Typography>
          </Grid>
          <Grid item>
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
            >
              Book Service
            </Button>
          </Grid>
        </Grid>
        </Box>

        {/* Weather Widget */}
        <Box sx={{ mb: 8 }}>
          <WeatherWidget appointments={appointments} />
        </Box>

        {/* Modern Stats Grid */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {[
            { 
              title: 'Total Visits', 
              value: stats.totalAppointments, 
              subtitle: 'All time',
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              icon: '📊',
              trend: '+12%'
            },
            { 
              title: 'Pending', 
              value: stats.pendingAppointments, 
              subtitle: 'This month',
              gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              icon: '⏳',
              trend: '+5%'
            },
            { 
              title: 'Estimates', 
              value: stats.totalEstimates, 
              subtitle: 'Requested',
              gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              icon: '📋',
              trend: stats.pendingEstimates > 0 ? `${stats.pendingEstimates} pending` : 'All reviewed'
            },
            { 
              title: 'Total Spent', 
              value: `$${stats.totalSpent.toFixed(2)}`, 
              subtitle: 'All time',
              gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              icon: '💰',
              trend: '+25%'
            }
        ].map((stat, index) => (
            <Grid item xs={12} sm={6} xl={3} key={index}>
              <Box 
              sx={{ 
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  p: 3,
                height: '100%',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box 
                    sx={{ 
                      background: stat.gradient,
                      borderRadius: '12px',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Chip 
                    label={stat.trend}
                    size="small"
                    sx={{ 
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#16a34a',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      border: 'none'
                    }}
                  />
                </Box>
                
                <Typography 
                  variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                    color: '#1e293b',
                    fontSize: '2rem',
                    mb: 0.5
                    }}
                  >
                    {stat.value}
                  </Typography>
                
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: '#64748b',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    mb: 0.5
                  }}
                >
                  {stat.title}
                </Typography>
                
                <Typography 
                  variant="caption"
                  sx={{ 
                    color: '#94a3b8',
                    fontSize: '0.75rem'
                  }}
                >
                  {stat.subtitle}
                  </Typography>
                </Box>
          </Grid>
        ))}
      </Grid>

        <Grid container spacing={6}>
          {/* Modern Quick Actions */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '1.5rem',
                  mb: 1
                }}
              >
            Quick Actions
          </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}
              >
                Manage your services efficiently
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} key={index}>
                  <Box 
                  component={Link}
                  to={action.link}
                  sx={{
                    textDecoration: 'none',
                      display: 'block',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      p: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        '&::before': {
                          opacity: 1
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: action.gradient || action.color,
                        opacity: 0,
                        transition: 'opacity 0.3s'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box 
                        sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '12px',
                          background: action.gradient || action.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 3,
                          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                          fontSize: '1.5rem'
                        }}
                      >
                        {action.icon || action.value}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            color: '#1e293b',
                            mb: 1,
                            fontSize: '1.125rem'
                          }}
                        >
                          {action.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#64748b',
                            fontSize: '0.875rem',
                            lineHeight: 1.5
                          }}
                        >
                          {action.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip 
                        label={`${action.count || 0} ${action.subtitle || 'items'}`}
                        size="small"
                        sx={{ 
                          background: 'rgba(100, 116, 139, 0.1)',
                          color: '#64748b',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          border: 'none'
                        }}
                      />
                      <Typography 
                        sx={{ 
                          color: '#94a3b8',
                          fontSize: '0.875rem',
                          fontWeight: 500
                        }}
                      >
                        →
                      </Typography>
                    </Box>
                  </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>

          {/* Modern Activity Feed */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '1.5rem',
                  mb: 1
                }}
              >
                Recent Activity
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}
              >
                Your latest appointments and updates
          </Typography>
            </Box>

            <Box 
              sx={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                p: 4,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }}
            >
              {(appointments.length > 0 || estimates.length > 0) ? (
                <Stack spacing={3}>
                  {/* Show recent appointments */}
                  {appointments.slice(0, 3).map((appointment, index) => (
                    <Box 
                      key={appointment.id}
                      sx={{
                        position: 'relative',
                        pb: index < appointments.slice(0, 4).length - 1 ? 3 : 0,
                        '&:not(:last-child)::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                        <Box 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '10px',
                            background: getStatusColor(appointment.status) || '#667eea',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        >
                          {appointment.status === 'completed' ? '✅' : 
                           appointment.status === 'approved' ? '📅' : 
                           appointment.status === 'pending' ? '⏳' : '📋'}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '0.875rem',
                              mb: 0.5
                            }}
                          >
                            {appointment.service || 'Car Detailing Service'}
                            </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: '#64748b',
                              fontSize: '0.75rem',
                              mb: 1
                            }}
                          >
                              {appointment.date ? 
                                (appointment.date.toDate ? appointment.date.toDate().toLocaleDateString() : 
                                 appointment.date.seconds ? new Date(appointment.date.seconds * 1000).toLocaleDateString() : 
                                 'Date TBD') : 'Date TBD'}
                            </Typography>
                        <Chip 
                          label={appointment.status || 'pending'} 
                          size="small"
                          sx={{
                              height: '20px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              background: `${getStatusColor(appointment.status)}15`,
                              color: getStatusColor(appointment.status),
                              border: `1px solid ${getStatusColor(appointment.status)}30`,
                            textTransform: 'capitalize'
                          }}
                        />
                        </Box>
                      </Box>
                    </Box>
                  ))}

                  {/* Show recent estimates */}
                  {estimates.slice(0, 2).map((estimate, index) => (
                    <Box 
                      key={`estimate-${estimate.id}`}
                      sx={{
                        position: 'relative',
                        pb: 3,
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        >
                          📋
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#1e293b',
                              fontSize: '0.875rem',
                              mb: 0.5
                            }}
                          >
                            {estimate.projectTitle || 'Estimate Request'}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#64748b',
                              fontSize: '0.75rem'
                            }}
                          >
                            {estimate.serviceCategory} • {estimate.status || 'pending'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#94a3b8',
                              fontSize: '0.75rem'
                            }}
                          >
                            {estimate.createdAt ? new Date(estimate.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  
                  <Button
                    component={Link}
                    to="/appointments"
                    sx={{
                      mt: 2,
                      background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      py: 1.5,
                      borderRadius: '12px',
                      textTransform: 'none',
                      '&:hover': { 
                        background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                    fullWidth
                  >
                    View All Activity
                  </Button>
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Box 
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      fontSize: '2rem'
                    }}
                  >
                    📅
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 1,
                      fontSize: '1rem'
                    }}
                  >
                    No appointments yet
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#64748b',
                      mb: 3,
                      fontSize: '0.875rem'
                    }}
                  >
                    Book your first service to get started
                  </Typography>
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
                      '&:hover': { 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Book Now
                  </Button>
                </Box>
              )}
                </Box>
          </Grid>
        </Grid>
    </Container>
    </Box>
  );
};

export default ClientDashboard;