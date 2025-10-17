import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Chip,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  WbSunny,
  Cloud,
  Grain,
  Air,
  Opacity,
  Schedule,
  LocationOn,
  Refresh
} from '@mui/icons-material';
import { weatherService } from '../services/weatherService';

// Weather widget with smart caching to minimize API calls
// - Current weather: cached for 30 minutes
// - Forecast: cached for 2 hours and refreshes when appointment dates change
const WeatherWidget = ({ appointments = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentWeather, setCurrentWeather] = useState(null);
  const [appointmentWeather, setAppointmentWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Memoize appointment data to prevent unnecessary effect re-runs
  // Only track the IDs and dates of approved appointments
  const appointmentDeps = useMemo(() => {
    const approved = appointments.filter(apt => apt.status === 'approved' || apt.status === 'confirmed');
    return approved
      .map(apt => `${apt.id}-${apt.date?.toDate?.()?.getTime() || apt.date}`)
      .sort()
      .join(',');
  }, [appointments]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🌤️ Loading weather data...');

      // Get user's location
      const location = await weatherService.getUserLocation();
      console.log('📍 Location:', location);
      
      // Fetch current weather
      const current = await weatherService.getCurrentWeather(location.lat, location.lon);
      setCurrentWeather(current);

      // If no weather data and no API key, show setup message
      if (!current && !process.env.REACT_APP_WEATHER_API_KEY) {
        setError('Weather API key not configured. Please add REACT_APP_WEATHER_API_KEY to your environment variables.');
        return;
      }

      // Check for upcoming appointments (within next 5 days)
      const upcomingAppointments = appointments.filter(apt => {
        if (apt.status !== 'approved' && apt.status !== 'confirmed') return false;
        const aptDate = apt.date?.toDate ? apt.date.toDate() : new Date(apt.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fiveDaysFromNow = new Date(today.getTime() + (5 * 24 * 60 * 60 * 1000));
        return aptDate >= today && aptDate <= fiveDaysFromNow;
      }).sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      });

      console.log('📅 Upcoming appointments:', upcomingAppointments.length);

      if (upcomingAppointments.length > 0) {
        // Get forecast for appointment weather
        const appointmentDates = upcomingAppointments.map(apt => 
          apt.date?.toDate ? apt.date.toDate() : new Date(apt.date)
        );
        const forecast = await weatherService.getForecast(location.lat, location.lon, appointmentDates);
        const nextAppointment = upcomingAppointments[0]; // Get the nearest appointment
        const nextAptDate = nextAppointment.date?.toDate ? nextAppointment.date.toDate() : new Date(nextAppointment.date);
        const appointmentWeatherData = weatherService.getWeatherForDate(forecast, nextAptDate);
        
        console.log('🌦️ Appointment weather:', appointmentWeatherData);
        
        if (appointmentWeatherData) {
          setAppointmentWeather({
            ...appointmentWeatherData,
            appointmentDate: nextAptDate,
            appointmentTime: nextAppointment.time
          });
        } else {
          setAppointmentWeather(null);
        }
      } else {
        // Clear appointment weather if no upcoming appointments
        console.log('ℹ️ No upcoming appointments');
        setAppointmentWeather(null);
      }

    } catch (err) {
      console.error('❌ Weather loading error:', err);
      setError('Weather data unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Weather widget effect triggered');
    console.log('📊 Appointments count:', appointments.length);
    console.log('🔑 Appointment deps:', appointmentDeps);
    loadWeatherData();
  }, [appointmentDeps]);

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Manual refresh triggered');
    // Clear cache to force fresh data
    weatherService.clearCache();
    await loadWeatherData();
    setRefreshing(false);
  };

  const getWeatherIcon = (description) => {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('sun') || desc.includes('clear')) return <WbSunny sx={{ color: '#fbbf24' }} />;
    if (desc.includes('cloud')) return <Cloud sx={{ color: '#6b7280' }} />;
    if (desc.includes('rain') || desc.includes('drizzle')) return <Grain sx={{ color: '#3b82f6' }} />;
    return <WbSunny sx={{ color: '#fbbf24' }} />;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card sx={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        p: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={40} sx={{ color: '#667eea' }} />
          <Typography color="text.secondary">Loading weather...</Typography>
        </Stack>
      </Card>
    );
  }

  if (error) {
    const isApiKeyMissing = error.includes('API key not configured');
    
    return (
      <Card sx={{
        background: isApiKeyMissing ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: isApiKeyMissing ? '1px solid rgba(255, 193, 7, 0.2)' : '1px solid rgba(255, 255, 255, 0.2)',
        p: 4,
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {isApiKeyMissing ? '⚙️' : '⛅'}
        </Typography>
        <Typography 
          variant="h6" 
          color={isApiKeyMissing ? '#f57c00' : 'error'} 
          sx={{ mb: 2, fontWeight: 600 }}
        >
          {isApiKeyMissing ? 'Weather Setup Required' : 'Weather Unavailable'}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          {isApiKeyMissing 
            ? 'To enable weather forecasts, please add your OpenWeatherMap API key to the environment variables.'
            : error
          }
        </Typography>
        {isApiKeyMissing && (
          <Box sx={{ 
            background: 'rgba(255, 255, 255, 0.3)', 
            borderRadius: 2, 
            p: 2, 
            mt: 2,
            textAlign: 'left'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              Quick Setup:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              1. Get free API key: openweathermap.org/api<br/>
              2. Add to .env: REACT_APP_WEATHER_API_KEY=your_key<br/>
              3. Restart the app
            </Typography>
          </Box>
        )}
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
      {/* Current Weather Card */}
      {currentWeather && (
        <Card sx={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          p: 4,
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            zIndex: -1
          }
        }}>
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocationOn sx={{ color: '#667eea', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  Current Weather
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Chip 
                  label="Live" 
                  size="small" 
                  sx={{ 
                    backgroundColor: '#10b981', 
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }} 
                />
                <Box
                  onClick={handleRefresh}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.5)',
                      transform: 'rotate(180deg)'
                    }
                  }}
                >
                  <Refresh 
                    sx={{ 
                      color: '#667eea', 
                      fontSize: 18,
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }} 
                  />
                </Box>
              </Stack>
            </Box>

            {/* Main Weather Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                {getWeatherIcon(currentWeather.description)}
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  {currentWeather.temperature}°
                </Typography>
                <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {currentWeather.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📍 {currentWeather.location}
                </Typography>
              </Box>
            </Box>

            {/* Weather Details */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: 2,
              mt: 2
            }}>
              <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: 'rgba(255, 255, 255, 0.2)' }}>
                <Air sx={{ color: '#667eea', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Wind</Typography>
                <Typography variant="h6" fontWeight={600}>{currentWeather.windSpeed}m/s</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: 'rgba(255, 255, 255, 0.2)' }}>
                <Opacity sx={{ color: '#667eea', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Humidity</Typography>
                <Typography variant="h6" fontWeight={600}>{currentWeather.humidity}%</Typography>
              </Box>
            </Box>
          </Stack>
        </Card>
      )}

      {/* Appointment Weather Card */}
      {appointmentWeather && (
        <Card sx={{
          background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(67, 233, 123, 0.2)',
          p: 4,
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.05) 0%, rgba(56, 249, 215, 0.05) 100%)',
            zIndex: -1
          }
        }}>
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Schedule sx={{ color: '#10b981', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  Appointment Weather
                </Typography>
              </Stack>
              <Chip 
                label="Forecast" 
                size="small" 
                sx={{ 
                  backgroundColor: '#f59e0b', 
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }} 
              />
            </Box>

            {/* Appointment Date */}
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              background: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="body2" color="text.secondary">Next Appointment</Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatDate(appointmentWeather.appointmentDate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                🕐 {appointmentWeather.appointmentTime}
              </Typography>
            </Box>

            {/* Weather Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 60,
                height: 60,
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                {getWeatherIcon(appointmentWeather.description)}
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981 0%, #38f9d7 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  {appointmentWeather.temperature}°
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {appointmentWeather.description}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default WeatherWidget;
