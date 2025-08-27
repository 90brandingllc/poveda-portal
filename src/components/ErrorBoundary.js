import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Container 
} from '@mui/material';
import { 
  ErrorOutline, 
  Refresh, 
  Home 
} from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you might want to log this to an external service
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    // Clear error state and reload the component
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              {/* Error Icon */}
              <ErrorOutline 
                sx={{ 
                  fontSize: 80, 
                  color: '#f87171', 
                  mb: 3 
                }} 
              />
              
              {/* Error Title */}
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1f2937',
                  mb: 2
                }}
              >
                Oops! Something went wrong
              </Typography>
              
              {/* Error Description */}
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#6b7280',
                  mb: 4,
                  maxWidth: 600,
                  mx: 'auto'
                }}
              >
                We're sorry, but something unexpected happened. Don't worry - your data is safe. 
                You can try refreshing the page or go back to the dashboard.
              </Typography>

              {/* Error ID for support */}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#9ca3af',
                  mb: 4,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem'
                }}
              >
                Error ID: {this.state.errorId}
              </Typography>

              {/* Action Buttons */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                  sx={{
                    background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5
                  }}
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                  sx={{
                    borderColor: '#0891b2',
                    color: '#0891b2',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: '#0891b2',
                      background: 'rgba(8, 145, 178, 0.1)'
                    }
                  }}
                >
                  Go to Dashboard
                </Button>
              </Box>

              {/* Development Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ 
                  mt: 4, 
                  p: 3, 
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'left'
                }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#ef4444' }}>
                    Development Error Details:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace',
                      color: '#374151',
                      whiteSpace: 'pre-wrap',
                      overflow: 'auto',
                      maxHeight: 200
                    }}
                  >
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
