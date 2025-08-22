import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const ManageAppointments = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Appointments
        </Typography>
        <Typography variant="body1">
          Appointment management functionality coming soon...
        </Typography>
      </Paper>
    </Container>
  );
};

export default ManageAppointments;
