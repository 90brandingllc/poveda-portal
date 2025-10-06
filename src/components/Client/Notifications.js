import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Chip,
  IconButton,
  Divider,
  Alert,
  Stack,
  Avatar,
  Button,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  Info,
  Warning,
  Error,
  MoreVert,
  Delete,
  MarkAsUnread,
  MarkEmailRead
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';

const Notifications = () => {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());

  // Real notifications from Firestore
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from Firestore
  useEffect(() => {
    if (currentUser) {
      // Agregamos un console.log para debug
      console.log('Buscando notificaciones para el usuario:', currentUser.uid);

      // Consulta temporal sin orderBy para evitar necesidad de índice compuesto
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid)
        // Se eliminó orderBy('createdAt', 'desc') temporalmente para evitar error de índice
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        let userNotifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.createdAt?.toDate() || new Date(),
            time: formatTimeAgo(data.createdAt?.toDate() || new Date()),
            // Asegurarnos de que read esté definido
            read: data.read === undefined ? false : data.read
          };
        });
        
        // Ordenar manualmente las notificaciones por fecha (más recientes primero)
        userNotifications.sort((a, b) => {
          const dateA = a.timestamp || new Date(0);
          const dateB = b.timestamp || new Date(0);
          return dateB - dateA;
        });

        console.log('Notificaciones encontradas:', userNotifications.length, userNotifications);
        setNotifications(userNotifications);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching notifications:', error);
        setError(`Error cargando notificaciones: ${error.message}`);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false); // También manejar el caso de que no haya usuario
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

  const handleMenuOpen = (event, notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const markAsRead = async (notificationId) => {
    try {
      // Actualización optimista del estado local
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true } 
            : notif
        )
      );
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      
      // Cambiar a la vista "all" si estás viendo "unread"
      if (filter === 'unread') {
        setFilter('all');
      }
      
      handleMenuClose();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Revertir el cambio local si falla
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId && notif.read 
            ? { ...notif, read: false } 
            : notif
        )
      );
    }
  };

  const markAsUnread = async (notificationId) => {
    try {
      // Actualización optimista del estado local
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: false } 
            : notif
        )
      );
      
      // Actualizar en Firestore
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: false,
        readAt: null
      });
      
      handleMenuClose();
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      
      // Revertir el cambio local si falla
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId && !notif.read 
            ? { ...notif, read: true } 
            : notif
        )
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    // Guardar una copia de la notificación antes de eliminarla para posible restauración
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    
    try {
      // Actualización optimista - eliminar del estado local
      setNotifications(prevNotifications => 
        prevNotifications.filter(notif => notif.id !== notificationId)
      );
      
      // Eliminar de Firestore
      await deleteDoc(doc(db, 'notifications', notificationId));
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      // Restaurar la notificación si falla
      if (notificationToDelete) {
        setNotifications(prev => [...prev, notificationToDelete]);
      }
    }
  };

  const getIconComponent = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ color: '#22c55e' }} />;
      case 'warning':
        return <Warning sx={{ color: '#f59e0b' }} />;
      case 'error':
        return <Error sx={{ color: '#ef4444' }} />;
      default:
        return <Info sx={{ color: '#3b82f6' }} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'warning':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'error':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      default:
        return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
    }
  };

  // Filtrado más robusto de notificaciones
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Asegurarse de que notification.read esté definido
      const isRead = notification.read === true;
      
      if (filter === 'unread') return !isRead;
      if (filter === 'read') return isRead;
      return true;
    });
  }, [notifications, filter]);

  // Contador de no leídas
  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.read !== true).length;
  }, [notifications]);
  
  // Añadimos un estado para controlar errores
  const [error, setError] = useState(null);

  // Función para marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    // Solo proceder si hay notificaciones no leídas
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      setLoading(true);
      
      // Actualiza el estado local optimistamente
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, read: true }))
      );
      
      // Actualizar cada notificación en Firebase
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          readAt: serverTimestamp()
        })
      );
      
      await Promise.all(updatePromises);
      
      // Si estamos en vista de no leídas, cambiar a todas
      if (filter === 'unread') {
        setFilter('all');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError(`Error marking all as read: ${error.message}`);
      setLoading(false);
      
      // Revertir cambios en caso de error
      // La suscripción a Firestore actualizará el estado
    }
  };

  const toggleExpanded = (notificationId) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const truncateMessage = (message, maxLength = 150) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <ClientLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsIcon sx={{ fontSize: '2rem', color: '#0891b2', mr: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#4b5563' }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip 
              label={`${unreadCount} new`} 
              size="small" 
              sx={{ 
                ml: 2, 
                background: '#ef4444', 
                color: 'white',
                fontWeight: 600
              }} 
            />
          )}
        </Box>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Stay updated with your appointments, estimates, and service notifications
        </Typography>
      </Box>

      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 4, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Filter Buttons and Actions */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1}>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
            sx={{
              borderRadius: 2,
              background: filter === 'all' ? '#0891b2' : 'transparent',
              borderColor: '#0891b2',
              color: filter === 'all' ? 'white' : '#0891b2',
              '&:hover': {
                background: filter === 'all' ? '#0e7490' : 'rgba(8, 145, 178, 0.1)'
              }
            }}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'contained' : 'outlined'}
            onClick={() => setFilter('unread')}
            sx={{
              borderRadius: 2,
              background: filter === 'unread' ? '#0891b2' : 'transparent',
              borderColor: '#0891b2',
              color: filter === 'unread' ? 'white' : '#0891b2',
              '&:hover': {
                background: filter === 'unread' ? '#0e7490' : 'rgba(8, 145, 178, 0.1)'
              }
            }}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'contained' : 'outlined'}
            onClick={() => setFilter('read')}
            sx={{
              borderRadius: 2,
              background: filter === 'read' ? '#0891b2' : 'transparent',
              borderColor: '#0891b2',
              color: filter === 'read' ? 'white' : '#0891b2',
              '&:hover': {
                background: filter === 'read' ? '#0e7490' : 'rgba(8, 145, 178, 0.1)'
              }
            }}
          >
            Read ({notifications.length - unreadCount})
          </Button>
        </Stack>
        
        {/* Botón para marcar todas como leídas */}
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            onClick={markAllAsRead}
            startIcon={<MarkEmailRead />}
            disabled={loading}
            sx={{
              borderRadius: 2,
              borderColor: '#0891b2',
              color: '#0891b2',
              '&:hover': {
                borderColor: '#0e7490',
                color: '#0e7490',
                background: 'rgba(8, 145, 178, 0.1)'
              }
            }}
          >
            Mark All Read
          </Button>
        )}
        </Box>
      </Box>

      {/* Notifications List */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {loading ? (
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.8)', 
              backdropFilter: 'blur(8px)', 
              border: 0, 
              boxShadow: 3,
              p: 4,
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Cargando notificaciones...
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={40} sx={{ color: '#0891b2' }} />
              </Box>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.8)', 
              backdropFilter: 'blur(8px)', 
              border: 0, 
              boxShadow: 3 
            }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <NotificationsIcon sx={{ fontSize: '4rem', color: '#d1d5db', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
                  {filter === 'unread' ? 'No unread notifications' : 
                   filter === 'read' ? 'No read notifications' : 
                   'No notifications yet'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                  {filter === 'unread' ? 'All your notifications have been read' :
                   filter === 'read' ? 'You haven\'t read any notifications yet' :
                   'You\'ll see updates about your appointments and services here'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={2}>
              {filteredNotifications.map((notification, index) => {
                const colors = getTypeColor(notification.type);
                return (
                  <Card 
                    key={notification.id}
                    sx={{ 
                      background: notification.read 
                        ? 'rgba(255, 255, 255, 0.6)' 
                        : 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(8px)', 
                      border: notification.read ? '1px solid rgba(209, 213, 219, 0.3)' : '2px solid rgba(8, 145, 178, 0.2)',
                      boxShadow: notification.read ? 1 : 3,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        justifyContent: 'space-between',
                        width: '100%',
                        minWidth: 0
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 2, 
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden'
                        }}>
                          <Avatar sx={{ 
                            background: colors.bg, 
                            width: 48, 
                            height: 48,
                            border: `2px solid ${colors.border}`
                          }}>
                            {getIconComponent(notification.type)}
                          </Avatar>
                          
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: notification.read ? 500 : 700,
                                  color: '#1f2937',
                                  fontSize: '1.125rem',
                                  wordBreak: 'break-word',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '100%',
                                  mr: 1
                                }}
                              >
                                {notification.title}
                              </Typography>
                              {!notification.read && (
                                <Box sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  background: '#ef4444',
                                  flexShrink: 0
                                }} />
                              )}
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  color: '#4b5563',
                                  lineHeight: 1.6,
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  overflow: 'visible',
                                  maxWidth: '100%'
                                }}
                              >
                                {expandedNotifications.has(notification.id) 
                                  ? notification.message 
                                  : truncateMessage(notification.message)}
                              </Typography>
                              {notification.message.length > 150 && (
                                <Button
                                  size="small"
                                  onClick={() => toggleExpanded(notification.id)}
                                  sx={{
                                    color: '#0891b2',
                                    fontSize: '0.875rem',
                                    p: 0,
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    mt: 0.5,
                                    '&:hover': {
                                      background: 'transparent',
                                      textDecoration: 'underline'
                                    }
                                  }}
                                >
                                  {expandedNotifications.has(notification.id) ? 'Show less' : 'Show more'}
                                </Button>
                              )}
                            </Box>
                            
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2,
                              flexWrap: 'wrap',
                              width: '100%'
                            }}>
                              <Chip 
                                label={notification.type}
                                size="small"
                                sx={{
                                  background: colors.bg,
                                  color: colors.text,
                                  borderColor: colors.border,
                                  fontWeight: 600,
                                  textTransform: 'capitalize',
                                  flexShrink: 0
                                }}
                                variant="outlined"
                              />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: '#9ca3af',
                                  flexShrink: 0,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {notification.time}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, notification)}
                          sx={{ 
                            color: '#6b7280',
                            flexShrink: 0,
                            alignSelf: 'flex-start',
                            mt: -0.5,
                            '&:hover': { background: 'rgba(0, 0, 0, 0.04)' }
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Grid>
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
          }
        }}
      >
        {selectedNotification && !selectedNotification.read && (
          <MenuItem onClick={() => markAsRead(selectedNotification.id)}>
            <MarkEmailRead sx={{ mr: 2 }} />
            Mark as Read
          </MenuItem>
        )}
        {selectedNotification && selectedNotification.read && (
          <MenuItem onClick={() => markAsUnread(selectedNotification.id)}>
            <MarkAsUnread sx={{ mr: 2 }} />
            Mark as Unread
          </MenuItem>
        )}
        <MenuItem onClick={() => deleteNotification(selectedNotification?.id)} sx={{ color: '#ef4444' }}>
          <Delete sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Menu>
    </ClientLayout>
  );
};

export default Notifications;
