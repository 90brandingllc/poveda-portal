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
  MenuItem,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
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
  Add,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  SwipeLeft,
  SwipeRight
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'));
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(isMobile ? 'day' : 'week'); // Default to day view on mobile
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedTimeSlot, setExpandedTimeSlot] = useState(null);

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

  // Generate time slots - TODOS LOS DÍAS MISMO HORARIO
  // 7:30 am - 10:00 am - 1:00 pm - 3:00 pm - 5:00 pm
  const generateTimeSlots = (date = null) => {
    const slots = [];
    
    // ✅ NUEVOS HORARIOS: Todos los días tienen los mismos horarios
    const availableSlots = [
      { hour: 7, minute: 30, time: '7:30' },   // 7:30 AM
      { hour: 10, minute: 0, time: '10:00' },  // 10:00 AM
      { hour: 13, minute: 0, time: '13:00' },  // 1:00 PM
      { hour: 15, minute: 0, time: '15:00' },  // 3:00 PM
      { hour: 17, minute: 0, time: '17:00' }   // 5:00 PM
    ];
    
    // Generate slots for available times
    availableSlots.forEach(slot => {
      slots.push({
        hour: slot.hour,
        minute: slot.minute,
        label: dayjs().hour(slot.hour).minute(slot.minute).format('h:mm A'),
        time: slot.time
      });
    });
    
    return slots;
  };

  // Get week days for calendar view (including weekends now)
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) { // Sunday to Saturday (full week)
      const day = currentWeek.add(i, 'day');
      days.push(day);
    }
    return days;
  };

  // Get appointments for a specific date and time (puede haber hasta 2)
  const getAppointmentsForSlot = (date, time) => {
    return appointments.filter(apt => {
      const aptDate = dayjs(apt.date.toDate());
      // Solo contar appointments que no estén cancelados o rechazados
      return aptDate.isSame(date, 'day') && apt.timeSlot === time && 
             apt.status !== 'cancelled' && apt.status !== 'rejected';
    });
  };

  // Mantener función legacy para compatibilidad
  const getAppointmentForSlot = (date, time) => {
    const appointments = getAppointmentsForSlot(date, time);
    return appointments.length > 0 ? appointments[0] : null;
  };

  // Get blocked slot for a specific date and time
  const getBlockedSlotForTime = (date, time) => {
    return blockedSlots.find(blocked => {
      const blockedDate = dayjs(blocked.date.toDate());
      return blockedDate.isSame(date, 'day') && blocked.timeSlot === time;
    });
  };

  // Check if a slot is available (máximo 2 citas por horario)
  const isSlotAvailable = (date, time) => {
    const MAX_BOOKINGS_PER_SLOT = 2;
    
    // Skip Sundays
    if (date.day() === 0) return false;
    
    // Check if slot is blocked
    if (getBlockedSlotForTime(date, time)) return false;
    
    // Check how many appointments exist for this slot
    const appointmentsInSlot = getAppointmentsForSlot(date, time);
    if (appointmentsInSlot.length >= MAX_BOOKINGS_PER_SLOT) return false;
    
    return true;
  };

  // Get slot capacity info
  const getSlotCapacity = (date, time) => {
    const MAX_BOOKINGS_PER_SLOT = 2;
    const appointmentsInSlot = getAppointmentsForSlot(date, time);
    return {
      total: MAX_BOOKINGS_PER_SLOT,
      booked: appointmentsInSlot.length,
      available: MAX_BOOKINGS_PER_SLOT - appointmentsInSlot.length,
      appointments: appointmentsInSlot
    };
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

  // Render calendar cell content with mobile optimization
  const renderCalendarCell = (date, timeSlot) => {
    // ✅ Todos los horarios están disponibles todos los días
    const slotCapacity = getSlotCapacity(date, timeSlot.label);
    const blockedSlot = getBlockedSlotForTime(date, timeSlot.label);
    
    // Si hay citas en este horario (1 o 2)
    if (slotCapacity.booked > 0 && !blockedSlot) {
      const isFull = slotCapacity.available === 0;
      return (
        <Box
          sx={{
            height: '100%',
            minHeight: isMobile ? 100 : 80,
            p: isMobile ? 1.5 : 1,
            bgcolor: isFull ? '#e3f2fd' : '#fff9e6',
            border: isFull ? '2px solid #2196f3' : '2px solid #ffa726',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: isFull ? '#bbdefb' : '#ffe0b2' },
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}
        >
          {/* Mostrar todas las citas */}
          {slotCapacity.appointments.map((apt, index) => (
            <Box key={apt.id} sx={{ mb: index < slotCapacity.appointments.length - 1 ? 1 : 0 }}>
              <Typography 
                variant={isMobile ? "body2" : "caption"} 
                sx={{ fontWeight: 600, color: isFull ? '#1565c0' : '#e65100', fontSize: isMobile ? '0.875rem' : '0.75rem' }}
              >
                {index + 1}. {apt.userName}
              </Typography>
              <Typography 
                variant={isMobile ? "body2" : "caption"} 
                display="block" 
                sx={{ color: isFull ? '#1976d2' : '#f57c00', fontSize: isMobile ? '0.8rem' : '0.7rem' }}
              >
                {apt.service || (apt.services && apt.services.length > 0 ? apt.services[0] : 'Service')}
              </Typography>
            </Box>
          ))}
          
          {/* Indicador de capacidad */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mt: 0.5,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? 0.5 : 0
          }}>
            <Chip 
              label={isFull ? `Full (${slotCapacity.booked}/${slotCapacity.total})` : `${slotCapacity.booked}/${slotCapacity.total} - ${slotCapacity.available} left`}
              size={isMobile ? "medium" : "small"} 
              sx={{ 
                height: isMobile ? 20 : 16, 
                fontSize: isMobile ? '0.75rem' : '0.65rem',
                bgcolor: isFull ? '#2196f3' : '#ff9800',
                color: 'white'
              }} 
            />
            {(() => {
              const weather = getWeatherForDate(date);
              if (weather && !isMobile) {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <img 
                      src={weatherService.getIconUrl(weather.icon)} 
                      alt={weather.description}
                      style={{ width: 14, height: 14 }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: isFull ? '#1976d2' : '#f57c00' }}>
                      {weather.temperature}°
                    </Typography>
                  </Box>
                );
              }
              return null;
            })()} 
          </Box>
          
          {/* Botón para agregar segunda cita si hay espacio */}
          {!isFull && (
            <Button
              size={isMobile ? "small" : "small"}
              variant="outlined"
              color="primary"
              startIcon={<Add />}
              onClick={() => openAddAppointmentDialog(date, timeSlot.label)}
              sx={{
                fontSize: isMobile ? '0.7rem' : '0.65rem',
                py: 0.25,
                px: 0.5,
                mt: 0.5,
                minHeight: isMobile ? 24 : 20
              }}
            >
              Add 2nd
            </Button>
          )}
        </Box>
      );
    }

    if (blockedSlot) {
      return (
        <Box
          sx={{
            height: '100%',
            minHeight: isMobile ? 80 : 60,
            p: isMobile ? 1.5 : 1,
            bgcolor: '#fff3e0',
            border: '2px solid #ff9800',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: '#ffe0b2' }
          }}
          onClick={() => unblockSlot(blockedSlot.id)}
        >
          <Typography 
            variant={isMobile ? "body2" : "caption"} 
            sx={{ fontWeight: 600, color: '#ef6c00', fontSize: isMobile ? '0.875rem' : '0.75rem' }}
          >
            Blocked
          </Typography>
          <Typography 
            variant={isMobile ? "body2" : "caption"} 
            display="block" 
            sx={{ color: '#f57c00', fontSize: isMobile ? '0.8rem' : '0.7rem' }}
          >
            {blockedSlot.reason}
          </Typography>
          <Chip 
            label={isMobile ? "Tap to unblock" : "Click to unblock"} 
            size={isMobile ? "medium" : "small"} 
            sx={{ 
              height: isMobile ? 20 : 16, 
              fontSize: isMobile ? '0.75rem' : '0.65rem',
              bgcolor: '#ff9800',
              color: 'white',
              mt: 0.5
            }} 
          />
        </Box>
      );
    }

    // Available slot with options - mobile optimized
    return (
      <Box
        sx={{
          height: '100%',
          minHeight: isMobile ? 100 : 60,
          p: isMobile ? 1.5 : 1,
          bgcolor: '#f1f8e9',
          border: '2px dashed #4caf50',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 1 : 0.5
        }}
      >
        <Button
          size={isMobile ? "medium" : "small"}
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => openAddAppointmentDialog(date, timeSlot.label)}
          sx={{
            fontSize: isMobile ? '0.8rem' : '0.7rem',
            py: isMobile ? 0.75 : 0.5,
            px: isMobile ? 1.5 : 1,
            minHeight: isMobile ? 32 : 24,
            backgroundColor: '#2196f3',
            '&:hover': {
              backgroundColor: '#1976d2'
            }
          }}
        >
          {isMobile ? 'Add' : 'Add Appointment'}
        </Button>
        <Button
          size={isMobile ? "medium" : "small"}
          variant="outlined"
          color="warning"
          startIcon={<Block />}
          onClick={() => blockSlot(date, timeSlot.label)}
          sx={{
            fontSize: isMobile ? '0.8rem' : '0.7rem',
            py: isMobile ? 0.75 : 0.5,
            px: isMobile ? 1.5 : 1,
            minHeight: isMobile ? 32 : 24,
            borderColor: '#ff9800',
            color: '#ef6c00',
            '&:hover': {
              borderColor: '#f57c00',
              backgroundColor: 'rgba(255, 152, 0, 0.04)'
            }
          }}
        >
          {isMobile ? 'Block' : 'Block Slot'}
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ px: isMobile ? 1 : 0 }}>
      {/* Header - Mobile Responsive */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: isMobile ? 2 : 4,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
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
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 600,
              fontSize: isMobile ? '1.5rem' : '2.125rem'
            }}
          >
            {isMobile ? 'Calendar' : 'Appointment Calendar'}
          </Typography>
        </Box>

        {/* View Controls - Mobile Responsive */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center',
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'center' : 'flex-end'
        }}>
          <ButtonGroup variant="outlined" size={isMobile ? "small" : "medium"}>
            <Button
              variant={viewMode === 'week' ? 'contained' : 'outlined'}
              startIcon={!isSmallMobile && <ViewWeek />}
              onClick={() => setViewMode('week')}
              disabled={isMobile} // Disable week view on mobile for better UX
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'contained' : 'outlined'}
              startIcon={!isSmallMobile && <ViewModule />}
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Calendar Navigation - Mobile Responsive */}
      <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 3,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
            <IconButton 
              onClick={goToPreviousWeek} 
              sx={{ 
                bgcolor: '#f5f5f5',
                '&:hover': { bgcolor: '#e0e0e0' }
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              sx={{ 
                fontWeight: 600, 
                minWidth: isMobile ? 200 : 300, 
                textAlign: 'center',
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}
            >
              {isMobile ? currentWeek.format('MMM YYYY') : currentWeek.format('MMMM YYYY')}
            </Typography>
            <IconButton 
              onClick={goToNextWeek} 
              sx={{ 
                bgcolor: '#f5f5f5',
                '&:hover': { bgcolor: '#e0e0e0' }
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={!isSmallMobile && <Today />}
            onClick={goToToday}
            size={isMobile ? "small" : "medium"}
            sx={{ ml: isMobile ? 0 : 2 }}
          >
            Today
          </Button>
        </Box>

        {/* Legend - Mobile Responsive */}
        <Box sx={{ 
          display: 'flex', 
          gap: isMobile ? 1.5 : 3, 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#e3f2fd', border: '2px solid #2196f3', borderRadius: 0.5 }} />
            <Typography variant={isMobile ? "caption" : "body2"}>Booked Appointment</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#fff3e0', border: '2px solid #ff9800', borderRadius: 0.5 }} />
            <Typography variant={isMobile ? "caption" : "body2"}>Blocked Slot</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#f1f8e9', border: '2px dashed #4caf50', borderRadius: 0.5 }} />
            <Typography variant={isMobile ? "caption" : "body2"}>Available Slot</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Business Hours Info - Mobile Responsive */}
      <Alert severity="info" sx={{ mb: isMobile ? 2 : 4 }}>
        <Typography variant={isMobile ? "caption" : "body2"}>
          <strong>Business Hours:</strong> Mon-Fri, 9AM-5PM (1hr slots)
          {!isMobile && ' • '}
          {isMobile && <br />}
          <strong>Weekend Policy:</strong> Closed Sat & Sun
        </Typography>
      </Alert>

      {/* Calendar Grid - Mobile Responsive */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          {isMobile ? (
            // Mobile Day View - Vertical Layout
            <Box sx={{ p: 2 }}>
              {/* Day Selector for Mobile */}
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconButton 
                  onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))}
                  sx={{ bgcolor: '#f5f5f5' }}
                >
                  <SwipeLeft />
                </IconButton>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedDate.format('dddd')}
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700,
                    color: selectedDate.isSame(dayjs(), 'day') ? 'primary.main' : 'inherit'
                  }}>
                    {selectedDate.format('MMMM D, YYYY')}
                  </Typography>
                  {(() => {
                    const weather = getWeatherForDate(selectedDate);
                    if (weather) {
                      return (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          mt: 1,
                          gap: 1
                        }}>
                          <img 
                            src={weatherService.getIconUrl(weather.icon)} 
                            alt={weather.description}
                            style={{ width: 24, height: 24 }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                            {weather.temperature}°C - {weather.description}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  })()} 
                </Box>
                <IconButton 
                  onClick={() => setSelectedDate(selectedDate.add(1, 'day'))}
                  sx={{ bgcolor: '#f5f5f5' }}
                >
                  <SwipeRight />
                </IconButton>
              </Box>

              {/* Time Slots for Selected Day */}
              <Stack spacing={2}>
                {generateTimeSlots(selectedDate).map((timeSlot) => {
                  return (
                    <Card key={timeSlot.hour} sx={{ border: '1px solid #e0e0e0' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {timeSlot.label}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedTimeSlot(
                              expandedTimeSlot === timeSlot.hour ? null : timeSlot.hour
                            )}
                          >
                            {expandedTimeSlot === timeSlot.hour ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                        
                        <Collapse in={expandedTimeSlot === timeSlot.hour} timeout="auto" unmountOnExit>
                          {renderCalendarCell(selectedDate, timeSlot)}
                        </Collapse>
                        
                        {expandedTimeSlot !== timeSlot.hour && (
                          <Box>
                            {(() => {
                              const slotCapacity = getSlotCapacity(selectedDate, timeSlot.label);
                              const blockedSlot = getBlockedSlotForTime(selectedDate, timeSlot.label);
                              
                              if (blockedSlot) {
                                return (
                                  <Chip 
                                    label="Blocked Slot" 
                                    color="warning" 
                                    variant="filled"
                                    sx={{ width: '100%' }}
                                  />
                                );
                              }
                              
                              if (slotCapacity.booked > 0) {
                                const isFull = slotCapacity.available === 0;
                                return (
                                  <Chip 
                                    label={isFull ? `Full (${slotCapacity.booked}/${slotCapacity.total})` : `${slotCapacity.booked}/${slotCapacity.total} Booked - ${slotCapacity.available} left`}
                                    color={isFull ? "primary" : "warning"}
                                    variant="filled"
                                    sx={{ width: '100%' }}
                                  />
                                );
                              }
                              
                              return (
                                <Chip 
                                  label="Available (0/2)" 
                                  color="success" 
                                  variant="outlined"
                                  sx={{ width: '100%' }}
                                />
                              );
                            })()} 
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          ) : (
            // Desktop Week View - Table Layout
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
          )}
        </Paper>
      )}

      {/* Add Appointment Dialog - Mobile Responsive */}
      <Dialog 
        open={addAppointmentDialog.open} 
        onClose={closeAddAppointmentDialog}
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
