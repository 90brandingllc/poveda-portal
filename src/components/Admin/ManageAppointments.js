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
  ArrowBack,
  Delete,
  Receipt,
  ImageOutlined,
  PictureAsPdf
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
  serverTimestamp,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleAppointmentStatusChange } from '../../utils/notificationTriggers';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);

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
        
        // Debug: Check for receipts
        console.log('📊 Total appointments loaded:', appointmentsData.length);
        const withReceipts = appointmentsData.filter(apt => apt.paymentReceiptUrl);
        console.log('📄 Appointments with receipts:', withReceipts.length);
        
        if (withReceipts.length > 0) {
          console.log('✅ Receipts found:');
          withReceipts.forEach(apt => {
            console.log(`  - ID: ${apt.id}`);
            console.log(`    Method: ${apt.paymentMethod}`);
            console.log(`    Receipt: ${apt.paymentReceiptUrl?.substring(0, 50)}...`);
          });
        } else {
          console.log('⚠️ No appointments have paymentReceiptUrl field yet');
          console.log('💡 To see receipts: Create a new appointment with Zelle payment and upload a receipt');
        }
        
        setAppointments(appointmentsData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Función auxiliar para verificar si una cita existe antes de intentar cualquier acción
  const verifyAppointmentExists = async (appointmentId) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      return appointmentSnap.exists();
    } catch (error) {
      console.error(`Error verificando existencia de cita ${appointmentId}:`, error);
      return false;
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      // Mostrar indicador de carga en UI
      setSnackbar({
        open: true,
        message: `Procesando cambio a estado ${newStatus}...`,
        severity: 'info'
      });

      // Get the appointment data first
      const appointmentRef = doc(db, 'appointments', appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      
      if (!appointmentSnap.exists()) {
        console.error(`La cita con ID ${appointmentId} no existe en la base de datos`);
        throw new Error(`La cita ya no existe en la base de datos. Es posible que haya sido eliminada por otro usuario o haya ocurrido un problema de sincronización.`);
      }
      
      const appointmentData = { id: appointmentId, ...appointmentSnap.data() };
      
      console.log(`Actualizando cita ${appointmentId} a estado ${newStatus}`, appointmentData);

      // Verificación adicional de campos obligatorios
      if (!appointmentData.userId && newStatus !== 'pending') {
        console.warn('Cita sin userId, añadiendo userId temporal para notificaciones');
        appointmentData.userId = 'system_notification'; // Valor temporal para evitar errores
      }
      
      // Update the appointment status
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Registro para depuración
      console.log(`Estado cambiado: ${appointmentData.status || 'unknown'} -> ${newStatus}`);
      
      // Intentar enviar notificación, pero no fallar si hay problemas
      try {
        // Use centralized notification service
        await handleAppointmentStatusChange(appointmentId, newStatus, appointmentData);
        console.log(`Status change to ${newStatus} processed successfully`);
      } catch (notificationError) {
        console.error('Error en sistema de notificaciones:', notificationError);
        // No interrumpir el flujo principal si fallan las notificaciones
      }
      
      // Actualizar UI con éxito
      setSnackbar({
        open: true,
        message: `Estado de cita cambiado a ${newStatus} correctamente!`,
        severity: 'success'
      });
      
      // Forzar actualización de los datos en la UI
      // No es necesario ya que onSnapshot manejará la actualización automáticamente
    } catch (error) {
      console.error('Error updating appointment:', error);
      
      // Registro de error para depuración
      console.error(`Error al cambiar estado de cita ${appointmentId} a ${newStatus}:`, error);
      
      setSnackbar({
        open: true,
        message: `Error al actualizar estado: ${error.message || 'Error desconocido'}`,
        severity: 'error'
      });
    }
  };

  // Función utilitaria para normalizar los datos de citas y evitar errores por datos faltantes
  const normalizeAppointmentData = (appointment) => {
    if (!appointment) return {};
    
    // Asegurarse de que los campos básicos existan
    const normalized = {
      ...appointment,
      status: appointment.status || 'pending',
      createdAt: appointment.createdAt || { seconds: Date.now() / 1000 },
      updatedAt: appointment.updatedAt || { seconds: Date.now() / 1000 },
      userName: appointment.userName || appointment.customerName || 'Cliente',
      userEmail: appointment.userEmail || appointment.customerEmail || '',
      service: appointment.service || 
               (Array.isArray(appointment.services) && appointment.services.length > 0 ? 
                appointment.services[0] : '') || 
               'Servicio no especificado',
      // Asegurarse de que estos objetos siempre existan
      address: appointment.address || {}
    };
    
    // Asegurarse de que el objeto date sea accesible
    if (normalized.date && normalized.date.seconds) {
      // Ya es un timestamp de Firestore, está bien
    } else if (normalized.date) {
      // Convertir a un objeto compatible
      try {
        const dateObj = new Date(normalized.date);
        normalized.date = {
          seconds: Math.floor(dateObj.getTime() / 1000),
          toDate: () => dateObj
        };
      } catch (e) {
        console.warn('Error normalizando fecha:', e);
        // Usar fecha actual como fallback
        const now = new Date();
        normalized.date = {
          seconds: Math.floor(now.getTime() / 1000),
          toDate: () => now
        };
      }
    } else {
      // Sin fecha, usar fecha actual
      const now = new Date();
      normalized.date = {
        seconds: Math.floor(now.getTime() / 1000),
        toDate: () => now
      };
    }
    
    return normalized;
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(normalizeAppointmentData(appointment));
    setDetailsDialogOpen(true);
  };

  // Function to view payment receipt
  const handleViewReceipt = (appointment) => {
    if (appointment.paymentReceiptUrl) {
      setCurrentReceipt({
        url: appointment.paymentReceiptUrl,
        fileName: appointment.paymentReceiptFileName || 'receipt',
        paymentMethod: appointment.paymentMethod || 'zelle'
      });
      setReceiptDialogOpen(true);
    }
  };

  const handleCloseReceiptDialog = () => {
    setReceiptDialogOpen(false);
    setCurrentReceipt(null);
  };

  // Function to start the deletion process
  const handleDeleteAppointment = async (appointment) => {
    // Verificar si la cita existe antes de intentar eliminarla
    const exists = await verifyAppointmentExists(appointment.id);
    if (!exists) {
      setSnackbar({
        open: true,
        message: 'La cita ya no existe en la base de datos.',
        severity: 'error'
      });
      return;
    }
    
    setAppointmentToDelete(normalizeAppointmentData(appointment));
    setDeleteDialogOpen(true);
  };
  
  // Function to confirm and execute appointment deletion
  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) {
      setDeleteDialogOpen(false);
      return;
    }
    
    try {
      // Mostrar indicador de carga
      setSnackbar({
        open: true,
        message: 'Eliminando cita...',
        severity: 'info'
      });
      
      // Verificar si la cita existe antes de intentar eliminarla
      const appointmentRef = doc(db, 'appointments', appointmentToDelete.id);
      const appointmentSnap = await getDoc(appointmentRef);
      
      if (!appointmentSnap.exists()) {
        throw new Error('La cita ya no existe en la base de datos');
      }
      
      // Registro para depuración
      console.log(`Eliminando cita ${appointmentToDelete.id} con estado ${appointmentToDelete.status || 'unknown'}`);
      
      // Eliminar la cita independientemente de su estado
      await deleteDoc(appointmentRef);
      
      setSnackbar({
        open: true,
        message: 'Cita eliminada correctamente',
        severity: 'success'
      });
      
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      
      // Registro de error para depuración
      console.error(`Error al eliminar cita ${appointmentToDelete.id}:`, error);
      
      setSnackbar({
        open: true,
        message: `Error al eliminar la cita: ${error.message || 'Error desconocido'}`,
        severity: 'error'
      });
    }
  };
  
  // Function to close the delete confirmation dialog
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'approved': return '#2e7d32';
      case 'completed': return '#1976d2';
      case 'rejected': return '#d32f2f';
      case 'cancelled': return '#757575';
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
      case 2: return appointments.filter(apt => apt.status === 'approved');
      case 3: return appointments.filter(apt => apt.status === 'completed');
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
      approved: appointments.filter(apt => apt.status === 'approved').length,
      completed: appointments.filter(apt => apt.status === 'completed').length
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
                  sx={{ fontWeight: 'bold', color: '#2e7d32' }}
                >
                  {counts.approved}
                </Typography>
                <Typography 
                  variant={isMobile ? "caption" : "body2"} 
                  color="text.secondary"
                >
                  {isMobile ? 'Scheduled' : 'Scheduled'}
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
            <Tab label={isMobile ? `Scheduled (${counts.approved})` : `Scheduled (${counts.approved})`} />
            <Tab label={isMobile ? `Completed (${counts.completed})` : `Completed (${counts.completed})`} />
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
                     tabValue === 2 ? 'No scheduled appointments.' :
                     tabValue === 3 ? 'No completed appointments.' :
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
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <Email fontSize="small" sx={{ fontSize: isSmallMobile ? '0.8rem' : '0.9rem', opacity: 0.8 }} />
                              {appointment.userEmail || appointment.customerEmail}
                            </Typography>
                            {appointment.bookingSource === 'web_url' && (
                              <Chip 
                                label="Usuario desde página web"
                                size="small"
                                sx={{
                                  mt: 0.5,
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: '#e3f2fd',
                                  color: '#1976d2',
                                  fontWeight: 500,
                                  '& .MuiChip-label': {
                                    px: 1
                                  }
                                }}
                              />
                            )}
                            {appointment.customerPhone && (
                              <Typography 
                                variant="caption"
                                color="text.secondary"
                                sx={{ 
                                  fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                <Phone fontSize="small" sx={{ fontSize: isSmallMobile ? '0.8rem' : '0.9rem', opacity: 0.8 }} />
                                {appointment.customerPhone}
                              </Typography>
                            )}
                            {appointment.vehiclePhone && (
                              <Typography 
                                variant="caption"
                                color="text.secondary"
                                sx={{ 
                                  fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  color: '#0891b2'
                                }}
                              >
                                <Phone fontSize="small" sx={{ fontSize: isSmallMobile ? '0.8rem' : '0.9rem', opacity: 0.8 }} />
                                {appointment.vehiclePhone} <span style={{ fontSize: '0.85em', opacity: 0.7 }}>(vehículo)</span>
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
                          {/* Servicios - Mejorado para múltiples servicios */}
                          <Box sx={{ mb: 1 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: isSmallMobile ? '0.65rem' : '0.7rem',
                                fontWeight: 600,
                                color: '#666',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                mb: 0.5,
                                display: 'block'
                              }}
                            >
                              Servicios:
                            </Typography>
                            {Array.isArray(appointment.services) && appointment.services.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                                {appointment.services.map((service, idx) => (
                                  <Chip
                                    key={idx}
                                    label={service}
                                    size="small"
                                    sx={{
                                      height: isSmallMobile ? 20 : 22,
                                      fontSize: isSmallMobile ? '0.65rem' : '0.7rem',
                                      bgcolor: '#f5f5f5',
                                      color: '#1976d2',
                                      fontWeight: 500,
                                      '& .MuiChip-label': {
                                        px: isSmallMobile ? 0.75 : 1,
                                        py: 0
                                      }
                                    }}
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography 
                                variant={isSmallMobile ? "body2" : "body1"} 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  fontSize: isSmallMobile ? '0.8rem' : '0.9rem',
                                  color: '#1976d2',
                                  mb: 0.5
                                }}
                              >
                                {appointment.service || appointment.serviceType || 'Car Detailing'}
                              </Typography>
                            )}
                          </Box>
                          
                          {/* Precio */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography 
                              variant="caption"
                              sx={{ 
                                fontSize: isSmallMobile ? '0.65rem' : '0.7rem',
                                fontWeight: 600,
                                color: '#666'
                              }}
                            >
                              Precio Total:
                            </Typography>
                            <Typography 
                              variant={isSmallMobile ? "subtitle1" : "h6"} 
                              sx={{ 
                                fontWeight: 'bold', 
                                color: '#2e7d32',
                                fontSize: isSmallMobile ? '0.95rem' : '1.1rem'
                              }}
                            >
                              ${appointment.finalPrice || appointment.estimatedPrice || 'TBD'}
                            </Typography>
                          </Box>
                          
                          {/* Información del vehículo */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.75,
                            p: 0.75,
                            bgcolor: '#f8f9fa',
                            borderRadius: 1
                          }}>
                            <Typography 
                              variant="caption"
                              sx={{ 
                                fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                                color: '#555',
                                fontWeight: 500
                              }}
                            >
                              🚗 {appointment.vehicleType} {appointment.vehicleYear} {appointment.vehicleMake}
                            </Typography>
                          </Box>
                          
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
                          {appointment.paymentReceiptUrl && (
                            <Button
                              onClick={() => handleViewReceipt(appointment)}
                              variant="outlined"
                              size="small"
                              startIcon={!isSmallMobile && <Receipt />}
                              sx={{
                                fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                                minWidth: isSmallMobile ? 55 : 'auto',
                                px: isSmallMobile ? 1.5 : 1.5,
                                py: isSmallMobile ? 0.5 : 0.5,
                                height: isSmallMobile ? 28 : 32,
                                borderColor: '#6b21a8',
                                color: '#6b21a8',
                                '&:hover': {
                                  borderColor: '#581c87',
                                  bgcolor: 'rgba(107, 33, 168, 0.04)'
                                }
                              }}
                            >
                              {isSmallMobile ? 'Receipt' : 'Receipt'}
                            </Button>
                          )}
                          {appointment.status === 'approved' && (
                            <>
                              <Button
                                onClick={async () => {
                                  const exists = await verifyAppointmentExists(appointment.id);
                                  if (exists) {
                                    handleStatusChange(appointment.id, 'completed');
                                  } else {
                                    setSnackbar({
                                      open: true,
                                      message: 'La cita ya no existe en la base de datos.',
                                      severity: 'error'
                                    });
                                  }
                                }}
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
                              <Button
                                onClick={async () => {
                                  const exists = await verifyAppointmentExists(appointment.id);
                                  if (exists) {
                                    handleStatusChange(appointment.id, 'cancelled');
                                  } else {
                                    setSnackbar({
                                      open: true,
                                      message: 'La cita ya no existe en la base de datos.',
                                      severity: 'error'
                                    });
                                  }
                                }}
                                variant="outlined"
                                size="small"
                                startIcon={!isSmallMobile && <Cancel />}
                                sx={{
                                  fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                                  minWidth: isSmallMobile ? 65 : 'auto',
                                  px: isSmallMobile ? 1.5 : 1.5,
                                  py: isSmallMobile ? 0.5 : 0.5,
                                  height: isSmallMobile ? 28 : 32,
                                  borderColor: '#757575',
                                  color: '#757575',
                                  '&:hover': {
                                    borderColor: '#616161',
                                    bgcolor: 'rgba(117, 117, 117, 0.04)'
                                  }
                                }}
                              >
                                {isSmallMobile ? 'Cancel' : 'Cancel'}
                              </Button>
                            </>
                          )}
                          {/* Botón para eliminar cita */}
                          <Button
                            onClick={() => handleDeleteAppointment(appointment)}
                            variant="outlined"
                            size="small"
                            startIcon={!isSmallMobile && <Delete />}
                            sx={{
                              fontSize: isSmallMobile ? '0.7rem' : '0.75rem',
                              minWidth: isSmallMobile ? 65 : 'auto',
                              px: isSmallMobile ? 1.5 : 1.5,
                              py: isSmallMobile ? 0.5 : 0.5,
                              height: isSmallMobile ? 28 : 32,
                              borderColor: '#d32f2f',
                              color: '#d32f2f',
                              '&:hover': {
                                borderColor: '#c62828',
                                bgcolor: 'rgba(211, 47, 47, 0.04)'
                              }
                            }}
                          >
                            Delete
                          </Button>
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
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email fontSize="small" sx={{ color: '#666', opacity: 0.8 }} />
                            {appointment.userEmail || appointment.customerEmail}
                          </Typography>
                          {appointment.bookingSource === 'web_url' && (
                            <Chip 
                              label="Usuario desde página web"
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: '#e3f2fd',
                                color: '#1976d2',
                                fontWeight: 500
                              }}
                            />
                          )}
                          {appointment.customerPhone && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone fontSize="small" sx={{ color: '#666', opacity: 0.8 }} />
                              {appointment.customerPhone}
                            </Typography>
                          )}
                          {appointment.vehiclePhone && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone fontSize="small" sx={{ color: '#0891b2', opacity: 0.8 }} />
                              {appointment.vehiclePhone} <span style={{ fontSize: '0.85em', opacity: 0.7 }}></span>
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(appointment.services) && appointment.services.length > 0 ? (
                          <Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5, maxWidth: 250 }}>
                              {appointment.services.map((service, idx) => (
                                <Chip
                                  key={idx}
                                  label={service}
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: '0.7rem',
                                    bgcolor: '#f5f5f5',
                                    color: '#1976d2',
                                    fontWeight: 500
                                  }}
                                />
                              ))}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                              {appointment.vehicleType} {appointment.vehicleYear} {appointment.vehicleMake}
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {appointment.service || appointment.serviceType || 'Car Detailing'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.vehicleType} {appointment.vehicleYear} {appointment.vehicleMake}
                            </Typography>
                          </Box>
                        )}
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
                            title="Ver detalles"
                          >
                            <Visibility />
                          </IconButton>
                          {appointment.paymentReceiptUrl && (
                            <IconButton
                              onClick={() => handleViewReceipt(appointment)}
                              sx={{ color: '#6b21a8' }}
                              size="small"
                              title="Ver comprobante de pago"
                            >
                              <Receipt />
                            </IconButton>
                          )}
                          {appointment.status === 'approved' && (
                            <>
                              <IconButton
                                onClick={async () => {
                                  const exists = await verifyAppointmentExists(appointment.id);
                                  if (exists) {
                                    handleStatusChange(appointment.id, 'completed');
                                  } else {
                                    setSnackbar({
                                      open: true,
                                      message: 'La cita ya no existe en la base de datos.',
                                      severity: 'error'
                                    });
                                  }
                                }}
                                sx={{ color: '#1976d2' }}
                                size="small"
                                title="Marcar como completada"
                              >
                                <CheckCircle />
                              </IconButton>
                              <IconButton
                                onClick={async () => {
                                  const exists = await verifyAppointmentExists(appointment.id);
                                  if (exists) {
                                    handleStatusChange(appointment.id, 'cancelled');
                                  } else {
                                    setSnackbar({
                                      open: true,
                                      message: 'La cita ya no existe en la base de datos.',
                                      severity: 'error'
                                    });
                                  }
                                }}
                                sx={{ color: '#757575' }}
                                size="small"
                                title="Cancelar cita"
                              >
                                <Cancel />
                              </IconButton>
                            </>
                          )}
                          {/* Botón para eliminar cita */}
                          <IconButton
                            onClick={() => handleDeleteAppointment(appointment)}
                            sx={{ color: '#d32f2f' }}
                            size="small"
                            title="Eliminar cita"
                          >
                            <Delete />
                          </IconButton>
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
                           tabValue === 2 ? 'No scheduled appointments.' :
                           tabValue === 3 ? 'No completed appointments.' :
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
                    {Array.isArray(selectedAppointment.services) && selectedAppointment.services.length > 0 ? (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          Services:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedAppointment.services.map((service, idx) => (
                            <Chip
                              key={idx}
                              label={service}
                              size="small"
                              sx={{
                                bgcolor: '#e3f2fd',
                                color: '#1976d2',
                                fontWeight: 500
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Service:</strong> {selectedAppointment.service || selectedAppointment.serviceType}
                      </Typography>
                    )}
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
                  {selectedAppointment.vehiclePhone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Phone sx={{ mr: 1, color: '#0891b2' }} />
                      <Typography variant="body2">
                        <strong>Vehicle Phone:</strong> {selectedAppointment.vehiclePhone}
                      </Typography>
                    </Box>
                  )}
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
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Button 
                  onClick={() => {
                    handleDeleteAppointment(selectedAppointment);
                    setDetailsDialogOpen(false);
                  }}
                  variant="outlined" 
                  color="error"
                  startIcon={<Delete />}
                  sx={{ mr: 1 }}
                >
                  Delete Appointment
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
                {selectedAppointment?.status === 'approved' && (
                  <>
                    <Button 
                      onClick={() => {
                        handleStatusChange(selectedAppointment.id, 'cancelled');
                        setDetailsDialogOpen(false);
                      }}
                      variant="outlined" 
                      color="inherit"
                      startIcon={<Cancel />}
                    >
                      Cancel Appointment
                    </Button>
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
                  </>
                )}
              </Box>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCancelDelete}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white', py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Delete />
              Confirm Deletion
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 1 }}>
            <Typography variant="h6" gutterBottom>
              Are you sure you want to delete this appointment?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This action cannot be undone and the appointment will be permanently removed from the system.
            </Typography>
            
            {appointmentToDelete && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'rgba(211, 47, 47, 0.05)', 
                borderRadius: 1, 
                border: '1px solid rgba(211, 47, 47, 0.2)' 
              }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Customer:</strong> {appointmentToDelete.userName || appointmentToDelete.customerName || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Service:</strong> {appointmentToDelete.service || appointmentToDelete.serviceType || 'Not specified'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Date:</strong> {appointmentToDelete.date?.toDate?.()?.toLocaleDateString() || 
                    appointmentToDelete.preferredDate?.toDate?.()?.toLocaleDateString() || 
                    appointmentToDelete.selectedDate || 'No date'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {appointmentToDelete.status || 'pending'}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={handleCancelDelete} 
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              variant="contained" 
              color="error"
              startIcon={<Delete />}
            >
              Delete Appointment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Receipt Viewer Dialog */}
        <Dialog
          open={receiptDialogOpen}
          onClose={handleCloseReceiptDialog}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            bgcolor: '#6b21a8',
            color: 'white'
          }}>
            <Receipt />
            Payment Receipt - {currentReceipt?.paymentMethod?.toUpperCase() || 'ZELLE'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {currentReceipt && (
              <Box>
                <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
                  <strong>File:</strong> {currentReceipt.fileName}
                </Typography>
                
                {/* Check if it's an image or PDF */}
                {currentReceipt.url && (
                  currentReceipt.fileName.toLowerCase().endsWith('.pdf') ? (
                    // PDF Viewer
                    <Box>
                      <Box sx={{ 
                        p: 2, 
                        mb: 2, 
                        bgcolor: '#f1f5f9', 
                        borderRadius: 2,
                        textAlign: 'center' 
                      }}>
                        <PictureAsPdf sx={{ fontSize: '4rem', color: '#d32f2f', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          PDF Receipt
                        </Typography>
                        <Button
                          variant="contained"
                          href={currentReceipt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<PictureAsPdf />}
                          sx={{
                            bgcolor: '#d32f2f',
                            '&:hover': { bgcolor: '#c62828' }
                          }}
                        >
                          Open PDF in New Tab
                        </Button>
                      </Box>
                      <iframe
                        src={currentReceipt.url}
                        width="100%"
                        height="600px"
                        title="Payment Receipt PDF"
                        style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                    </Box>
                  ) : (
                    // Image Viewer
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 2,
                      bgcolor: '#f8f9fa',
                      borderRadius: 2
                    }}>
                      <img 
                        src={currentReceipt.url} 
                        alt="Payment Receipt" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '70vh',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Button
                        variant="outlined"
                        href={currentReceipt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<ImageOutlined />}
                        sx={{ mt: 2 }}
                      >
                        Open Full Size
                      </Button>
                    </Box>
                  )
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCloseReceiptDialog}
              variant="contained"
            >
              Close
            </Button>
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
