import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Divider,
  Avatar
} from '@mui/material';
import {
  Visibility,
  Reply,
  CheckCircle,
  Schedule,
  Email,
  Phone,
  Person,
  Info,
  BugReport
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { 
  collection, 
  onSnapshot, 
  updateDoc,
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

const ManageTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const ticketsData = [];
        snapshot.forEach((doc) => {
          ticketsData.push({ id: doc.id, ...doc.data() });
        });
        setTickets(ticketsData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setSnackbar({
        open: true,
        message: `Ticket ${newStatus} successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update ticket status.',
        severity: 'error'
      });
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      // Add admin response to ticket
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        adminResponse: replyMessage,
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSnackbar({
        open: true,
        message: 'Reply sent successfully!',
        severity: 'success'
      });

      setReplyDialogOpen(false);
      setReplyMessage('');
    } catch (error) {
      console.error('Error sending reply:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send reply.',
        severity: 'error'
      });
    }
  };

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setDetailsDialogOpen(true);
  };

  const handleReply = (ticket) => {
    setSelectedTicket(ticket);
    setReplyDialogOpen(true);
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

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'billing': return <Email />;
      case 'technical': return <BugReport />;
      case 'general': return <Info />;
      default: return <Info />;
    }
  };

  const getFilteredTickets = () => {
    switch (tabValue) {
      case 0: return tickets; // All
      case 1: return tickets.filter(ticket => ticket.status === 'open');
      case 2: return tickets.filter(ticket => ticket.status === 'in-progress');
      case 3: return tickets.filter(ticket => ticket.status === 'resolved');
      case 4: return tickets.filter(ticket => ticket.status === 'closed');
      default: return tickets;
    }
  };

  const getTabCounts = () => {
    return {
      all: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
    };
  };

  const counts = getTabCounts();
  const filteredTickets = getFilteredTickets();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          🎫 Manage Support Tickets
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {counts.all}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Tickets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                  {counts.open}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Open Tickets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {counts.inProgress}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {counts.resolved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resolved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label={`All (${counts.all})`} />
            <Tab label={`Open (${counts.open})`} />
            <Tab label={`In Progress (${counts.inProgress})`} />
            <Tab label={`Resolved (${counts.resolved})`} />
            <Tab label={`Closed (${counts.closed})`} />
          </Tabs>
        </Paper>

        {/* Tickets Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.9rem' }}>
                          {ticket.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {ticket.userName || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ticket.userEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {ticket.subject}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {ticket.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCategoryIcon(ticket.category)}
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {ticket.category}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.priority || 'Medium'} 
                        size="small"
                        sx={{
                          bgcolor: getPriorityColor(ticket.priority),
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.status || 'open'} 
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(ticket.status),
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {ticket.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ticket.createdAt?.toDate?.()?.toLocaleTimeString() || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleViewDetails(ticket)}
                          color="primary"
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <IconButton
                            onClick={() => handleReply(ticket)}
                            color="secondary"
                            size="small"
                          >
                            <Reply />
                          </IconButton>
                        )}
                        {ticket.status === 'open' && (
                          <IconButton
                            onClick={() => handleStatusChange(ticket.id, 'in-progress')}
                            sx={{ color: '#1976d2' }}
                            size="small"
                          >
                            <Schedule />
                          </IconButton>
                        )}
                        {ticket.status !== 'resolved' && (
                          <IconButton
                            onClick={() => handleStatusChange(ticket.id, 'resolved')}
                            sx={{ color: '#2e7d32' }}
                            size="small"
                          >
                            <CheckCircle />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                        No tickets found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        {tabValue === 0 ? 'No support tickets have been created yet.' : 'No tickets match the selected filter.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Ticket Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            Ticket Details - #{selectedTicket?.id?.slice(-8)}
          </DialogTitle>
          <DialogContent>
            {selectedTicket && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Person sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedTicket.userName || 'Unknown User'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Email sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedTicket.userEmail}
                    </Typography>
                  </Box>
                  {selectedTicket.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Phone sx={{ mr: 1, color: '#666' }} />
                      <Typography variant="body2">
                        {selectedTicket.phone}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Ticket Information
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Subject:</strong> {selectedTicket.subject}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Category:</strong> {selectedTicket.category}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Priority:</strong> 
                    <Chip 
                      label={selectedTicket.priority || 'Medium'} 
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: getPriorityColor(selectedTicket.priority),
                        color: 'white'
                      }}
                    />
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Status:</strong> 
                    <Chip 
                      label={selectedTicket.status || 'open'} 
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: getStatusColor(selectedTicket.status),
                        color: 'white'
                      }}
                    />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {selectedTicket.createdAt?.toDate?.()?.toLocaleString() || 'Recently'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Customer Message
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    p: 2, 
                    bgcolor: '#f5f5f5', 
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedTicket.message}
                  </Typography>

                  {selectedTicket.adminResponse && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                        Admin Response
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        p: 2, 
                        bgcolor: '#e8f5e8', 
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedTicket.adminResponse}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            {selectedTicket?.status !== 'resolved' && selectedTicket?.status !== 'closed' && (
              <Button 
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleReply(selectedTicket);
                }}
                variant="contained"
              >
                Reply
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog 
          open={replyDialogOpen} 
          onClose={() => setReplyDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            Reply to Ticket - {selectedTicket?.subject}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Your Response"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your response to the customer..."
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSendReply}
              variant="contained"
              disabled={!replyMessage.trim()}
            >
              Send Reply & Resolve
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default ManageTickets;
