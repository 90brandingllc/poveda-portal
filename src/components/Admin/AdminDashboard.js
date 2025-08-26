import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  Assignment,
  CheckCircle,
  AttachMoney,
  RequestQuote,
  SupportAgent,
  Visibility
} from '@mui/icons-material';
import { db } from '../../firebase/config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    totalRevenue: 0,
    activeClients: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Load dashboard stats and recent data
    const unsubscribeAppointments = onSnapshot(
      query(collection(db, 'appointments'), orderBy('createdAt', 'desc'), limit(5)),
      (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentAppointments(appointments);
        
        // Calculate stats
        setStats(prev => ({
          ...prev,
          totalAppointments: appointments.length,
          pendingAppointments: appointments.filter(apt => apt.status === 'pending').length
        }));
      }
    );

    const unsubscribeEstimates = onSnapshot(
      query(collection(db, 'estimates'), orderBy('createdAt', 'desc'), limit(5)),
      (snapshot) => {
        const estimates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentEstimates(estimates);
      }
    );

    const unsubscribeTickets = onSnapshot(
      query(collection(db, 'tickets'), orderBy('createdAt', 'desc'), limit(5)),
      (snapshot) => {
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentTickets(tickets);
      }
    );

    return () => {
      unsubscribeAppointments();
      unsubscribeEstimates();
      unsubscribeTickets();
    };
  }, [currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'approved': return '#2e7d32';
      case 'completed': return '#1976d2';
      case 'cancelled': return '#d32f2f';
      default: return '#757575';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 4 } }}>
      <Typography variant="h3" sx={{ fontWeight: 700, color: '#4b5563', fontSize: { xs: '1.75rem', sm: '2.5rem' }, mb: { xs: 4, sm: 6 } }}>
        Admin Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 3, sm: 4 }} sx={{ mb: { xs: 4, sm: 6 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid rgba(229, 231, 235, 0.8)',
            borderRadius: 3,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transform: 'translateY(-1px)',
              transition: 'all 0.2s ease'
            }
          }}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 32, color: '#6b7280', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                {stats.totalAppointments}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.875rem' }}>
                Total Appointments
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid rgba(229, 231, 235, 0.8)',
            borderRadius: 3,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transform: 'translateY(-1px)',
              transition: 'all 0.2s ease'
            }
          }}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 32, color: '#6b7280', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                {stats.pendingAppointments}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.875rem' }}>
                Pending Appointments
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid rgba(229, 231, 235, 0.8)',
            borderRadius: 3,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transform: 'translateY(-1px)',
              transition: 'all 0.2s ease'
            }
          }}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 32, color: '#6b7280', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                ${stats.totalRevenue}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.875rem' }}>
                Total Revenue
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid rgba(229, 231, 235, 0.8)',
            borderRadius: 3,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transform: 'translateY(-1px)',
              transition: 'all 0.2s ease'
            }
          }}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 32, color: '#6b7280', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                {stats.activeClients}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.875rem' }}>
                Active Clients
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Data Cards */}
      <Grid container spacing={{ xs: 3, sm: 6 }}>
        {/* Recent Appointments */}
        <Grid item xs={12} lg={4}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', color: '#4b5563' }}>
            <Assignment sx={{ mr: 1, color: '#0891b2' }} />
            Recent Appointments
          </Typography>
          
          <Card sx={{ 
            height: 400, 
            display: 'flex', 
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(8px)', 
            border: 0, 
            boxShadow: 3
          }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              <List>
                {recentAppointments.length > 0 ? recentAppointments.map((appointment) => (
                  <ListItem key={appointment.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: getStatusColor(appointment.status), width: 32, height: 32 }}>
                        {appointment.status === 'pending' ? <Schedule /> : 
                         appointment.status === 'completed' ? <CheckCircle /> : <Assignment />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {appointment.userName || 'Unknown Customer'}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.servicePackage || 'Car Detailing'} - ${appointment.estimatedPrice || 'TBD'}
                          </Typography>
                          <Chip 
                            label={appointment.status || 'pending'} 
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: getStatusColor(appointment.status),
                              color: 'white',
                              textTransform: 'capitalize',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                )) : (
                  <ListItem>
                    <ListItemText 
                      primary="No recent appointments"
                      secondary="New bookings will appear here"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Button
                component={Link}
                to="/admin/appointments"
                variant="outlined"
                fullWidth
                startIcon={<Visibility />}
                sx={{ 
                  color: '#1976d2',
                  borderColor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#f5f5f5'
                  }
                }}
              >
                View All Appointments
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Recent Support Tickets */}
        <Grid item xs={12} lg={4}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
            <SupportAgent sx={{ mr: 1 }} />
            Recent Support Tickets
          </Typography>
          
          <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              <List>
                {recentTickets.length > 0 ? recentTickets.map((ticket) => (
                  <ListItem key={ticket.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: ticket.status === 'open' ? '#ed6c02' : 
                                ticket.status === 'in-progress' ? '#1976d2' : '#2e7d32',
                        width: 32, 
                        height: 32 
                      }}>
                        <SupportAgent />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ticket.subject || 'Support Request'}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {ticket.priority || 'Normal'} Priority
                          </Typography>
                          <Chip 
                            label={ticket.status || 'open'} 
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: ticket.status === 'open' ? '#ed6c02' : 
                                      ticket.status === 'in-progress' ? '#1976d2' : '#2e7d32',
                              color: 'white',
                              textTransform: 'capitalize',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                )) : (
                  <ListItem>
                    <ListItemText 
                      primary="No recent tickets"
                      secondary="Support requests will appear here"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Button
                component={Link}
                to="/admin/tickets"
                variant="outlined"
                fullWidth
                startIcon={<SupportAgent />}
                sx={{ 
                  color: '#ed6c02',
                  borderColor: '#ed6c02',
                  '&:hover': {
                    bgcolor: '#fff8e1'
                  }
                }}
              >
                View All Tickets
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Recent Estimates */}
        <Grid item xs={12} lg={4}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
            <RequestQuote sx={{ mr: 1 }} />
            Recent Estimates
          </Typography>
          
          <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              <List>
                {recentEstimates.length > 0 ? recentEstimates.map((estimate) => (
                  <ListItem key={estimate.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: getStatusColor(estimate.status),
                        width: 32, 
                        height: 32 
                      }}>
                        {estimate.status === 'pending' ? <Schedule /> : 
                         estimate.status === 'quoted' ? <AttachMoney /> : 
                         estimate.status === 'in-progress' ? <Assignment /> : <RequestQuote />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {estimate.userName || 'Unknown Customer'}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {estimate.vehicleType || 'Vehicle'} - ${estimate.estimatedPrice || 'TBD'}
                          </Typography>
                          <Chip 
                            label={estimate.status || 'pending'} 
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: getStatusColor(estimate.status),
                              color: 'white',
                              textTransform: 'capitalize',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                )) : (
                  <ListItem>
                    <ListItemText 
                      primary="No recent estimates"
                      secondary="Estimate requests will appear here"
                    />
                  </ListItem>
                )}
              </List>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Button
                component={Link}
                to="/admin/estimates"
                variant="outlined"
                fullWidth
                startIcon={<RequestQuote />}
                sx={{ 
                  color: '#9c27b0',
                  borderColor: '#9c27b0',
                  '&:hover': {
                    bgcolor: '#f3e5f5'
                  }
                }}
              >
                View All Estimates
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;