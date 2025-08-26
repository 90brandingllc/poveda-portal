import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Stack,
  Fade,
  Slide
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
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
      await signin(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
    setLoading(false);
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'Login failed. Please try again.';
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
        <Fade in={true} timeout={800}>
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
            <Slide direction="down" in={true} timeout={1000}>
              <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 5 } }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: { xs: 2, sm: 3 }
                  }}
                >
                  <img 
                    src="/POVEDA PREMIUM AUTO CARE - LOGO.svg" 
                    alt="POVEDA PREMIUM AUTO CARE" 
                    style={{ 
                      height: window.innerWidth < 600 ? 100 : 140, 
                      width: 'auto',
                      filter: 'drop-shadow(0 10px 30px rgba(8, 145, 178, 0.3))'
                    }} 
                  />
                </Box>
              </Box>
            </Slide>

            {error && (
              <Fade in={!!error} timeout={300}>
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    '& .MuiAlert-icon': {
                      color: '#ef4444'
                    }
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={5}>
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1, 
                      fontWeight: 500, 
                      color: '#4b5563',
                      fontSize: '0.875rem'
                    }}
                  >
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    name="email"
                    type="email"
                    placeholder="Enter your email"
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
                </Box>

                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1, 
                      fontWeight: 500, 
                      color: '#4b5563',
                      fontSize: '0.875rem'
                    }}
                  >
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '3.5rem',
                        paddingLeft: '3rem',
                        paddingRight: '3rem',
                        borderRadius: 3,
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
                              '&:hover': { color: '#4b5563' }
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Remember Me and Forgot Password */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <input
                      type="checkbox"
                      id="remember"
                      style={{
                        width: '1rem',
                        height: '1rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer'
                      }}
                    />
                    <Typography 
                      component="label" 
                      htmlFor="remember"
                      sx={{ 
                        color: 'rgba(75, 85, 99, 0.7)', 
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      Remember me
                    </Typography>
                  </Box>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    sx={{
                      color: '#0891b2',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      '&:hover': {
                        color: 'rgba(8, 145, 178, 0.8)',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>

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
                <Box sx={{ width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }} />
              </Box>
              <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Typography
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(8px)',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    color: 'rgba(75, 85, 99, 0.6)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Or continue with
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              }
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                height: '3.5rem',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(8px)',
                color: '#4b5563',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              Continue with Google
            </Button>

            <Typography 
              sx={{ 
                textAlign: 'center', 
                color: 'rgba(75, 85, 99, 0.7)', 
                fontSize: '0.875rem',
                pt: 4
              }}
            >
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ 
                  color: '#0891b2',
                  fontWeight: 500,
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'rgba(8, 145, 178, 0.8)',
                    textDecoration: 'underline'
                  }
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
