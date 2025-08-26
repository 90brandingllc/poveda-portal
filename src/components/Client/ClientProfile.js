import React, { useState } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Avatar,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import ClientLayout from '../Layout/ClientLayout';

const ClientProfile = () => {
  const { currentUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phoneNumber || '',
    address: ''
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would typically update the user profile in Firebase
      // For now, we'll just simulate a save
      setTimeout(() => {
        setEditMode(false);
        setSuccess(true);
        setLoading(false);
        setTimeout(() => setSuccess(false), 3000);
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phoneNumber || '',
      address: ''
    });
  };

  return (
    <ClientLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#4b5563', mb: 2 }}>
          My Profile
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Manage your account information and preferences
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          Profile updated successfully!
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(8px)', 
            border: 0, 
            boxShadow: 3,
            textAlign: 'center',
            p: 3
          }}>
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                mx: 'auto', 
                mb: 3,
                background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                fontSize: '3rem'
              }}
            >
              {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {currentUser?.displayName || 'User'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
              Premium Customer
            </Typography>
            
            <Box sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ color: '#0891b2', mr: 2 }} />
                <Typography variant="body2">{currentUser?.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ color: '#0891b2', mr: 2 }} />
                <Typography variant="body2">Member since 2024</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(8px)', 
            border: 0, 
            boxShadow: 3 
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Personal Information
                </Typography>
                {!editMode ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    sx={{ color: '#0891b2' }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Save />}
                      onClick={handleSave}
                      disabled={loading}
                      variant="contained"
                      sx={{ 
                        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)'
                        }
                      }}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      variant="outlined"
                      sx={{ color: '#6b7280', borderColor: '#d1d5db' }}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: editMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(8px)'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={true} // Email should not be editable
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(8px)'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: editMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(8px)'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: editMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(8px)'
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Account Statistics
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', background: 'rgba(14, 145, 178, 0.1)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0891b2' }}>
                      12
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Total Services
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', background: 'rgba(34, 197, 94, 0.1)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e' }}>
                      3
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      This Month
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', background: 'rgba(249, 115, 22, 0.1)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#f97316' }}>
                      2
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Pending
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', background: 'rgba(168, 85, 247, 0.1)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#a855f7' }}>
                      4.9
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Rating
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ClientLayout>
  );
};

export default ClientProfile;
