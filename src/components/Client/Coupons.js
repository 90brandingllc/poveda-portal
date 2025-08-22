import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Coupons = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Available Coupons
        </Typography>
        <Typography variant="body1">
          Coupons functionality coming soon...
        </Typography>
      </Paper>
    </Container>
  );
};

export default Coupons;
