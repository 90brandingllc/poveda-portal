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
  IconButton
} from '@mui/material';
import {
  Dashboard,
  People,
  Assignment,
  AttachMoney,

  Visibility,
  CheckCircle,
  Cancel
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
    totalRevenue: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    // Listen to appointments for stats
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointments = [];
      let totalRevenue = 0;
      let pending = 0;
      let completed = 0;

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        appointments.push(data);
        
        if (data.status === 'pending') pending++;
        if (data.status === 'completed') {
          completed++;
          totalRevenue += data.finalPrice || data.estimatedPrice || 0;
        }
      });

      setRecentAppointments(appointments.slice(0, 5));
      setStats({
        totalAppointments: snapshot.size,
        pendingAppointments: pending,
        completedAppointments: completed,
        totalRevenue
      });
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'approved': return '#2e7d32';
      case 'completed': return '#1976d2';
      case 'rejected': return '#d32f2f';
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

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            title: 'Total Appointments', 
            value: stats.totalAppointments, 
            icon: <Assignment />, 
            color: '#1976d2',
            link: '/admin/appointments'
          },
          { 
            title: 'Pending Approvals', 
            value: stats.pendingAppointments, 
            icon: <People />, 
            color: '#ed6c02',
            link: '/admin/appointments'
          },
          { 
            title: 'Completed Services', 
            value: stats.completedAppointments, 
            icon: <CheckCircle />, 
            color: '#2e7d32',
            link: '/admin/appointments'
          },
          { 
            title: 'Total Revenue', 
            value: `$${stats.totalRevenue}`, 
            icon: <AttachMoney />, 
            color: '#9c27b0',
            link: '/admin/appointments'
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
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {[
              {
                title: 'Manage Appointments',
                description: 'Review and approve bookings',
                icon: <Assignment />,
                color: '#1976d2',
                link: '/admin/appointments'
              },
              {
                title: 'Support Tickets',
                description: 'Handle customer inquiries',
                icon: <People />,
                color: '#2e7d32',
                link: '/admin/tickets'
              },
              {
                title: 'Estimate Requests',
                description: 'Review custom quotes',
                icon: <AttachMoney />,
                color: '#ed6c02',
                link: '/admin/estimates'
              },

              {
                title: 'Manage Users',
                description: 'Create admin accounts and manage users',
                icon: <People />,
                color: '#ff5722',
                link: '/admin/users'
              }
            ].map((action, index) => (
              <Grid item xs={12} key={index}>
                <Card 
                  component={Link}
                  to={action.link}
                  sx={{
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent>
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Recent Appointments */}
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Recent Appointments
          </Typography>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {appointment.userName || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {appointment.userEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {appointment.service || 'Car Detailing'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ${appointment.finalPrice || appointment.estimatedPrice || 'TBD'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={appointment.status || 'pending'} 
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(appointment.status),
                            color: 'white',
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <Visibility />
                        </IconButton>
                        {appointment.status === 'pending' && (
                          <>
                            <IconButton size="small" color="success">
                              <CheckCircle />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <Cancel />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button
                component={Link}
                to="/admin/appointments"
                variant="outlined"
                fullWidth
              >
                View All Appointments
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
