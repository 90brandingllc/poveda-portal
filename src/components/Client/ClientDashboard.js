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
  WbSunny,
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

        {/* Dashboard Grid */}
        <Grid container spacing={{ xs: 3, sm: 6 }}>
          {/* Weather Card */}
          <Grid item xs={12} md={6}>
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
                      background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
                    }}>
                      <WbSunny sx={{ fontSize: '1.25rem', color: '#92400e' }} />
                    </Box>
                    Today's Weather
                  </Typography>
                }
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ pt: 2, pb: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 3,
                  position: 'relative',
                  zIndex: 1
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: { xs: 'center', sm: 'flex-start' },
                    position: 'relative' 
                  }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 2, sm: 3 },
                      mb: 2
                    }}>
                      <WbSunny sx={{ 
                        fontSize: { xs: '3.5rem', sm: '4.5rem' }, 
                        color: '#fbbf24',
                        filter: 'drop-shadow(0 4px 12px rgba(251, 191, 36, 0.4))',
                        animation: 'pulse 2s infinite ease-in-out',
                        '@keyframes pulse': {
                          '0%': { opacity: 0.9, transform: 'scale(0.98)' },
                          '50%': { opacity: 1, transform: 'scale(1.02)' },
                          '100%': { opacity: 0.9, transform: 'scale(0.98)' },
                        }
                      }} />
                      <Box>
                        <Typography sx={{ 
                          fontSize: { xs: '2.5rem', sm: '3.5rem' }, 
                          fontWeight: 800,
                          lineHeight: 1,
                          color: '#1e293b',
                          letterSpacing: '-1px',
                          mb: 0.5
                        }}>72°F</Typography>
                        <Typography sx={{ 
                          fontSize: { xs: '1rem', sm: '1.125rem' }, 
                          fontWeight: 600, 
                          color: '#475569',
                          ml: 0.5
                        }}>Sunny</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{
                      background: 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(5px)',
                      borderRadius: '12px',
                      p: 1.5,
                      px: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                      border: '1px solid rgba(255,255,255,0.8)',
                      width: { xs: '100%', sm: 'auto' }
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mb: 0.5 }}>HUMIDITY</Typography>
                        <Typography sx={{ fontWeight: 700, color: '#0891b2' }}>45%</Typography>
                      </Box>
                      
                      <Box sx={{ height: '30px', width: '1px', background: 'rgba(203, 213, 225, 0.6)' }} />
                      
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mb: 0.5 }}>WIND</Typography>
                        <Typography sx={{ fontWeight: 700, color: '#0891b2' }}>5 mph</Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    textAlign: { xs: 'center', sm: 'right' },
                    background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
                    backdropFilter: 'blur(5px)',
                    borderRadius: '12px',
                    p: 2,
                    minWidth: { xs: '100%', sm: '180px' },
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                    border: '1px solid rgba(255,255,255,0.8)'
                  }}>
                    <Typography sx={{ 
                      fontSize: '0.875rem', 
                      color: '#0e7490',
                      fontWeight: 600,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: { xs: 'center', sm: 'flex-end' },
                      gap: 0.5
                    }}>
                      <Box component="span" sx={{ 
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#0891b2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 'bold'
                      }}>✓</Box>
                      Perfect for detailing!
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>
                      Low humidity and mild winds create ideal conditions for your car service today
                    </Typography>
                  </Box>
                </Box>
                
                {/* Decorative Elements */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: '-20px', 
                  right: '-20px', 
                  width: '150px', 
                  height: '150px', 
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
                <Box sx={{ 
                  position: 'absolute', 
                  top: '30px', 
                  right: '20px', 
                  width: '30px', 
                  height: '30px', 
                  background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: '50px', 
                  left: '20px', 
                  width: '50px', 
                  height: '50px', 
                  background: 'radial-gradient(circle, rgba(8, 145, 178, 0.05) 0%, rgba(8, 145, 178, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Appointments */}
          <Grid item xs={12} md={6}>
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

          {/* Stats Cards */}
          <Grid item xs={12} md={3}>
            <Stack spacing={{ xs: 3, sm: 4 }}>
              {/* Today's Appointments Card */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', 
                borderRadius: '16px',
                border: '1px solid rgba(233, 213, 255, 0.8)',
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.1)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 6px 16px rgba(139, 92, 246, 0.25)'
                    }}>
                      <AccessTime sx={{ color: 'white', fontSize: '1.5rem' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ 
                        fontSize: '0.75rem', 
                        color: '#7c3aed', 
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        mb: 0.5
                      }}>
                        TODAY'S APPOINTMENTS
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '2.2rem', 
                        fontWeight: 800, 
                        color: '#5b21b6',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 1
                      }}>
                        {stats.pendingAppointments}
                        <Typography component="span" sx={{ 
                          fontSize: '0.9rem', 
                          fontWeight: 500, 
                          color: '#7c3aed',
                          pb: 0.5
                        }}>
                          scheduled
                        </Typography>
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Decorative circles */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    right: '-20px', 
                    width: '100px', 
                    height: '100px', 
                    background: 'radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, rgba(167, 139, 250, 0) 70%)',
                    borderRadius: '50%',
                    zIndex: 0
                  }} />
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: '-10px', 
                    left: '30px', 
                    width: '60px', 
                    height: '60px', 
                    background: 'radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, rgba(167, 139, 250, 0) 70%)',
                    borderRadius: '50%',
                    zIndex: 0
                  }} />
                </CardContent>
              </Card>

              {/* Pending Estimates Card */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', 
                borderRadius: '16px',
                border: '1px solid rgba(254, 215, 170, 0.8)',
                boxShadow: '0 10px 30px rgba(249, 115, 22, 0.1)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 6px 16px rgba(249, 115, 22, 0.25)'
                    }}>
                      <Description sx={{ color: 'white', fontSize: '1.5rem' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ 
                        fontSize: '0.75rem', 
                        color: '#ea580c', 
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        mb: 0.5
                      }}>
                        PENDING ESTIMATES
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '2.2rem', 
                        fontWeight: 800, 
                        color: '#9a3412',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 1
                      }}>
                        {stats.pendingEstimates}
                        <Typography component="span" sx={{ 
                          fontSize: '0.9rem', 
                          fontWeight: 500, 
                          color: '#c2410c',
                          pb: 0.5
                        }}>
                          in progress
                        </Typography>
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Decorative circles */}
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: '-20px', 
                    right: '-10px', 
                    width: '90px', 
                    height: '90px', 
                    background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(251, 146, 60, 0) 70%)',
                    borderRadius: '50%',
                    zIndex: 0
                  }} />
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '10px', 
                    left: '20px', 
                    width: '40px', 
                    height: '40px', 
                    background: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, rgba(251, 146, 60, 0) 70%)',
                    borderRadius: '50%',
                    zIndex: 0
                  }} />
                </CardContent>
              </Card>

              {/* Leave a Review Card */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
                borderRadius: '16px',
                border: '1px solid rgba(167, 243, 208, 0.8)',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.1)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)',
                      fontSize: '1.8rem'
                    }}>
                      ⭐
                    </Box>
                    <Box>
                      <Typography sx={{ 
                        fontSize: '0.75rem', 
                        color: '#059669', 
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        mb: 0.5
                      }}>
                        SHARE YOUR EXPERIENCE
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 800, 
                        color: '#065f46',
                        lineHeight: 1.2
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
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      fontWeight: 600,
                      borderRadius: '10px',
                      padding: '10px 0',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)'
                      },
                      transition: 'all 0.2s ease',
                      textTransform: 'none',
                      fontSize: '0.95rem'
                    }}
                  >
                    Write Review
                  </Button>
                  
                  {/* Decorative circles */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    left: '-20px', 
                    width: '90px', 
                    height: '90px', 
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 70%)',
                    borderRadius: '50%',
                    zIndex: 0
                  }} />
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: '10px', 
                    right: '20px', 
                    width: '70px', 
                    height: '70px', 
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%)',
                    borderRadius: '50%',
                    zIndex: 0
                  }} />
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Service Reminder */}
          <Grid item xs={12} md={9}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #0891b2 0%, #0284c7 100%)', 
              borderRadius: '16px',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 15px 40px rgba(6, 182, 212, 0.25)', 
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 4, sm: 6 }, height: '100%', position: 'relative', zIndex: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  justifyContent: 'space-between', 
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  height: '100%',
                  gap: { xs: 4, sm: 0 }
                }}>
                  <Box>
                    <Typography sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      mb: 1.5, 
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Box component="span" sx={{ 
                        width: '24px',
                        height: '24px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(255, 255, 255, 0.2)'
                      }}>
                        <Schedule sx={{ fontSize: '1rem', color: 'white' }} />
                      </Box>
                      REMINDER
                    </Typography>
                    
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      mb: 3, 
                      fontSize: { xs: '1.75rem', sm: '2.25rem' },
                      lineHeight: 1.2,
                      letterSpacing: '-0.01em',
                      textShadow: '0 2px 10px rgba(0,0,0,0.15)'
                    }}>
                      Schedule your next
                      <br />
                      service appointment
                    </Typography>
                    
                    <Button
                      component={Link}
                      to="/book-appointment"
                      sx={{
                        background: 'rgba(255, 255, 255, 0.95)', 
                        color: '#0891b2', 
                        fontWeight: 700,
                        borderRadius: '12px',
                        px: { xs: 4, sm: 5 },
                        py: 1.5,
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                        '&:hover': { 
                          background: 'white',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 25px rgba(0, 0, 0, 0.2)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Book now
                    </Button>
                  </Box>
                  
                  <Box sx={{ 
                    position: 'relative', 
                    display: { xs: 'none', md: 'block' },
                    width: '250px',
                    height: '200px'
                  }}>
                    {/* Car illustration or visual element */}
                    <Box sx={{ 
                      position: 'absolute',
                      top: '-20px',
                      right: '-10px',
                      width: '240px',
                      height: '180px',
                      borderRadius: '24px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      transform: 'rotate(-5deg)'
                    }}>
                      <DirectionsCar sx={{ fontSize: '6rem', color: 'white', opacity: 0.9 }} />
                    </Box>
                  </Box>
                </Box>
                
                {/* Decorative Elements */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: '-40px', 
                  left: '-30px', 
                  width: '180px', 
                  height: '180px', 
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
                <Box sx={{ 
                  position: 'absolute', 
                  top: '-30px', 
                  right: '40px', 
                  width: '120px', 
                  height: '120px', 
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }} />
                <Box sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '20%', 
                  width: '15px', 
                  height: '15px', 
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '50%',
                  zIndex: 0,
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.8)'
                }} />
                <Box sx={{ 
                  position: 'absolute', 
                  top: '30%', 
                  right: '15%', 
                  width: '10px', 
                  height: '10px', 
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '50%',
                  zIndex: 0,
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.8)'
                }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
    </ClientLayout>
  );
};

export default ClientDashboard;