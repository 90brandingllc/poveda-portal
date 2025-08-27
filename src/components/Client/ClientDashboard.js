import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Button,
  Box,
  Avatar,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip
} from '@mui/material';
import {
  Search,
  Notifications,
  WbSunny,
  DirectionsCar,
  AccessTime,
  Description,
  Logout
} from '@mui/icons-material';

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';
import { generateSampleData } from '../../utils/generateSampleData';

const ClientDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    completedAppointments: 0,
    totalSpent: 0,
    totalEstimates: 0,
    pendingEstimates: 0
  });
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const notificationsOpen = Boolean(notificationsAnchor);
  const [notifications, setNotifications] = useState([]);

  // Fetch real-time notifications
  useEffect(() => {
    if (currentUser) {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        where('read', '==', false),
        limit(5)
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const unreadNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: formatTimeAgo(doc.data().createdAt?.toDate() || new Date())
        }));
        setNotifications(unreadNotifications);
      }, (error) => {
        console.error('Error fetching notifications:', error);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleNotificationsClick = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };



  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };



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

      return () => {
        unsubscribeAppointments();
        unsubscribeEstimates();
      };
    }
  }, [currentUser]);

  return (
    <ClientLayout>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 4, sm: 6 } }}>
          <Box>
            <Typography sx={{ color: '#0891b2', mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Friend'}👋
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#4b5563', fontSize: { xs: '1.75rem', sm: '2.5rem' } }}>
              Dashboard
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate('/appointments')}
              sx={{ 
                color: '#6b7280',
                '&:hover': {
                  color: '#0891b2',
                  background: 'rgba(8, 145, 178, 0.1)'
                }
              }}
              title="Search Appointments"
            >
              <Search />
            </IconButton>
            <IconButton 
              onClick={handleNotificationsClick}
        sx={{ 
                color: '#0891b2',
                '&:hover': {
                  background: 'rgba(8, 145, 178, 0.1)'
                }
              }}
            >
              <Badge badgeContent={notifications.length} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton 
              onClick={handleLogout}
              sx={{ 
                color: '#dc2626',
                '&:hover': {
                  background: 'rgba(220, 38, 38, 0.1)',
                  color: '#b91c1c'
                }
              }}
              title="Logout"
            >
              <Logout />
            </IconButton>
            <Avatar 
              onClick={handleProfileClick}
              sx={{ 
                background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                cursor: 'pointer',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
            </Avatar>
            <Typography sx={{ fontWeight: 500, color: '#4b5563', display: { xs: 'none', md: 'block' } }}>
              {currentUser?.displayName || 'User'}
            </Typography>
            

        </Box>
        </Box>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchor}
          open={notificationsOpen}
          onClose={handleNotificationsClose}
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
              width: '350px',
              maxHeight: '400px'
            }
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Notifications
            </Typography>
            {notifications.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#6b7280', textAlign: 'center', py: 4 }}>
                No new notifications
              </Typography>
            ) : (
              notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <MenuItem 
                    onClick={handleNotificationsClose}
                    sx={{ 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      py: 2,
                      borderRadius: '8px',
                      '&:hover': {
                        background: 'rgba(8, 145, 178, 0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {notification.title}
                  </Typography>
                      <Chip 
                        size="small" 
                        label={notification.type}
                    sx={{ 
                          background: notification.type === 'success' ? '#dcfce7' : '#dbeafe',
                          color: notification.type === 'success' ? '#166534' : '#1e40af',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {notification.time}
                    </Typography>
                  </MenuItem>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))
            )}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button 
                size="small" 
                component={Link}
                to="/notifications"
                sx={{ color: '#0891b2' }}
                onClick={handleNotificationsClose}
              >
                View All Notifications
              </Button>
            </Box>
          </Box>
        </Menu>

        {/* Dashboard Grid */}
        <Grid container spacing={{ xs: 3, sm: 6 }}>
          {/* Weather Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', border: 0, boxShadow: 3 }}>
                            <CardHeader
                title={
                  <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>Today's Weather</Typography>
                }
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <WbSunny sx={{ fontSize: '4rem', color: '#eab308', mb: 1 }} />
                      <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>72°F</Typography>
                      <Typography sx={{ fontSize: '0.875rem', color: '#6b7280' }}>Sunny</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#6b7280' }}>Perfect for detailing!</Typography>
                    <Typography sx={{ fontWeight: 600 }}>Low humidity: 45%</Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#6b7280' }}>Wind: 5 mph</Typography>
                </Box>
                </Box>
              </CardContent>
            </Card>
      </Grid>

          {/* Upcoming Appointments */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', border: 0, boxShadow: 3 }}>
              <CardHeader 
                title={
                  <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>Upcoming Appointments</Typography>
                }
                action={
                  <Button 
                  component={Link}
                    to="/appointments" 
                    variant="text" 
                    sx={{ color: '#0891b2', p: 0, fontSize: '0.875rem' }}
                  >
                    View all appointments
                  </Button>
                }
              />
              <CardContent>
                <Stack spacing={2}>
                  {appointments.length > 0 ? appointments.slice(0, 2).map((appointment, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, backgroundColor: '#f9fafb', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <DirectionsCar sx={{ fontSize: '2rem', color: '#0891b2' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{appointment.service || 'Car Detailing'}</Typography>
                          <Typography sx={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {appointment.vehicleDetails || 'Your vehicle'}
                        </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {appointment.time || '2:00 PM'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {appointment.date ? new Date(appointment.date.toDate ? appointment.date.toDate() : appointment.date).toLocaleDateString() : 'Today'}
                        </Typography>
                      </Box>
                    </Box>
                  )) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography sx={{ color: '#6b7280', mb: 2 }}>No upcoming appointments</Typography>
                  <Button
                    component={Link}
                    to="/book-appointment"
                    variant="contained"
                        sx={{ background: '#0891b2', '&:hover': { background: '#0e7490' } }}
                  >
                        Book Service
                  </Button>
                </Box>
              )}
                </Stack>
            </CardContent>
          </Card>
        </Grid>

          {/* Stats Cards */}
          <Grid item xs={12} md={3}>
            <Stack spacing={{ xs: 3, sm: 6 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)', border: 0, boxShadow: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 40, height: 40, background: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AccessTime sx={{ color: 'white', fontSize: '1.25rem' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>TODAY'S APPOINTMENTS</Typography>
                      <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#581c87' }}>{stats.pendingAppointments}</Typography>
            </Box>
                </Box>
            </CardContent>
          </Card>

              

              <Card sx={{ background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)', border: 0, boxShadow: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 40, height: 40, background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Description sx={{ color: 'white', fontSize: '1.25rem' }} />
                    </Box>
                        <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#c2410c', fontWeight: 600 }}>PENDING ESTIMATES</Typography>
                      <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#9a3412' }}>{stats.pendingEstimates}</Typography>
                        </Box>
                      </Box>
                </CardContent>
              </Card>

              {/* Leave a Review Card */}
              <Card sx={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: 0, boxShadow: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ width: 40, height: 40, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ⭐
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>SHARE YOUR EXPERIENCE</Typography>
                      <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#166534' }}>Leave a Review</Typography>
                    </Box>
                  </Box>
                  <Button
                    href="https://reviewthis.biz/povedadetailing1"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    fullWidth
                    sx={{
                      background: '#22c55e',
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        background: '#16a34a',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Write Review
                  </Button>
                </CardContent>
              </Card>

                </Stack>
          </Grid>

          {/* Service Reminder */}
          <Grid item xs={12} md={9}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)', 
              border: 0, 
              boxShadow: 3, 
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1, fontSize: '0.875rem' }}>REMINDER</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      Schedule your next
                      <br />
                      service appointment
                  </Typography>
                  <Button
                    component={Link}
                    to="/book-appointment"
                    sx={{
                        background: 'white', 
                        color: '#0891b2', 
                      fontWeight: 600,
                        '&:hover': { background: '#f8fafc' }
                      }}
                    >
                      Book now
                  </Button>
                </Box>
                  <Box sx={{ position: 'relative', display: { xs: 'none', sm: 'block' } }}>
                    <Box sx={{ width: 128, height: 128, background: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%', position: 'absolute', top: -32, right: -32 }} />
                    <Box sx={{ width: 96, height: 96, background: 'rgba(255, 255, 255, 0.3)', borderRadius: '50%', position: 'absolute', top: 16, right: 16 }} />
                    <Box sx={{ width: 64, height: 64, background: 'rgba(255, 255, 255, 0.4)', borderRadius: '50%', position: 'absolute', top: 32, right: 48 }} />
                  </Box>
                </Box>
            </CardContent>
          </Card>
          </Grid>
        </Grid>
    </ClientLayout>
  );
};

export default ClientDashboard;