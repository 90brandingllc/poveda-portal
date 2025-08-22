import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  DirectionsCar,
  Dashboard,
  ExitToApp
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      handleClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = currentUser
    ? userRole === 'admin'
      ? [
          { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
          { label: 'Appointments', path: '/admin/appointments', icon: <DirectionsCar /> },
          { label: 'Support Tickets', path: '/admin/tickets', icon: <AccountCircle /> },
          { label: 'Estimates', path: '/admin/estimates', icon: <AccountCircle /> }
        ]
      : [
          { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
          { label: 'Book Service', path: '/book-appointment', icon: <DirectionsCar /> },
          { label: 'My Appointments', path: '/appointments', icon: <AccountCircle /> },
          { label: 'Contact Us', path: '/contact', icon: <AccountCircle /> },
          { label: 'Get Estimate', path: '/estimate', icon: <AccountCircle /> },
          { label: 'Coupons', path: '/coupons', icon: <AccountCircle /> }
        ]
    : [
        { label: 'Home', path: '/' },
        { label: 'Services', path: '/services' },
        { label: 'About', path: '/about' }
      ];

  return (
    <AppBar position="sticky" elevation={2} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo and Brand */}
        <Box 
          component={Link} 
          to="/" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none', 
            color: 'inherit' 
          }}
        >
          <img 
            src="/logo.svg" 
            alt="POVEDA PREMIUM AUTO CARE" 
            style={{ height: 40, marginRight: 12 }} 
          />
          {!isMobile && (
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: '#1976d2',
                fontSize: '1.1rem'
              }}
            >
              POVEDA PREMIUM AUTO CARE
            </Typography>
          )}
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!currentUser ? (
              // Public menu items
              <>
                {menuItems.map((item) => (
                  <Button
                    key={item.label}
                    component={Link}
                    to={item.path}
                    sx={{ 
                      color: 'text.primary',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  sx={{ ml: 1 }}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{ ml: 1 }}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              // Authenticated menu items
              <>
                {menuItems.map((item) => (
                  <Button
                    key={item.label}
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{ 
                      color: 'text.primary',
                      fontWeight: 500,
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleClose}>
                    <AccountCircle sx={{ mr: 1 }} />
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ExitToApp sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenu}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Mobile Menu */}
        <Menu
          id="mobile-menu"
          anchorEl={mobileMenuAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleClose}
        >
          {menuItems.map((item) => (
            <MenuItem
              key={item.label}
              component={Link}
              to={item.path}
              onClick={handleClose}
            >
              {item.icon && <Box sx={{ mr: 1 }}>{item.icon}</Box>}
              {item.label}
            </MenuItem>
          ))}
          {!currentUser ? (
            <>
              <MenuItem component={Link} to="/login" onClick={handleClose}>
                Login
              </MenuItem>
              <MenuItem component={Link} to="/register" onClick={handleClose}>
                Sign Up
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
