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
        background: 'linear-gradient(135deg, #4285f4 0%, #1976d2 50%, #0d47a1 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4
      }}
    >
      {/* Floating geometric shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          right: '10%',
          width: '120px',
          height: '120px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 7s ease-in-out infinite',
          zIndex: 1
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          left: '8%',
          width: '90px',
          height: '90px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '40%',
          animation: 'float 9s ease-in-out infinite reverse',
          zIndex: 1
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '20%',
          width: '70px',
          height: '70px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '30%',
          animation: 'float 6s ease-in-out infinite',
          zIndex: 1
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Fade in={true} timeout={800}>
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              overflow: 'hidden'
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
                    src="/logo.svg" 
                    alt="POVEDA PREMIUM AUTO CARE" 
                    style={{ 
                      height: 120, 
                      width: 'auto',
                      filter: 'drop-shadow(0 10px 30px rgba(66, 133, 244, 0.3))'
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
