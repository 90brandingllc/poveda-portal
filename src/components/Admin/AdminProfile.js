import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Security,
  Notifications,
  BusinessCenter,
  Email,
  Phone,
  LocationOn,
  Schedule,
  Palette,
  CalendarToday,
  Google,
  CheckCircle,
  Settings,
  Upload,
  Camera,
  Analytics
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AdminProfile = () => {
  const { currentUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    businessName: '',
    businessAddress: '',
    businessHours: '',
    bio: '',
    avatar: null
  });
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    autoSync: true,
    calendarIntegration: false,
    theme: 'light',
    language: 'en'
  });

  const [calendarSync, setCalendarSync] = useState({
    isConnected: false,
    calendarEmail: '',
    syncColor: '#4285f4',
    isLoading: false,
    error: null,
    autoSync: true
  });

  const [analyticsSettings, setAnalyticsSettings] = useState({
    trackingCode: '',
    isConnected: false,
    isLoading: false
  });

  // Google Calendar OAuth Config
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email';

  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    loadProfileData();
  }, [currentUser]);

  const loadProfileData = async () => {
    if (!currentUser?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileData({
          displayName: userData.displayName || currentUser.displayName || '',
          email: userData.email || currentUser.email || '',
          phoneNumber: userData.phoneNumber || '',
          businessName: userData.businessName || 'POVEDA Premium Auto Care',
          businessAddress: userData.businessAddress || '',
          businessHours: userData.businessHours || '9:00 AM - 5:00 PM',
          bio: userData.bio || '',
          avatar: userData.avatar || null
        });

        setPreferences({
          emailNotifications: userData.preferences?.emailNotifications ?? true,
          smsNotifications: userData.preferences?.smsNotifications ?? false,
          autoSync: userData.preferences?.autoSync ?? true,
          calendarIntegration: userData.preferences?.calendarIntegration ?? false,
          theme: userData.preferences?.theme || 'light',
          language: userData.preferences?.language || 'en'
        });

        setCalendarSync({
          isConnected: userData.adminCalendarSync?.isConnected || false,
          calendarEmail: userData.adminCalendarSync?.calendarEmail || '',
          syncColor: userData.adminCalendarSync?.syncColor || '#4285f4'
        });

        setAnalyticsSettings({
          trackingCode: userData.analyticsSettings?.trackingCode || '',
          isConnected: userData.analyticsSettings?.isConnected || false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showAlert('Failed to load profile data', 'error');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...profileData,
        preferences,
        updatedAt: new Date()
      });

      setEditMode(false);
      showAlert('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showAlert('Failed to update profile', 'error');
    }
    setLoading(false);
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        preferences: newPreferences
      });
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  // Google Calendar OAuth Functions
  const initializeGoogleAPI = () => {
    return new Promise((resolve, reject) => {
      console.log('🔧 Initializing Google API...');
      console.log('Client ID:', GOOGLE_CLIENT_ID);
      
      if (!GOOGLE_CLIENT_ID) {
        reject(new Error('Google Client ID not found in environment variables'));
        return;
      }

      // Check if Google Identity Services is available
      if (window.google && window.google.accounts) {
        console.log('✅ Google Identity Services already loaded');
        resolve();
        return;
      }

      // Load Google Identity Services
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        console.log('✅ Google Identity Services loaded');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  };

  const handleCalendarConnect = async () => {
    console.log('🚀 Starting calendar connection...');
    setCalendarSync(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await initializeGoogleAPI();

      // Create a promise to handle the OAuth callback
      const oauth2Response = await new Promise((resolve, reject) => {
        console.log('🔐 Initiating OAuth flow...');
        
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_SCOPES,
          callback: (tokenResponse) => {
            console.log('✅ OAuth success:', tokenResponse);
            resolve(tokenResponse);
          },
          error_callback: (error) => {
            console.error('❌ OAuth error:', error);
            reject(new Error(`OAuth failed: ${error.type || 'Unknown error'}`));
          }
        });

        client.requestAccessToken();
      });

      console.log('🎫 Got access token:', oauth2Response.access_token ? 'Yes' : 'No');
      console.log('🔑 Access token (first 20 chars):', oauth2Response.access_token?.substring(0, 20) + '...');

      // Get user profile info using the access token
      console.log('👤 Fetching user profile...');
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${oauth2Response.access_token}`
        }
      });

      console.log('📡 Profile response status:', profileResponse.status);
      
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('❌ Profile response error:', errorText);
        throw new Error(`Failed to get user profile: ${profileResponse.status} - ${errorText}`);
      }

      const profile = await profileResponse.json();
      console.log('✅ Got user profile:', profile.email);

      // Debug: Check state values before saving
      console.log('🔍 Current calendarSync state:', {
        syncColor: calendarSync.syncColor,
        autoSync: calendarSync.autoSync,
        isConnected: calendarSync.isConnected
      });

      // Use the user's UID as the document ID
      const userDocRef = doc(db, 'users', currentUser.uid);

      // Check if user document exists, if not create it
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('🆕 Creating user document...');
        // Create user document with basic admin info
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          role: 'admin',
          createdAt: new Date(),
          adminCalendarSync: {
            isConnected: true,
            calendarEmail: profile.email,
            syncColor: calendarSync.syncColor || '#4285f4',
            autoSync: calendarSync.autoSync !== undefined ? calendarSync.autoSync : true,
            connectedAt: new Date(),
            googleAccessToken: oauth2Response.access_token
          }
        });
      } else {
        console.log('📝 Updating existing user document...');
        // Update existing user document with calendar sync info
        await updateDoc(userDocRef, {
          adminCalendarSync: {
            isConnected: true,
            calendarEmail: profile.email,
            syncColor: calendarSync.syncColor || '#4285f4',
            autoSync: calendarSync.autoSync !== undefined ? calendarSync.autoSync : true,
            connectedAt: new Date(),
            googleAccessToken: oauth2Response.access_token
          }
        });
      }

      console.log('💾 Saved to Firestore');

      setCalendarSync(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        calendarEmail: profile.email,
        lastSync: new Date()
      }));

      showAlert('🎉 Google Calendar connected successfully! All new appointments will now sync automatically to your business calendar.', 'success');

    } catch (error) {
      console.error('❌ Calendar connection error:', error);
      setCalendarSync(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect to Google Calendar. Please try again.'
      }));
      
      showAlert(`❌ Connection failed: ${error.message || 'Please check your internet connection and try again.'}`, 'error');
    }
  };

  const handleCalendarDisconnect = async () => {
    try {
      // Use the user's UID as the document ID
      const userDocRef = doc(db, 'users', currentUser.uid);

      // Check if document exists first
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          adminCalendarSync: {
            isConnected: false,
            calendarEmail: null,
            autoSync: false,
            disconnectedAt: new Date(),
            googleAccessToken: null
          }
        });
      } else {
        console.log('User document does not exist, no need to disconnect');
      }

      setCalendarSync({
        isConnected: false,
        isLoading: false,
        error: null,
        lastSync: null,
        calendarEmail: '',
        syncColor: '#4285f4',
        autoSync: true
      });

      showAlert('🔗 Google Calendar disconnected successfully.', 'success');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
      showAlert('Error disconnecting calendar. Please try again.', 'error');
    }
  };

  const handleColorChange = (color) => {
    setCalendarSync(prev => ({ ...prev, syncColor: color }));
    // Save color preference to database
    updateDoc(doc(db, 'users', currentUser.uid), {
      'adminCalendarSync.syncColor': color
    }).catch(error => {
      console.error('Error updating color:', error);
    });
  };

  // Analytics Functions
  const handleSaveAnalytics = async () => {
    if (!analyticsSettings.trackingCode.trim()) return;
    
    setAnalyticsSettings(prev => ({ ...prev, isLoading: true }));
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        analyticsSettings: {
          trackingCode: analyticsSettings.trackingCode.trim(),
          isConnected: true,
          connectedAt: new Date().toISOString()
        }
      });
      
      setAnalyticsSettings(prev => ({ 
        ...prev, 
        isConnected: true, 
        isLoading: false 
      }));
      
      showAlert('🎉 Google Analytics connected successfully! Analytics data will start appearing within 24 hours.', 'success');
    } catch (error) {
      console.error('Error saving analytics settings:', error);
      setAnalyticsSettings(prev => ({ ...prev, isLoading: false }));
      showAlert('Error saving analytics settings. Please try again.', 'error');
    }
  };

  const handleDisconnectAnalytics = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        analyticsSettings: {
          trackingCode: '',
          isConnected: false,
          disconnectedAt: new Date().toISOString()
        }
      });
      
      setAnalyticsSettings({
        trackingCode: '',
        isConnected: false,
        isLoading: false
      });
      
      showAlert('🔗 Google Analytics disconnected successfully.', 'success');
    } catch (error) {
      console.error('Error disconnecting analytics:', error);
      showAlert('Error disconnecting analytics. Please try again.', 'error');
    }
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 3000);
  };

  const themeColors = [
    { name: 'Professional Blue', color: '#1976d2' },
    { name: 'Success Green', color: '#2e7d32' },
    { name: 'Business Orange', color: '#ed6c02' },
    { name: 'Premium Purple', color: '#7b1fa2' },
    { name: 'Elegant Teal', color: '#0288d1' },
    { name: 'Classic Dark', color: '#424242' }
  ];

  return (
    <Box>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Profile Overview Card */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 'fit-content', position: 'sticky', top: 20 }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '3rem',
                    fontWeight: 600,
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  {profileData.displayName?.charAt(0) || 'A'}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                  size="small"
                >
                  <Camera />
                </IconButton>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {profileData.displayName || 'Admin User'}
              </Typography>
              
              <Chip 
                label="Administrator" 
                sx={{ 
                  bgcolor: '#28a745', 
                  color: 'white', 
                  fontWeight: 600,
                  mb: 2
                }} 
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {profileData.bio || 'Professional car detailing administrator'}
              </Typography>

              <Box sx={{ textAlign: 'left', mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="body2">{profileData.email}</Typography>
                </Box>
                {profileData.phoneNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="body2">{profileData.phoneNumber}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="body2">{profileData.businessHours}</Typography>
                </Box>
              </Box>

              <Button
                variant={editMode ? "outlined" : "contained"}
                startIcon={editMode ? <Cancel /> : <Edit />}
                fullWidth
                onClick={() => setEditMode(!editMode)}
                sx={{ mt: 2 }}
              >
                {editMode ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Profile Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <BusinessCenter sx={{ mr: 1 }} />
                    Profile Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Display Name"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                        disabled={!editMode}
                        variant={editMode ? "outlined" : "filled"}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={profileData.email}
                        disabled
                        variant="filled"
                        helperText="Email cannot be changed"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={profileData.phoneNumber}
                        onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                        disabled={!editMode}
                        variant={editMode ? "outlined" : "filled"}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Business Name"
                        value={profileData.businessName}
                        onChange={(e) => setProfileData({...profileData, businessName: e.target.value})}
                        disabled={!editMode}
                        variant={editMode ? "outlined" : "filled"}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Business Address"
                        value={profileData.businessAddress}
                        onChange={(e) => setProfileData({...profileData, businessAddress: e.target.value})}
                        disabled={!editMode}
                        variant={editMode ? "outlined" : "filled"}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Business Hours"
                        value={profileData.businessHours}
                        onChange={(e) => setProfileData({...profileData, businessHours: e.target.value})}
                        disabled={!editMode}
                        variant={editMode ? "outlined" : "filled"}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio / Description"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        disabled={!editMode}
                        variant={editMode ? "outlined" : "filled"}
                        multiline
                        rows={3}
                        placeholder="Tell us about yourself and your business..."
                      />
                    </Grid>
                  </Grid>

                  {editMode && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Preferences & Settings */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Settings sx={{ mr: 1 }} />
                    Preferences & Settings
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Notifications</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.emailNotifications}
                            onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                          />
                        }
                        label="Email Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.smsNotifications}
                            onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                          />
                        }
                        label="SMS Notifications"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Automation</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.autoSync}
                            onChange={(e) => handlePreferenceChange('autoSync', e.target.checked)}
                          />
                        }
                        label="Auto-sync Appointments"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.calendarIntegration}
                            onChange={(e) => handlePreferenceChange('calendarIntegration', e.target.checked)}
                          />
                        }
                        label="Calendar Integration"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Google Calendar Integration */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <CalendarToday sx={{ mr: 1 }} />
                    Google Calendar Integration
                  </Typography>

                  {calendarSync.isConnected ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Calendar Connected
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Synced with: {calendarSync.calendarEmail}
                      </Typography>
                      
                      {/* Color picker for calendar events */}
                      <Typography variant="subtitle2" gutterBottom>Event Color:</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {themeColors.map((colorOption) => (
                          <Tooltip title={colorOption.name} key={colorOption.color}>
                            <Box
                              onClick={() => handleColorChange(colorOption.color)}
                              sx={{
                                width: 32,
                                height: 32,
                                backgroundColor: colorOption.color,
                                borderRadius: '50%',
                                cursor: 'pointer',
                                border: calendarSync.syncColor === colorOption.color ? '3px solid #000' : '2px solid #fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  transition: 'transform 0.2s'
                                }
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                      
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={handleCalendarDisconnect}
                      >
                        Disconnect Calendar
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Connect your Google Calendar to automatically sync appointments and manage your schedule.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={calendarSync.isLoading ? <Settings sx={{ animation: 'spin 1s linear infinite' }} /> : <Google />}
                        onClick={handleCalendarConnect}
                        disabled={calendarSync.isLoading}
                        sx={{
                          background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #3367d6 0%, #2d8e47 100%)',
                          },
                          '&:disabled': {
                            background: '#cccccc',
                            color: '#666666',
                          }
                        }}
                      >
                        {calendarSync.isLoading ? 'Connecting...' : 'Connect Google Calendar'}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Google Analytics Integration */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Analytics sx={{ mr: 1 }} />
                    Google Analytics Integration
                  </Typography>

                  {analyticsSettings.isConnected ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Analytics Connected
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Tracking Code: {analyticsSettings.trackingCode}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Website analytics data is being collected and will appear in your Analytics dashboard.
                      </Typography>
                      
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDisconnectAnalytics}
                        startIcon={<Analytics />}
                      >
                        Disconnect Analytics
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Connect Google Analytics to track website visitors, page views, and user behavior on your business website.
                      </Typography>
                      
                      <TextField
                        fullWidth
                        label="Google Analytics Tracking Code"
                        placeholder="G-XXXXXXXXXX"
                        value={analyticsSettings.trackingCode}
                        onChange={(e) => setAnalyticsSettings(prev => ({ 
                          ...prev, 
                          trackingCode: e.target.value 
                        }))}
                        helperText="Enter your Google Analytics 4 tracking code (format: G-XXXXXXXXXX)"
                        variant="outlined"
                        sx={{ mb: 3 }}
                      />
                      
                      <Button
                        variant="contained"
                        startIcon={analyticsSettings.isLoading ? <Settings sx={{ animation: 'spin 1s linear infinite' }} /> : <Analytics />}
                        onClick={handleSaveAnalytics}
                        disabled={analyticsSettings.isLoading || !analyticsSettings.trackingCode.trim()}
                        sx={{
                          background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #3367d6 0%, #2d8e47 100%)',
                          },
                          '&.Mui-disabled': {
                            background: '#cccccc',
                            color: '#666666',
                          }
                        }}
                      >
                        {analyticsSettings.isLoading ? 'Connecting...' : 'Connect Analytics'}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Security Settings */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Security sx={{ mr: 1 }} />
                    Security Settings
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Security />
                      </ListItemIcon>
                      <ListItemText
                        primary="Change Password"
                        secondary="Update your account password for security"
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setChangePasswordDialog(true)}
                      >
                        Change
                      </Button>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialog(false)}>Cancel</Button>
          <Button variant="contained">Update Password</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProfile;
