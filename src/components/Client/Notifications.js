import React, { useState, useEffect } from 'react';
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
  MenuItem
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
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const userNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().createdAt?.toDate() || new Date(),
          time: formatTimeAgo(doc.data().createdAt?.toDate() || new Date())
        }));
        setNotifications(userNotifications);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
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
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      handleMenuClose();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnread = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: false,
        readAt: null
      });
      handleMenuClose();
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting notification:', error);
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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

      {/* Filter Buttons */}
      <Box sx={{ mb: 4 }}>
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
      </Box>

      {/* Notifications List */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {filteredNotifications.length === 0 ? (
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
