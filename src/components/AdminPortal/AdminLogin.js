import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Stack
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Google,
  AdminPanelSettings
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signin, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await signin(formData.email, formData.password);
      
      // Verify user is an admin
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData || userData.role !== 'admin') {
        setError('Access denied. This portal is for administrators only.');
        setLoading(false);
        return;
      }

      // Admin verified, redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      
      // Check if user exists and has admin role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        // New Google user on admin portal - automatically create with admin role
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          role: 'admin',
          createdAt: new Date()
        });
        navigate('/admin/dashboard');
      } else if (userData.role !== 'admin') {
        setError('Access denied. This portal is for administrators only.');
        setLoading(false);
        return;
      } else {
        // Existing admin user
        navigate('/admin/dashboard');
      }
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
    setLoading(false);
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Admin account not found. Please check your credentials.';
      case 'auth/wrong-password':
        return 'Invalid password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'Login failed. Please check your credentials and try again.';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>
        {`
          @keyframes pulseGlow {
            0% { opacity: 0.6; transform: scale(1); }
            100% { opacity: 1; transform: scale(1.05); }
          }
        `}
      </style>

      {/* Frosted glass background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #ffffff 100%)'
        }}
      />
      
      {/* Frosted glass overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(8px)'
        }}
      />

      {/* Floating glass orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: '2rem', sm: '5rem' },
          left: { xs: '1rem', sm: '5rem' },
          width: { xs: '4rem', sm: '8rem' },
          height: { xs: '4rem', sm: '8rem' },
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'pulseGlow 2s ease-in-out infinite alternate',
          zIndex: 1
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: { xs: '6rem', sm: '10rem' },
          right: { xs: '1rem', sm: '8rem' },
          width: { xs: '3rem', sm: '6rem' },
          height: { xs: '3rem', sm: '6rem' },
          background: 'rgba(8, 145, 178, 0.3)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          animation: 'pulseGlow 2s ease-in-out infinite alternate 1000ms',
          zIndex: 1
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '8rem',
          left: '33%',
          width: '10rem',
          height: '10rem',
          background: 'rgba(59, 130, 246, 0.25)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulseGlow 2s ease-in-out infinite alternate 500ms',
          zIndex: 1
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '5rem',
          right: '5rem',
          width: '7rem',
          height: '7rem',
          background: 'rgba(255, 255, 255, 0.25)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'pulseGlow 2s ease-in-out infinite alternate 700ms',
          zIndex: 1
        }}
      />

      {/* Subtle grid pattern */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(8,145,178,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px',
          zIndex: 1
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 10, py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, sm: 6 },
            borderRadius: { xs: 2, sm: 3 },
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            overflow: 'hidden',
            maxWidth: { xs: '100%', sm: '28rem' },
            margin: '0 auto',
            mt: { xs: 2, sm: 0 }
          }}
        >
          {/* Logo Section */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 5 } }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: '80px', sm: '112px' },
                height: { xs: '80px', sm: '112px' },
                borderRadius: '50%',
                background: 'rgba(8, 145, 178, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(8, 145, 178, 0.2)',
                mb: { xs: 2, sm: 3 },
                mx: 'auto',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              <img 
                src="/POVEDA PREMIUM AUTO CARE - LOGO.svg" 
                alt="POVEDA AUTO CARE" 
                style={{ 
                  height: '60%', 
                  width: 'auto',
                  filter: 'drop-shadow(0 2px 8px rgba(8, 145, 178, 0.3))'
                }} 
              />
            </Box>
            
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem' },
                background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.9) 0%, rgba(6, 182, 212, 0.8) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: { xs: 1, sm: 2 },
                letterSpacing: '-0.02em'
              }}
            >
              Admin Portal
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(8, 145, 178, 0.7)',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 500,
                letterSpacing: '0.025em'
              }}
            >
              Sign in to your admin account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={{ xs: 3, sm: 4 }}>
              <TextField
                fullWidth
                placeholder="Enter your email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: { xs: '3rem', sm: '3.5rem' },
                    paddingLeft: { xs: '2.5rem', sm: '3rem' },
                    borderRadius: { xs: 2, sm: 3 },
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    '& fieldset': {
                      border: 'none'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(8, 145, 178, 0.5)',
                      boxShadow: '0 0 0 2px rgba(8, 145, 178, 0.2)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(8, 145, 178, 0.5)',
                      boxShadow: '0 0 0 2px rgba(8, 145, 178, 0.2)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: '#4b5563',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    '&::placeholder': {
                      color: 'rgba(75, 85, 99, 0.5)',
                      opacity: 1
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ position: 'absolute', left: '1rem' }}>
                      <Email sx={{ color: 'rgba(75, 85, 99, 0.6)', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                placeholder="Enter your password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: { xs: '3rem', sm: '3.5rem' },
                    paddingLeft: { xs: '2.5rem', sm: '3rem' },
                    paddingRight: { xs: '2.5rem', sm: '3rem' },
                    borderRadius: { xs: 2, sm: 3 },
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    '& fieldset': {
                      border: 'none'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(8, 145, 178, 0.5)',
                      boxShadow: '0 0 0 2px rgba(8, 145, 178, 0.2)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(8, 145, 178, 0.5)',
                      boxShadow: '0 0 0 2px rgba(8, 145, 178, 0.2)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: '#4b5563',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    '&::placeholder': {
                      color: 'rgba(75, 85, 99, 0.5)',
                      opacity: 1
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ position: 'absolute', left: '1rem' }}>
                      <Lock sx={{ color: 'rgba(75, 85, 99, 0.6)', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end" sx={{ position: 'absolute', right: '1rem' }}>
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ 
                          color: 'rgba(75, 85, 99, 0.6)',
                          padding: '4px',
                          '&:hover': {
                            backgroundColor: 'rgba(8, 145, 178, 0.1)'
                          }
                        }}
                      >
                        {showPassword ? <VisibilityOff sx={{ fontSize: '1.25rem' }} /> : <Visibility sx={{ fontSize: '1.25rem' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  height: { xs: '3rem', sm: '3.5rem' },
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  borderRadius: { xs: 2, sm: 3 },
                  background: '#0891b2',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px rgba(8, 145, 178, 0.3)',
                  transition: 'all 0.3s ease',
                  mt: 3,
                  '&:hover': {
                    background: 'rgba(8, 145, 178, 0.9)',
                    boxShadow: '0 15px 35px rgba(8, 145, 178, 0.4)',
                    transform: 'translateY(-2px) scale(1.02)'
                  },
                  '&:active': {
                    transform: 'translateY(0) scale(0.98)'
                  },
                  '&:disabled': {
                    background: 'rgba(156, 163, 175, 0.5)',
                    boxShadow: 'none',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Stack>
          </form>

          {/* Divider */}
          <Box sx={{ position: 'relative', py: 4 }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Box sx={{ width: '100%', borderTop: '1px solid rgba(8, 145, 178, 0.2)' }} />
            </Box>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Typography
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'rgba(8, 145, 178, 0.7)'
                }}
              >
                OR CONTINUE WITH
              </Typography>
            </Box>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleGoogleSignIn}
            disabled={loading}
            startIcon={<Google sx={{ fontSize: '1.25rem' }} />}
            sx={{
              height: { xs: '3rem', sm: '3.5rem' },
              fontWeight: 600,
              textTransform: 'none',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              borderRadius: { xs: 2, sm: 3 },
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(75, 85, 99, 0.8)',
              transition: 'all 0.3s ease',
              '&:hover': {
                border: '1px solid rgba(8, 145, 178, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 0 0 2px rgba(8, 145, 178, 0.2)',
                transform: 'translateY(-2px) scale(1.02)'
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)'
              }
            }}
          >
            Continue with Google
          </Button>

          {/* Bottom Links */}
          <Box sx={{ textAlign: 'center', pt: 4 }}>
            <Typography variant="body2" sx={{ 
              color: 'rgba(8, 145, 178, 0.7)',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 500,
              mb: 2
            }}>
              Need admin account?{' '}
              <Button
                component={RouterLink}
                to="/admin/register"
                variant="text"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#0891b2',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'rgba(8, 145, 178, 0.8)',
                    textDecoration: 'underline'
                  }
                }}
              >
                Register Here
              </Button>
            </Typography>
            
            <Typography variant="caption" sx={{ 
              color: 'rgba(8, 145, 178, 0.6)',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}>
              Customer portal:{' '}
              <Button
                component={RouterLink}
                to="/login"
                variant="text"
                size="small"
                sx={{ 
                  textTransform: 'none',
                  color: 'rgba(8, 145, 178, 0.7)',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#0891b2',
                    textDecoration: 'underline'
                  }
                }}
              >
                Customer Login
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLogin;
