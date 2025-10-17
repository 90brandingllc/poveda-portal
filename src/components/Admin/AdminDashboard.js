import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalTickets: 0,
    totalRevenue: 0,
    activeClients: 0,
    isLoading: true
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Load dashboard stats and recent data
    const unsubscribeAppointments = onSnapshot(
      query(collection(db, 'appointments'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const allAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const recentAppointments = allAppointments.slice(0, 5);
        setRecentAppointments(recentAppointments);
        
        // Calculate stats from all appointments
        const totalRevenue = allAppointments
          .filter(apt => apt.status === 'completed')
          .reduce((sum, apt) => sum + (parseFloat(apt.finalPrice) || parseFloat(apt.estimatedPrice) || 0), 0);
        
        // Extraer emails únicos para clientes activos
        const clientEmails = allAppointments.map(apt => apt.userEmail || apt.customerEmail);
        const uniqueEmailsSet = new Set(clientEmails);
        const uniqueEmails = Array.from(uniqueEmailsSet);
        const uniqueClients = uniqueEmailsSet.size;
        
        // Mostrar en consola para depurar
        console.log('Emails únicos de clientes:', uniqueEmails);
        console.log('Total clientes únicos:', uniqueClients);
        
        setStats(prev => ({
          ...prev,
          totalAppointments: allAppointments.length,
          pendingAppointments: allAppointments.filter(apt => apt.status === 'pending').length,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          activeClients: uniqueClients,
          isLoading: false
        }));
      }
    );

    const unsubscribeEstimates = onSnapshot(
      query(collection(db, 'estimates'), orderBy('lastUpdated', 'desc'), limit(5)),
      (snapshot) => {
        const estimatesData = [];
        snapshot.forEach((doc) => {
          estimatesData.push({ id: doc.id, ...doc.data() });
        });
        console.log('Dashboard - Loaded estimates:', estimatesData.length);
        setRecentEstimates(estimatesData);
      }
    );

    // Usar exactamente la misma consulta que en ManageTickets.js para mantener consistencia
    const unsubscribeTickets = onSnapshot(
      query(collection(db, 'tickets'), orderBy('lastUpdated', 'desc')),
      (snapshot) => {
        // Obtener tickets de la misma manera que en ManageTickets.js
        const ticketsData = [];
        snapshot.forEach((doc) => {
          ticketsData.push({ id: doc.id, ...doc.data() });
        });
        
        // Para la vista previa del dashboard, solo mostrar los 5 más recientes
        const recentTickets = ticketsData.slice(0, 5);
        setRecentTickets(recentTickets);
        
        // Log para verificar que coincide con la página de Manage Support Tickets
        console.log('Dashboard - Total tickets (igual que en Manage Support Tickets):', ticketsData.length);
        
        // Actualizar el contador para que sea exactamente el mismo que en Manage Support Tickets
        setStats(prev => ({
          ...prev,
          totalTickets: ticketsData.length
        }));
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
          <Card 
            onClick={() => navigate('/admin/appointments')}
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)', 
              border: '1px solid rgba(229, 231, 235, 0.8)',
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease',
                '& .card-icon': {
                  transform: 'scale(1.1)',
                }
              }
            }}
          >
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              borderRadius: '0 0 0 100%',
              background: 'rgba(25, 118, 210, 0.05)',
              zIndex: 0
            }} />
            
            <Box sx={{ 
              p: 3, 
              textAlign: 'left',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, mb: 1 }}>
                    Total Appointments
                  </Typography>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700, 
                    color: '#111827', 
                    lineHeight: 1,
                    fontSize: { xs: '1.8rem', sm: '2.2rem' }
                  }}>
                    {stats.isLoading ? '...' : stats.totalAppointments}
                  </Typography>
                </Box>
                
                <Schedule 
                  className="card-icon"
                  sx={{ 
                    fontSize: 40, 
                    color: '#1976d2', 
                    p: 1,
                    borderRadius: '12px',
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                    transition: 'transform 0.2s ease'
                  }} 
                />
              </Box>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            onClick={() => navigate('/admin/tickets')}
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)', 
              border: '1px solid rgba(229, 231, 235, 0.8)',
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease',
                '& .card-icon': {
                  transform: 'scale(1.1)',
                }
              }
            }}
          >
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              borderRadius: '0 0 0 100%',
              background: 'rgba(156, 39, 176, 0.05)',
              zIndex: 0
            }} />
            
            <Box sx={{ 
              p: 3, 
              textAlign: 'left',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, mb: 1 }}>
                    Support Tickets
                  </Typography>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700, 
                    color: '#111827', 
                    lineHeight: 1,
                    fontSize: { xs: '1.8rem', sm: '2.2rem' }
                  }}>
                    {stats.isLoading ? '...' : stats.totalTickets}
                  </Typography>
                </Box>
                
                <SupportAgent 
                  className="card-icon"
                  sx={{ 
                    fontSize: 40, 
                    color: '#9c27b0', 
                    p: 1,
                    borderRadius: '12px',
                    bgcolor: 'rgba(156, 39, 176, 0.1)',
                    transition: 'transform 0.2s ease'
                  }} 
                />
              </Box>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            onClick={() => navigate('/admin/appointments?filter=completed')}
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)', 
              border: '1px solid rgba(229, 231, 235, 0.8)',
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease',
                '& .card-icon': {
                  transform: 'scale(1.1)',
                }
              }
            }}
          >
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              borderRadius: '0 0 0 100%',
              background: 'rgba(46, 125, 50, 0.05)',
              zIndex: 0
            }} />
            
            <Box sx={{ 
              p: 3, 
              textAlign: 'left',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, mb: 1 }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700, 
                    color: '#111827', 
                    lineHeight: 1,
                    fontSize: { xs: '1.8rem', sm: '2.2rem' },
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Box component="span" sx={{ fontSize: '70%', mr: 0.5, color: '#2e7d32' }}>$</Box>
                    {stats.isLoading ? '...' : stats.totalRevenue.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Typography>
                </Box>
                
                <AttachMoney 
                  className="card-icon"
                  sx={{ 
                    fontSize: 40, 
                    color: '#2e7d32', 
                    p: 1,
                    borderRadius: '12px',
                    bgcolor: 'rgba(46, 125, 50, 0.1)',
                    transition: 'transform 0.2s ease'
                  }} 
                />
              </Box>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            onClick={() => navigate('/admin/appointments')}
            sx={{ 
              background: 'rgba(255, 255, 255, 0.9)', 
              border: '1px solid rgba(229, 231, 235, 0.8)',
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease',
                '& .card-icon': {
                  transform: 'scale(1.1)',
                }
              }
            }}
          >
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              borderRadius: '0 0 0 100%',
              background: 'rgba(156, 39, 176, 0.05)',
              zIndex: 0
            }} />
            
            <Box sx={{ 
              p: 3, 
              textAlign: 'left',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500, mb: 1 }}>
                    Active Clients
                  </Typography>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700, 
                    color: '#111827', 
                    lineHeight: 1,
                    fontSize: { xs: '1.8rem', sm: '2.2rem' }
                  }}>
                    {stats.isLoading ? '...' : stats.activeClients}
                  </Typography>
                </Box>
                
                <TrendingUp 
                  className="card-icon"
                  sx={{ 
                    fontSize: 40, 
                    color: '#9c27b0', 
                    p: 1,
                    borderRadius: '12px',
                    bgcolor: 'rgba(156, 39, 176, 0.1)',
                    transition: 'transform 0.2s ease'
                  }} 
                />
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Data Cards */}
      <Grid container spacing={{ xs: 3, sm: 6 }}>
        {/* Recent Appointments */}
        <Grid item xs={12} lg={4}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              color: '#0891b2',
              fontSize: { xs: '1.15rem', md: '1.35rem' },
              '& svg': { color: '#0891b2' }
            }}
          >
            <Assignment sx={{ 
              mr: 1.5, 
              p: 0.8, 
              borderRadius: '12px',
              bgcolor: 'rgba(8, 145, 178, 0.1)', 
              fontSize: '1.6rem' 
            }} />
            Recent Appointments
          </Typography>
          
          <Card sx={{ 
            height: 400, 
            display: 'flex', 
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(10px)', 
            border: '1px solid rgba(8, 145, 178, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
              <List sx={{ py: 0 }}>
                {recentAppointments.length > 0 ? recentAppointments.map((appointment) => (
                  <ListItem 
                    key={appointment.id} 
                    sx={{ 
                      py: 1.5,
                      px: 2, 
                      mb: 1.5, 
                      border: '1px solid rgba(229, 231, 235, 0.6)', 
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(8, 145, 178, 0.04)',
                        borderColor: 'rgba(8, 145, 178, 0.2)',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: appointment.status === 'completed' 
                          ? 'rgba(37, 99, 235, 0.1)' 
                          : appointment.status === 'rejected' 
                            ? 'rgba(220, 38, 38, 0.1)' 
                            : appointment.status === 'pending' 
                              ? 'rgba(245, 158, 11, 0.1)' 
                              : 'rgba(16, 185, 129, 0.1)',
                        width: 40, 
                        height: 40,
                        color: appointment.status === 'completed' 
                          ? '#1e40af' 
                          : appointment.status === 'rejected' 
                            ? '#b91c1c' 
                            : appointment.status === 'pending' 
                              ? '#d97706' 
                              : '#047857',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}>
                        {appointment.status === 'pending' ? <Schedule /> : 
                         appointment.status === 'completed' ? <CheckCircle /> : <Assignment />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600, 
                          color: '#111827',
                          fontSize: '0.95rem',
                          mb: 0.5
                        }}>
                          {appointment.userName || 'Unknown Customer'}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 500 }}>
                            {appointment.servicePackage || 'Car Detailing'} - ${appointment.estimatedPrice || 'TBD'}
                          </Typography>
                          <Chip 
                            label={appointment.status || 'pending'} 
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: appointment.status === 'completed' 
                                ? 'rgba(37, 99, 235, 0.1)' 
                                : appointment.status === 'rejected' 
                                  ? 'rgba(220, 38, 38, 0.1)' 
                                  : appointment.status === 'pending' 
                                    ? 'rgba(245, 158, 11, 0.1)' 
                                    : 'rgba(16, 185, 129, 0.1)',
                              color: appointment.status === 'completed' 
                                ? '#1e40af' 
                                : appointment.status === 'rejected' 
                                  ? '#b91c1c' 
                                  : appointment.status === 'pending' 
                                    ? '#d97706' 
                                    : '#047857',
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                              borderRadius: '6px',
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
            <Box 
              sx={{ 
                p: 2, 
                borderTop: '1px solid rgba(229, 231, 235, 0.6)',
                backgroundColor: 'rgba(249, 250, 251, 0.5)'
              }}
            >
              <Button
                component={Link}
                to="/admin/appointments"
                variant="contained"
                fullWidth
                startIcon={<Visibility />}
                sx={{ 
                  bgcolor: '#0891b2',
                  color: 'white',
                  py: 1.2,
                  boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)',
                  borderRadius: '10px',
                  '&:hover': {
                    bgcolor: '#0e7490',
                    boxShadow: '0 6px 16px rgba(8, 145, 178, 0.3)',
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
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              color: '#b45309',
              fontSize: { xs: '1.15rem', md: '1.35rem' },
              '& svg': { color: '#b45309' }
            }}
          >
            <SupportAgent sx={{ 
              mr: 1.5, 
              p: 0.8, 
              borderRadius: '12px',
              bgcolor: 'rgba(180, 83, 9, 0.1)', 
              fontSize: '1.6rem' 
            }} />
            Recent Support Tickets
          </Typography>
          
          <Card sx={{ 
            height: 400, 
            display: 'flex', 
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(10px)', 
            border: '1px solid rgba(180, 83, 9, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
              <List sx={{ py: 0 }}>
                {recentTickets.length > 0 ? recentTickets.map((ticket) => (
                  <ListItem 
                    key={ticket.id} 
                    sx={{ 
                      py: 1.5,
                      px: 2, 
                      mb: 1.5, 
                      border: '1px solid rgba(229, 231, 235, 0.6)', 
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(180, 83, 9, 0.04)',
                        borderColor: 'rgba(180, 83, 9, 0.2)',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: ticket.priority === 'high' 
                          ? 'rgba(220, 38, 38, 0.1)' 
                          : ticket.priority === 'medium' 
                            ? 'rgba(245, 158, 11, 0.1)' 
                            : 'rgba(16, 185, 129, 0.1)',
                        width: 40, 
                        height: 40,
                        color: ticket.priority === 'high' 
                          ? '#b91c1c' 
                          : ticket.priority === 'medium' 
                            ? '#d97706' 
                            : '#047857',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}>
                        <SupportAgent />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600, 
                          color: '#111827',
                          fontSize: '0.95rem',
                          mb: 0.5
                        }}>
                          {ticket.subject || 'Support Request'}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ 
                            color: ticket.priority === 'high' ? '#b91c1c' : '#4b5563',
                            fontWeight: ticket.priority === 'high' ? 600 : 500 
                          }}>
                            {ticket.priority || 'Normal'} Priority
                          </Typography>
                          <Chip 
                            label={ticket.status || 'open'} 
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: ticket.status === 'open' ? 'rgba(245, 158, 11, 0.1)' : 
                                      ticket.status === 'in-progress' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: ticket.status === 'open' ? '#d97706' : 
                                      ticket.status === 'in-progress' ? '#1e40af' : '#047857',
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                              borderRadius: '6px',
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
            <Box 
              sx={{ 
                p: 2, 
                borderTop: '1px solid rgba(229, 231, 235, 0.6)',
                backgroundColor: 'rgba(249, 250, 251, 0.5)'
              }}
            >
              <Button
                component={Link}
                to="/admin/tickets"
                variant="contained"
                fullWidth
                startIcon={<SupportAgent />}
                sx={{ 
                  bgcolor: '#b45309',
                  color: 'white',
                  py: 1.2,
                  boxShadow: '0 4px 12px rgba(180, 83, 9, 0.2)',
                  borderRadius: '10px',
                  '&:hover': {
                    bgcolor: '#92400e',
                    boxShadow: '0 6px 16px rgba(180, 83, 9, 0.3)',
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
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              color: '#047857',
              fontSize: { xs: '1.15rem', md: '1.35rem' },
              '& svg': { color: '#047857' }
            }}
          >
            <RequestQuote sx={{ 
              mr: 1.5, 
              p: 0.8, 
              borderRadius: '12px',
              bgcolor: 'rgba(4, 120, 87, 0.1)', 
              fontSize: '1.6rem' 
            }} />
            Recent Estimates
          </Typography>
          
          <Card sx={{ 
            height: 400, 
            display: 'flex', 
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(10px)', 
            border: '1px solid rgba(4, 120, 87, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-4px)'
            }
          }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
              <List sx={{ py: 0 }}>
                {recentEstimates.length > 0 ? recentEstimates.map((estimate) => (
                  <ListItem 
                    key={estimate.id} 
                    sx={{ 
                      py: 1.5,
                      px: 2, 
                      mb: 1.5, 
                      border: '1px solid rgba(229, 231, 235, 0.6)', 
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(4, 120, 87, 0.04)',
                        borderColor: 'rgba(4, 120, 87, 0.2)',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: estimate.status === 'approved' 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : estimate.status === 'rejected' 
                            ? 'rgba(220, 38, 38, 0.1)' 
                            : estimate.status === 'pending' 
                              ? 'rgba(245, 158, 11, 0.1)' 
                              : 'rgba(37, 99, 235, 0.1)',
                        width: 40, 
                        height: 40,
                        color: estimate.status === 'approved' 
                          ? '#047857' 
                          : estimate.status === 'rejected' 
                            ? '#b91c1c' 
                            : estimate.status === 'pending' 
                              ? '#d97706' 
                              : '#1e40af',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                      }}>
                        {estimate.status === 'pending' ? <Schedule /> : 
                         estimate.status === 'quoted' ? <AttachMoney /> : 
                         estimate.status === 'approved' ? <CheckCircle /> : <RequestQuote />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600, 
                          color: '#111827',
                          fontSize: '0.95rem',
                          mb: 0.5
                        }}>
                          {estimate.userName || 'Unknown Customer'}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 500 }}>
                            {estimate.vehicleType || 'Vehicle'} - ${estimate.estimatedPrice || 'TBD'}
                          </Typography>
                          <Chip 
                            label={estimate.status || 'pending'} 
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: estimate.status === 'approved' 
                                ? 'rgba(16, 185, 129, 0.1)' 
                                : estimate.status === 'rejected' 
                                  ? 'rgba(220, 38, 38, 0.1)' 
                                  : estimate.status === 'pending' 
                                    ? 'rgba(245, 158, 11, 0.1)' 
                                    : 'rgba(37, 99, 235, 0.1)',
                              color: estimate.status === 'approved' 
                                ? '#047857' 
                                : estimate.status === 'rejected' 
                                  ? '#b91c1c' 
                                  : estimate.status === 'pending' 
                                    ? '#d97706' 
                                    : '#1e40af',
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                              borderRadius: '6px',
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
            <Box 
              sx={{ 
                p: 2, 
                borderTop: '1px solid rgba(229, 231, 235, 0.6)',
                backgroundColor: 'rgba(249, 250, 251, 0.5)'
              }}
            >
              <Button
                component={Link}
                to="/admin/estimates"
                variant="contained"
                fullWidth
                startIcon={<RequestQuote />}
                sx={{ 
                  bgcolor: '#047857',
                  color: 'white',
                  py: 1.2,
                  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)',
                  borderRadius: '10px',
                  '&:hover': {
                    bgcolor: '#065f46',
                    boxShadow: '0 6px 16px rgba(4, 120, 87, 0.3)',
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