import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const ManageEstimates = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Estimates
        </Typography>
        <Typography variant="body1">
          Estimate management functionality coming soon...
        </Typography>
      </Paper>
    </Container>
  );
};

export default ManageEstimates;
