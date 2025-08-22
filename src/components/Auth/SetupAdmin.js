import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Email,
  Lock,
  Person,
  Security
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const SetupAdmin = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canSetup, setCanSetup] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  // Check if there are any existing admins
  useEffect(() => {
    const checkExistingAdmins = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const hasAdmins = usersSnapshot.docs.some(doc => doc.data().role === 'admin');
        setCanSetup(!hasAdmins);
      } catch (error) {
        console.error('Error checking existing admins:', error);
        setCanSetup(true); // Allow setup if we can't check
      }
    };

    checkExistingAdmins();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!canSetup) {
      setError('Admin setup is not allowed. Admin accounts already exist.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, {
        displayName: formData.displayName,
        role: 'admin'
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
      case 'auth/weak-password':
        return 'Password is too weak.';
      default:
        return 'Setup failed. Please try again.';
    }
  };

  if (!canSetup) {
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
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Security sx={{ fontSize: 64, color: '#d32f2f', mb: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#d32f2f' }}>
              Admin Setup Not Allowed
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Admin accounts already exist in the system. Please contact an existing administrator for access.
            </Typography>
          </Box>
          
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

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
          <Security sx={{ fontSize: 64, color: '#d32f2f', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#d32f2f' }}>
            Setup First Admin
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create the first administrator account for POVEDA PREMIUM AUTO CARE
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              name="displayName"
              label="Full Name"
              value={formData.displayName}
              onChange={handleChange}
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
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
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              variant="outlined"
              helperText="Password must be at least 6 characters"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
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
                bgcolor: '#d32f2f',
                '&:hover': {
                  bgcolor: '#b71c1c'
                }
              }}
            >
              {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
            </Button>
          </Box>
        </form>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            This will create the first administrator account with full system access.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SetupAdmin;

