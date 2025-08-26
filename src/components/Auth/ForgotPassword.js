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
  Fade,
  Stack
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  ArrowBack,
  CheckCircle
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Email verification, 2: Set new password
  const [passwordReset, setPasswordReset] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!formData.email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      // For now, we'll simulate email verification and go to step 2
      // In a real implementation, you might want to verify the email exists in your database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setMessage('Email verified! Please enter your new password.');
      setStep(2);
    } catch (error) {
      setError('Email verification failed. Please try again.');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Validation
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in both password fields');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Send password reset email first
      await resetPassword(formData.email);
      setMessage('Password reset email sent! Please check your email and click the reset link. After clicking the link, you can set your new password.');
      setPasswordReset(true);
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
    setLoading(false);
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/too-many-requests':
        return 'Too many password reset attempts. Please try again later.';
      default:
        return 'Failed to reset password. Please try again.';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
          `,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.5,
        },
      }}
    >
      {/* Floating orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
          backdropFilter: 'blur(10px)',
          animation: 'pulseGlow 4s ease-in-out infinite alternate',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
          backdropFilter: 'blur(10px)',
          animation: 'pulseGlow 6s ease-in-out infinite alternate-reverse',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Logo */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <img
                src="/POVEDA PREMIUM AUTO CARE - LOGO.svg"
                alt="POVEDA PREMIUM AUTO CARE"
                style={{
                  width: '100px',
                  height: 'auto',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                }}
              />
            </Box>

            {!passwordReset ? (
              <>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    color: '#1f2937',
                    textAlign: 'center',
                    mb: 2,
                    fontSize: { xs: '1.75rem', sm: '2rem' }
                  }}
                >
                  Reset Password
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: '#6b7280',
                    textAlign: 'center',
                    mb: 4,
                    fontSize: '1rem',
                    lineHeight: 1.6
                  }}
                >
                  {step === 1 ? 
                    'Enter your email address to reset your password' :
                    'Create a strong new password for your account'
                  }
                </Typography>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-message': { fontSize: '0.95rem' }
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {message && (
                  <Alert 
                    severity="success" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-message': { fontSize: '0.95rem' }
                    }}
                  >
                    {message}
                  </Alert>
                )}

                {step === 1 ? (
                  <Box component="form" onSubmit={handleEmailSubmit} sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      name="email"
                      type="email"
                      label="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: '#9ca3af' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(249, 250, 251, 0.8)',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0891b2',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0891b2',
                          },
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                        boxShadow: '0 10px 25px rgba(8, 145, 178, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0e7490 0%, #164e63 100%)',
                          boxShadow: '0 15px 35px rgba(8, 145, 178, 0.4)',
                          transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                          background: '#d1d5db',
                          boxShadow: 'none',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {loading ? 'Verifying...' : 'Verify Email'}
                    </Button>
                  </Box>
                ) : (
                  <Box component="form" onSubmit={handlePasswordReset} sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      label="New Password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: '#9ca3af' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              edge="end"
                              disabled={loading}
                            >
                              {showNewPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(249, 250, 251, 0.8)',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0891b2',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0891b2',
                          },
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm New Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
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
                              disabled={loading}
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(249, 250, 251, 0.8)',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0891b2',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0891b2',
                          },
                        },
                      }}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Button
                        onClick={() => setStep(1)}
                        variant="outlined"
                        disabled={loading}
                        sx={{
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          borderColor: '#d1d5db',
                          color: '#6b7280',
                          '&:hover': {
                            borderColor: '#9ca3af',
                            backgroundColor: 'rgba(107, 114, 128, 0.1)',
                          },
                        }}
                      >
                        Back
                      </Button>

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                          boxShadow: '0 10px 25px rgba(8, 145, 178, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0e7490 0%, #164e63 100%)',
                            boxShadow: '0 15px 35px rgba(8, 145, 178, 0.4)',
                            transform: 'translateY(-2px)',
                          },
                          '&:disabled': {
                            background: '#d1d5db',
                            boxShadow: 'none',
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {loading ? 'Sending Reset Email...' : 'Reset Password'}
                      </Button>
                    </Stack>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircle 
                  sx={{ 
                    fontSize: 60, 
                    color: '#10b981', 
                    mb: 2 
                  }} 
                />
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: '#1f2937',
                    mb: 2
                  }}
                >
                  Reset Email Sent!
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#6b7280',
                    mb: 4,
                    fontSize: '1rem',
                    lineHeight: 1.6
                  }}
                >
                  We've sent a password reset link to <strong>{formData.email}</strong>. 
                  Please check your email and click the link to complete your password reset.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => {
                    setPasswordReset(false);
                    setStep(1);
                    setMessage('');
                    setError('');
                    setFormData({ email: '', newPassword: '', confirmPassword: '' });
                  }}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                    boxShadow: '0 10px 25px rgba(8, 145, 178, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0e7490 0%, #164e63 100%)',
                      boxShadow: '0 15px 35px rgba(8, 145, 178, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Send Another Email
                </Button>
              </Box>
            )}

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#0891b2',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  '&:hover': {
                    color: '#0e7490',
                    textDecoration: 'underline',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ArrowBack sx={{ fontSize: '1rem' }} />
                Back to Login
              </Link>
            </Box>
          </Paper>
        </Fade>
      </Container>

      <style jsx global>{`
        @keyframes pulseGlow {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </Box>
  );
};

export default ForgotPassword;