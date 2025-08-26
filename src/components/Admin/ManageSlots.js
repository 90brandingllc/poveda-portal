import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ButtonGroup,
  Tooltip,
  Avatar,
  MenuItem
} from '@mui/material';
import {
  Schedule,
  Block,
  Delete,
  ArrowBack,
  CalendarToday,
  AccessTime,
  CheckCircle,
  Cancel,
  ChevronLeft,
  ChevronRight,
  Today,
  ViewWeek,
  ViewModule,
  Person,
  Event,
  Add
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { weatherService } from '../../services/weatherService';

const ManageSlots = () => {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'));
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [deleteDialog, setDeleteDialog] = useState({ open: false, slot: null });
  const [newSlotDialog, setNewSlotDialog] = useState({ open: false, date: null, time: null });
  const [addAppointmentDialog, setAddAppointmentDialog] = useState({ 
    open: false, 
    date: null, 
    timeSlot: null 
  });
  const [appointmentForm, setAppointmentForm] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    service: '',
    vehicleDetails: '',
    notes: ''
  });
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Service options for appointments
  const serviceOptions = [
    'Exterior Detail',
    'Interior Detail',
    'Full Detail',
    'Ceramic Coating',
    'Paint Protection Film',
    'Engine Bay Cleaning',
    'Headlight Restoration',
    'Wheel & Tire Detail'
  ];

  // Generate time slots for business hours (9 AM - 5 PM)
  const generateTimeSlots = () => {
    const slots = [];
    // Generate 1-hour slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      slots.push({
        hour: hour,
        label: dayjs().hour(hour).minute(0).format('h:mm A'),
        time: `${hour}:00`
      });
    }
    return slots;
  };

  // Get week days for calendar view
  const getWeekDays = () => {
    const days = [];
    for (let i = 1; i <= 5; i++) { // Monday to Friday only
      const day = currentWeek.add(i, 'day');
      days.push(day);
    }
    return days;
  };

  // Get appointments for a specific date and time
  const getAppointmentForSlot = (date, time) => {
    return appointments.find(apt => {
      const aptDate = dayjs(apt.date.toDate());
      return aptDate.isSame(date, 'day') && apt.timeSlot === time;
    });
  };

  // Get blocked slot for a specific date and time
  const getBlockedSlotForTime = (date, time) => {
    return blockedSlots.find(blocked => {
      const blockedDate = dayjs(blocked.date.toDate());
      return blockedDate.isSame(date, 'day') && blocked.timeSlot === time;
    });
  };

  // Check if a slot is available
  const isSlotAvailable = (date, time) => {
    // Skip weekends
    if (date.day() === 0 || date.day() === 6) return false;
    
    // Check if there's an appointment
    if (getAppointmentForSlot(date, time)) return false;
    
    // Check if slot is blocked
    if (getBlockedSlotForTime(date, time)) return false;
    
    return true;
  };

  // Load weather forecast for the week
  const loadWeatherData = async () => {
    setWeatherLoading(true);
    try {
      // Get user's location
      const location = await weatherService.getUserLocation();
      
      // Get appointment dates for the week
      const weekDays = getWeekDays();
      const appointmentDates = weekDays.map(day => day.toDate());
      
      // Fetch weather forecast
      const forecast = await weatherService.getForecast(
        location.lat, 
        location.lon, 
        appointmentDates
      );
      
      setWeatherForecast(forecast);
    } catch (error) {
      console.error('Error loading weather data:', error);
      setWeatherForecast([]);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Load appointments and blocked slots for the current week
  const loadWeekData = async () => {
    setLoading(true);
    try {
      const weekStart = currentWeek.startOf('week').toDate();
      const weekEnd = currentWeek.endOf('week').toDate();

      // Load appointments for the week
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('date', '>=', weekStart),
        where('date', '<=', weekEnd)
      );
      
      const appointmentSnapshot = await getDocs(appointmentsQuery);
      const appointmentData = [];
      appointmentSnapshot.forEach((doc) => {
        appointmentData.push({ id: doc.id, ...doc.data() });
      });

      // Load blocked slots for the week
      const blockedQuery = query(
        collection(db, 'blockedSlots'),
        where('date', '>=', weekStart),
        where('date', '<=', weekEnd)
      );
      
      const blockedSnapshot = await getDocs(blockedQuery);
      const blockedData = [];
      blockedSnapshot.forEach((doc) => {
        blockedData.push({ id: doc.id, ...doc.data() });
      });

      setAppointments(appointmentData);
      setBlockedSlots(blockedData);
      
      // Load weather data for the week
      loadWeatherData();
    } catch (error) {
      console.error('Error loading week data:', error);
    }
    setLoading(false);
  };

  // Block a time slot
  const blockSlot = async (date, timeSlot) => {
    try {
      await addDoc(collection(db, 'blockedSlots'), {
        date: date.toDate(),
        timeSlot: timeSlot,
        blockedBy: 'admin',
        reason: 'Manually blocked',
        createdAt: serverTimestamp()
      });
      
      loadWeekData();
    } catch (error) {
      console.error('Error blocking slot:', error);
    }
  };

  // Unblock a time slot
  const unblockSlot = async (blockedSlotId) => {
    try {
      await deleteDoc(doc(db, 'blockedSlots', blockedSlotId));
      loadWeekData();
    } catch (error) {
      console.error('Error unblocking slot:', error);
    }
  };

  // Open dialog to add appointment manually
  const openAddAppointmentDialog = (date, timeSlot) => {
    setAddAppointmentDialog({
      open: true,
      date: date,
      timeSlot: timeSlot
    });
    setAppointmentForm({
      userName: '',
      userEmail: '',
      userPhone: '',
      service: '',
      vehicleDetails: '',
      notes: ''
    });
  };

  // Close add appointment dialog
  const closeAddAppointmentDialog = () => {
    setAddAppointmentDialog({ open: false, date: null, timeSlot: null });
    setAppointmentForm({
      userName: '',
      userEmail: '',
      userPhone: '',
      service: '',
      vehicleDetails: '',
      notes: ''
    });
  };

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create appointment manually
  const createAppointment = async () => {
    try {
      if (!appointmentForm.userName || !appointmentForm.userEmail || !appointmentForm.service) {
        alert('Please fill in all required fields (Name, Email, Service)');
        return;
      }

      const appointmentData = {
        userName: appointmentForm.userName,
        userEmail: appointmentForm.userEmail,
        userPhone: appointmentForm.userPhone || '',
        service: appointmentForm.service,
        vehicleDetails: appointmentForm.vehicleDetails || '',
        notes: appointmentForm.notes || '',
        date: addAppointmentDialog.date.toDate(),
        timeSlot: addAppointmentDialog.timeSlot,
        status: 'confirmed',
        bookedBy: 'admin',
        createdAt: serverTimestamp(),
        paymentStatus: 'pending'
      };

      await addDoc(collection(db, 'appointments'), appointmentData);
      
      closeAddAppointmentDialog();
      loadWeekData();
      
      alert('Appointment created successfully!');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Error creating appointment. Please try again.');
    }
  };

  // Get weather for a specific date
  const getWeatherForDate = (date) => {
    if (!weatherForecast.length) return null;
    return weatherService.getWeatherForDate(weatherForecast, date.toDate());
  };

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeek(currentWeek.subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setCurrentWeek(currentWeek.add(1, 'week'));
  };

  const goToToday = () => {
    setCurrentWeek(dayjs().startOf('week'));
  };

  useEffect(() => {
    loadWeekData();
  }, [currentWeek]);

  // Render calendar cell content
  const renderCalendarCell = (date, timeSlot) => {
    const appointment = getAppointmentForSlot(date, timeSlot.label);
    const blockedSlot = getBlockedSlotForTime(date, timeSlot.label);
    
    if (appointment) {
      return (
        <Box
          sx={{
            height: '100%',
            minHeight: 60,
            p: 1,
            bgcolor: '#e3f2fd',
            border: '2px solid #2196f3',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: '#bbdefb' }
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#1565c0' }}>
            {appointment.userName}
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: '#1976d2' }}>
            {appointment.service}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            <Chip 
              label="Booked" 
              size="small" 
              sx={{ 
                height: 16, 
                fontSize: '0.65rem',
                bgcolor: '#2196f3',
                color: 'white'
              }} 
            />
            {(() => {
              const weather = getWeatherForDate(date);
              if (weather) {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <img 
                      src={weatherService.getIconUrl(weather.icon)} 
                      alt={weather.description}
                      style={{ width: 14, height: 14 }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#1976d2' }}>
                      {weather.temperature}°
                    </Typography>
                  </Box>
                );
              }
              return null;
            })()}
          </Box>
        </Box>
      );
    }

    if (blockedSlot) {
      return (
        <Box
          sx={{
            height: '100%',
            minHeight: 60,
            p: 1,
            bgcolor: '#fff3e0',
            border: '2px solid #ff9800',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: '#ffe0b2' }
          }}
          onClick={() => unblockSlot(blockedSlot.id)}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#ef6c00' }}>
            Blocked
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: '#f57c00' }}>
            {blockedSlot.reason}
          </Typography>
          <Chip 
            label="Click to unblock" 
            size="small" 
            sx={{ 
              height: 16, 
              fontSize: '0.65rem',
              bgcolor: '#ff9800',
              color: 'white',
              mt: 0.5
            }} 
          />
        </Box>
      );
    }

    // Available slot with options
    return (
      <Box
        sx={{
          height: '100%',
          minHeight: 60,
          p: 1,
          bgcolor: '#f1f8e9',
          border: '2px dashed #4caf50',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}
      >
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => openAddAppointmentDialog(date, timeSlot.label)}
          sx={{
            fontSize: '0.7rem',
            py: 0.5,
            px: 1,
            minHeight: 24,
            backgroundColor: '#2196f3',
            '&:hover': {
              backgroundColor: '#1976d2'
            }
          }}
        >
          Add Appointment
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<Block />}
          onClick={() => blockSlot(date, timeSlot.label)}
          sx={{
            fontSize: '0.7rem',
            py: 0.5,
            px: 1,
            minHeight: 24,
            borderColor: '#ff9800',
            color: '#ef6c00',
            '&:hover': {
              borderColor: '#f57c00',
              backgroundColor: 'rgba(255, 152, 0, 0.04)'
            }
          }}
        >
          Block Slot
        </Button>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            component={Link}
            to="/admin/dashboard"
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
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Appointment Calendar
          </Typography>
        </Box>

        {/* View Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ButtonGroup variant="outlined">
            <Button
              variant={viewMode === 'week' ? 'contained' : 'outlined'}
              startIcon={<ViewWeek />}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'contained' : 'outlined'}
              startIcon={<ViewModule />}
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Calendar Navigation */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={goToPreviousWeek} sx={{ bgcolor: '#f5f5f5' }}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600, minWidth: 300, textAlign: 'center' }}>
              {currentWeek.format('MMMM YYYY')}
            </Typography>
            <IconButton onClick={goToNextWeek} sx={{ bgcolor: '#f5f5f5' }}>
              <ChevronRight />
            </IconButton>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<Today />}
            onClick={goToToday}
            sx={{ ml: 2 }}
          >
            Today
          </Button>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#e3f2fd', border: '2px solid #2196f3', borderRadius: 0.5 }} />
            <Typography variant="body2">Booked Appointment</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#fff3e0', border: '2px solid #ff9800', borderRadius: 0.5 }} />
            <Typography variant="body2">Blocked Slot</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#f1f8e9', border: '2px dashed #4caf50', borderRadius: 0.5 }} />
            <Typography variant="body2">Available Slot</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Business Hours Info */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM (1-hour slots) • 
          <strong> Weekend Policy:</strong> Closed on Saturdays and Sundays
        </Typography>
      </Alert>

      {/* Calendar Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 600,
                      width: 120,
                      borderRight: '1px solid #e0e0e0'
                    }}
                  >
                    Time
                  </TableCell>
                  {getWeekDays().map((day) => (
                    <TableCell 
                      key={day.format('YYYY-MM-DD')}
                      align="center"
                      sx={{ 
                        bgcolor: '#f5f5f5', 
                        fontWeight: 600,
                        minWidth: 180,
                        borderRight: '1px solid #e0e0e0'
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {day.format('ddd')}
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700,
                          color: day.isSame(dayjs(), 'day') ? 'primary.main' : 'inherit'
                        }}>
                          {day.format('D')}
                        </Typography>
                        {(() => {
                          const weather = getWeatherForDate(day);
                          if (weather) {
                            return (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                mt: 1,
                                gap: 0.5
                              }}>
                                <img 
                                  src={weatherService.getIconUrl(weather.icon)} 
                                  alt={weather.description}
                                  style={{ width: 24, height: 24 }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                  {weather.temperature}°C
                                </Typography>
                              </Box>
                            );
                          } else if (weatherLoading) {
                            return (
                              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress size={16} />
                              </Box>
                            );
                          }
                          return null;
                        })()}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {generateTimeSlots().map((timeSlot) => (
                  <TableRow key={timeSlot.hour}>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: '#fafafa',
                        borderRight: '1px solid #e0e0e0',
                        verticalAlign: 'top',
                        py: 1
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {timeSlot.label}
                      </Typography>
                    </TableCell>
                    {getWeekDays().map((day) => (
                      <TableCell 
                        key={`${day.format('YYYY-MM-DD')}-${timeSlot.hour}`}
                        sx={{ 
                          p: 1, 
                          borderRight: '1px solid #e0e0e0',
                          verticalAlign: 'top'
                        }}
                      >
                        {renderCalendarCell(day, timeSlot)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Add Appointment Dialog */}
      <Dialog 
        open={addAppointmentDialog.open} 
        onClose={closeAddAppointmentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Event color="primary" />
          Add New Appointment
          {addAppointmentDialog.date && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Chip
                label={`${addAppointmentDialog.date.format('MMM D, YYYY')} at ${addAppointmentDialog.timeSlot}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              {(() => {
                const weather = getWeatherForDate(addAppointmentDialog.date);
                if (weather) {
                  return (
                    <Chip
                      icon={
                        <img 
                          src={weatherService.getIconUrl(weather.icon)} 
                          alt={weather.description}
                          style={{ width: 16, height: 16 }}
                        />
                      }
                      label={`${weather.temperature}°C - ${weather.description}`}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        backgroundColor: '#e3f2fd',
                        borderColor: '#2196f3',
                        color: '#1976d2'
                      }}
                    />
                  );
                }
                return null;
              })()}
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Customer Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Customer Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name *"
                value={appointmentForm.userName}
                onChange={(e) => handleFormChange('userName', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address *"
                type="email"
                value={appointmentForm.userEmail}
                onChange={(e) => handleFormChange('userEmail', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={appointmentForm.userPhone}
                onChange={(e) => handleFormChange('userPhone', e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Service Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                Service Details
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Service Type *"
                value={appointmentForm.service}
                onChange={(e) => handleFormChange('service', e.target.value)}
                variant="outlined"
                required
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select a service</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vehicle Details"
                value={appointmentForm.vehicleDetails}
                onChange={(e) => handleFormChange('vehicleDetails', e.target.value)}
                variant="outlined"
                placeholder="e.g., 2020 Honda Civic, White"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={appointmentForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                variant="outlined"
                multiline
                rows={3}
                placeholder="Additional notes or special requests..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={closeAddAppointmentDialog}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={createAppointment}
            variant="contained"
            color="primary"
            startIcon={<Event />}
            disabled={!appointmentForm.userName || !appointmentForm.userEmail || !appointmentForm.service}
          >
            Create Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageSlots;
