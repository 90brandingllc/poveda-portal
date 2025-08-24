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
      navigate('/login');
      handleClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = currentUser
    ? userRole === 'admin'
      ? [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Appointments', path: '/admin/appointments' },
          { label: 'Support Tickets', path: '/admin/tickets' },
          { label: 'Estimates', path: '/admin/estimates' }
        ]
      : [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Book Service', path: '/book-appointment' },
          { label: 'My Appointments', path: '/appointments' },
          { label: 'Contact Us', path: '/contact' },
          { label: 'Get Estimate', path: '/get-estimate' },
          { label: 'My Estimates', path: '/my-estimates' }
        ]
    : [];

  return (
    <AppBar position="sticky" elevation={2} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo and Brand */}
        <Box 
          component={currentUser ? Link : 'div'} 
          to={currentUser ? "/dashboard" : undefined}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none', 
            color: 'inherit',
            cursor: currentUser ? 'pointer' : 'default'
          }}
        >
          {/* Debug info - remove this later */}
          {currentUser && (
            <Typography variant="caption" sx={{ mr: 2, color: '#666' }}>
              Role: {userRole || 'loading...'}
            </Typography>
          )}
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
                  onClick={handleMenu}
                  sx={{ 
                    color: 'text.primary',
                    fontWeight: 500,
                    minWidth: 'auto',
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                  }}
                >
                  {currentUser?.displayName || currentUser?.email || 'Account'}
                </Button>
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
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <Button
            onClick={handleMobileMenu}
            sx={{ 
              color: 'text.primary',
              fontWeight: 500,
              minWidth: 'auto'
            }}
          >
            Menu
          </Button>
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
              Logout
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
