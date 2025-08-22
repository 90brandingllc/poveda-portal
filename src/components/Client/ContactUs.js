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
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

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

  useEffect(() => {
    if (currentUser) {
      const ticketsQuery = query(
        collection(db, 'tickets'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
        const ticketData = [];
        snapshot.forEach((doc) => {
          ticketData.push({ id: doc.id, ...doc.data() });
        });
        setTickets(ticketData);
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
            message: formData.message,
            timestamp: serverTimestamp()
          }
        ]
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Contact & Support
      </Typography>

      <Grid container spacing={4}>
        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Support sx={{ mr: 1, color: '#1976d2' }} />
                Get In Touch
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 2, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Phone Support
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      (555) 123-4567
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 2, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Email Support
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      support@povedaautocare.com
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 2, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Support Hours
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mon-Fri: 8AM-6PM<br />
                      Sat-Sun: 9AM-5PM
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 2, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Service Area
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mobile Service Available<br />
                      We Come To You!
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                  Emergency Support
                </Typography>
                <Typography variant="body2">
                  For urgent matters, please call our emergency line at (555) 123-4567
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          {/* FAQ Quick Links */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Help
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="How to reschedule my appointment?"
                    secondary="Visit 'My Appointments' to modify your booking"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="What should I prepare for service?"
                    secondary="Remove personal items and ensure vehicle access"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="How long does detailing take?"
                    secondary="2-6 hours depending on the package selected"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Support Ticket Form & History */}
        <Grid item xs={12} md={8}>
          {/* Create New Ticket */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Chat sx={{ mr: 1, color: '#1976d2' }} />
                Create Support Ticket
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Your support ticket has been created successfully! Our team will respond within 24 hours.
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      name="subject"
                      label="Subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="Brief description of your issue"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      select
                      name="priority"
                      label="Priority"
                      value={formData.priority}
                      onChange={handleChange}
                      SelectProps={{ native: true }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      name="message"
                      label="Message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Please describe your issue or question in detail..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={<Send />}
                      disabled={loading}
                      sx={{ mr: 2 }}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      size="large"
                      onClick={() => setFormData({ subject: '', message: '', priority: 'medium' })}
                    >
                      Clear
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>

          {/* Support Ticket History */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Your Support Tickets
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {tickets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Support sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No support tickets yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first ticket above if you need assistance
                  </Typography>
                </Box>
              ) : (
                <List>
                  {tickets.map((ticket, index) => (
                    <React.Fragment key={ticket.id}>
                      <ListItem 
                        button
                        onClick={() => handleTicketClick(ticket)}
                        sx={{ borderRadius: 1, mb: 1, '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getStatusColor(ticket.status) }}>
                            {ticket.status === 'resolved' ? <CheckCircle /> : <Pending />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {ticket.subject}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip 
                                  label={ticket.priority} 
                                  size="small"
                                  sx={{ 
                                    bgcolor: getPriorityColor(ticket.priority),
                                    color: 'white',
                                    textTransform: 'capitalize'
                                  }}
                                />
                                <Chip 
                                  label={ticket.status} 
                                  size="small"
                                  sx={{ 
                                    bgcolor: getStatusColor(ticket.status),
                                    color: 'white',
                                    textTransform: 'capitalize'
                                  }}
                                />
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              Created: {ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                              {ticket.messages && ` • ${ticket.messages.length} message${ticket.messages.length !== 1 ? 's' : ''}`}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < tickets.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ticket Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Support Ticket Details</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={selectedTicket?.priority} 
                size="small"
                sx={{ 
                  bgcolor: getPriorityColor(selectedTicket?.priority),
                  color: 'white',
                  textTransform: 'capitalize'
                }}
              />
              <Chip 
                label={selectedTicket?.status} 
                size="small"
                sx={{ 
                  bgcolor: getStatusColor(selectedTicket?.status),
                  color: 'white',
                  textTransform: 'capitalize'
                }}
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {selectedTicket.subject}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Created: {new Date(selectedTicket.createdAt?.seconds * 1000).toLocaleString()}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Conversation:
              </Typography>
              
              {selectedTicket.messages && selectedTicket.messages.map((msg, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: msg.sender === 'user' ? '#e3f2fd' : '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: msg.sender === 'user' ? '#1976d2' : '#666' }}>
                    {msg.sender === 'user' ? 'You' : 'Support Team'}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {msg.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ContactUs;
