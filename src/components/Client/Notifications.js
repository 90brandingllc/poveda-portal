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
import ClientLayout from '../Layout/ClientLayout';

const Notifications = () => {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());

  // Sample notifications data - in real app this would come from Firestore
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Appointment Confirmed',
      message: 'Your Full Detailing appointment on December 28, 2024 at 2:00 PM has been confirmed. Our team will arrive at your location.',
      type: 'success',
      time: '2 hours ago',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      icon: 'success'
    },
    {
      id: 2,
      title: 'Estimate Ready',
      message: 'Your estimate for Premium Wash Package is ready for review. Total estimated cost: $89.99.',
      type: 'info',
      time: '5 hours ago',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
      icon: 'info'
    },
    {
      id: 3,
      title: 'Payment Received',
      message: 'We have received your deposit payment of $45.00 for your upcoming appointment. Remaining balance: $44.99.',
      type: 'success',
      time: '1 day ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      icon: 'success'
    },
    {
      id: 4,
      title: 'Appointment Reminder',
      message: 'Reminder: Your appointment is scheduled for tomorrow at 2:00 PM. Please ensure your vehicle is accessible.',
      type: 'warning',
      time: '1 day ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      icon: 'warning'
    },
    {
      id: 5,
      title: 'Service Completed',
      message: 'Your Full Detailing service has been completed! Thank you for choosing POVEDA PREMIUM AUTO CARE. Please leave us a review.',
      type: 'success',
      time: '3 days ago',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
      icon: 'success'
    },
    {
      id: 6,
      title: 'Welcome to POVEDA',
      message: 'Welcome to POVEDA PREMIUM AUTO CARE! Your account has been created successfully. Explore our services and book your first appointment.',
      type: 'info',
      time: '1 week ago',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      read: true,
      icon: 'info'
    }
  ]);

  const handleMenuOpen = (event, notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    handleMenuClose();
  };

  const markAsUnread = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: false }
          : notification
      )
    );
    handleMenuClose();
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
    handleMenuClose();
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
