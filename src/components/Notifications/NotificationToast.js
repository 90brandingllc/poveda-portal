import React, { useState, useEffect, forwardRef } from 'react';
import { 
  Snackbar, 
  Alert, 
  Box, 
  Typography, 
  IconButton, 
  Button 
} from '@mui/material';
import { Close, CheckCircle, Info, Warning, Error } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CustomAlert = forwardRef((props, ref) => {
  const { 
    notification, 
    onClose,
    ...alertProps 
  } = props;
  
  const navigate = useNavigate();
  
  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle fontSize="inherit" />;
      case 'warning': return <Warning fontSize="inherit" />;
      case 'error': return <Error fontSize="inherit" />;
      default: return <Info fontSize="inherit" />;
    }
  };
  
  const handleViewDetails = () => {
    navigate('/notifications');
    onClose();
  };
  
  return (
    <Alert 
      ref={ref}
      icon={getIcon(notification.type)}
      severity={notification.type || 'info'}
      {...alertProps}
      sx={{
        width: '100%',
        maxWidth: 400,
        boxShadow: 3,
        '.MuiAlert-message': {
          width: '100%'
        }
      }}
      action={
        <>
          <Button 
            color="inherit" 
            size="small" 
            onClick={handleViewDetails}
            sx={{ textTransform: 'none', mr: 1 }}
          >
            View
          </Button>
          <IconButton 
            size="small" 
            aria-label="close" 
            color="inherit" 
            onClick={onClose}
          >
            <Close fontSize="small" />
          </IconButton>
        </>
      }
    >
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {notification.title}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {notification.message?.length > 120 
            ? `${notification.message.substring(0, 120)}...` 
            : notification.message}
        </Typography>
      </Box>
    </Alert>
  );
});

const NotificationToast = ({ notification, open, onClose }) => {
  return (
    <Snackbar 
      open={open} 
      autoHideDuration={6000} 
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }}
    >
      <CustomAlert 
        notification={notification} 
        onClose={onClose} 
        elevation={6}
      />
    </Snackbar>
  );
};

export default NotificationToast;
