import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Badge,
  useTheme,
  useMediaQuery,
  Paper,
  ListItemAvatar,
  Button
} from '@mui/material';
import {
  Dashboard,
  CalendarToday,
  People,
  Assignment,
  SupportAgent,
  RequestQuote,
  AccountCircle,
  Menu as MenuIcon,
  Logout,
  Settings,
  NotificationsNone,
  ChevronLeft,
  BusinessCenter,
  Schedule,
  Analytics,
  PersonAdd,
  Email
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import UserManual from '../UserManual';

const drawerWidth = 280;

const AdminLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  
  // Usar el contexto de notificaciones
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Navigation menu items
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/admin/dashboard',
      description: 'Overview & Analytics'
    },
    {
      text: 'Calendar',
      icon: <CalendarToday />,
      path: '/admin/slots',
      description: 'Appointment Slots'
    },
    {
      text: 'Appointments',
      icon: <Assignment />,
      path: '/admin/appointments',
      description: 'Booking Management',
     
    },
    {
      text: 'Customers',
      icon: <People />,
      path: '/admin/users',
      description: 'User Management'
    },
    {
      text: 'Support Tickets',
      icon: <SupportAgent />,
      path: '/admin/tickets',
      description: 'Customer Support',
     
    },
    {
      text: 'Estimates',
      icon: <RequestQuote />,
      path: '/admin/estimates',
      description: 'Quote Requests'
    },
    {
      text: 'Analytics',
      icon: <Analytics />,
      path: '/admin/analytics',
      description: 'Website Analytics'
    },
    {
      text: 'Email Templates',
      icon: <Email />,
      path: '/admin/templates',
      description: 'Manage Email Templates'
    },
    {
      text: 'Profile',
      icon: <AccountCircle />,
      path: '/admin/profile',
      description: 'Account Settings'
    }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleProfileMenuClose();
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClick = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.text : 'Admin Panel';
  };

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'rgba(255, 255, 255, 0.8)', 
      backdropFilter: 'blur(8px)',
      overflow: 'auto' // Changed from 'hidden' to 'auto' to enable scrolling
    }}>
      {/* Logo Section */}
      <Box sx={{ p: 5, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src="/POVEDA PREMIUM AUTO CARE - LOGO.svg" 
          alt="POVEDA AUTO CARE" 
          style={{ 
            height: '120px', 
            width: 'auto',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }} 
        />
      </Box>

      {/* Admin Info Section */}
      <Paper 
        sx={{ 
          m: 2, 
          p: 2, 
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 2,
              background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
            }}
          >
            {currentUser?.displayName?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4b5563' }}>
              {currentUser?.displayName || 'Admin User'}
            </Typography>
            <Chip 
              label="Administrator" 
              size="small" 
              sx={{ 
                backgroundColor: 'rgba(8, 145, 178, 0.1)',
                color: '#0891b2',
                fontSize: '0.7rem',
                fontWeight: 600,
                height: 20
              }} 
            />
          </Box>
        </Box>
      </Paper>

      {/* Navigation Menu */}
      <List sx={{ 
        flex: 1, 
        px: 2, 
        overflowY: 'auto', // Enable vertical scrolling for the menu items
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        maxHeight: { xs: '60vh', sm: '60vh', md: '65vh' }, // Set a maximum height based on viewport height
      }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: 3,
                mx: 1,
                background: isActiveRoute(item.path) ? '#0891b2' : 'transparent',
                color: isActiveRoute(item.path) ? 'white' : '#6b7280',
                '&:hover': {
                  backgroundColor: isActiveRoute(item.path) ? '#0891b2' : 'rgba(107, 114, 128, 0.1)',
                  transform: 'translateX(4px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: isActiveRoute(item.path) ? 'white' : '#6b7280',
                  minWidth: 40
                }}
              >
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{ 
                  '& .MuiTypography-root': { 
                    fontWeight: isActiveRoute(item.path) ? 600 : 500,
                    fontSize: '0.875rem'
                  } 
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          © 2024 POVEDA Premium Auto Care
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Admin Panel v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #ddd6fe 100%)'
    }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.8)', 
         
         
          borderRadius: 0,
         
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 1, minHeight: { xs: '64px', sm: '70px' } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { lg: 'none' },
              color: '#555',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                transform: 'scale(1.05)',
                transition: 'all 0.2s'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}></Box>
          
          <IconButton
            color="inherit"
            onClick={handleNotificationsClick}
            sx={{ 
              mr: { xs: 1, sm: 2 },
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              p: { xs: 0.8, sm: 1 },
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              color: '#555',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                transform: 'scale(1.05)',
                transition: 'all 0.2s'
              }
            }}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{ 
                '& .MuiBadge-badge': { 
                  fontSize: '0.6rem',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px'
                } 
              }}
            >
              <NotificationsNone sx={{ fontSize: '1.4rem', color: '#555' }} />
            </Badge>
          </IconButton>
          
          <IconButton 
            onClick={handleProfileMenuOpen}
            sx={{ 
              p: 0.2,
              ml: { xs: 1, sm: 1.5 },
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 3px 12px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Avatar 
              sx={{ 
                width: { xs: 34, sm: 38 }, 
                height: { xs: 34, sm: 38 },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {currentUser?.displayName?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
              }
            }}
          >
            <MenuItem onClick={() => { handleNavigate('/admin/profile'); handleProfileMenuClose(); }}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Profile Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

          {/* Notifications Menu - Empty but structure preserved */}
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleNotificationsClose}
            sx={{
              '& .MuiPaper-root': {
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(231, 235, 240, 0.9)',
                boxShadow: '0 15px 40px -12px rgba(0, 0, 0, 0.18)',
                mt: 1.5,
                minWidth: { xs: 280, sm: 340 },
                maxHeight: 450,
                overflow: 'hidden'
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box 
              sx={{ 
                p: 2.5, 
                borderBottom: '1px solid rgba(231, 235, 240, 0.9)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#111827',
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }}
              >
                Notificaciones
              </Typography>
              <Chip 
                label={`${unreadCount} nueva${unreadCount !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  background: unreadCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(243, 244, 246, 0.8)',
                  color: unreadCount > 0 ? '#ef4444' : '#6b7280',
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  height: 24
                }}
              />
            </Box>
            
            <Box 
              sx={{ 
                overflowY: 'auto',
                maxHeight: 320,
                minHeight: 100
              }}
            >
              {notifications && notifications.length > 0 ? (
                <List sx={{ py: 0 }}>
                  {notifications.map(notification => (
                    <ListItem 
                      key={notification.id} 
                      sx={{
                        backgroundColor: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                        borderBottom: '1px solid rgba(231, 235, 240, 0.6)',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: 
                              notification.type === 'appointment' ? 'rgba(79, 70, 229, 0.1)' :
                              notification.type === 'ticket' ? 'rgba(239, 68, 68, 0.1)' : 
                              'rgba(16, 185, 129, 0.1)',
                            color: 
                              notification.type === 'appointment' ? '#4f46e5' :
                              notification.type === 'ticket' ? '#ef4444' : 
                              '#10b981'
                          }}
                        >
                          {notification.type === 'appointment' ? <Schedule /> : 
                           notification.type === 'ticket' ? <SupportAgent /> : 
                           <RequestQuote />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: notification.read ? 500 : 700,
                              color: notification.read ? '#4b5563' : '#111827',
                              fontSize: '0.875rem'
                            }}
                          >
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                            {notification.content}
                            <Box component="span" sx={{ display: 'block', mt: 0.5, color: '#9ca3af', fontSize: '0.7rem' }}>
                              {new Date(notification.createdAt).toLocaleString()}
                            </Box>
                          </Typography>
                        }
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                          
                          // Navegar a la página correspondiente según el tipo de notificación
                          if (notification.type === 'appointment') {
                            navigate('/admin/appointments');
                          } else if (notification.type === 'ticket') {
                            navigate('/admin/tickets');
                          } else if (notification.type === 'estimate') {
                            navigate('/admin/estimates');
                          }
                          
                          handleNotificationsClose();
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 100
                  }}
                >
                  <NotificationsNone 
                    sx={{ 
                      fontSize: '3rem', 
                      color: '#d1d5db', 
                      mb: 2 
                    }} 
                  />
                  <Typography variant="body1" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    No hay notificaciones nuevas
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
                    Las actualizaciones aparecerán aquí
                  </Typography>
                </Box>
              )}
            </Box>
            
            {notifications && notifications.length > 0 && (
              <Box sx={{ p: 2, borderTop: '1px solid rgba(231, 235, 240, 0.9)' }}>
                <Button 
                  fullWidth 
                  variant="text" 
                  size="small"
                  onClick={() => {
                    markAllAsRead();
                  }}
                  sx={{ 
                    textTransform: 'none',
                    color: '#3b82f6',
                    '&:hover': {
                      backgroundColor: 'rgba(59, 130, 246, 0.05)'
                    }
                  }}
                >
                  Marcar todas como leídas
                </Button>
              </Box>
            )}
          </Menu>

        </Toolbar>
      </AppBar>

      {/* Side Navigation */}
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              background: 'transparent',
              height: '100%',
              overflowY: 'visible' // Ensure the drawer content can be scrolled
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              background: 'transparent',
              height: '100%',
              overflowY: 'visible', // Ensure the drawer content can be scrolled
              '&::-webkit-scrollbar': {
                display: 'none' // Hide default scrollbar for cleaner look
              }
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Botón flotante de Manual de Usuario */}
      <UserManual />
    </Box>
  );
};

export default AdminLayout;
