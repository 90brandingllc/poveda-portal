import React, { useState } from 'react';
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
  Paper
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
  PersonAdd
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
      badge: 3 // Example notification count
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
      badge: 2
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

  const handleNotificationsClick = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
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
      borderTopRightRadius: { xs: 0, sm: '24px' },
      borderBottomRightRadius: { xs: 0, sm: '24px' },
      overflow: 'hidden'
    }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src="/POVEDA PREMIUM AUTO CARE - LOGO.svg" 
          alt="POVEDA AUTO CARE" 
          style={{ 
            height: '60px', 
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
      <List sx={{ flex: 1, px: 2 }}>
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
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          color: '#333',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {getPageTitle()}
          </Typography>

          {/* Notifications */}
          <IconButton 
            onClick={handleNotificationsClick}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={5} color="error">
              <NotificationsNone />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton onClick={handleProfileMenuOpen}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
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

          {/* Notifications Menu */}
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleNotificationsClose}
            sx={{
              '& .MuiPaper-root': {
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(8, 145, 178, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                mt: 1.5,
                minWidth: 320,
                maxHeight: 400
              }
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(8, 145, 178, 0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#4b5563' }}>
                Notifications
              </Typography>
            </Box>
            
            {/* Sample notifications */}
            <MenuItem 
              onClick={handleNotificationsClose}
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(8, 145, 178, 0.05)',
                '&:hover': {
                  background: 'rgba(8, 145, 178, 0.05)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  New Appointment
                </Typography>
                <Chip 
                  size="small" 
                  label="new"
                  sx={{ 
                    background: '#dcfce7',
                    color: '#166534',
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                John Doe booked a car detailing appointment
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                5 minutes ago
              </Typography>
            </MenuItem>

            <MenuItem 
              onClick={handleNotificationsClose}
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(8, 145, 178, 0.05)',
                '&:hover': {
                  background: 'rgba(8, 145, 178, 0.05)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Payment Received
                </Typography>
                <Chip 
                  size="small" 
                  label="info"
                  sx={{ 
                    background: '#dbeafe',
                    color: '#1e40af',
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                Payment of $150 received for appointment #001
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                1 hour ago
              </Typography>
            </MenuItem>

            <MenuItem 
              onClick={handleNotificationsClose}
              sx={{
                p: 2,
                '&:hover': {
                  background: 'rgba(8, 145, 178, 0.05)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  System Update
                </Typography>
                <Chip 
                  size="small" 
                  label="system"
                  sx={{ 
                    background: '#f3e8ff',
                    color: '#7c3aed',
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                System maintenance completed successfully
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                2 hours ago
              </Typography>
            </MenuItem>
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
              background: 'transparent'
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
              background: 'transparent'
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
    </Box>
  );
};

export default AdminLayout;
