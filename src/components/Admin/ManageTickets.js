import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const ManageTickets = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Support Tickets
        </Typography>
        <Typography variant="body1">
          Support ticket management functionality coming soon...
        </Typography>
      </Paper>
    </Container>
  );
};

export default ManageTickets;
