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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  RequestQuote,
  CheckCircle,
  Star,
  Send,
  AutoFixHigh,
  Refresh,
  History,
  Chat,
  Add
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';

// OpenAI Integration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const GetEstimate = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [improvingText, setImprovingText] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessType: '',
    serviceCategory: '',
    projectTitle: '',
    description: ''
  });

  // Business types and their service categories
  const businessTypes = {
    automotive: {
      name: 'Automotive & Detailing',
      icon: '🚗',
      categories: [
        'Exterior Detailing',
        'Interior Cleaning',
        'Paint Correction',
        'Ceramic Coating',
        'Full Detail Package',
        'Maintenance Services',
        'Custom Request'
      ]
    },
    construction: {
      name: 'Construction & Renovation',
      icon: '🏗️',
      categories: [
        'Home Renovation',
        'Kitchen Remodeling',
        'Bathroom Remodeling',
        'Roofing',
        'Flooring',
        'Electrical Work',
        'Plumbing',
        'Painting',
        'Custom Build'
      ]
    },
    beauty: {
      name: 'Beauty & Wellness',
      icon: '💅',
      categories: [
        'Hair Services',
        'Nail Services',
        'Spa Treatments',
        'Facial Services',
        'Massage Therapy',
        'Wellness Packages',
        'Event Styling',
        'Custom Service'
      ]
    },
    general: {
      name: 'General Services',
      icon: '🔧',
      categories: [
        'Consulting',
        'Design Services',
        'Maintenance',
        'Repair Services',
        'Installation',
        'Custom Project'
      ]
    }
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
        
        // Sort by createdAt (most recent first) - client-side sorting
        estimateData.sort((a, b) => {
          const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
        
        setEstimates(estimateData);
        
        // Update selectedEstimate if dialog is open and estimate is updated
        if (selectedEstimate && estimateData.length > 0) {
          const updatedEstimate = estimateData.find(est => est.id === selectedEstimate.id);
          if (updatedEstimate) {

            setSelectedEstimate(updatedEstimate);
          }
        }
      }, (error) => {
        console.error('❌ GetEstimate: Error fetching estimates:', error);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const improveTextWithAI = async (text, fieldName) => {
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
              content: 'You are a professional writing assistant. Improve the user\'s text to be clear, professional, and grammatically correct while maintaining their original meaning. Fix any spelling errors, improve grammar, and enhance clarity. Keep the tone professional but friendly.'
            },
            {
              role: 'user',
              content: `Please improve this ${fieldName}: "${text}"`
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const improvedText = data.choices[0]?.message?.content?.trim() || text;
      
      setFormData({
        ...formData,
        [fieldName]: improvedText
      });

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
        message: replyMessage.trim(),
        timestamp: new Date(),
        isSystemMessage: false
      };

      await updateDoc(estimateRef, {
        messages: arrayUnion(newMessage),
        lastUpdated: new Date()
      });
      setReplyMessage('');
      
      // Immediately update the selectedEstimate with the new message for instant UI update
      const updatedEstimate = {
        ...selectedEstimate,
        messages: [...selectedEstimate.messages, newMessage],
        lastUpdated: new Date()
      };
      setSelectedEstimate(updatedEstimate);
      
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send message. Please try again.');
    }
    setReplyLoading(false);
  };

  const improveReplyTextWithAI = async (text) => {
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
              content: 'You are a professional writing assistant. Improve the user\'s text to be clear, professional, and grammatically correct while maintaining their original meaning. Fix any spelling errors, improve grammar, and enhance clarity. Keep the tone professional but friendly.'
            },
            {
              role: 'user',
              content: `Please improve this text: "${text}"`
            }
          ],
          max_tokens: 500,
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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const estimateData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        businessType: formData.businessType,
        serviceCategory: formData.serviceCategory,
        projectTitle: formData.projectTitle,
        description: formData.description,
        status: 'pending',
        messages: [{
          id: Date.now(),
          sender: 'client',
          senderName: currentUser.displayName || currentUser.email,
          message: `New estimate request: ${formData.projectTitle}`,
          timestamp: new Date(),
          isSystemMessage: true
        }],
        lastUpdated: new Date(),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'estimates'), estimateData);
      setSuccess(true);
      setFormData({
        businessType: '',
        serviceCategory: '',
        projectTitle: '',
        description: ''
      });
    } catch (error) {
      console.error('Error creating estimate:', error);
      alert('Failed to submit estimate request. Please try again.');
    }
    setLoading(false);
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

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
            Estimate Request Submitted!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            We'll review your request and get back to you within 24 hours.
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Our team will contact you via your preferred method with questions, clarifications, and a detailed quote.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => setSuccess(false)}
              startIcon={<Add />}
            >
              Request Another Estimate
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setTabValue(1)}
              startIcon={<History />}
            >
              View My Estimates
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Get Custom Estimate
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="New Request" icon={<RequestQuote />} />
          <Tab label="My Estimates" icon={<History />} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={4}>
          {/* Request Form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Tell us what you need
              </Typography>

              <Grid container spacing={3}>
                {/* Business Type Selection */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>What type of service do you need?</InputLabel>
                    <Select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      required
                    >
                      {Object.entries(businessTypes).map(([key, type]) => (
                        <MenuItem key={key} value={key}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontSize: '1.2em' }}>{type.icon}</span>
                            {type.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Service Category */}
                {formData.businessType && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Service Category</InputLabel>
                      <Select
                        name="serviceCategory"
                        value={formData.serviceCategory}
                        onChange={handleChange}
                        required
                      >
                        {businessTypes[formData.businessType]?.categories.map(category => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Project Title */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="projectTitle"
                    label="Project Title"
                    value={formData.projectTitle}
                    onChange={handleChange}
                    placeholder="Brief title for your project..."
                    required
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => improveTextWithAI(formData.projectTitle, 'projectTitle')}
                      disabled={improvingText || !formData.projectTitle.trim()}
                      startIcon={improvingText ? <CircularProgress size={16} /> : <AutoFixHigh />}
                    >
                      {improvingText ? 'Improving...' : 'Improve with AI'}
                    </Button>
                  </Box>
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="description"
                    label="Project Description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what you want done. Include any specific requirements, materials, colors, styles, or other important details..."
                    required
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => improveTextWithAI(formData.description, 'description')}
                      disabled={improvingText || !formData.description.trim()}
                      startIcon={improvingText ? <CircularProgress size={16} /> : <AutoFixHigh />}
                    >
                      {improvingText ? 'Improving...' : 'Improve with AI'}
                    </Button>
                  </Box>
                </Grid>



                {/* AI Helper Info */}
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      💡 <strong>AI Text Improvement:</strong> Click the ✨ button next to any text field to automatically improve your writing. 
                      Perfect for fixing grammar, spelling, or making your request clearer!
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !formData.businessType || !formData.projectTitle || !formData.description}
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                  sx={{ flex: 1 }}
                >
                  {loading ? 'Submitting...' : 'Submit Estimate Request'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Info Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <Star sx={{ mr: 1, color: '#FFD700' }} />
                  How It Works
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="1. Tell us what you need"
                      secondary="Describe your project in detail"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="2. We review & respond"
                      secondary="Get questions and clarifications within 24 hours"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="3. Receive your quote"
                      secondary="Detailed pricing and timeline"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="4. Book your service"
                      secondary="Schedule when it works for you"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  💡 Tips for Better Estimates
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Be specific"
                      secondary="More details = more accurate pricing"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Include photos"
                      secondary="Mention if you can provide images"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Set realistic timelines"
                      secondary="Rush jobs may cost more"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Use AI improvement"
                      secondary="Click ✨ to enhance your text"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Your Estimate Requests
            </Typography>
            {estimates.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <RequestQuote sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No estimates requested yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Click "New Request" tab to get started!
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setTabValue(0)}
                  startIcon={<Add />}
                >
                  Create First Estimate
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
                            label={estimate.status} 
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
                        
                        <Typography variant="body2" sx={{ mb: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {estimate.description}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {estimate.createdAt ? new Date(estimate.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<Chat />}
                            sx={{ textTransform: 'none' }}
                          >
                            {estimate.messages?.length > 1 ? `${estimate.messages.length - 1} messages` : 'View Details'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {/* Estimate Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedEstimate?.projectTitle}</Typography>
            <Chip 
              label={selectedEstimate?.status} 
              sx={{
                bgcolor: getStatusColor(selectedEstimate?.status),
                color: 'white',
                textTransform: 'capitalize'
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEstimate && (
            <Grid container spacing={3}>
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
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedEstimate.description}</Typography>
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
              
              {/* Messages/Communication Thread */}
              {selectedEstimate.messages && selectedEstimate.messages.length > 1 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Communication</Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', p: 2, backgroundColor: '#fafafa' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedEstimate.messages.slice(1).map((message, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: message.sender === 'client' ? 'flex-end' : 'flex-start',
                            mb: 1
                          }}
                        >
                          <Box 
                            sx={{ 
                              maxWidth: '70%',
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: message.sender === 'client' ? '#1976d2' : '#ffffff',
                              color: message.sender === 'client' ? 'white' : 'text.primary',
                              position: 'relative',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              border: message.sender === 'admin' ? '1px solid #e0e0e0' : 'none'
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: message.sender === 'client' ? 'rgba(255,255,255,0.9)' : '#1976d2'
                                }}
                              >
                                {message.senderName}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontSize: '0.75rem',
                                  color: message.sender === 'client' ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                                }}
                              >
                                {message.timestamp?.seconds 
                                  ? new Date(message.timestamp.seconds * 1000).toLocaleString()
                                  : new Date(message.timestamp).toLocaleString()
                                }
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                              {message.message}
                            </Typography>
                            {message.sender === 'admin' && (
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  left: -8,
                                  top: 12,
                                  width: 0,
                                  height: 0,
                                  borderTop: '8px solid transparent',
                                  borderBottom: '8px solid transparent',
                                  borderRight: '8px solid #ffffff'
                                }}
                              />
                            )}
                            {message.sender === 'client' && (
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  right: -8,
                                  top: 12,
                                  width: 0,
                                  height: 0,
                                  borderTop: '8px solid transparent',
                                  borderBottom: '8px solid transparent',
                                  borderLeft: '8px solid #1976d2'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Paper>

                  {/* Reply Section */}
                  <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chat sx={{ mr: 1 }} />
                      Send Message
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Ask questions, provide more details, or respond to our team..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => improveReplyTextWithAI(replyMessage)}
                          disabled={improvingText || !replyMessage.trim()}
                          startIcon={improvingText ? <CircularProgress size={16} /> : <AutoFixHigh />}
                        >
                          {improvingText ? 'Improving...' : 'Improve with AI'}
                        </Button>
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
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GetEstimate;