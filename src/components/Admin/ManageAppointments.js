import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  Phone,
  Email,
  LocationOn,
  DirectionsCar
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'appointments'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const appointmentsData = [];
        snapshot.forEach((doc) => {
          appointmentsData.push({ id: doc.id, ...doc.data() });
        });
        setAppointments(appointmentsData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setSnackbar({
        open: true,
        message: `Appointment ${newStatus} successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update appointment status.',
        severity: 'error'
      });
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'approved': return '#2e7d32';
      case 'completed': return '#1976d2';
      case 'rejected': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getFilteredAppointments = () => {
    switch (tabValue) {
      case 0: return appointments; // All
      case 1: return appointments.filter(apt => apt.status === 'pending');
      case 2: return appointments.filter(apt => apt.status === 'approved');
      case 3: return appointments.filter(apt => apt.status === 'completed');
      case 4: return appointments.filter(apt => apt.status === 'rejected');
      default: return appointments;
    }
  };

  const getTabCounts = () => {
    return {
      all: appointments.length,
      pending: appointments.filter(apt => apt.status === 'pending').length,
      approved: appointments.filter(apt => apt.status === 'approved').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      rejected: appointments.filter(apt => apt.status === 'rejected').length
    };
  };

  const counts = getTabCounts();
  const filteredAppointments = getFilteredAppointments();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          📅 Manage Appointments
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {counts.all}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Appointments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                  {counts.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {counts.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {counts.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label={`All (${counts.all})`} />
            <Tab label={`Pending (${counts.pending})`} />
            <Tab label={`Approved (${counts.approved})`} />
            <Tab label={`Completed (${counts.completed})`} />
            <Tab label={`Rejected (${counts.rejected})`} />
          </Tabs>
        </Paper>

        {/* Appointments Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {appointment.userName || appointment.customerName || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.userEmail || appointment.customerEmail}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.customerPhone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {appointment.service || appointment.serviceType || 'Car Detailing'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.vehicleType} {appointment.vehicleYear} {appointment.vehicleMake}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {appointment.date?.toDate?.()?.toLocaleDateString() || 
                         appointment.preferredDate?.toDate?.()?.toLocaleDateString() || 
                         appointment.selectedDate || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.time || appointment.preferredTime || appointment.selectedTime || 'Not specified'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        ${appointment.finalPrice || appointment.estimatedPrice || 'TBD'}
                      </Typography>
                      {appointment.paymentStatus === 'deposit_paid' && (
                        <Typography variant="body2" sx={{ color: 'success.main', fontSize: '0.75rem' }}>
                          Deposit: ${appointment.depositAmount}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={appointment.status || 'pending'} 
                        sx={{
                          bgcolor: getStatusColor(appointment.status),
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleViewDetails(appointment)}
                          color="primary"
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                        {appointment.status === 'pending' && (
                          <>
                            <IconButton
                              onClick={() => handleStatusChange(appointment.id, 'approved')}
                              sx={{ color: '#2e7d32' }}
                              size="small"
                            >
                              <CheckCircle />
                            </IconButton>
                            <IconButton
                              onClick={() => handleStatusChange(appointment.id, 'rejected')}
                              sx={{ color: '#d32f2f' }}
                              size="small"
                            >
                              <Cancel />
                            </IconButton>
                          </>
                        )}
                        {appointment.status === 'approved' && (
                          <IconButton
                            onClick={() => handleStatusChange(appointment.id, 'completed')}
                            sx={{ color: '#1976d2' }}
                            size="small"
                          >
                            <CheckCircle />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAppointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                        No appointments found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        {tabValue === 0 ? 'No appointments have been created yet.' : 'No appointments match the selected filter.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Appointment Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            Appointment Details
          </DialogTitle>
          <DialogContent>
            {selectedAppointment && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1">
                      <strong>Name:</strong> {selectedAppointment.userName || selectedAppointment.customerName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Email sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedAppointment.userEmail || selectedAppointment.customerEmail}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Phone sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedAppointment.customerPhone || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedAppointment.address ? 
                        `${selectedAppointment.address.street}, ${selectedAppointment.address.city}, ${selectedAppointment.address.state} ${selectedAppointment.address.zipCode}` : 
                        selectedAppointment.serviceLocation || 'Location to be confirmed'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Service Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Service Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      <strong>Service:</strong> {selectedAppointment.service || selectedAppointment.serviceType}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Package:</strong> {selectedAppointment.package || selectedAppointment.category || 'Standard'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Total Price:</strong> ${selectedAppointment.finalPrice || selectedAppointment.estimatedPrice}
                    </Typography>
                    {selectedAppointment.depositAmount && (
                      <>
                        <Typography variant="body1">
                          <strong>Deposit Paid:</strong> ${selectedAppointment.depositAmount}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Remaining Balance:</strong> ${selectedAppointment.remainingBalance || 0}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          <strong>Payment Status:</strong> {selectedAppointment.paymentStatus || 'Pending'}
                        </Typography>
                      </>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DirectionsCar sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedAppointment.vehicleYear} {selectedAppointment.vehicleMake} {selectedAppointment.vehicleModel}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Type:</strong> {selectedAppointment.vehicleType}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Color:</strong> {selectedAppointment.vehicleColor}
                  </Typography>
                </Grid>

                {/* Appointment Details */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Appointment Details
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedAppointment.date?.toDate?.()?.toLocaleDateString() || 
                       selectedAppointment.preferredDate?.toDate?.()?.toLocaleDateString() || 
                       selectedAppointment.selectedDate} at {selectedAppointment.time || selectedAppointment.preferredTime || selectedAppointment.selectedTime}
                    </Typography>
                  </Box>
                  
                  {(selectedAppointment.notes || selectedAppointment.specialRequests) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Notes:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        p: 2, 
                        bgcolor: '#f5f5f5', 
                        borderRadius: 1,
                        fontStyle: 'italic'
                      }}>
                        {selectedAppointment.notes || selectedAppointment.specialRequests}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Status:</strong> 
                      <Chip 
                        label={selectedAppointment.status || 'pending'} 
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: getStatusColor(selectedAppointment.status),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Created:</strong> {selectedAppointment.createdAt?.toDate?.()?.toLocaleString() || 'Recently'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            {selectedAppointment?.status === 'pending' && (
              <>
                <Button 
                  onClick={() => {
                    handleStatusChange(selectedAppointment.id, 'approved');
                    setDetailsDialogOpen(false);
                  }}
                  variant="contained" 
                  color="success"
                >
                  Approve
                </Button>
                <Button 
                  onClick={() => {
                    handleStatusChange(selectedAppointment.id, 'rejected');
                    setDetailsDialogOpen(false);
                  }}
                  variant="contained" 
                  color="error"
                >
                  Reject
                </Button>
              </>
            )}
            {selectedAppointment?.status === 'approved' && (
              <Button 
                onClick={() => {
                  handleStatusChange(selectedAppointment.id, 'completed');
                  setDetailsDialogOpen(false);
                }}
                variant="contained" 
                color="primary"
              >
                Mark Complete
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default ManageAppointments;
