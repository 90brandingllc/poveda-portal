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
  TextField
} from '@mui/material';
import {
  Schedule,
  Block,
  Delete,
  ArrowBack,
  CalendarToday,
  AccessTime,
  CheckCircle,
  Cancel
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

const ManageSlots = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, slot: null });

  // Generate time slots for business hours (9 AM - 5 PM)
  const generateTimeSlots = (date) => {
    const slots = [];
    const selectedDay = dayjs(date);
    
    // Skip weekends
    if (selectedDay.day() === 0 || selectedDay.day() === 6) {
      return [];
    }
    
    // Generate 1-hour slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      const slotTime = selectedDay.hour(hour).minute(0).second(0);
      slots.push({
        time: slotTime,
        label: slotTime.format('h:mm A'),
        hour: hour
      });
    }
    
    return slots;
  };

  // Load appointments and blocked slots for selected date
  const loadSlotData = async (date) => {
    setLoading(true);
    try {
      const dayStart = dayjs(date).startOf('day').toDate();
      const dayEnd = dayjs(date).endOf('day').toDate();

      // Load appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('date', '>=', dayStart),
        where('date', '<=', dayEnd)
      );
      
      const appointmentSnapshot = await getDocs(appointmentsQuery);
      const appointmentData = [];
      appointmentSnapshot.forEach((doc) => {
        appointmentData.push({ id: doc.id, ...doc.data() });
      });

      // Load blocked slots
      const blockedQuery = query(
        collection(db, 'blockedSlots'),
        where('date', '>=', dayStart),
        where('date', '<=', dayEnd)
      );
      
      const blockedSnapshot = await getDocs(blockedQuery);
      const blockedData = [];
      blockedSnapshot.forEach((doc) => {
        blockedData.push({ id: doc.id, ...doc.data() });
      });

      setAppointments(appointmentData);
      setBlockedSlots(blockedData);

      // Generate available slots
      const allSlots = generateTimeSlots(date);
      const bookedSlots = appointmentData.map(app => app.timeSlot);
      const adminBlockedSlots = blockedData.map(block => block.timeSlot);
      
      const slotsWithStatus = allSlots.map(slot => ({
        ...slot,
        status: bookedSlots.includes(slot.label) ? 'booked' :
                adminBlockedSlots.includes(slot.label) ? 'blocked' : 'available',
        appointmentInfo: appointmentData.find(app => app.timeSlot === slot.label),
        blockedInfo: blockedData.find(block => block.timeSlot === slot.label)
      }));

      setAvailableSlots(slotsWithStatus);
    } catch (error) {
      console.error('Error loading slot data:', error);
    }
    setLoading(false);
  };

  // Block a time slot
  const blockSlot = async (slot) => {
    try {
      await addDoc(collection(db, 'blockedSlots'), {
        date: selectedDate.toDate(),
        timeSlot: slot.label,
        blockedBy: 'admin',
        reason: 'Manually blocked',
        createdAt: serverTimestamp()
      });
      
      loadSlotData(selectedDate);
    } catch (error) {
      console.error('Error blocking slot:', error);
    }
  };

  // Unblock a time slot
  const unblockSlot = async (slot) => {
    try {
      if (slot.blockedInfo) {
        await deleteDoc(doc(db, 'blockedSlots', slot.blockedInfo.id));
        loadSlotData(selectedDate);
      }
    } catch (error) {
      console.error('Error unblocking slot:', error);
    }
  };

  useEffect(() => {
    loadSlotData(selectedDate);
  }, [selectedDate]);

  const getSlotColor = (status) => {
    switch (status) {
      case 'booked': return '#f44336';
      case 'blocked': return '#ff9800';
      case 'available': return '#4caf50';
      default: return '#757575';
    }
  };

  const getSlotIcon = (status) => {
    switch (status) {
      case 'booked': return <Cancel />;
      case 'blocked': return <Block />;
      case 'available': return <CheckCircle />;
      default: return <Schedule />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
          Manage Appointment Slots
        </Typography>
      </Box>

      {/* Date Selection */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Select Date to Manage"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                minDate={dayjs()}
                maxDate={dayjs().add(90, 'day')}
                shouldDisableDate={(date) => {
                  // Disable weekends
                  return date.day() === 0 || date.day() === 6;
                }}
                renderInput={(params) => (
                  <TextField {...params} fullWidth />
                )}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<CheckCircle />} 
                label="Available" 
                sx={{ bgcolor: '#4caf50', color: 'white' }} 
              />
              <Chip 
                icon={<Cancel />} 
                label="Booked" 
                sx={{ bgcolor: '#f44336', color: 'white' }} 
              />
              <Chip 
                icon={<Block />} 
                label="Blocked" 
                sx={{ bgcolor: '#ff9800', color: 'white' }} 
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Business Hours Info */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM (1-hour slots)
          <br />
          <strong>Weekend Policy:</strong> Closed on Saturdays and Sundays
        </Typography>
      </Alert>

      {/* Slots Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : selectedDate.day() === 0 || selectedDate.day() === 6 ? (
        <Alert severity="warning">
          Business is closed on weekends. Please select a weekday.
        </Alert>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Slots for {selectedDate.format('dddd, MMMM D, YYYY')}
          </Typography>
          
          <Grid container spacing={2}>
            {availableSlots.map((slot, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card 
                  sx={{ 
                    border: `2px solid ${getSlotColor(slot.status)}`,
                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton 
                          size="small" 
                          sx={{ color: getSlotColor(slot.status), mr: 1 }}
                        >
                          {getSlotIcon(slot.status)}
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {slot.label}
                        </Typography>
                      </Box>
                      <Chip 
                        label={slot.status}
                        size="small"
                        sx={{
                          bgcolor: getSlotColor(slot.status),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>

                    {/* Slot Info */}
                    {slot.status === 'booked' && slot.appointmentInfo && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Customer: {slot.appointmentInfo.userName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Service: {slot.appointmentInfo.service}
                        </Typography>
                      </Box>
                    )}

                    {slot.status === 'blocked' && slot.blockedInfo && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Reason: {slot.blockedInfo.reason}
                        </Typography>
                      </Box>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {slot.status === 'available' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Block />}
                          onClick={() => blockSlot(slot)}
                          fullWidth
                        >
                          Block
                        </Button>
                      )}
                      
                      {slot.status === 'blocked' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => unblockSlot(slot)}
                          fullWidth
                        >
                          Unblock
                        </Button>
                      )}
                      
                      {slot.status === 'booked' && (
                        <Button
                          variant="outlined"
                          size="small"
                          disabled
                          fullWidth
                        >
                          Booked
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default ManageSlots;
