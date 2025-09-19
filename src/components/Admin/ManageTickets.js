import React, { useState, useEffect } from 'react';
import {
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
  Avatar,
  useMediaQuery,
  useTheme,
  Stack
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
  BugReport,
  ArrowBack,
  Delete,
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { 
  collection, 
  onSnapshot, 
  updateDoc,
  deleteDoc,
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ManageTickets = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tickets, setTickets] = useState([]);
  const [, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'tickets'), orderBy('lastUpdated', 'desc')),
      (snapshot) => {
        const ticketsData = [];
        snapshot.forEach((doc) => {
          ticketsData.push({ id: doc.id, ...doc.data() });
        });
        console.log('Admin - Loaded tickets:', ticketsData);
        setTickets(ticketsData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: newStatus,
        lastUpdated: serverTimestamp()
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
      const ticketRef = doc(db, 'tickets', selectedTicket.id);
      
      // Add admin response to the messages array
      await updateDoc(ticketRef, {
        messages: arrayUnion({
          sender: 'admin',
          senderName: 'Support Team',
          message: replyMessage.trim(),
          timestamp: new Date()
        }),
        status: 'in-progress', // Set to in-progress when admin replies
        lastUpdated: serverTimestamp()
      });

      setSnackbar({
        open: true,
        message: 'Reply sent successfully!',
        severity: 'success'
      });

      setReplyDialogOpen(false);
      setReplyMessage('');
      
      // Update selected ticket locally to show the new message
      setSelectedTicket(prev => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          {
            sender: 'admin',
            senderName: 'Support Team',
            message: replyMessage.trim(),
            timestamp: new Date()
          }
        ]
      }));

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

  const handleDeleteClick = (ticket) => {
    setTicketToDelete(ticket);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;

    try {
      await deleteDoc(doc(db, 'tickets', ticketToDelete.id));
      
      setSnackbar({
        open: true,
        message: 'Ticket deleted successfully!',
        severity: 'success'
      });
      
      setDeleteConfirmOpen(false);
      setTicketToDelete(null);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete ticket.',
        severity: 'error'
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setTicketToDelete(null);
  };

  const handleRowClick = (ticket) => {
    handleViewDetails(ticket);
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
    <Box sx={{ px: isMobile ? 1 : 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header - Mobile Responsive */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: isMobile ? 2 : 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
            <IconButton 
              onClick={() => navigate('/admin/dashboard')}
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
              variant={isMobile ? "h5" : "h3"} 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                mb: 0,
                fontSize: isMobile ? '1.5rem' : '3rem'
              }}
            >
              {isMobile ? '🎫 Support Tickets' : 'Manage Support Tickets'}
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards - Mobile Responsive */}
        <Grid container spacing={isMobile ? 1.5 : 3} sx={{ mb: isMobile ? 2 : 4 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                <Typography 
                  variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#1976d2',
                    fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2.125rem'
                  }}
                >
                  {counts.all}
                </Typography>
                <Typography 
                  variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
                  color="text.secondary"
                  sx={{ fontSize: isSmallMobile ? '0.7rem' : 'inherit' }}
                >
                  {isSmallMobile ? 'Total' : 'Total Tickets'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                <Typography 
                  variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#ed6c02',
                    fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2.125rem'
                  }}
                >
                  {counts.open}
                </Typography>
                <Typography 
                  variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
                  color="text.secondary"
                  sx={{ fontSize: isSmallMobile ? '0.7rem' : 'inherit' }}
                >
                  {isSmallMobile ? 'Open' : 'Open Tickets'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                <Typography 
                  variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#1976d2',
                    fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2.125rem'
                  }}
                >
                  {counts.inProgress}
                </Typography>
                <Typography 
                  variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
                  color="text.secondary"
                  sx={{ fontSize: isSmallMobile ? '0.7rem' : 'inherit' }}
                >
                  {isSmallMobile ? 'Progress' : 'In Progress'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                <Typography 
                  variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#2e7d32',
                    fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2.125rem'
                  }}
                >
                  {counts.resolved}
                </Typography>
                <Typography 
                  variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
                  color="text.secondary"
                  sx={{ fontSize: isSmallMobile ? '0.7rem' : 'inherit' }}
                >
                  Resolved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Tabs - Mobile Responsive */}
        <Paper sx={{ mb: isMobile ? 2 : 3, overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile={isMobile}
            sx={{
              '& .MuiTab-root': {
                fontSize: isSmallMobile ? '0.65rem' : isMobile ? '0.75rem' : '0.875rem',
                minWidth: isSmallMobile ? 70 : isMobile ? 90 : 'auto',
                padding: isSmallMobile ? '4px 6px' : isMobile ? '6px 8px' : '12px 16px',
                minHeight: isSmallMobile ? 36 : 48
              },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3
                }
              }
            }}
          >
            <Tab label={isSmallMobile ? `All (${counts.all})` : `All (${counts.all})`} />
            <Tab label={isSmallMobile ? `Open (${counts.open})` : `Open (${counts.open})`} />
            <Tab label={isSmallMobile ? `Prog (${counts.inProgress})` : isMobile ? `Progress (${counts.inProgress})` : `In Progress (${counts.inProgress})`} />
            <Tab label={isSmallMobile ? `Done (${counts.resolved})` : `Resolved (${counts.resolved})`} />
            <Tab label={isSmallMobile ? `Closed (${counts.closed})` : `Closed (${counts.closed})`} />
          </Tabs>
        </Paper>

        {/* Tickets Display - Mobile Responsive */}
        <Paper>
          {isMobile ? (
            // Mobile Card View
            <Box sx={{ p: 2 }}>
              {filteredTickets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                    No tickets found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    {tabValue === 0 ? 'No support tickets have been created yet.' : 'No tickets match the selected filter.'}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {filteredTickets.map((ticket) => (
                    <Card 
                      key={ticket.id} 
                      variant="outlined" 
                      sx={{ 
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                          borderColor: '#1976d2'
                        }
                      }}
                      onClick={() => handleRowClick(ticket)}
                    >
                      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                        {/* Customer Info */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                          <Avatar sx={{ 
                            bgcolor: 'primary.main', 
                            mr: isSmallMobile ? 1 : 1.5, 
                            width: isSmallMobile ? 28 : 32, 
                            height: isSmallMobile ? 28 : 32,
                            fontSize: isSmallMobile ? '0.75rem' : '0.875rem'
                          }}>
                            {ticket.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant={isSmallMobile ? "body2" : "subtitle2"} 
                              sx={{ 
                                fontWeight: 'bold', 
                                mb: 0.25,
                                fontSize: isSmallMobile ? '0.8rem' : '0.875rem',
                                lineHeight: 1.2
                              }}
                            >
                              {ticket.userName || 'Unknown User'}
                            </Typography>
                            <Typography 
                              variant="caption"
                              color="text.secondary" 
                              sx={{ 
                                fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                                wordBreak: 'break-word',
                                display: 'block'
                              }}
                            >
                              {ticket.userEmail}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                            <Chip 
                              label={ticket.status || 'open'} 
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(ticket.status),
                                color: 'white',
                                textTransform: 'capitalize',
                                fontWeight: 'bold',
                                fontSize: isSmallMobile ? '0.6rem' : '0.7rem',
                                height: isSmallMobile ? 18 : 20
                              }}
                            />
                            <Chip 
                              label={ticket.priority || 'Medium'} 
                              size="small"
                              sx={{
                                bgcolor: getPriorityColor(ticket.priority),
                                color: 'white',
                                textTransform: 'capitalize',
                                fontWeight: 'bold',
                                fontSize: isSmallMobile ? '0.6rem' : '0.7rem',
                                height: isSmallMobile ? 18 : 20
                              }}
                            />
                          </Box>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* Ticket Info */}
                        <Box sx={{ mb: 1.5 }}>
                          <Typography 
                            variant={isSmallMobile ? "body2" : "subtitle2"} 
                            sx={{ 
                              fontWeight: 'bold', 
                              mb: 0.5,
                              fontSize: isSmallMobile ? '0.8rem' : '0.875rem'
                            }}
                          >
                            {ticket.subject}
                          </Typography>
                          <Typography 
                            variant="caption"
                            color="text.secondary" 
                            sx={{ 
                              mb: 1,
                              fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3
                            }}
                          >
                            {ticket.message}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {getCategoryIcon(ticket.category)}
                              <Typography 
                                variant="caption"
                                sx={{ 
                                  textTransform: 'capitalize',
                                  fontSize: isSmallMobile ? '0.65rem' : '0.75rem'
                                }}
                              >
                                {ticket.category}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="caption" 
                              color="primary" 
                              sx={{ fontSize: isSmallMobile ? '0.65rem' : '0.75rem' }}
                            >
                              💬 {ticket.messages?.length || 1} msg{(ticket.messages?.length || 1) !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="caption"
                            color="text.secondary"
                            sx={{ 
                              fontSize: isSmallMobile ? '0.6rem' : '0.7rem',
                              display: 'block',
                              mt: 0.5
                            }}
                          >
                            {ticket.lastUpdated?.toDate?.()?.toLocaleDateString() || ticket.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </Typography>
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ 
                          display: 'flex', 
                          gap: isSmallMobile ? 0.5 : 1, 
                          justifyContent: 'flex-end', 
                          flexWrap: 'wrap',
                          mt: 1
                        }}
                        onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(ticket);
                            }}
                            variant="outlined"
                            size="small"
                            startIcon={!isSmallMobile && <Visibility />}
                            sx={{
                              fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                              minWidth: isSmallMobile ? 45 : 'auto',
                              px: isSmallMobile ? 1 : 1.5,
                              py: isSmallMobile ? 0.25 : 0.5
                            }}
                          >
                            View
                          </Button>
                          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReply(ticket);
                              }}
                              variant="contained"
                              size="small"
                              sx={{ 
                                bgcolor: '#9c27b0', 
                                '&:hover': { bgcolor: '#7b1fa2' },
                                fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                                minWidth: isSmallMobile ? 50 : 'auto',
                                px: isSmallMobile ? 1 : 1.5,
                                py: isSmallMobile ? 0.25 : 0.5
                              }}
                              startIcon={!isSmallMobile && <Reply />}
                            >
                              Reply
                            </Button>
                          )}
                          {ticket.status === 'open' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(ticket.id, 'in-progress');
                              }}
                              variant="contained"
                              size="small"
                              sx={{ 
                                bgcolor: '#1976d2', 
                                '&:hover': { bgcolor: '#1565c0' },
                                fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                                minWidth: isSmallMobile ? 50 : 'auto',
                                px: isSmallMobile ? 1 : 1.5,
                                py: isSmallMobile ? 0.25 : 0.5
                              }}
                              startIcon={!isSmallMobile && <Schedule />}
                            >
                              {isSmallMobile ? 'Start' : 'Progress'}
                            </Button>
                          )}
                          {ticket.status !== 'resolved' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(ticket.id, 'resolved');
                              }}
                              variant="contained"
                              size="small"
                              sx={{ 
                                bgcolor: '#2e7d32', 
                                '&:hover': { bgcolor: '#1b5e20' },
                                fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                                minWidth: isSmallMobile ? 55 : 'auto',
                                px: isSmallMobile ? 1 : 1.5,
                                py: isSmallMobile ? 0.25 : 0.5
                              }}
                              startIcon={!isSmallMobile && <CheckCircle />}
                            >
                              {isSmallMobile ? 'Done' : 'Resolve'}
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          ) : (
            // Desktop Table View
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
                    <TableRow 
                      key={ticket.id} 
                      hover 
                      onClick={() => handleRowClick(ticket)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)'
                        }
                      }}
                    >
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
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {ticket.message}
                        </Typography>
                        <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                          💬 {ticket.messages?.length || 1} message{(ticket.messages?.length || 1) !== 1 ? 's' : ''}
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
                          {ticket.lastUpdated?.toDate?.()?.toLocaleDateString() || ticket.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last: {ticket.lastUpdated?.toDate?.()?.toLocaleTimeString() || ticket.createdAt?.toDate?.()?.toLocaleTimeString() || ''}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(ticket);
                            }}
                            color="primary"
                            size="small"
                            title="View Details"
                          >
                            <Visibility />
                          </IconButton>
                          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReply(ticket);
                              }}
                              color="secondary"
                              size="small"
                              title="Reply"
                            >
                              <Reply />
                            </IconButton>
                          )}
                          {ticket.status === 'open' && (
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(ticket.id, 'in-progress');
                              }}
                              sx={{ color: '#1976d2' }}
                              size="small"
                              title="Mark In Progress"
                            >
                              <Schedule />
                            </IconButton>
                          )}
                          {ticket.status !== 'resolved' && (
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(ticket.id, 'resolved');
                              }}
                              sx={{ color: '#2e7d32' }}
                              size="small"
                              title="Mark Resolved"
                            >
                              <CheckCircle />
                            </IconButton>
                          )}
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(ticket);
                            }}
                            sx={{ color: '#d32f2f' }}
                            size="small"
                            title="Delete Ticket"
                          >
                            <Delete />
                          </IconButton>
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
          )}
        </Paper>

        {/* Ticket Details Dialog - Mobile Responsive */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)} 
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
                    Conversation Thread
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
                          ml: msg.sender === 'admin' ? 2 : 0,
                          mr: msg.sender === 'admin' ? 0 : 2
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: msg.sender === 'user' ? '#1976d2' : '#f57c00' }}>
                          {msg.sender === 'user' ? '👤 Customer' : '🛠️ Support Team'}
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

                  {/* Quick Reply Section */}
                  {selectedTicket.status !== 'closed' && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Quick Reply
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Type a quick reply..."
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim()}
                        variant="contained"
                        size="small"
                        startIcon={<Reply />}
                      >
                        Send Reply
                      </Button>
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
            <Box>
              {selectedTicket?.status === 'open' && (
                <Button 
                  onClick={() => handleStatusChange(selectedTicket.id, 'in-progress')}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Mark In Progress
                </Button>
              )}
              {selectedTicket?.status !== 'resolved' && selectedTicket?.status !== 'closed' && (
                <Button 
                  onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                  variant="outlined"
                  color="success"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Mark Resolved
                </Button>
              )}
              {selectedTicket?.status === 'resolved' && (
                <Button 
                  onClick={() => handleStatusChange(selectedTicket.id, 'closed')}
                  variant="outlined"
                  color="error"
                  size="small"
                >
                  Close Ticket
                </Button>
              )}
            </Box>
            <Button onClick={() => setDetailsDialogOpen(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reply Dialog - Mobile Responsive */}
        <Dialog 
          open={replyDialogOpen} 
          onClose={() => setReplyDialogOpen(false)} 
          maxWidth="sm" 
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleDeleteCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ color: '#d32f2f' }} />
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this support ticket?
            </Typography>
            {ticketToDelete && (
              <Box sx={{ 
                bgcolor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  Ticket: {ticketToDelete.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Customer: {ticketToDelete.userName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {ticketToDelete.status}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" sx={{ mt: 2, color: '#d32f2f', fontWeight: 500 }}>
              ⚠️ This action cannot be undone. All messages and data associated with this ticket will be permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleDeleteCancel}
              variant="outlined"
              color="inherit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              variant="contained"
              color="error"
              startIcon={<Delete />}
            >
              Delete Ticket
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
    </Box>
  );
};

export default ManageTickets;
