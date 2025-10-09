import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Phone,
  Email,
  LocationOn,
  Schedule,
  Send,
  Support,
  Chat,
  CheckCircle,
  Pending
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';

const ContactUs = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const phoneNumber = '6146535882'; // sin paréntesis ni espacios
  const whatsappLink = `https://wa.me/${phoneNumber}`;
  useEffect(() => {
    if (currentUser) {
      console.log('ContactUs - Setting up tickets listener for user:', currentUser.uid);
      
      // Temporarily remove orderBy to avoid index issues
      const ticketsQuery = query(
        collection(db, 'tickets'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
        console.log('ContactUs - Tickets snapshot received, size:', snapshot.size);
        const ticketData = [];
        snapshot.forEach((doc) => {
          console.log('ContactUs - Ticket data:', { id: doc.id, ...doc.data() });
          ticketData.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort client-side by createdAt
        ticketData.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return bTime - aTime;
        });
        
        console.log('ContactUs - Setting tickets:', ticketData);
        setTickets(ticketData);
      }, (error) => {
        console.error('ContactUs - Error in tickets listener:', error);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ticketData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        status: 'open',
        createdAt: serverTimestamp(),
        messages: [
          {
            sender: 'user',
            senderName: currentUser.displayName || currentUser.email,
            message: formData.message,
            timestamp: new Date()
          }
        ],
        lastUpdated: serverTimestamp()
      };

      await addDoc(collection(db, 'tickets'), ticketData);
      
      setSuccess(true);
      setFormData({ subject: '', message: '', priority: 'medium' });
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
    setLoading(false);
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setDialogOpen(true);
    setReplyMessage('');
  };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setReplyLoading(true);
    try {
      const ticketRef = doc(db, 'tickets', selectedTicket.id);
      
      await updateDoc(ticketRef, {
        messages: arrayUnion({
          sender: 'user',
          senderName: currentUser.displayName || currentUser.email,
          message: replyMessage.trim(),
          timestamp: new Date()
        }),
        lastUpdated: serverTimestamp(),
        status: selectedTicket.status === 'resolved' ? 'open' : selectedTicket.status // Reopen if was resolved
      });

      setReplyMessage('');
      
      // Update the selected ticket locally to show the new message immediately
      setSelectedTicket(prev => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          {
            sender: 'user',
            senderName: currentUser.displayName || currentUser.email,
            message: replyMessage.trim(),
            timestamp: new Date()
          }
        ]
      }));

    } catch (error) {
      console.error('Error sending reply:', error);
    }
    setReplyLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#ed6c02';
      case 'in-progress': return '#1976d2';
      case 'resolved': return '#2e7d32';
      case 'closed': return '#757575';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#d32f2f';
      case 'medium': return '#ed6c02';
      case 'low': return '#2e7d32';
      default: return '#757575';
    }
  };

  return (
    <ClientLayout>
      <Box
        sx={{
          mb: 5,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: '#e2e8f0',
          p: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              width: 70,
              height: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)'
            }}
          >
            <Support sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, mb: 1 }}>
              Contact & Support
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Get help from our team and track your support tickets in one place
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Chat />}
          sx={{
            bgcolor: '#1976d2',
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            fontWeight: 600,
            py: 1.5,
            px: 3,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': {
              background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
              boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)'
            }
          }}
          onClick={() => document.getElementById('support-form').scrollIntoView({ behavior: 'smooth' })}
        >
          Create New Ticket
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
            elevation={0}
          >
            <Box sx={{ 
              bgcolor: '#1976d2', 
              p: 3,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                <Support sx={{ mr: 1.5, fontSize: 24 }} />
                Get In Touch
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 1 }}>
                We're here to help with all your questions and concerns
              </Typography>
            </Box>
            
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3 }}>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      bgcolor: '#f0f7ff',
                      border: '1px solid',
                      borderColor: '#bbdefb',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 12px rgba(25, 118, 210, 0.15)'
                      }
                    }}
                  >
                    <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                      <Phone />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        Phone Support
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                        (614) 653 5882
                      </Typography>
                    </Box>
                  </Paper>
                </a>

                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    bgcolor: '#f0f7ff',
                    border: '1px solid',
                    borderColor: '#bbdefb',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 12px rgba(25, 118, 210, 0.15)'
                    }
                  }}
                >
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                    <Email />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Email Support
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                      support@povedapremiumautocare.com
                    </Typography>
                  </Box>
                </Paper>

                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    bgcolor: '#f0f7ff',
                    border: '1px solid',
                    borderColor: '#bbdefb',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 12px rgba(25, 118, 210, 0.15)'
                    }
                  }}
                >
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                    <Schedule />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Support Hours
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#334155', display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1976d2', mr: 1, display: 'inline-block' }} /> 
                        Regular: Monday–Sunday, 7:00 a.m. – 6:00 p.m.
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#334155', display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1976d2', mr: 1, display: 'inline-block' }} /> 
                        Summer: Monday–Sunday, 7:00 a.m. – 9:00 p.m.
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#334155', display: 'flex', alignItems: 'center' }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1976d2', mr: 1, display: 'inline-block' }} /> 
                        Customer Service Phone Support 24/7
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    bgcolor: '#f0f7ff',
                    border: '1px solid',
                    borderColor: '#bbdefb',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 12px rgba(25, 118, 210, 0.15)'
                    }
                  }}
                >
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                    <LocationOn />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Service Area
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                      4529 Parkwick Dr, Columbus, OH 43228
                    </Typography>
                    <Chip 
                      label="Mobile Service Available" 
                      size="small" 
                      sx={{ 
                        mt: 1, 
                        bgcolor: 'rgba(25, 118, 210, 0.1)', 
                        color: '#1976d2', 
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: '#bbdefb'
                      }} 
                    />
                  </Box>
                </Paper>
              </Box>
            </CardContent>
          </Card>


        </Grid>

        {/* Support Ticket Form & History */}
        <Grid item xs={12} md={8}>
          {/* Create New Ticket */}
          <Card 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
            elevation={0}
            id="support-form"
          >
            <Box sx={{ 
              bgcolor: '#1976d2', 
              p: 3,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                <Chat sx={{ mr: 1.5, fontSize: 24 }} />
                Create Support Ticket
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 1 }}>
                Let us know how we can help you by filling out the form below
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {success && (
                <Alert 
                  severity="success" 
                  variant="filled"
                  icon={<CheckCircle />}
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    alignItems: 'center',
                    '& .MuiAlert-message': {
                      fontWeight: 500
                    }
                  }}
                >
                  Your support ticket has been created successfully! Our team will respond within 24 hours.
                </Alert>
              )}

              <Box 
                component="form" 
                onSubmit={handleSubmit}
                sx={{
                  '& .MuiFormLabel-root': {
                    fontWeight: 500
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                      borderWidth: 2
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '1rem'
                  }
                }}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
                      Subject
                    </Typography>
                    <TextField
                      fullWidth
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="Brief description of your issue"
                      InputProps={{
                        sx: {
                          bgcolor: '#f8fafc',
                          '&:hover': {
                            bgcolor: '#f1f5f9'
                          },
                          '&.Mui-focused': {
                            bgcolor: '#fff',
                            boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.1)'
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
                      Priority
                    </Typography>
                    <TextField
                      fullWidth
                      select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      SelectProps={{ 
                        native: true,
                      }}
                      InputProps={{
                        sx: {
                          bgcolor: '#f8fafc',
                          '&:hover': {
                            bgcolor: '#f1f5f9'
                          },
                          '&.Mui-focused': {
                            bgcolor: '#fff',
                            boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.1)'
                          }
                        }
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
                      Message
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Please describe your issue or question in detail..."
                      InputProps={{
                        sx: {
                          bgcolor: '#f8fafc',
                          '&:hover': {
                            bgcolor: '#f1f5f9'
                          },
                          '&.Mui-focused': {
                            bgcolor: '#fff',
                            boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.1)'
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<Send />}
                        disabled={loading}
                        sx={{ 
                          bgcolor: '#1976d2',
                          background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                          fontWeight: 600,
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                            boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)'
                          }
                        }}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        size="large"
                        onClick={() => setFormData({ subject: '', message: '', priority: 'medium' })}
                        sx={{ 
                          fontWeight: 600,
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          borderWidth: '2px',
                          textTransform: 'none',
                          fontSize: '1rem',
                          color: '#64748b',
                          borderColor: '#cbd5e1',
                          '&:hover': {
                            borderColor: '#94a3b8',
                            bgcolor: 'rgba(226, 232, 240, 0.2)'
                          }
                        }}
                      >
                        Clear Form
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* Support Ticket History */}
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
            elevation={0}
          >
            <Box sx={{ 
              bgcolor: '#1976d2', 
              p: 3,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                <Support sx={{ mr: 1.5, fontSize: 24 }} />
                Your Support Tickets
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 1 }}>
                View and manage all your support requests
              </Typography>
            </Box>

            <CardContent sx={{ p: 0 }}>
              {tickets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                  <Box 
                    sx={{ 
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f0f7ff 0%, #e1f5fe 100%)',
                      border: '1px solid',
                      borderColor: '#bbdefb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 25px -5px rgba(25,118,210,0.2)'
                    }}
                  >
                    <Support sx={{ fontSize: 60, color: '#1976d2' }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 700, mb: 2 }}>
                    No Support Tickets Yet
                  </Typography>
                  <Typography variant="body1" color="#64748b" sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
                    Create your first support ticket using the form above and we'll respond within 24 hours
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Chat />}
                    onClick={() => document.getElementById('support-form').scrollIntoView({ behavior: 'smooth' })}
                    sx={{
                      bgcolor: '#1976d2',
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      fontWeight: 600,
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                        boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)'
                      }
                    }}
                  >
                    Create First Ticket
                  </Button>
                </Box>
              ) : (
                <Box sx={{ p: 0 }}>
                  {tickets.map((ticket, index) => (
                    <React.Fragment key={ticket.id}>
                      <Box 
                        sx={{
                          p: 3,
                          borderBottom: index < tickets.length - 1 ? '1px solid #e2e8f0' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            bgcolor: 'rgba(241, 245, 249, 0.6)',
                            '& .ticket-hover-button': {
                              opacity: 1,
                              transform: 'translateX(0)'
                            }
                          }
                        }}
                        onClick={() => handleTicketClick(ticket)}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item>
                            <Avatar 
                              sx={{ 
                                bgcolor: getStatusColor(ticket.status), 
                                width: 48, 
                                height: 48,
                                boxShadow: `0 4px 12px ${getStatusColor(ticket.status)}40`
                              }}
                            >
                              {ticket.status === 'resolved' ? <CheckCircle /> : <Pending />}
                            </Avatar>
                          </Grid>
                          
                          <Grid item xs={12} sm container>
                            <Grid item xs={12} sm={8}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                                {ticket.subject}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box 
                                    component="span" 
                                    sx={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      bgcolor: 'rgba(226, 232, 240, 0.6)', 
                                      color: '#64748b',
                                      py: 0.5,
                                      px: 1.5,
                                      borderRadius: 5,
                                      fontSize: '0.75rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                                    {ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                  </Box>
                                </Box>
                                
                                {ticket.messages && (
                                  <Box 
                                    component="span" 
                                    sx={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      bgcolor: 'rgba(226, 232, 240, 0.6)', 
                                      color: '#64748b',
                                      py: 0.5,
                                      px: 1.5,
                                      borderRadius: 5,
                                      fontSize: '0.75rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    <Chat sx={{ fontSize: 14, mr: 0.5 }} />
                                    {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                                  </Box>
                                )}
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mt: { xs: 1.5, sm: 0 } }}>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                                <Chip 
                                  label={ticket.priority} 
                                  size="small"
                                  sx={{ 
                                    background: `linear-gradient(90deg, ${getPriorityColor(ticket.priority)} 0%, ${getPriorityColor(ticket.priority)}DD 100%)`,
                                    color: 'white',
                                    textTransform: 'capitalize',
                                    fontWeight: 600,
                                    borderRadius: 1,
                                    boxShadow: `0 2px 8px ${getPriorityColor(ticket.priority)}40`
                                  }}
                                />
                                <Chip 
                                  label={ticket.status} 
                                  size="small"
                                  sx={{ 
                                    background: `linear-gradient(90deg, ${getStatusColor(ticket.status)} 0%, ${getStatusColor(ticket.status)}DD 100%)`,
                                    color: 'white',
                                    textTransform: 'capitalize',
                                    fontWeight: 600,
                                    borderRadius: 1,
                                    boxShadow: `0 2px 8px ${getStatusColor(ticket.status)}40`
                                  }}
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </Grid>
                        
                        <Button
                          className="ticket-hover-button"
                          variant="contained"
                          size="small"
                          sx={{ 
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%) translateX(100%)',
                            opacity: 0,
                            transition: 'all 0.3s ease',
                            bgcolor: '#1976d2',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: '#1565c0'
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTicketClick(ticket);
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </React.Fragment>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ticket Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        {selectedTicket && (
          <>
            <Box 
              sx={{ 
                bgcolor: getStatusColor(selectedTicket.status),
                py: 1,
                px: 3,
                background: `linear-gradient(90deg, ${getStatusColor(selectedTicket.status)} 0%, ${getStatusColor(selectedTicket.status)}DD 100%)`
              }}
            >
              <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                {selectedTicket.status} Ticket
              </Typography>
            </Box>
            
            <DialogTitle sx={{ py: 3, bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ maxWidth: { xs: '100%', sm: '70%' } }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {selectedTicket.subject}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarToday sx={{ fontSize: 16, color: '#64748b', mr: 0.7 }} />
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Created: {new Date(selectedTicket.createdAt?.seconds * 1000).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={selectedTicket.priority} 
                        size="small"
                        sx={{ 
                          background: `linear-gradient(90deg, ${getPriorityColor(selectedTicket.priority)} 0%, ${getPriorityColor(selectedTicket.priority)}DD 100%)`,
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: 600,
                          borderRadius: 1,
                          boxShadow: `0 2px 8px ${getPriorityColor(selectedTicket.priority)}40`
                        }}
                      />
                      <Chip 
                        label={selectedTicket.status} 
                        size="small"
                        sx={{ 
                          background: `linear-gradient(90deg, ${getStatusColor(selectedTicket.status)} 0%, ${getStatusColor(selectedTicket.status)}DD 100%)`,
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: 600,
                          borderRadius: 1,
                          boxShadow: `0 2px 8px ${getStatusColor(selectedTicket.status)}40`
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chat sx={{ mr: 1, fontSize: 20, color: '#1976d2' }} />
                  Conversation
                </Typography>
                
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    maxHeight: 400, 
                    overflowY: 'auto', 
                    p: 3, 
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    borderColor: '#e2e8f0',
                    mb: 3
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedTicket.messages && selectedTicket.messages.map((msg, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex',
                          flexDirection: msg.sender === 'user' ? 'row' : 'row-reverse',
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            bgcolor: msg.sender === 'user' ? '#1976d2' : '#ed6c02',
                            width: 38,
                            height: 38,
                            mr: msg.sender === 'user' ? 1.5 : 0,
                            ml: msg.sender === 'user' ? 0 : 1.5,
                            boxShadow: msg.sender === 'user' 
                              ? '0 3px 8px rgba(25, 118, 210, 0.2)'
                              : '0 3px 8px rgba(237, 108, 2, 0.2)',
                            alignSelf: 'flex-start'
                          }}
                        >
                          {msg.sender === 'user' ? <Support /> : <Support />}
                        </Avatar>
                        
                        <Box 
                          sx={{ 
                            maxWidth: '75%',
                            p: 2, 
                            bgcolor: msg.sender === 'user' ? '#e3f2fd' : '#fff8e1', 
                            borderRadius: 2,
                            position: 'relative',
                            '&:after': {
                              content: '""',
                              position: 'absolute',
                              top: 12,
                              [msg.sender === 'user' ? 'left' : 'right']: -8,
                              width: 0,
                              height: 0,
                              borderTop: '8px solid transparent',
                              borderBottom: '8px solid transparent',
                              [msg.sender === 'user' ? 'borderRight' : 'borderLeft']: msg.sender === 'user' 
                                ? '8px solid #e3f2fd'
                                : '8px solid #fff8e1',
                            }
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, color: msg.sender === 'user' ? '#1976d2' : '#ed6c02', mb: 0.5 }}>
                            {msg.sender === 'user' ? 'You' : 'Support Team'}
                            {msg.senderName && ` (${msg.senderName})`}
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.message}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block', textAlign: 'right' }}>
                            {msg.timestamp ? 
                              (msg.timestamp.seconds ? 
                                new Date(msg.timestamp.seconds * 1000).toLocaleString() : 
                                msg.timestamp.toLocaleString()) 
                              : 'Just now'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Reply Section */}
                {selectedTicket.status !== 'closed' && (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      bgcolor: '#f8fafc',
                      borderRadius: 2,
                      borderColor: '#e2e8f0',
                      mb: 3
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Send sx={{ mr: 1, fontSize: 18, color: '#1976d2' }} />
                      Add Reply
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply here..."
                      variant="outlined"
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'white',
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                            borderWidth: 2
                          }
                        } 
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        onClick={handleReplySubmit}
                        disabled={!replyMessage.trim() || replyLoading}
                        variant="contained"
                        startIcon={<Send />}
                        sx={{ 
                          borderRadius: 2,
                          py: 1,
                          px: 3,
                          fontWeight: 600,
                          textTransform: 'none',
                          background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                          boxShadow: '0 4px 12px rgba(25,118,210,0.15)'
                        }}
                      >
                        {replyLoading ? 'Sending...' : 'Send Reply'}
                      </Button>
                    </Box>
                  </Paper>
                )}

                {selectedTicket.status === 'closed' && (
                  <Alert 
                    severity="info" 
                    variant="outlined"
                    icon={<Support />}
                    sx={{ 
                      mt: 2,
                      borderRadius: 2,
                      borderWidth: 2,
                      borderColor: '#90caf9'
                    }}
                  >
                    This ticket has been closed. Please create a new ticket if you need further assistance.
                  </Alert>
                )}
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <Button 
                onClick={() => setDialogOpen(false)}
                variant="outlined"
                sx={{ 
                  borderRadius: 2, 
                  px: 3,
                  borderWidth: 2,
                  borderColor: '#cbd5e1',
                  color: '#64748b',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#94a3b8',
                    borderWidth: 2,
                    bgcolor: 'rgba(226, 232, 240, 0.2)'
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </ClientLayout>
  );
};

export default ContactUs;
