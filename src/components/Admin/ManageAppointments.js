import React, { useState, useEffect } from 'react';
import {
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
  Tab,
  useMediaQuery,
  useTheme,
  Stack,
  Divider,
  Avatar
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  Phone,
  Email,
  LocationOn,
  DirectionsCar,
  ArrowBack
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
import { useNavigate, useLocation } from 'react-router-dom';

const ManageAppointments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [appointments, setAppointments] = useState([]);
  const [, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);

  // Check URL parameters to set initial tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view === 'today') {
      setTabValue(1); // Set to Today tab
    }
  }, [location]);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (tabValue) {
      case 0: return appointments; // All
      case 1: 
        // Today's appointments
        return appointments.filter(apt => {
          const aptDate = apt.date?.toDate ? apt.date.toDate() : new Date(apt.date);
          return aptDate >= today && aptDate < tomorrow;
        });
      case 2: return appointments.filter(apt => apt.status === 'pending');
      case 3: return appointments.filter(apt => apt.status === 'approved');
      case 4: return appointments.filter(apt => apt.status === 'completed');
      case 5: return appointments.filter(apt => apt.status === 'rejected');
      default: return appointments;
    }
  };

  const getTabCounts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAppointments = appointments.filter(apt => {
      const aptDate = apt.date?.toDate ? apt.date.toDate() : new Date(apt.date);
      return aptDate >= today && aptDate < tomorrow;
    });

    return {
      all: appointments.length,
      today: todaysAppointments.length,
      pending: appointments.filter(apt => apt.status === 'pending').length,
      approved: appointments.filter(apt => apt.status === 'approved').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      rejected: appointments.filter(apt => apt.status === 'rejected').length
    };
  };

  const counts = getTabCounts();
  const filteredAppointments = getFilteredAppointments();

  return (
    <Box sx={{ 
      px: isMobile ? 1 : 0,
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header - Mobile Responsive */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: isMobile ? 2 : 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
            <IconButton 
              onClick={() => navigate('/admin/dashboard')}
              sx={{ 
                mr: 2,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography 
              variant={isMobile ? "h5" : "h3"} 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                mb: 0,
                fontSize: isMobile ? '1.5rem' : '3rem'
              }}
            >
              {isMobile ? '📅 Appointments' : '📅 Manage Appointments'}
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards - Mobile Responsive */}
        <Grid container spacing={isMobile ? 1 : 3} sx={{ 
          mb: isMobile ? 2 : 4,
          width: '100%',
          margin: 0,
          '& .MuiGrid-item': {
            paddingLeft: isMobile ? '4px' : '12px',
            paddingTop: isMobile ? '4px' : '12px'
          }
        }}>
          <Grid item xs={6} sm={6} md={3} sx={{ width: '100%' }}>
            <Card sx={{ 
              width: '100%',
              minWidth: 0
            }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 0.5 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 },
                minWidth: 0
              }}>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  sx={{ fontWeight: 'bold', color: '#1976d2' }}
                >
                  {counts.all}
                </Typography>
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="text.secondary"
                >
                  {isMobile ? 'Total' : 'Total Appointments'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ width: '100%' }}>
            <Card sx={{ 
              width: '100%',
              minWidth: 0
            }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 0.5 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 },
                minWidth: 0
              }}>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  sx={{ fontWeight: 'bold', color: '#ed6c02' }}
                >
                  {counts.pending}
                </Typography>
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="text.secondary"
                >
                  {isMobile ? 'Pending' : 'Pending Approval'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ width: '100%' }}>
            <Card sx={{ 
              width: '100%',
              minWidth: 0
            }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 0.5 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 },
                minWidth: 0
              }}>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  sx={{ fontWeight: 'bold', color: '#2e7d32' }}
                >
                  {counts.approved}
                </Typography>
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="text.secondary"
                >
                  Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ width: '100%' }}>
            <Card sx={{ 
              width: '100%',
              minWidth: 0
            }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 0.5 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 },
                minWidth: 0
              }}>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  sx={{ fontWeight: 'bold', color: '#1976d2' }}
                >
                  {counts.completed}
                </Typography>
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="text.secondary"
                >
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Tabs - Mobile Responsive */}
        <Paper sx={{ 
          mb: isMobile ? 2 : 3,
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile={isMobile}
            sx={{
              width: '100%',
              maxWidth: '100%',
              '& .MuiTab-root': {
                fontSize: isSmallMobile ? '0.6rem' : isMobile ? '0.7rem' : '0.875rem',
                minWidth: isSmallMobile ? 60 : isMobile ? 75 : 'auto',
                padding: isSmallMobile ? '4px 4px' : isMobile ? '6px 6px' : '12px 16px',
                maxWidth: isSmallMobile ? 80 : 'none'
              },
              '& .MuiTabs-flexContainer': {
                width: isMobile ? 'auto' : '100%'
              }
            }}
          >
            <Tab label={isMobile ? `All (${counts.all})` : `All (${counts.all})`} />
            <Tab label={isMobile ? `Today (${counts.today})` : `Today (${counts.today})`} />
            <Tab label={isMobile ? `Pending (${counts.pending})` : `Pending (${counts.pending})`} />
            <Tab label={isMobile ? `Approved (${counts.approved})` : `Approved (${counts.approved})`} />
            <Tab label={isMobile ? `Done (${counts.completed})` : `Completed (${counts.completed})`} />
            <Tab label={isMobile ? `Rejected (${counts.rejected})` : `Rejected (${counts.rejected})`} />
          </Tabs>
        </Paper>

        {/* Appointments Display - Mobile Responsive */}
        <Paper sx={{ 
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          {isMobile ? (
            // Mobile Card View
            <Box sx={{ 
              p: isSmallMobile ? 1 : 1.5,
              width: '100%',
              maxWidth: '100%',
              overflowX: 'hidden'
            }}>
              {filteredAppointments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                    No appointments found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    {tabValue === 0 ? 'No appointments have been created yet.' : 
                     tabValue === 1 ? 'No appointments scheduled for today.' : 
                     'No appointments match the selected filter.'}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} sx={{ width: '100%' }}>
                  {filteredAppointments.map((appointment) => (
                    <Card 
                      key={appointment.id} 
                      variant="outlined" 
                      sx={{ 
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          borderColor: '#1976d2'
                        }
                      }}
                    >
                      <CardContent sx={{ 
                        p: isSmallMobile ? 1.5 : 2,
                        width: '100%',
                        minWidth: 0,
                        '&:last-child': { pb: isSmallMobile ? 1.5 : 2 }
                      }}>
                        {/* Customer Info */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          mb: 1.5,
                          width: '100%',
                          minWidth: 0
                        }}>
                          <Avatar sx={{ 
                            bgcolor: 'primary.main', 
                            mr: isSmallMobile ? 1 : 1.5, 
                            width: isSmallMobile ? 28 : 36, 
                            height: isSmallMobile ? 28 : 36,
                            fontSize: isSmallMobile ? '0.75rem' : '0.875rem',
                            flexShrink: 0
                          }}>
                            {(appointment.userName || appointment.customerName || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ 
                            flex: 1, 
                            minWidth: 0,
                            width: '100%',
                            overflow: 'hidden'
                          }}>
                            <Typography 
                              variant={isSmallMobile ? "body2" : "subtitle1"} 
                              sx={{ 
                                fontWeight: 'bold', 
                                mb: 0.25,
                                fontSize: isSmallMobile ? '0.8rem' : '0.95rem',
                                lineHeight: 1.2
                              }}
                            >
                              {appointment.userName || appointment.customerName || 'Unknown'}
                            </Typography>
                            <Typography 
                              variant="caption"
                              color="text.secondary" 
                              sx={{ 
                                mb: 0.25,
                                fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                                wordBreak: 'break-word',
                                display: 'block'
                              }}
                            >
                              {appointment.userEmail || appointment.customerEmail}
                            </Typography>
                            {appointment.customerPhone && (
                              <Typography 
                                variant="caption"
                                color="text.secondary"
                                sx={{ 
                                  fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                                  display: 'block'
                                }}
                              >
                                {appointment.customerPhone}
                              </Typography>
                            )}
                          </Box>
                          <Chip 
                            label={appointment.status || 'pending'} 
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(appointment.status),
                              color: 'white',
                              textTransform: 'capitalize',
                              fontWeight: 'bold',
                              fontSize: isSmallMobile ? '0.6rem' : '0.7rem',
                              height: isSmallMobile ? 18 : 22,
                              flexShrink: 0,
                              '& .MuiChip-label': {
                                px: isSmallMobile ? 0.5 : 1
                              }
                            }}
                          />
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* Service & Vehicle Info */}
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography 
                              variant={isSmallMobile ? "body2" : "body1"} 
                              sx={{ 
                                fontWeight: 'bold', 
                                fontSize: isSmallMobile ? '0.85rem' : '0.95rem',
                                flex: 1
                              }}
                            >
                              {appointment.service || appointment.serviceType || 'Car Detailing'}
                            </Typography>
                            <Typography 
                              variant={isSmallMobile ? "subtitle1" : "h6"} 
                              sx={{ 
                                fontWeight: 'bold', 
                                color: '#2e7d32',
                                fontSize: isSmallMobile ? '0.9rem' : '1.1rem',
                                ml: 1
                              }}
                            >
                              ${appointment.finalPrice || appointment.estimatedPrice || 'TBD'}
                            </Typography>
                          </Box>
                          
                          <Typography 
                            variant="caption"
                            color="text.secondary" 
                            sx={{ 
                              mb: 0.75,
                              fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                              display: 'block'
                            }}
                          >
                            🚗 {appointment.vehicleType} {appointment.vehicleYear} {appointment.vehicleMake}
                          </Typography>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 0.5
                          }}>
                            <Typography 
                              variant="caption"
                              color="text.secondary"
                              sx={{ 
                                fontSize: isSmallMobile ? '0.65rem' : '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              📅 {appointment.date?.toDate?.()?.toLocaleDateString() || 
                                   appointment.preferredDate?.toDate?.()?.toLocaleDateString() || 
                                   appointment.selectedDate || 'Date TBD'}
                            </Typography>
                            <Typography 
                              variant="caption"
                              color="text.secondary"
                              sx={{ 
                                fontSize: isSmallMobile ? '0.65rem' : '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              🕐 {appointment.time || appointment.preferredTime || appointment.selectedTime || 'Time TBD'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Action Buttons - Enhanced Mobile */}
                        <Box sx={{ 
                          display: 'flex', 
                          gap: isSmallMobile ? 0.75 : 1, 
                          justifyContent: 'flex-end', 
                          flexWrap: 'wrap',
                          mt: 1.5,
                          pt: 1,
                          borderTop: '1px solid #f0f0f0',
                          width: '100%',
                          minWidth: 0,
                          overflow: 'hidden'
                        }}>
                          <Button
                            onClick={() => handleViewDetails(appointment)}
                            variant="outlined"
                            size="small"
                            startIcon={!isSmallMobile && <Visibility />}
                            sx={{
                              fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                              minWidth: isSmallMobile ? 55 : 'auto',
                              px: isSmallMobile ? 1.5 : 1.5,
                              py: isSmallMobile ? 0.5 : 0.5,
                              height: isSmallMobile ? 28 : 32,
                              borderColor: '#1976d2',
                              color: '#1976d2',
                              '&:hover': {
                                borderColor: '#1565c0',
                                bgcolor: 'rgba(25, 118, 210, 0.04)'
                              }
                            }}
                          >
                            View
                          </Button>
                          {appointment.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => handleStatusChange(appointment.id, 'approved')}
                                variant="contained"
                                size="small"
                                sx={{ 
                                  bgcolor: '#2e7d32', 
                                  '&:hover': { bgcolor: '#1b5e20' },
                                  fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                                  minWidth: isSmallMobile ? 65 : 'auto',
                                  px: isSmallMobile ? 1.5 : 1.5,
                                  py: isSmallMobile ? 0.5 : 0.5,
                                  height: isSmallMobile ? 28 : 32
                                }}
                                startIcon={!isSmallMobile && <CheckCircle />}
                              >
                                {isSmallMobile ? 'Approve' : 'Approve'}
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(appointment.id, 'rejected')}
                                variant="contained"
                                size="small"
                                sx={{ 
                                  bgcolor: '#d32f2f', 
                                  '&:hover': { bgcolor: '#c62828' },
                                  fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                                  minWidth: isSmallMobile ? 55 : 'auto',
                                  px: isSmallMobile ? 1.5 : 1.5,
                                  py: isSmallMobile ? 0.5 : 0.5,
                                  height: isSmallMobile ? 28 : 32
                                }}
                                startIcon={!isSmallMobile && <Cancel />}
                              >
                                {isSmallMobile ? 'Reject' : 'Reject'}
                              </Button>
                            </>
                          )}
                          {appointment.status === 'approved' && (
                            <Button
                              onClick={() => handleStatusChange(appointment.id, 'completed')}
                              variant="contained"
                              size="small"
                              startIcon={!isSmallMobile && <CheckCircle />}
                              sx={{
                                bgcolor: '#1976d2',
                                '&:hover': { bgcolor: '#1565c0' },
                                fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                                minWidth: isSmallMobile ? 75 : 'auto',
                                px: isSmallMobile ? 1.5 : 1.5,
                                py: isSmallMobile ? 0.5 : 0.5,
                                height: isSmallMobile ? 28 : 32
                              }}
                            >
                              {isSmallMobile ? 'Complete' : 'Complete'}
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          ) : (
            // Desktop Table View
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
                          {tabValue === 0 ? 'No appointments have been created yet.' : 
                           tabValue === 1 ? 'No appointments scheduled for today.' : 
                           'No appointments match the selected filter.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Appointment Details Dialog - Mobile Responsive */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          fullScreen={isMobile}
          sx={{
            '& .MuiDialog-paper': {
              margin: isMobile ? 0 : '32px',
              width: isMobile ? '100%' : 'auto',
              maxHeight: isMobile ? '100%' : 'calc(100% - 64px)'
            }
          }}
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
    </Box>
  );
};

export default ManageAppointments;
