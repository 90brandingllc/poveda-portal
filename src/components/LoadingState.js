import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Grid,
  Card,
  CardContent
} from '@mui/material';

/**
 * Reusable loading state components for consistent UX
 */

// Main loading spinner with message
export const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 40, 
  fullScreen = false,
  background = false 
}) => {
  const content = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      p: 4
    }}>
      <CircularProgress 
        size={size} 
        sx={{ 
          color: '#0891b2',
          filter: 'drop-shadow(0 4px 8px rgba(8, 145, 178, 0.3))'
        }} 
      />
      <Typography 
        variant="body1" 
        sx={{ 
          color: '#6b7280',
          fontWeight: 500,
          textAlign: 'center'
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  if (fullScreen) {
    return (
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: background ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
        backdropFilter: background ? 'blur(4px)' : 'none',
        zIndex: 9999
      }}>
        {content}
      </Box>
    );
  }

  return content;
};

// Skeleton loading for dashboard cards
export const DashboardCardSkeleton = ({ count = 4 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <Card sx={{
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <CardContent>
            <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={24} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Skeleton loading for appointment list
export const AppointmentListSkeleton = ({ count = 3 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} sx={{
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={28} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '16px' }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: '8px' }} />
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
);

// Skeleton loading for vehicle list
export const VehicleListSkeleton = ({ count = 3 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Card sx={{
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width="70%" height={28} />
            </Box>
            <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '12px' }} />
              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '12px' }} />
            </Box>
            <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: '8px' }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Skeleton loading for notifications
export const NotificationListSkeleton = ({ count = 5 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} sx={{
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="15%" height={16} />
              </Box>
              <Skeleton variant="text" width="90%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="70%" height={20} />
            </Box>
            <Skeleton variant="circular" width={24} height={24} />
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
);

// Inline loading spinner for buttons
export const ButtonSpinner = ({ size = 20 }) => (
  <CircularProgress 
    size={size} 
    sx={{ 
      color: 'inherit',
      mr: 1
    }} 
  />
);

// Page loading state
export const PageLoading = ({ message = 'Loading page...' }) => (
  <Box sx={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <LoadingSpinner message={message} size={50} />
  </Box>
);

// Form loading overlay
export const FormLoadingOverlay = ({ message = 'Processing...' }) => (
  <Box sx={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(4px)',
    borderRadius: 'inherit',
    zIndex: 10
  }}>
    <LoadingSpinner message={message} size={30} />
  </Box>
);

export default {
  LoadingSpinner,
  DashboardCardSkeleton,
  AppointmentListSkeleton,
  VehicleListSkeleton,
  NotificationListSkeleton,
  ButtonSpinner,
  PageLoading,
  FormLoadingOverlay
};
