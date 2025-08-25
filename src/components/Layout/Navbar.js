import React, { useState } from 'react';
import {
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Avatar,
  Container,
  Chip
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
    <Box 
      sx={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          py: 2
        }}>
          {/* Modern Logo and Brand */}
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
            <img 
              src="/logo.svg" 
              alt="POVEDA PREMIUM AUTO CARE" 
              style={{ height: 36, marginRight: 12 }} 
            />
            {!isMobile && (
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                POVEDA PREMIUM AUTO CARE
              </Typography>
            )}
          </Box>

          {/* Modern Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!currentUser ? (
                // Public menu items
                <>
                  <Button
                    component={Link}
                    to="/login"
                    sx={{
                      color: '#64748b',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 3,
                      py: 1,
                      borderRadius: '8px',
                      textTransform: 'none',
                      '&:hover': { 
                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                        color: '#1e293b'
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    sx={{
                      background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      px: 4,
                      py: 1,
                      borderRadius: '8px',
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(30, 41, 59, 0.2)',
                      '&:hover': { 
                        background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 16px rgba(30, 41, 59, 0.3)'
                      }
                    }}
                  >
                    Get Started
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
                        color: '#64748b',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        px: 3,
                        py: 1,
                        borderRadius: '8px',
                        textTransform: 'none',
                        '&:hover': { 
                          backgroundColor: 'rgba(100, 116, 139, 0.1)',
                          color: '#1e293b'
                        }
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                  
                  {/* Role Badge */}
                  {userRole === 'admin' && (
                    <Chip 
                      label="Admin"
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: '24px',
                        ml: 1
                      }}
                    />
                  )}
                  
                  {/* Modern User Menu */}
                  <Button
                    onClick={handleMenu}
                    sx={{ 
                      minWidth: 'auto',
                      p: 0.5,
                      ml: 2,
                      borderRadius: '12px',
                      '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.1)' }
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
                    </Avatar>
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
        </Box>
      </Container>
    </Box>
  );
};

export default Navbar;
