import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge
} from '@mui/material';
import {
  Dashboard,
  People,
  Assignment,
  AttachMoney,
  Visibility,
  CheckCircle,
  Cancel,
  TrendingUp,
  TrendingDown,
  Schedule,
  Star,
  Warning,
  Notifications,
  CalendarToday,
  MonetizationOn,
  PersonAdd,
  SupportAgent,
  Analytics,
  Assessment,
  RequestQuote
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    approvedAppointments: 0,
    rejectedAppointments: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    totalCustomers: 0,
    openTickets: 0,
    todaysAppointments: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Listen to appointments for comprehensive stats
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      orderBy('createdAt', 'desc')
    );

    const ticketsQuery = query(
      collection(db, 'tickets'),
      orderBy('lastUpdated', 'desc'),
      limit(5)
    );

    const estimatesQuery = query(
      collection(db, 'estimates'),
      orderBy('lastUpdated', 'desc'),
      limit(5)
    );

    // Appointments listener
    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointments = [];
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let pending = 0;
      let completed = 0;
      let approved = 0;
      let rejected = 0;
      let todaysCount = 0;
      const uniqueCustomers = new Set();
      const completedAppointmentValues = [];

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        appointments.push(data);
        
        // Count by status and calculate revenue
        switch (data.status) {
          case 'pending': 
            pending++;
            // Add deposit revenue for pending appointments
            const pendingDeposit = data.depositAmount || (data.estimatedPrice ? data.estimatedPrice * 0.5 : 0);
            totalRevenue += pendingDeposit;
            console.log(`💰 Pending Appointment ${data.id}: +$${pendingDeposit.toFixed(2)} (deposit)`);
            break;
          case 'completed': 
            completed++;
            const revenue = data.finalPrice || data.estimatedPrice || 0;
            totalRevenue += revenue;
            completedAppointmentValues.push(revenue);
            console.log(`💰 Completed Appointment ${data.id}: +$${revenue.toFixed(2)} (full payment)`);
            break;
          case 'approved': 
            approved++;
            // Add deposit revenue for approved appointments
            const approvedDeposit = data.depositAmount || (data.estimatedPrice ? data.estimatedPrice * 0.5 : 0);
            totalRevenue += approvedDeposit;
            console.log(`💰 Approved Appointment ${data.id}: +$${approvedDeposit.toFixed(2)} (deposit)`);
            break;
          case 'confirmed':
            approved++; // Count confirmed as approved
            // Add deposit revenue for confirmed appointments
            const confirmedDeposit = data.depositAmount || (data.estimatedPrice ? data.estimatedPrice * 0.5 : 0);
            totalRevenue += confirmedDeposit;
            console.log(`💰 Confirmed Appointment ${data.id}: +$${confirmedDeposit.toFixed(2)} (deposit)`);
            break;
          case 'rejected': rejected++; break;
          default: break;
        }

        // Monthly revenue calculation
        const appointmentDate = data.createdAt?.toDate?.() || new Date(data.createdAt);
        if (appointmentDate >= startOfMonth) {
          switch (data.status) {
            case 'pending':
            case 'approved': 
            case 'confirmed':
              // Add deposit revenue for this month
              const monthlyDeposit = data.depositAmount || (data.estimatedPrice ? data.estimatedPrice * 0.5 : 0);
              monthlyRevenue += monthlyDeposit;
              break;
            case 'completed':
              // Add full revenue for completed appointments
              monthlyRevenue += data.finalPrice || data.estimatedPrice || 0;
              break;
            default: break;
          }
        }

        // Today's appointments
        if (appointmentDate >= startOfDay) {
          todaysCount++;
        }

        // Track unique customers
        if (data.userId) {
          uniqueCustomers.add(data.userId);
        }
      });

      // Calculate average order value
      const averageOrderValue = completedAppointmentValues.length > 0 
        ? completedAppointmentValues.reduce((a, b) => a + b, 0) / completedAppointmentValues.length 
        : 0;

      // Calculate conversion rate
      const conversionRate = snapshot.size > 0 ? (completed / snapshot.size) * 100 : 0;

      // Create notifications
      const newNotifications = [];
      if (pending > 5) {
        newNotifications.push({
          id: 'pending-appointments',
          type: 'warning',
          message: `${pending} appointments waiting for approval`,
          action: 'View Appointments'
        });
      }
      if (todaysCount > 0) {
        newNotifications.push({
          id: 'todays-appointments',
          type: 'info',
          message: `${todaysCount} appointments scheduled for today`,
          action: 'View Schedule'
        });
      }

      // Debug logging for revenue calculation
      console.log('📊 Revenue Calculation Debug:', {
        totalRevenue: totalRevenue.toFixed(2),
        monthlyRevenue: monthlyRevenue.toFixed(2),
        appointmentBreakdown: {
          pending: pending,
          approved: approved,
          completed: completed,
          rejected: rejected
        },
        totalAppointments: snapshot.size
      });

      setRecentAppointments(appointments.slice(0, 5));
      setNotifications(newNotifications);
      setStats(prev => ({
        ...prev,
        totalAppointments: snapshot.size,
        pendingAppointments: pending,
        completedAppointments: completed,
        approvedAppointments: approved,
        rejectedAppointments: rejected,
        totalRevenue,
        monthlyRevenue,
        averageOrderValue,
        conversionRate,
        totalCustomers: uniqueCustomers.size,
        todaysAppointments: todaysCount
      }));
    });

    // Tickets listener
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const tickets = [];
      let openTicketCount = 0;

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        tickets.push(data);
        if (data.status === 'open' || data.status === 'in-progress') {
          openTicketCount++;
        }
      });

      setRecentTickets(tickets);
      setStats(prev => ({ ...prev, openTickets: openTicketCount }));
      setLoading(false);
    });

    // Estimates listener
    const unsubscribeEstimates = onSnapshot(estimatesQuery, (snapshot) => {
      const estimates = [];
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        estimates.push(data);
      });
      setRecentEstimates(estimates);
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeTickets();
      unsubscribeEstimates();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'approved': return '#2e7d32';
      case 'completed': return '#1976d2';
      case 'rejected': return '#d32f2f';
      case 'in-progress': return '#1976d2';
      case 'quoted': return '#2e7d32';
      case 'declined': return '#d32f2f';
      default: return '#757575';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '2rem',
                fontWeight: 600
              }}
            >
              <Dashboard sx={{ fontSize: '2.5rem' }} />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Welcome back, {currentUser?.displayName || 'Admin'}! Manage your business operations here.
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {notifications.map((notification, index) => (
            <Grid item xs={12} key={notification.id}>
              <Alert 
                severity={notification.type}
                action={
                  <Button color="inherit" size="small">
                    {notification.action}
                  </Button>
                }
              >
                {notification.message}
              </Alert>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Enhanced Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Primary Metrics */}
        {[
          { 
            title: 'Total Revenue', 
            value: `$${stats.totalRevenue.toFixed(2)}`, 
            subtitle: `$${stats.monthlyRevenue.toFixed(2)} this month`,
            icon: <MonetizationOn />, 
            color: '#1976d2',
            trend: stats.monthlyRevenue > 0 ? 'up' : 'neutral',
            link: '/admin/appointments'
          },
          { 
            title: 'Pending Approvals', 
            value: stats.pendingAppointments, 
            subtitle: 'Require immediate attention',
            icon: <Schedule />, 
            color: '#ed6c02',
            trend: stats.pendingAppointments > 5 ? 'down' : 'neutral',
            link: '/admin/appointments'
          },
          { 
            title: 'Completed Services', 
            value: stats.completedAppointments, 
            subtitle: `${stats.conversionRate.toFixed(1)}% conversion rate`,
            icon: <CheckCircle />, 
            color: '#2e7d32',
            trend: stats.conversionRate > 80 ? 'up' : 'neutral',
            link: '/admin/appointments'
          },
          { 
            title: 'Active Customers', 
            value: stats.totalCustomers, 
            subtitle: `$${stats.averageOrderValue.toFixed(2)} avg order`,
            icon: <People />, 
            color: '#9c27b0',
            trend: 'up',
            link: '/admin/users'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              component={Link}
              to={stat.link}
              sx={{ 
                height: '100%',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
              }}
            >
              <CardContent sx={{ position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    {stat.subtitle}
                  </Typography>
                  {stat.trend === 'up' && <TrendingUp sx={{ color: '#4caf50', fontSize: 20 }} />}
                  {stat.trend === 'down' && <TrendingDown sx={{ color: '#f44336', fontSize: 20 }} />}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Secondary Metrics */}
        {[
          { 
            title: 'Today\'s Schedule', 
            value: stats.todaysAppointments, 
            subtitle: 'Appointments today',
            icon: <CalendarToday />, 
            color: '#3f51b5'
          },
          { 
            title: 'Open Tickets', 
            value: stats.openTickets, 
            subtitle: 'Support requests',
            icon: <SupportAgent />, 
            color: '#ff9800'
          },
          { 
            title: 'Approved Jobs', 
            value: stats.approvedAppointments, 
            subtitle: 'Ready to service',
            icon: <Assignment />, 
            color: '#4caf50'
          },
          { 
            title: 'Performance', 
            value: `${stats.conversionRate.toFixed(1)}%`, 
            subtitle: 'Booking success rate',
            icon: <Analytics />, 
            color: '#e91e63'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              sx={{ 
                p: 2,
                height: '100%',
                background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
                border: `1px solid ${stat.color}30`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: stat.color, width: 32, height: 32, mr: 2 }}>
                  {stat.icon}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stat.subtitle}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Left Sidebar - Quick Actions */}
        <Box sx={{ width: 280, flexShrink: 0 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
            <Dashboard sx={{ mr: 1 }} />
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              {
                title: 'Pending Approvals',
                description: `${stats.pendingAppointments} appointments waiting`,
                icon: <Schedule />,
                color: '#ed6c02',
                link: '/admin/appointments',
                badge: stats.pendingAppointments
              },
              {
                title: 'Support Tickets',
                description: `${stats.openTickets} open tickets`,
                icon: <SupportAgent />,
                color: '#ff9800',
                link: '/admin/tickets',
                badge: stats.openTickets
              },
              {
                title: 'Today\'s Schedule',
                description: `${stats.todaysAppointments} appointments today`,
                icon: <CalendarToday />,
                color: '#1976d2',
                link: '/admin/appointments'
              },
              {
                title: 'Revenue Analytics',
                description: 'View detailed reports',
                icon: <Assessment />,
                color: '#9c27b0',
                link: '/admin/analytics'
              }
            ].map((action, index) => (
              <Card 
                key={index}
                component={Link}
                to={action.link}
                sx={{
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  border: action.badge > 0 ? `2px solid ${action.color}` : 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: action.color, mr: 2 }}>
                        {action.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                    </Box>
                    {action.badge > 0 && (
                      <Badge badgeContent={action.badge} color="error">
                        <Notifications sx={{ color: action.color }} />
                      </Badge>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1 }}>
          <Grid container spacing={4}>

            {/* Recent Appointments */}
            <Grid item xs={12} lg={4}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
            <Assignment sx={{ mr: 1 }} />
            Recent Appointments
          </Typography>
          <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
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
                            From: {ticket.userName || ticket.userEmail}
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
                      secondary="Customer inquiries will appear here"
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
                            {estimate.projectTitle} - {estimate.serviceCategory}
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
                      secondary="Customer estimate requests will appear here"
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
              >
                View All Estimates
              </Button>
            </Box>
          </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
