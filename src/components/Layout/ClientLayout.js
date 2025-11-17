import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Typography
} from '@mui/material';
import {
  Dashboard,
  CalendarToday,
  Assignment,
  Phone,
  Calculate,
  Description,
  Notifications,
  Menu,
  Logout,
  DirectionsCar
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext'; // COMMENTED: No longer needed
// import { collection, query, where, onSnapshot } from 'firebase/firestore'; // COMMENTED: No longer needed
// import { db } from '../../firebase/config'; // COMMENTED: No longer needed
import UserManual from '../UserManual';

const ClientLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  // const [unreadCount, setUnreadCount] = useState(0); // COMMENTED: No longer needed
  const location = useLocation();
  const navigate = useNavigate();
  // const { logout, currentUser } = useAuth(); // COMMENTED: No longer needed

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // COMMENTED: Logout and notification features removed
  /*
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  // Fetch unread notification count
  useEffect(() => {
    if (currentUser) {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid),
        where('read', '==', false)
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        setUnreadCount(snapshot.docs.length);
      }, (error) => {
        console.error('Error fetching notification count:', error);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);
  */

  // Navigation items - Only public features available
  const navigationItems = [
    // COMMENTED: Auth-dependent features
    // { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    // { text: 'My Garage', icon: <DirectionsCar />, path: '/my-garage' },
    // { text: 'Notifications', icon: <Notifications />, path: '/notifications' },
    // { text: 'My Estimates', icon: <Description />, path: '/my-estimates' },
    
    // Public features
    { text: 'Book Service', icon: <CalendarToday />, path: '/book-appointment' },
    { text: 'Our Services', icon: <Assignment />, path: '/appointments' },
    { text: 'Contact Us', icon: <Phone />, path: '/contact' },
    { text: 'Get Estimate', icon: <Calculate />, path: '/get-estimate' }
  ];

  // Sidebar component
  const drawer = (
    <Box sx={{ 
      background: 'rgba(255, 255, 255, 0.8)', 
      backdropFilter: 'blur(8px)',
      height: '100%',
      borderTopRightRadius: { xs: 0, sm: '24px' },
      borderBottomRightRadius: { xs: 0, sm: '24px' },
      overflow: 'hidden'
    }}>
      <Box sx={{ p: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      
      <List sx={{ px: 2 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              sx={{
                borderRadius: 3,
                mx: 1,
                background: location.pathname === item.path ? '#0891b2' : 'transparent',
                color: location.pathname === item.path ? 'white' : '#6b7280',
                '&:hover': {
                  backgroundColor: location.pathname === item.path ? '#0891b2' : 'rgba(107, 114, 128, 0.1)',
                  transform: 'translateX(4px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? 'white' : '#6b7280',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiTypography-root': { 
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    fontSize: '0.875rem'
                  } 
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* COMMENTED: Logout Button - No longer needed */}
        {/*
        <ListItem disablePadding sx={{ mt: 2 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 3,
              mx: 1,
              color: '#dc2626',
              '&:hover': {
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                transform: 'translateX(4px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ 
              color: '#dc2626',
              minWidth: 40
            }}>
              <Logout />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              sx={{ 
                '& .MuiTypography-root': { 
                  fontWeight: 500,
                  fontSize: '0.875rem'
                } 
              }} 
            />
          </ListItemButton>
        </ListItem>
        */}
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #ddd6fe 100%)'
    }}>
      {/* Mobile App Bar */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'block', sm: 'none' },
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          color: '#4b5563',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, color: '#4b5563' }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            POVEDA AUTO CARE
          </Typography>
          {/* COMMENTED: Notification button removed */}
          {/*
          <IconButton 
            sx={{ color: '#4b5563' }}
            onClick={handleNotificationClick}
            aria-label="notifications"
          >
            <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          */}
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: 256 }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 256 },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 256,
              border: 'none',
              background: 'transparent'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Eliminada la barra superior de desktop para evitar duplicar la campana de notificaciones */}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          ml: { sm: '256px' },
          mt: { xs: '64px', sm: '20px' } // Reducido el margen superior en desktop
        }}
      >
        {children}
      </Box>

      {/* Botón flotante de Manual de Usuario */}
      <UserManual />
    </Box>
  );
};

export default ClientLayout;
