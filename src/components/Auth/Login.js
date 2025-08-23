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
  Stack
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Google
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
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        {/* Logo and Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img 
            src="/logo.svg" 
            alt="POVEDA PREMIUM AUTO CARE" 
            style={{ height: 150, marginBottom: 24 }} 
          />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your POVEDA account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
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
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 100%)'
                }
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
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
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1.1rem',
            borderColor: '#db4437',
            color: '#db4437',
            '&:hover': {
              borderColor: '#db4437',
              backgroundColor: 'rgba(219, 68, 55, 0.04)'
            }
          }}
        >
          Continue with Google
        </Button>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/register"
              sx={{ fontWeight: 600, textDecoration: 'none' }}
            >
              Sign up here
            </Link>
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link
            href="#"
            sx={{ 
              fontSize: '0.875rem',
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': { color: 'primary.main' }
            }}
          >
            Forgot your password?
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
