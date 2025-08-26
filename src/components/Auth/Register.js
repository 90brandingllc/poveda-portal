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
  Person,
  Visibility,
  VisibilityOff,
  Google,
  Phone,
  ArrowForward
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signup, signInWithGoogle } = useAuth();
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Phone number validation (if provided)
    if (formData.phoneNumber) {
      const cleanPhone = formData.phoneNumber.replace(/\s|-|\(|\)|\.|\+/g, '');
      if (cleanPhone && !/^\d{10,15}$/.test(cleanPhone)) {
        setError('Please enter a valid phone number (10-15 digits)');
        return;
      }
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        role: 'client' // All regular registrations are clients
      });
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
      await signInWithGoogle({
        phoneNumber: formData.phoneNumber // Include phone number if provided
      });
      navigate('/dashboard');
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
    setLoading(false);
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      case 'auth/weak-password':
        return 'Password is too weak.';
      default:
        return 'Registration failed. Please try again.';
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
            {/* Subtle inner glow effect */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #4285f4, #1976d2, #4285f4)',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 3s ease infinite'
              }}
            />

            {/* Logo Section */}
            <Slide direction="down" in={true} timeout={1000}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
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
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#1a1a1a',
                    mb: 1,
                    background: 'linear-gradient(135deg, #4285f4 0%, #1976d2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Create Account
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#6b7280',
                    fontWeight: 400
                  }}
                >
                  Join us to book your car detailing services
                </Typography>
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
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  name="displayName"
                  label="Full Name"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4'
                        }
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4',
                          borderWidth: '2px'
                        }
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#4285f4'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4'
                        }
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4',
                          borderWidth: '2px'
                        }
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#4285f4'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="phoneNumber"
                  label="Phone Number"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="e.g. +1 (555) 123-4567"
                  helperText="Optional - for appointment reminders and updates"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4'
                        }
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4',
                          borderWidth: '2px'
                        }
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#4285f4'
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#9ca3af',
                      fontSize: '0.75rem'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  helperText="Password must be at least 6 characters"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4'
                        }
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4',
                          borderWidth: '2px'
                        }
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#4285f4'
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#9ca3af',
                      fontSize: '0.75rem'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#9ca3af' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4'
                        }
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(248, 250, 252, 1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#4285f4',
                          borderWidth: '2px'
                        }
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#4285f4'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: '#9ca3af' }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                  endIcon={!loading && <ArrowForward />}
                  sx={{
                    py: 1.8,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #4285f4 0%, #1976d2 100%)',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      boxShadow: '0 15px 35px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 4 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#9ca3af',
                  fontWeight: 500,
                  px: 2
                }}
              >
                OR
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Google />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{
                py: 1.8,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1.1rem',
                borderRadius: 2,
                borderColor: 'rgba(219, 68, 55, 0.3)',
                color: '#db4437',
                backgroundColor: 'rgba(219, 68, 55, 0.02)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#db4437',
                  backgroundColor: 'rgba(219, 68, 55, 0.08)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 25px rgba(219, 68, 55, 0.2)'
                }
              }}
            >
              Continue with Google
            </Button>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{ 
                    fontWeight: 600, 
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #4285f4 0%, #1976d2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign in here
                </Link>
              </Typography>

              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#9ca3af',
                  maxWidth: 400, 
                  display: 'block',
                  fontSize: '0.75rem',
                  lineHeight: 1.5
                }}
              >
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Register;
