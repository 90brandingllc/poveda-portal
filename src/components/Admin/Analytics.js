import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Visibility,
  TrendingUp,
  People,
  Schedule,
  Language,
  Smartphone,
  Computer,
  Refresh
} from '@mui/icons-material';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const Analytics = () => {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 1247,
    uniqueVisitors: 892,
    bounceRate: 32.5,
    avgSessionDuration: '2m 45s',
    topPages: [
      { page: '/services', views: 342, percentage: 27.4 },
      { page: '/about', views: 289, percentage: 23.2 },
      { page: '/contact', views: 198, percentage: 15.9 },
      { page: '/book-appointment', views: 156, percentage: 12.5 },
      { page: '/', views: 142, percentage: 11.4 }
    ],
    trafficSources: [
      { source: 'Google Search', visitors: 423, percentage: 47.4 },
      { source: 'Direct', visitors: 267, percentage: 29.9 },
      { source: 'Social Media', visitors: 134, percentage: 15.0 },
      { source: 'Referral', visitors: 68, percentage: 7.6 }
    ],
    deviceTypes: [
      { device: 'Mobile', users: 534, percentage: 59.9 },
      { device: 'Desktop', users: 267, percentage: 29.9 },
      { device: 'Tablet', users: 91, percentage: 10.2 }
    ],
    recentActivity: [
      { time: '2 minutes ago', event: 'New visitor from Google', location: 'Miami, FL' },
      { time: '5 minutes ago', event: 'Appointment booked', location: 'Orlando, FL' },
      { time: '12 minutes ago', event: 'Contact form submitted', location: 'Tampa, FL' },
      { time: '18 minutes ago', event: 'Service page viewed', location: 'Jacksonville, FL' },
      { time: '23 minutes ago', event: 'New visitor from Facebook', location: 'Fort Lauderdale, FL' }
    ]
  });

  useEffect(() => {
    checkAnalyticsConnection();
  }, [currentUser]);

  const checkAnalyticsConnection = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setIsConnected(userData.analyticsSettings?.isConnected || false);
      }
    } catch (error) {
      console.error('Error loading analytics settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const getDeviceIcon = (device) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone />;
      case 'desktop': return <Computer />;
      default: return <Language />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography>Loading analytics data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 700, 
          color: '#4b5563', 
          fontSize: { xs: '1.75rem', sm: '2.5rem' },
          display: 'flex',
          alignItems: 'center'
        }}>
          <AnalyticsIcon sx={{ mr: 2, fontSize: { xs: '2rem', sm: '2.5rem' } }} />
          Website Analytics
        </Typography>
        
        <Tooltip title="Refresh Data">
          <IconButton 
            onClick={checkAnalyticsConnection}
            sx={{ 
              color: '#6b7280',
              '&:hover': { color: '#0891b2' }
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {!isConnected ? (
        <Card sx={{ 
          background: 'rgba(255, 255, 255, 0.9)', 
          border: '1px solid rgba(229, 231, 235, 0.8)',
          borderRadius: 3,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(8px)',
          textAlign: 'center',
          py: 8
        }}>
          <AnalyticsIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#6b7280', mb: 1 }}>
            Analytics Not Connected
          </Typography>
          <Typography variant="body1" sx={{ color: '#9ca3af', mb: 3 }}>
            Please connect your Google Analytics in the Profile page to view website analytics data.
          </Typography>
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
            Go to <strong>Profile → Google Analytics Integration</strong> to set up your tracking code and start collecting data.
          </Alert>
        </Card>
      ) : (
        <>
          {/* Overview Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease'
                }
              }}>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Visibility sx={{ fontSize: 40, color: '#0891b2', mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                    {formatNumber(analyticsData.totalViews)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Total Page Views
                  </Typography>
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease'
                }
              }}>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <People sx={{ fontSize: 40, color: '#0891b2', mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                    {formatNumber(analyticsData.uniqueVisitors)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Unique Visitors
                  </Typography>
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease'
                }
              }}>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 40, color: '#0891b2', mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                    {analyticsData.bounceRate}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Bounce Rate
                  </Typography>
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease'
                }
              }}>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Schedule sx={{ fontSize: 40, color: '#0891b2', mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                    {analyticsData.avgSessionDuration}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                    Avg. Session Duration
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Analytics with Charts */}
          <Grid container spacing={3}>
            {/* Top Pages with Chart Visualization */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                height: 450
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Visibility sx={{ mr: 1, color: '#0891b2' }} />
                    Most Visited Pages
                  </Typography>
                  
                  {analyticsData.topPages.map((page, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                          {page.page}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0891b2' }}>
                          {formatNumber(page.views)} views
                        </Typography>
                      </Box>
                      <Box sx={{ position: 'relative', height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${page.percentage}%`,
                            background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)',
                            borderRadius: 4,
                            transition: 'width 0.5s ease'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#6b7280', mt: 0.5 }}>
                        {page.percentage.toFixed(1)}% of total traffic
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>

            {/* Traffic Sources with Pie Chart Style */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                height: 450
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1, color: '#0891b2' }} />
                    Traffic Sources
                  </Typography>
                  
                  {analyticsData.trafficSources.map((source, index) => {
                    const colors = ['#0891b2', '#06b6d4', '#67e8f9', '#a7f3d0'];
                    return (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              backgroundColor: colors[index], 
                              borderRadius: '50%', 
                              mr: 1 
                            }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {source.source}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: colors[index] }}>
                            {formatNumber(source.visitors)} visitors
                          </Typography>
                        </Box>
                        <Box sx={{ position: 'relative', height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              height: '100%',
                              width: `${source.percentage}%`,
                              backgroundColor: colors[index],
                              borderRadius: 3,
                              transition: 'width 0.5s ease'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          {source.percentage.toFixed(1)}% of total visitors
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            </Grid>

            {/* Device Analytics */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)'
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Computer sx={{ mr: 1, color: '#0891b2' }} />
                    Device Breakdown
                  </Typography>
                  {analyticsData.deviceTypes.map((device, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getDeviceIcon(device.device)}
                          <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
                            {device.device}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0891b2' }}>
                          {formatNumber(device.users)} ({device.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={device.percentage} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: '#f3f4f6',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#0891b2',
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>

            {/* Real-time Activity Feed */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                background: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)'
              }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ mr: 1, color: '#0891b2' }} />
                    Real-time Activity
                    <Chip 
                      label="LIVE" 
                      size="small" 
                      sx={{ 
                        ml: 1, 
                        backgroundColor: '#10b981', 
                        color: 'white',
                        fontSize: '0.7rem',
                        animation: 'pulse 2s infinite'
                      }} 
                    />
                  </Typography>
                  {analyticsData.recentActivity.map((activity, index) => (
                    <Box key={index} sx={{ 
                      mb: 2, 
                      pb: 2, 
                      borderBottom: index < analyticsData.recentActivity.length - 1 ? '1px solid #e5e7eb' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        backgroundColor: '#10b981', 
                        borderRadius: '50%', 
                        mt: 0.5, 
                        mr: 2,
                        flexShrink: 0
                      }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          {activity.event}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          {activity.time} • {activity.location}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Analytics;
