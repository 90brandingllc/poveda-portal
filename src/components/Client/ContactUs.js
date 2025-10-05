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
             
  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Phone sx={{ mr: 2, color: '#1976d2' }} />
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          Phone Support
        </Typography>
        <Typography variant="body2" color="text.secondary">
          (614) 653 5882
        </Typography>
      </Box>
    </Box>
  </a>


                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 2, color: '#1976d2' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Email Support
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      support@povedapremiumautocare.com
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
                      Regular: Monday–Sunday, 7:00 a.m. – 6:00 p.m.<br />
                      Summer: Monday–Sunday, 7:00 a.m. – 9:00 p.m.<br />
                      Customer Service Phone Support 24/7
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
                      4529 Parkwick Dr, Columbus, OH 43228<br />
                      Mobile Service Also Available
                    </Typography>
                  </Box>
                </Box>
              </Box>


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
              
              <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2 }}>
                {selectedTicket.messages && selectedTicket.messages.map((msg, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 2, 
                      p: 2, 
                      bgcolor: msg.sender === 'user' ? '#e3f2fd' : '#fff3e0', 
                      borderRadius: 2,
                      border: msg.sender === 'user' ? '1px solid #bbdefb' : '1px solid #ffcc02',
                      ml: msg.sender === 'user' ? 2 : 0,
                      mr: msg.sender === 'user' ? 0 : 2
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: msg.sender === 'user' ? '#1976d2' : '#f57c00' }}>
                      {msg.sender === 'user' ? '👤 You' : '🛠️ Support Team'}
                      {msg.senderName && ` (${msg.senderName})`}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
                      {msg.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {msg.timestamp ? 
                        (msg.timestamp.seconds ? 
                          new Date(msg.timestamp.seconds * 1000).toLocaleString() : 
                          msg.timestamp.toLocaleString()) 
                        : 'Just now'}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Reply Section */}
              {selectedTicket.status !== 'closed' && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
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
                    sx={{ mb: 2 }}
                  />
                  <Button
                    onClick={handleReplySubmit}
                    disabled={!replyMessage.trim() || replyLoading}
                    variant="contained"
                    startIcon={<Send />}
                    size="small"
                  >
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </Button>
                </Box>
              )}

              {selectedTicket.status === 'closed' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This ticket has been closed. Please create a new ticket if you need further assistance.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </ClientLayout>
  );
};

export default ContactUs;
