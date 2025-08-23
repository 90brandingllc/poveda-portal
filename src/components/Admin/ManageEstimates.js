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
  Alert,
  Tabs,
  Tab,
  Divider,
  Avatar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Visibility,
  Reply,
  CheckCircle,
  Cancel,
  Schedule,
  Email,
  Phone,
  Person,
  ArrowBack,
  Send,
  AdminPanelSettings,
  AutoFixHigh,
  AttachMoney
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
  arrayUnion
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// OpenAI Integration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const ManageEstimates = () => {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [improvingText, setImprovingText] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Business types for display
  const businessTypes = {
    automotive: { name: 'Automotive & Detailing', icon: '🚗' },
    construction: { name: 'Construction & Renovation', icon: '🏗️' },
    beauty: { name: 'Beauty & Wellness', icon: '💅' },
    general: { name: 'General Services', icon: '🔧' }
  };

  useEffect(() => {
    const estimatesQuery = query(
      collection(db, 'estimates'),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(estimatesQuery, (snapshot) => {
      const estimateData = [];
      snapshot.forEach((doc) => {
        estimateData.push({ id: doc.id, ...doc.data() });
      });
      setEstimates(estimateData);
    });

    return () => unsubscribe();
  }, []);

  const improveTextWithAI = async (text) => {
    if (!text.trim() || !OPENAI_API_KEY) {
      alert('Please enter some text first, or OpenAI API key is not configured.');
      return text;
    }

    setImprovingText(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional business communication assistant. Improve the admin\'s message to be clear, professional, and helpful while maintaining a friendly business tone. Fix any grammar issues and enhance clarity.'
            },
            {
              role: 'user',
              content: `Please improve this business message: "${text}"`
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const improvedText = data.choices[0]?.message?.content?.trim() || text;
      
      setReplyMessage(improvedText);
      return improvedText;
    } catch (error) {
      console.error('Error improving text:', error);
      alert('Failed to improve text. Please try again.');
      return text;
    } finally {
      setImprovingText(false);
    }
  };

  const handleStatusChange = async (estimateId, newStatus) => {
    try {
      await updateDoc(doc(db, 'estimates', estimateId), {
        status: newStatus,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedEstimate) return;

    setReplyLoading(true);
    try {
      const estimateRef = doc(db, 'estimates', selectedEstimate.id);
      
      const newMessage = {
        id: Date.now(),
        sender: 'admin',
        senderName: 'Admin Team',
        message: replyMessage,
        timestamp: new Date()
      };

      const updateData = {
        messages: arrayUnion(newMessage),
        lastUpdated: new Date(),
        status: selectedEstimate.status === 'pending' ? 'in-progress' : selectedEstimate.status
      };

      // If including a quote, update the quoted price
      if (quotedPrice.trim()) {
        updateData.quotedPrice = parseFloat(quotedPrice);
        updateData.status = 'quoted';
      }

      // Add admin notes if provided
      if (adminNotes.trim()) {
        updateData.adminNotes = adminNotes;
      }

      await updateDoc(estimateRef, updateData);

      setReplyMessage('');
      setQuotedPrice('');
      setAdminNotes('');
      
      // Update selected estimate to show new message immediately
      setSelectedEstimate({
        ...selectedEstimate,
        messages: [...(selectedEstimate.messages || []), newMessage],
        quotedPrice: quotedPrice ? parseFloat(quotedPrice) : selectedEstimate.quotedPrice,
        adminNotes: adminNotes || selectedEstimate.adminNotes
      });

    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send message. Please try again.');
    }
    setReplyLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'in-progress': return '#1976d2';
      case 'quoted': return '#2e7d32';
      case 'approved': return '#4caf50';
      case 'declined': return '#d32f2f';
      case 'completed': return '#9c27b0';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in-progress': return '💬';
      case 'quoted': return '💰';
      case 'approved': return '✅';
      case 'declined': return '❌';
      case 'completed': return '🎉';
      default: return '📄';
    }
  };

  const filterEstimatesByStatus = (status) => {
    switch (status) {
      case 'pending':
        return estimates.filter(est => est.status === 'pending');
      case 'in-progress':
        return estimates.filter(est => est.status === 'in-progress');
      case 'quoted':
        return estimates.filter(est => est.status === 'quoted');
      case 'completed':
        return estimates.filter(est => ['approved', 'completed'].includes(est.status));
      default:
        return estimates;
    }
  };

  const getFilteredEstimates = () => {
    switch (tabValue) {
      case 0: return estimates; // All
      case 1: return filterEstimatesByStatus('pending');
      case 2: return filterEstimatesByStatus('in-progress');
      case 3: return filterEstimatesByStatus('quoted');
      case 4: return filterEstimatesByStatus('completed');
      default: return estimates;
    }
  };

  // Statistics
  const stats = {
    total: estimates.length,
    pending: estimates.filter(est => est.status === 'pending').length,
    inProgress: estimates.filter(est => est.status === 'in-progress').length,
    quoted: estimates.filter(est => est.status === 'quoted').length,
    completed: estimates.filter(est => ['approved', 'completed'].includes(est.status)).length
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
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
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
            💰 Manage Estimates
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Estimates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {stats.inProgress}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {stats.quoted}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quoted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                  {stats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
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
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`All (${stats.total})`} />
            <Tab label={`Pending (${stats.pending})`} />
            <Tab label={`In Progress (${stats.inProgress})`} />
            <Tab label={`Quoted (${stats.quoted})`} />
            <Tab label={`Completed (${stats.completed})`} />
          </Tabs>
        </Paper>

        {/* Estimates Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Client & Project</TableCell>
                  <TableCell>Service Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Budget/Quote</TableCell>
                  <TableCell>Timeline</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Messages</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredEstimates().map((estimate) => (
                  <TableRow key={estimate.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {estimate.projectTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {estimate.userName} • {estimate.userEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{businessTypes[estimate.businessType]?.icon}</span>
                        <Box>
                          <Typography variant="body2">
                            {businessTypes[estimate.businessType]?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {estimate.serviceCategory}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${getStatusIcon(estimate.status)} ${estimate.status}`}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(estimate.status),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {estimate.quotedPrice ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'green' }}>
                          ${estimate.quotedPrice}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {estimate.budget || 'Not specified'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {estimate.timeline || 'Flexible'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {estimate.lastUpdated ? 
                          new Date(estimate.lastUpdated.seconds ? estimate.lastUpdated.seconds * 1000 : estimate.lastUpdated).toLocaleDateString() : 
                          'Recently'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {estimate.messages?.length ? estimate.messages.length - 1 : 0} messages
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setSelectedEstimate(estimate);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {getFilteredEstimates().length === 0 && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No estimates found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 0 ? 'No estimates have been submitted yet.' : 'No estimates match the current filter.'}
              </Typography>
            </Box>
          )}
        </Paper>
      </motion.div>

      {/* Estimate Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedEstimate?.projectTitle}</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedEstimate?.status || ''}
                  label="Status"
                  onChange={(e) => {
                    handleStatusChange(selectedEstimate.id, e.target.value);
                    setSelectedEstimate({...selectedEstimate, status: e.target.value});
                  }}
                >
                  <MenuItem value="pending">⏳ Pending</MenuItem>
                  <MenuItem value="in-progress">💬 In Progress</MenuItem>
                  <MenuItem value="quoted">💰 Quoted</MenuItem>
                  <MenuItem value="approved">✅ Approved</MenuItem>
                  <MenuItem value="declined">❌ Declined</MenuItem>
                  <MenuItem value="completed">🎉 Completed</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          {selectedEstimate && (
            <Grid container spacing={3}>
              {/* Project Details */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Project Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Service Type</Typography>
                      <Typography variant="body1">
                        {businessTypes[selectedEstimate.businessType]?.icon} {businessTypes[selectedEstimate.businessType]?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                      <Typography variant="body1">{selectedEstimate.serviceCategory}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      <Typography variant="body1">{selectedEstimate.description}</Typography>
                    </Grid>
                    {selectedEstimate.timeline && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Timeline</Typography>
                        <Typography variant="body1">{selectedEstimate.timeline}</Typography>
                      </Grid>
                    )}
                    {selectedEstimate.budget && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Client Budget</Typography>
                        <Typography variant="body1">{selectedEstimate.budget}</Typography>
                      </Grid>
                    )}
                    {selectedEstimate.location && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                        <Typography variant="body1">{selectedEstimate.location}</Typography>
                      </Grid>
                    )}
                    {selectedEstimate.additionalRequirements && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Additional Requirements</Typography>
                        <Typography variant="body1">{selectedEstimate.additionalRequirements}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              {/* Client Info & Quote */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Client Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                      <Typography variant="body1">{selectedEstimate.userName}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{selectedEstimate.userEmail}</Typography>
                    </Grid>
                    {selectedEstimate.phone && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                        <Typography variant="body1">{selectedEstimate.phone}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Contact Preference</Typography>
                      <Typography variant="body1">{selectedEstimate.contactPreference}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Urgency</Typography>
                      <Typography variant="body1">{selectedEstimate.urgency}</Typography>
                    </Grid>
                    {selectedEstimate.quotedPrice && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Quoted Price</Typography>
                        <Typography variant="h6" sx={{ color: 'green', fontWeight: 600 }}>
                          ${selectedEstimate.quotedPrice}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              {/* Communication Thread */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Communication Thread
                  </Typography>
                  
                  {selectedEstimate.messages && selectedEstimate.messages.length > 0 ? (
                    <Box sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
                      {selectedEstimate.messages.map((message, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            mb: 2, 
                            display: 'flex', 
                            flexDirection: message.sender === 'admin' ? 'row' : 'row-reverse',
                            alignItems: 'flex-start'
                          }}
                        >
                          <Avatar 
                            sx={{ 
                              bgcolor: message.sender === 'admin' ? 'secondary.main' : 'primary.main',
                              mx: 1
                            }}
                          >
                            {message.sender === 'admin' ? <AdminPanelSettings /> : <Person />}
                          </Avatar>
                          <Paper 
                            sx={{ 
                              p: 2, 
                              maxWidth: '70%',
                              bgcolor: message.sender === 'admin' ? 'grey.100' : 'primary.light',
                              color: message.sender === 'admin' ? 'text.primary' : 'primary.contrastText'
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {message.senderName}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {message.message}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {new Date(message.timestamp?.seconds ? message.timestamp.seconds * 1000 : message.timestamp).toLocaleString()}
                            </Typography>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      No messages yet. Start the conversation by sending a message below!
                    </Alert>
                  )}

                  {/* Admin Reply Section */}
                  <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #eee' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Admin Reply
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Quoted Price (Optional)"
                          value={quotedPrice}
                          onChange={(e) => setQuotedPrice(e.target.value)}
                          placeholder="e.g., 1500"
                          InputProps={{
                            startAdornment: <AttachMoney />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Admin Notes (Private)"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Internal notes..."
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Type your response to the client..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        variant="outlined"
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                          size="small"
                          onClick={() => improveTextWithAI(replyMessage)}
                          disabled={improvingText || !replyMessage.trim()}
                          startIcon={improvingText ? <CircularProgress size={16} /> : <AutoFixHigh />}
                        >
                          {improvingText ? 'Improving...' : 'Improve with AI'}
                        </Button>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleSendReply}
                        disabled={replyLoading || !replyMessage.trim()}
                        startIcon={replyLoading ? <CircularProgress size={20} /> : <Send />}
                      >
                        {replyLoading ? 'Sending...' : 'Send Reply'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        onClick={() => handleStatusChange(selectedEstimate.id, 'quoted')}
                        disabled={!quotedPrice.trim()}
                        startIcon={<AttachMoney />}
                      >
                        Quote Project
                      </Button>
                    </Box>
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                      💡 Use the ✨ button to improve your message with AI for better professional communication!
                    </Alert>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageEstimates;