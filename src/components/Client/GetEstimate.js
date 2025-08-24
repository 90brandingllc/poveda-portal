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
  DialogContentText,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  RequestQuote,
  CheckCircle,
  Star,
  Send,
  History,
  Chat,
  Add,
  Edit,
  Delete,
  Save,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';



const GetEstimate = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ subject: '', description: '' });

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    files: []
  });
  const [uploading, setUploading] = useState(false);



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
      Swal.fire({
        title: 'Message Failed!',
        text: 'Failed to send message. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d32f2f'
      });
    }
    setReplyLoading(false);
  };

  const handleEdit = () => {
    if (selectedEstimate && selectedEstimate.status === 'pending') {
      setEditMode(true);
      setEditData({
        subject: selectedEstimate.subject,
        description: selectedEstimate.description
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedEstimate || selectedEstimate.status !== 'pending') return;
    
    try {
      const estimateRef = doc(db, 'estimates', selectedEstimate.id);
      await updateDoc(estimateRef, {
        subject: editData.subject,
        description: editData.description,
        lastUpdated: new Date()
      });
      
      setEditMode(false);
      Swal.fire({
        title: 'Success!',
        text: 'Estimate updated successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#1976d2'
      });
    } catch (error) {
      console.error('Error updating estimate:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update estimate. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d32f2f'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditData({ subject: '', description: '' });
  };

  const handleDeleteConfirm = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this estimate? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'estimates', selectedEstimate.id));
        setDialogOpen(false);
        Swal.fire({
          title: 'Deleted!',
          text: 'Estimate deleted successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#1976d2'
        });
      } catch (error) {
        console.error('Error deleting estimate:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete estimate. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d32f2f'
        });
      }
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of files) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          Swal.fire({
            title: 'File Too Large!',
            text: `File ${file.name} is too large. Maximum size is 10MB.`,
            icon: 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ff9800'
          });
          continue;
        }

        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          Swal.fire({
            title: 'Invalid File Type!',
            text: `File ${file.name} is not a valid image or video file.`,
            icon: 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ff9800'
          });
          continue;
        }

        // Upload to Firebase Storage
        const timestamp = Date.now();
        const fileName = `estimates/${currentUser.uid}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        uploadedFiles.push({
          name: file.name,
          url: downloadURL,
          type: file.type,
          size: file.size,
          path: fileName
        });
      }

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...uploadedFiles]
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
      Swal.fire({
        title: 'Upload Failed!',
        text: 'Failed to upload files. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d32f2f'
      });
    }
    
    setUploading(false);
  };

  const handleFileRemove = async (index) => {
    const file = formData.files[index];
    
    try {
      // Delete from Firebase Storage
      if (file.path) {
        const storageRef = ref(storage, file.path);
        await deleteObject(storageRef);
      }
      
      // Remove from state
      setFormData(prev => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index)
      }));
    } catch (error) {
      console.error('Error deleting file:', error);
      Swal.fire({
        title: 'Delete Failed!',
        text: 'Failed to delete file. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d32f2f'
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const estimateData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        subject: formData.subject,
        description: formData.description,
        files: formData.files,
        status: 'pending',
        messages: [{
          id: Date.now(),
          sender: 'client',
          senderName: currentUser.displayName || currentUser.email,
          message: `New estimate request: ${formData.subject}`,
          timestamp: new Date(),
          isSystemMessage: true
        }],
        lastUpdated: new Date(),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'estimates'), estimateData);
      setSuccess(true);
      setFormData({
        subject: '',
        description: '',
        files: []
      });
    } catch (error) {
      console.error('Error creating estimate:', error);
      Swal.fire({
        title: 'Submission Failed!',
        text: 'Failed to submit estimate request. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d32f2f'
      });
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
            We'll review your request and get back to you as soon as possible.
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
              onClick={() => {
                setSuccess(false);
                setTabValue(1);
              }}
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


                {/* Subject */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="subject"
                    label="Subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Brief title for your project..."
                    required
                  />

                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="description"
                    label="Description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what you want done. Include any specific requirements, materials, colors, styles, or other important details..."
                    required
                  />
                </Grid>

                {/* File Upload */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Attach Photos/Videos (Optional)
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        disabled={uploading}
                        startIcon={uploading ? <CircularProgress size={20} /> : <Add />}
                      >
                        {uploading ? 'Uploading...' : 'Add Files'}
                      </Button>
                    </label>
                  </Box>
                  
                  {/* File Preview */}
                  {formData.files.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {formData.files.map((file, index) => (
                        <Box key={index} sx={{ position: 'relative', maxWidth: 200 }}>
                          {file.type.startsWith('image/') ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              style={{
                                width: '100%',
                                height: 120,
                                objectFit: 'cover',
                                borderRadius: 8,
                                border: '1px solid #ddd'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 200,
                                height: 120,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: 2,
                                border: '1px solid #ddd'
                              }}
                            >
                              <Typography variant="body2" textAlign="center">
                                📹 {file.name}
                              </Typography>
                            </Box>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleFileRemove(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'white',
                              '&:hover': { backgroundColor: '#f5f5f5' }
                            }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
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
                  disabled={loading || !formData.subject || !formData.description}
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
                      secondary="Get questions and clarifications as soon as possible"
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
                            {estimate.subject}
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
            <Typography variant="h6">{selectedEstimate?.subject}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedEstimate?.status === 'pending' && !editMode && (
                <>
                  <IconButton 
                    onClick={handleEdit}
                    size="small"
                    sx={{ color: 'primary.main' }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    onClick={handleDeleteConfirm}
                    size="small"
                    sx={{ color: 'error.main' }}
                  >
                    <Delete />
                  </IconButton>
                </>
              )}
                <Chip 
                label={selectedEstimate?.status} 
                  sx={{
                  bgcolor: getStatusColor(selectedEstimate?.status),
                    color: 'white',
                    textTransform: 'capitalize'
                  }}
                />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEstimate && (
            <Grid container spacing={3}>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    value={editData.subject}
                    onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedEstimate.subject}</Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedEstimate.description}</Typography>
                )}
              </Grid>
              
              {/* Attached Files */}
              {selectedEstimate.files && selectedEstimate.files.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Attached Files</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {selectedEstimate.files.map((file, index) => (
                      <Box key={index} sx={{ maxWidth: 200 }}>
                        {file.type.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            onClick={() => window.open(file.url, '_blank')}
                            style={{
                              width: '100%',
                              height: 120,
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid #ddd',
                              cursor: 'pointer'
                            }}
                          />
                        ) : (
                          <Box
                            onClick={() => window.open(file.url, '_blank')}
                            sx={{
                              width: 200,
                              height: 120,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f5f5f5',
                              borderRadius: 2,
                              border: '1px solid #ddd',
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: '#e0e0e0' }
                            }}
                          >
                            <Typography variant="body2" textAlign="center">
                              📹 {file.name}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
              
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
          {editMode ? (
            <>
              <Button onClick={handleCancelEdit} startIcon={<Cancel />}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                variant="contained" 
                startIcon={<Save />}
                disabled={!editData.subject.trim() || !editData.description.trim()}
              >
                Save Changes
              </Button>
            </>
          ) : (
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          )}
        </DialogActions>
      </Dialog>


    </Container>
  );
};

export default GetEstimate;