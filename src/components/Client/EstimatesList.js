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
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  RequestQuote,
  Send,
  Chat,
  History,
  Person,
  AdminPanelSettings,
  ArrowBack,
  Edit,
  Delete,
  Save,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  arrayUnion,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Updated: AI functionality removed from client side
const EstimatesList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  

  const [estimates, setEstimates] = useState([]);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ subject: '', description: '' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);


  // Business types for display
  const businessTypes = {
    automotive: { name: 'Automotive & Detailing', icon: '🚗' },
    construction: { name: 'Construction & Renovation', icon: '🏗️' },
    beauty: { name: 'Beauty & Wellness', icon: '💅' },
    general: { name: 'General Services', icon: '🔧' }
  };

  useEffect(() => {
    if (currentUser) {
      const estimatesQuery = query(
        collection(db, 'estimates'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(estimatesQuery, (snapshot) => {
        const estimateData = [];
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          estimateData.push(data);
        });
        
        // Sort by lastUpdated (most recent first) - client-side sorting
        estimateData.sort((a, b) => {
          const aTime = a.lastUpdated?.seconds ? a.lastUpdated.seconds * 1000 : new Date(a.lastUpdated).getTime();
          const bTime = b.lastUpdated?.seconds ? b.lastUpdated.seconds * 1000 : new Date(b.lastUpdated).getTime();
          return bTime - aTime;
        });
        
        setEstimates(estimateData);
      }, (error) => {
        console.error('❌ EstimatesList: Error fetching estimates:', error);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);



  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedEstimate) return;

    setReplyLoading(true);
    try {
      const estimateRef = doc(db, 'estimates', selectedEstimate.id);
      
      const newMessage = {
        id: Date.now(),
        sender: 'client',
        senderName: currentUser.displayName || currentUser.email,
        message: replyMessage,
        timestamp: new Date()
      };

      await updateDoc(estimateRef, {
        messages: arrayUnion(newMessage),
        lastUpdated: new Date(),
        status: selectedEstimate.status === 'pending' ? 'in-progress' : selectedEstimate.status
      });

      setReplyMessage('');
      
      // Update selected estimate to show new message immediately
      setSelectedEstimate({
        ...selectedEstimate,
        messages: [...(selectedEstimate.messages || []), newMessage]
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

  return (
    <ClientLayout>
        {/* Modern Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 8,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          p: { xs: 3, md: 5 },
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
        }}>
          <IconButton 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              mr: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              width: 48,
              height: 48,
              '&:hover': {
                background: 'rgba(255, 255, 255, 1)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
              }
            }}
          >
            <ArrowBack sx={{ color: '#1e293b' }} />
          </IconButton>
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.875rem', md: '2.25rem' },
                color: '#1e293b',
                mb: 1,
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              My Estimate Requests
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#64748b',
                fontWeight: 400,
                fontSize: '1.125rem'
              }}
            >
              Track your project estimates and quotes
            </Typography>
          </Box>
        </Box>

        {estimates.length === 0 ? (
          <Box sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            p: 8,
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
          }}>
            <Box 
              sx={{
                width: 120,
                height: 120,
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 4,
                fontSize: '3rem'
              }}
            >
              💰
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                mb: 2,
                fontSize: '1.5rem'
              }}
            >
              No estimates requested yet
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#64748b',
                mb: 4,
                maxWidth: 400,
                mx: 'auto',
                fontSize: '1.125rem',
                lineHeight: 1.6
              }}
            >
              Get started by requesting your first estimate!
            </Typography>
            <Button
              onClick={() => navigate('/get-estimate')}
              sx={{
                background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '1rem',
                px: 6,
                py: 2,
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 10px 25px rgba(234, 179, 8, 0.3)',
                '&:hover': { 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 15px 30px rgba(234, 179, 8, 0.4)'
                }
              }}
              startIcon={<RequestQuote />}
            >
              Request Estimate
            </Button>
          </Box>
        ) : (
        <Grid container spacing={3}>
          {estimates.map((estimate) => (
            <Grid item xs={12} md={6} lg={4} key={estimate.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '100%',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => {
                  setSelectedEstimate(estimate);
                  setDialogOpen(true);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                      {estimate.projectTitle}
                    </Typography>
                    <Chip 
                      label={`${getStatusIcon(estimate.status)} ${estimate.status}`}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(estimate.status),
                        color: 'white',
                        textTransform: 'capitalize',
                        ml: 1
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {businessTypes[estimate.businessType]?.icon} {estimate.serviceCategory}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 2, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical' 
                    }}
                  >
                    {estimate.description}
                  </Typography>
                  

                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {estimate.lastUpdated ? 
                        new Date(estimate.lastUpdated.seconds ? estimate.lastUpdated.seconds * 1000 : estimate.lastUpdated).toLocaleDateString() : 
                        'Recently'
                      }
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Chat />}
                      sx={{ textTransform: 'none' }}
                    >
                      {estimate.messages?.length > 1 ? 
                        `${estimate.messages.length - 1} messages` : 
                        'View Details'
                      }
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Estimate Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
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
            <Chip 
              label={`${getStatusIcon(selectedEstimate?.status)} ${selectedEstimate?.status}`}
              sx={{
                bgcolor: getStatusColor(selectedEstimate?.status),
                color: 'white',
                textTransform: 'capitalize'
              }}
            />
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          {selectedEstimate && (
            <Box>
              {/* Project Details */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Project Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Service Type</Typography>
                    <Typography variant="body1">
                      {businessTypes[selectedEstimate.businessType]?.icon} {businessTypes[selectedEstimate.businessType]?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                    <Typography variant="body1">{selectedEstimate.serviceCategory}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{selectedEstimate.description}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Communication Thread */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Chat sx={{ mr: 1 }} />
                  Communication
                </Typography>
                
                {selectedEstimate.messages && selectedEstimate.messages.length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    {selectedEstimate.messages.map((message, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          mb: 2, 
                          display: 'flex', 
                          flexDirection: message.sender === 'client' ? 'row-reverse' : 'row',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            bgcolor: message.sender === 'client' ? 'primary.main' : 'secondary.main',
                            mx: 1
                          }}
                        >
                          {message.sender === 'client' ? <Person /> : <AdminPanelSettings />}
                        </Avatar>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            maxWidth: '70%',
                            bgcolor: message.sender === 'client' ? 'primary.light' : 'grey.100',
                            color: message.sender === 'client' ? 'primary.contrastText' : 'text.primary'
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

                {/* Reply Section */}
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Send a Message
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Ask questions, provide more details, or respond to our team..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      variant="outlined"
                    />

                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleSendReply}
                    disabled={replyLoading || !replyMessage.trim()}
                    startIcon={replyLoading ? <CircularProgress size={20} /> : <Send />}
                  >
                    {replyLoading ? 'Sending...' : 'Send Message'}
                  </Button>

                </Box>
              </Paper>
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

export default EstimatesList;
