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
  Chip,
  Tooltip
} from '@mui/material';
import {
  Search,
  Notifications,
  DirectionsCar,
  AccessTime,
  Description,
  Logout,
  CheckCircleOutline,
  CalendarToday,
  Schedule
} from '@mui/icons-material';

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';
import { generateSampleData } from '../../utils/generateSampleData';
import WeatherWidget from '../WeatherWidget';

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
      // Consulta temporal sin filtrado por read para evitar necesidad de índice compuesto
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid)
        // Se eliminaron los filtros adicionales temporalmente
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        let allNotifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            time: formatTimeAgo(data.createdAt?.toDate() || new Date())
          };
        });
        
        // Filtrar manualmente solo las notificaciones no leídas
        const unreadNotifications = allNotifications.filter(n => n.read !== true);
        
        // Ordenar por fecha (más recientes primero)
        unreadNotifications.sort((a, b) => {
          const dateA = a.createdAt?.toDate() || new Date(0);
          const dateB = b.createdAt?.toDate() || new Date(0);
          return dateB - dateA;
        });
        
        // Limitar a 5 notificaciones
        const limitedNotifications = unreadNotifications.slice(0, 5);
        
        setNotifications(limitedNotifications);
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

  // Nueva función para marcar notificaciones como leídas
  const markNotificationAsRead = async (notificationId) => {
    try {
      // Actualización optimista en el estado local
      setNotifications(prevNotifications => 
        prevNotifications.filter(n => n.id !== notificationId)
      );
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      
      console.log('Notificación marcada como leída:', notificationId);
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
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
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: { xs: 4, sm: 6 },
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(240,249,255,0.9) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          p: { xs: 2.5, sm: 3 },
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
          border: '1px solid rgba(255,255,255,0.6)'
        }}>
          <Box>
            <Typography sx={{ 
              color: '#0891b2', 
              mb: 1, 
              fontSize: { xs: '0.85rem', sm: '1rem' },
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box component="span" sx={{ 
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>👋</Box>
              Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Friend'}
            </Typography>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              color: '#1e293b', 
              fontSize: { xs: '1.75rem', sm: '2.5rem' },
              textShadow: '0 2px 10px rgba(0,0,0,0.05)',
              letterSpacing: '-0.5px'
            }}>
              Dashboard
            </Typography>
          </Box>

          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            gap: 1.5,
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            p: 0.8,
            pr: 2.5,
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
          }}>
            <Tooltip title="Search Appointments">
              <IconButton 
                onClick={() => navigate('/appointments')}
                sx={{ 
                  color: '#475569',
                  background: 'rgba(255,255,255,0.8)',
                  width: 40,
                  height: 40,
                  '&:hover': {
                    color: '#0891b2',
                    background: 'rgba(8, 145, 178, 0.1)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                }}
              >
                <Search sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton 
                onClick={handleNotificationsClick}
                sx={{ 
                  color: notifications.length > 0 ? '#0891b2' : '#475569',
                  background: notifications.length > 0 ? 'rgba(8, 145, 178, 0.1)' : 'rgba(255,255,255,0.8)',
                  width: 40,
                  height: 40,
                  '&:hover': {
                    background: 'rgba(8, 145, 178, 0.15)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                }}
              >
                <Badge 
                  badgeContent={notifications.length} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      minWidth: '18px',
                      height: '18px'
                    }
                  }}
                >
                  <Notifications sx={{ fontSize: '1.2rem' }} />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Box sx={{ 
              height: '20px', 
              width: '1px', 
              background: 'rgba(203, 213, 225, 0.6)', 
              mx: 0.5 
            }} />
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5 
            }}>
              <Avatar 
                onClick={handleProfileClick}
                sx={{ 
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                  cursor: 'pointer',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)',
                    transform: 'scale(1.05)',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.15)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
              </Avatar>
              
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography sx={{ 
                  fontWeight: 600, 
                  color: '#334155', 
                  fontSize: '0.9rem',
                  lineHeight: 1.2
                }}>
                  {currentUser?.displayName || 'User'}
                </Typography>
                <Typography sx={{ 
                  color: '#64748b',
                  fontSize: '0.75rem'
                }}>
                  Client Account
                </Typography>
              </Box>
            </Box>
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
              width: '400px', // Aumentado el ancho del modal
              maxHeight: '450px' // Aumentado la altura máxima
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
                <Box key={notification.id} sx={{ position: 'relative', mb: 2 }}>
                  <MenuItem 
                    onClick={handleNotificationsClose}
                    sx={{ 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      py: 2,
                      borderRadius: '8px',
                      '&:hover': {
                        background: 'rgba(8, 145, 178, 0.1)'
                      },
                      pr: 12, // Más espacio para el botón
                      position: 'relative', // Para posicionar elementos dentro
                      overflow: 'visible' // Permitir que el botón se vea aunque esté fuera del área
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, pr: 2 }}>
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
                    <Typography variant="body2" sx={{ color: '#6b7280', mb: 1, pr: 8, maxWidth: '100%', wordBreak: 'break-word' }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {notification.time}
                    </Typography>
                  </MenuItem>
                  
                  {/* Botón para marcar como leído */}
                  <Tooltip title="Marcar como leída" placement="left">
                    <IconButton
                      size="medium" // Tamaño más grande para mejor visibilidad
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationAsRead(notification.id);
                      }}
                      sx={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'white',
                        border: '1px solid #e5e7eb',
                        color: '#0891b2',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        width: 36, // Tamaño fijo más grande
                        height: 36, // Tamaño fijo más grande
                        '&:hover': {
                          bgcolor: '#f0f9ff',
                          boxShadow: '0 3px 6px rgba(0,0,0,0.15)',
                          color: '#0e7490',
                        },
                        zIndex: 10 // Mayor valor para asegurar que esté por encima de todo
                      }}
                    >
                      <CheckCircleOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  {index < notifications.length - 1 && <Divider sx={{ mt: 1 }} />}
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

        {/* Quick Stats Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              color: 'white',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(30, 58, 138, 0.3)',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, mb: 1 }}>
                  TOTAL APPOINTMENTS
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {stats.totalAppointments}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  All time
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
              color: 'white',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(8, 145, 178, 0.3)',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, mb: 1 }}>
                  PENDING
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {stats.pendingAppointments}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  Awaiting approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
              color: 'white',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(51, 65, 85, 0.3)',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, mb: 1 }}>
                  COMPLETED
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {stats.completedAppointments}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  Services done
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
              color: 'white',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(12, 74, 110, 0.3)',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, mb: 1 }}>
                  TOTAL SPENT
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  ${stats.totalSpent.toFixed(0)}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  Lifetime value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dashboard Grid */}
        <Grid container spacing={{ xs: 3, sm: 4 }}>
          {/* Weather Widget - Integrated */}
          <Grid item xs={12}>
            <WeatherWidget appointments={appointments} />
          </Grid>

          {/* Upcoming Appointments */}
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.85) 100%)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.7)',
              boxShadow: '0 10px 30px rgba(8, 145, 178, 0.08)',
              overflow: 'hidden',
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardHeader 
                title={
                  <Typography sx={{ 
                    fontSize: { xs: '1.125rem', md: '1.25rem' },
                    fontWeight: 700,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}>
                    <Box component="span" sx={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #bfdbfe 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}>
                      <CalendarToday sx={{ fontSize: '1.25rem', color: '#1e40af' }} />
                    </Box>
                    Upcoming Appointments
                  </Typography>
                }
                action={
                  <Button 
                    component={Link}
                    to="/appointments" 
                    variant="text" 
                    sx={{ 
                      color: '#2563eb', 
                      p: 0, 
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      '&:hover': {
                        color: '#1d4ed8',
                        background: 'transparent'
                      }
                    }}
                  >
                    View all
                  </Button>
                }
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ 
                pt: 2, 
                pb: 3, 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 1
              }}>
                <Stack spacing={2.5}>
                  {appointments.length > 0 ? appointments.slice(0, 2).map((appointment, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        p: 2.5, 
                        backgroundColor: 'rgba(255, 255, 255, 0.7)', 
                        backdropFilter: 'blur(5px)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                        border: '1px solid rgba(255,255,255,0.8)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
                          boxShadow: '0 3px 12px rgba(59, 130, 246, 0.2)'
                        }}>
                          <DirectionsCar sx={{ fontSize: '1.8rem', color: '#1e40af' }} />
                        </Box>
                        <Box>
                          <Typography sx={{ 
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: '#334155',
                            mb: 0.5
                          }}>
                            {appointment.service || 'Car Detailing'}
                          </Typography>
                          <Typography sx={{ 
                            fontSize: '0.875rem', 
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            {appointment.vehicleDetails || 'Your vehicle'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        textAlign: 'right',
                        background: 'rgba(255,255,255,0.6)',
                        borderRadius: '8px',
                        p: 1,
                        minWidth: '80px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                      }}>
                        <Typography sx={{ 
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#0891b2',
                          mb: 0.5
                        }}>
                          {appointment.time || '2:00 PM'}
                        </Typography>
                        <Typography sx={{ 
                          fontSize: '0.75rem', 
                          color: '#64748b',
                          fontWeight: 500
                        }}>
                          {appointment.date ? new Date(appointment.date.toDate ? appointment.date.toDate() : appointment.date).toLocaleDateString() : 'Today'}
                        </Typography>
                      </Box>
                    </Box>
                  )) : (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      minHeight: 200
                    }}>
                      <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'rgba(236, 253, 245, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3
                      }}>
                        <CalendarToday sx={{ fontSize: '2rem', color: '#0d9488' }} />
                      </Box>
                      <Typography sx={{ color: '#475569', fontWeight: 500, mb: 2 }}>No upcoming appointments</Typography>
                      <Button
                        component={Link}
                        to="/book-appointment"
                        variant="contained"
                        sx={{ 
                          background: 'linear-gradient(135deg, #0891b2 0%, #0284c7 100%)',
                          boxShadow: '0 4px 14px rgba(8, 145, 178, 0.25)',
                          px: 4,
                          py: 1,
                          borderRadius: '10px',
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: '0.95rem',
                          '&:hover': { 
                            background: 'linear-gradient(135deg, #0e7490 0%, #0369a1 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 18px rgba(8, 145, 178, 0.3)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Book Service Now
                      </Button>
                    </Box>
                  )}
                </Stack>
                
                {/* Decorative Elements */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: '-30px', 
                  left: '-20px', 
                  width: '120px', 
                  height: '120px', 
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
                <Box sx={{ 
                  position: 'absolute', 
                  top: '40px', 
                  right: '30px', 
                  width: '60px', 
                  height: '60px', 
                  background: 'radial-gradient(circle, rgba(6, 182, 212, 0.04) 0%, rgba(6, 182, 212, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Quick Actions Card */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
                color: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(30, 64, 175, 0.35)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    mb: 3,
                    opacity: 0.9
                  }}>
                    QUICK ACTIONS
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Button
                      component={Link}
                      to="/book-appointment"
                      fullWidth
                      sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: '12px',
                        py: 1.5,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
                        },
                        transition: 'all 0.2s ease',
                        textTransform: 'none'
                      }}
                    >
                      📅 Book Appointment
                    </Button>
                    
                    <Button
                      component={Link}
                      to="/get-estimate"
                      fullWidth
                      sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: '12px',
                        py: 1.5,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
                        },
                        transition: 'all 0.2s ease',
                        textTransform: 'none'
                      }}
                    >
                      💰 Get Estimate
                    </Button>
                    
                    <Button
                      component={Link}
                      to="/support"
                      fullWidth
                      sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: '12px',
                        py: 1.5,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
                        },
                        transition: 'all 0.2s ease',
                        textTransform: 'none'
                      }}
                    >
                      💬 Contact Support
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Leave a Review Card */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                color: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(51, 65, 85, 0.35)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      background: 'rgba(255, 255, 255, 0.15)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '1.8rem'
                    }}>
                      ⭐
                    </Box>
                    <Box>
                      <Typography sx={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        mb: 0.5,
                        opacity: 0.9
                      }}>
                        SHARE YOUR EXPERIENCE
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '1.1rem', 
                        fontWeight: 800
                      }}>
                        Leave a Review
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Button
                    href="https://reviewthis.biz/povedadetailing1"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    fullWidth
                    sx={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#1e293b',
                      fontWeight: 700,
                      borderRadius: '12px',
                      py: 1.5,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      '&:hover': {
                        background: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)'
                      },
                      transition: 'all 0.2s ease',
                      textTransform: 'none'
                    }}
                  >
                    Write Review Now
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Service Reminder Banner */}
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', 
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(8, 145, 178, 0.35)', 
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 }, position: 'relative', zIndex: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: 3
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ 
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      mb: 1.5,
                      opacity: 0.95
                    }}>
                      🚗 KEEP YOUR CAR LOOKING FRESH
                    </Typography>
                    
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      mb: 2, 
                      fontSize: { xs: '1.5rem', sm: '2rem' },
                      lineHeight: 1.2
                    }}>
                      Ready for your next detail?
                    </Typography>
                    
                    <Typography sx={{ 
                      fontSize: '1rem',
                      mb: 3,
                      opacity: 0.9,
                      maxWidth: '500px'
                    }}>
                      Book your appointment today and keep your vehicle in pristine condition
                    </Typography>
                    
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Button
                        component={Link}
                        to="/book-appointment"
                        sx={{
                          background: 'white', 
                          color: '#0891b2', 
                          fontWeight: 700,
                          borderRadius: '12px',
                          px: 4,
                          py: 1.5,
                          fontSize: '1rem',
                          textTransform: 'none',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                          '&:hover': { 
                            background: 'rgba(255, 255, 255, 0.95)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Book Appointment
                      </Button>
                      
                      <Button
                        component={Link}
                        to="/services"
                        sx={{
                          background: 'rgba(255, 255, 255, 0.2)', 
                          color: 'white',
                          border: '2px solid rgba(255, 255, 255, 0.5)',
                          fontWeight: 600,
                          borderRadius: '12px',
                          px: 4,
                          py: 1.5,
                          fontSize: '1rem',
                          textTransform: 'none',
                          backdropFilter: 'blur(10px)',
                          '&:hover': { 
                            background: 'rgba(255, 255, 255, 0.3)',
                            transform: 'translateY(-2px)',
                            borderColor: 'rgba(255, 255, 255, 0.8)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        View Services
                      </Button>
                    </Stack>
                  </Box>
                  
                  <Box sx={{ 
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '3px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <DirectionsCar sx={{ fontSize: '5rem', color: 'white', opacity: 0.9 }} />
                  </Box>
                </Box>
                
                {/* Decorative Elements */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: '-50px', 
                  right: '-50px', 
                  width: '200px', 
                  height: '200px', 
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
                <Box sx={{ 
                  position: 'absolute', 
                  top: '-30px', 
                  left: '30%', 
                  width: '100px', 
                  height: '100px', 
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
    </ClientLayout>
  );
};

export default ClientDashboard;