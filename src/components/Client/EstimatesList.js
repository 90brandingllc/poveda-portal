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
  AutoFixHigh,
  ArrowBack
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
  arrayUnion 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';

// OpenAI Integration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const EstimatesList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [improvingText, setImprovingText] = useState(false);

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
        where('userId', '==', currentUser.uid),
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
    }
  }, [currentUser]);

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
              content: 'You are a professional writing assistant. Improve the user\'s message to be clear, professional, and grammatically correct while maintaining their original meaning and tone. Fix any spelling errors, improve grammar, and enhance clarity.'
            },
            {
              role: 'user',
              content: `Please improve this message: "${text}"`
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton 
          onClick={() => navigate('/dashboard')}
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
          My Estimate Requests
        </Typography>
      </Box>

      {estimates.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <RequestQuote sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No estimates requested yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Get started by requesting your first estimate!
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/get-estimate')}
            startIcon={<RequestQuote />}
          >
            Request Estimate
          </Button>
        </Paper>
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
                  
                  {estimate.timeline && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      ⏰ {estimate.timeline}
                    </Typography>
                  )}
                  
                  {estimate.budget && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      💰 {estimate.budget}
                    </Typography>
                  )}
                  
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
                  {selectedEstimate.timeline && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Timeline</Typography>
                      <Typography variant="body1">{selectedEstimate.timeline}</Typography>
                    </Grid>
                  )}
                  {selectedEstimate.budget && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Budget</Typography>
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
                  <Button
                    variant="contained"
                    onClick={handleSendReply}
                    disabled={replyLoading || !replyMessage.trim()}
                    startIcon={replyLoading ? <CircularProgress size={20} /> : <Send />}
                  >
                    {replyLoading ? 'Sending...' : 'Send Message'}
                  </Button>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    💡 Use the ✨ button to improve your message with AI before sending!
                  </Alert>
                </Box>
              </Paper>
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

export default EstimatesList;
