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
  // Star, // Reserved for future use
  Send,
  History,
  Chat,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Info,
  CalendarToday,
  PhotoLibrary,
  // Description, // Reserved for future use  
  // Schedule, // Reserved for future use
  Payments,
  LocationOn,
  NoteAdd,
  Forum
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ClientLayout from '../Layout/ClientLayout';
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
        confirmButtonColor: '#d32f2f',
        zIndex: 9999,
        backdrop: `rgba(0,0,0,0.4)`
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
        confirmButtonColor: '#1976d2',
        zIndex: 9999,
        backdrop: `rgba(0,0,0,0.4)`
      });
    } catch (error) {
      console.error('Error updating estimate:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update estimate. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d32f2f',
        zIndex: 9999,
        backdrop: `rgba(0,0,0,0.4)`
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
      cancelButtonText: 'Cancel',
      zIndex: 9999,
      backdrop: `rgba(0,0,0,0.4)`,
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        popup: 'swal-popup-front',
        overlay: 'swal-overlay-front'
      }
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
          confirmButtonColor: '#1976d2',
          zIndex: 9999,
          backdrop: `rgba(0,0,0,0.4)`
        });
      } catch (error) {
        console.error('Error deleting estimate:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete estimate. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#d32f2f',
          zIndex: 9999,
          backdrop: `rgba(0,0,0,0.4)`
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
            confirmButtonColor: '#ff9800',
            zIndex: 9999,
            backdrop: `rgba(0,0,0,0.4)`
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
            confirmButtonColor: '#ff9800',
            zIndex: 9999,
            backdrop: `rgba(0,0,0,0.4)`
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
        confirmButtonColor: '#d32f2f',
        zIndex: 9999,
        backdrop: `rgba(0,0,0,0.4)`
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
        confirmButtonColor: '#d32f2f',
        zIndex: 9999,
        backdrop: `rgba(0,0,0,0.4)`
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
        confirmButtonColor: '#d32f2f',
        zIndex: 9999,
        backdrop: `rgba(0,0,0,0.4)`
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
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 4, md: 6 }, 
            textAlign: 'center',
            borderRadius: 4,
            border: '1px solid #e0f2fe',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
          }}
        >
          <Box 
            sx={{ 
              width: 110, 
              height: 110, 
              borderRadius: '50%', 
              bgcolor: '#ecfdf5',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 15px 30px rgba(34,197,94,0.2)'
            }}
          >
            <CheckCircle sx={{ fontSize: 60, color: '#22c55e' }} />
          </Box>

          <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
            Request Submitted!
          </Typography>
          
          <Typography variant="h6" sx={{ color: '#475569', fontWeight: 400, mb: 4, maxWidth: 600, mx: 'auto' }}>
            Thank you for your estimate request. Our team will review your details 
            and provide a personalized quote within 24 hours.
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 3, 
              justifyContent: 'center',
              flexDirection: { xs: 'column', sm: 'row' }
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => setSuccess(false)}
              startIcon={<Add />}
              sx={{ 
                py: 1.5,
                px: 4,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)',
                boxShadow: '0 10px 15px -3px rgba(8,145,178,0.2)',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(90deg, #0e7490 0%, #0891b2 100%)',
                  boxShadow: '0 15px 20px -3px rgba(8,145,178,0.3)'
                }
              }}
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
              sx={{ 
                py: 1.5,
                px: 4,
                borderRadius: 2,
                borderColor: '#94a3b8',
                color: '#475569',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#64748b',
                  backgroundColor: 'rgba(100,116,139,0.04)'
                }
              }}
            >
              View My Estimates
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <ClientLayout>
      <Box sx={{ 
        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', 
        borderRadius: 4, 
        p: { xs: 3, md: 5 },
        mb: 4,
        color: 'white',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' }
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Get Custom Estimate
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
            Tell us about your project and get a personalized quote from our detailing experts within 24 hours.
          </Typography>
        </Box>
        <Box sx={{ mt: { xs: 2, md: 0 } }}>
          <Button 
            variant="contained" 
            sx={{ 
              bgcolor: 'white', 
              color: '#0891b2',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              }
            }}
            onClick={() => setTabValue(tabValue === 0 ? 1 : 0)}
          >
            {tabValue === 0 ? 'View My Estimates' : 'Create New Estimate'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 4,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ 
            width: '100%', 
            maxWidth: 600,
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none',
            }
          }}
        >
          <Tab 
            label="New Request" 
            icon={<RequestQuote />}
            iconPosition="start"
          />
          <Tab 
            label="My Estimates" 
            icon={<History />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {tabValue === 0 && (
      <Grid container spacing={4}>
        {/* Request Form */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 4 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              background: 'linear-gradient(to bottom, #ffffff, #f8fafc)' 
            }}
          >
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  bgcolor: '#0891b2', 
                  color: 'white', 
                  width: 42, 
                  height: 42,
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mr: 2,
                  boxShadow: '0 3px 10px rgba(8,145,178,0.3)'
                }}
              >
                <RequestQuote />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Tell us about your project
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Subject */}
              <Grid item xs={12}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  Project Title
                  <Tooltip title="Give your project a clear, descriptive name">
                    <IconButton size="small" sx={{ ml: 0.5, color: '#94a3b8' }}>
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <TextField
                  fullWidth
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="E.g., Complete Interior Detail for 2020 BMW"
                  required
                  variant="outlined"
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(8,145,178,0.2)'
                      }
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Choose a title that clearly describes your car detailing needs
                </Typography>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 1, 
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center' 
                  }}
                >
                  Project Details
                  <Tooltip title="Describe your vehicle condition and what services you need">
                    <IconButton size="small" sx={{ ml: 0.5, color: '#94a3b8' }}>
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Please describe your vehicle (make, model, year), current condition, and the specific detailing services you're looking for. Mention any areas of concern or special requirements."
                  required
                  variant="outlined"
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(8,145,178,0.2)'
                      }
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  The more details you provide, the more accurate your estimate will be
                </Typography>
              </Grid>

              {/* File Upload */}
              <Grid item xs={12}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 1, 
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  Add Photos/Videos (Optional)
                  <Tooltip title="Images of your vehicle help us provide a more accurate estimate">
                    <IconButton size="small" sx={{ ml: 0.5, color: '#94a3b8' }}>
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: '#cbd5e1',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    minHeight: 150,
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: '#0891b2',
                      backgroundColor: 'rgba(8,145,178,0.04)'
                    }
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" style={{ width: '100%', textAlign: 'center' }}>
                    {uploading ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CircularProgress size={40} sx={{ color: '#0891b2', mb: 2 }} />
                        <Typography variant="body1" color="textSecondary">
                          Uploading files...
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                        <Box 
                          sx={{ 
                            bgcolor: '#e0f2fe',
                            p: 2,
                            borderRadius: '50%',
                            mb: 2,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Add fontSize="large" sx={{ color: '#0891b2' }} />
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#0891b2', mb: 1 }}>
                          Drag files here or click to browse
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Upload photos of your vehicle for a more accurate estimate
                        </Typography>
                      </Box>
                    )}
                  </label>
                </Paper>
                  
                  {/* File Preview */}
                  {formData.files.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Uploaded Files ({formData.files.length})
                      </Typography>
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
                                  border: '1px solid #ddd',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(file.url, '_blank')}
                              />
                            ) : file.type.startsWith('video/') ? (
                              <Box
                                sx={{
                                  width: 200,
                                  height: 120,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: 2,
                                  border: '1px solid #ddd',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(file.url, '_blank')}
                              >
                                <Typography variant="h4">🎥</Typography>
                                <Typography variant="caption" textAlign="center" sx={{ mt: 1 }}>
                                  {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                                </Typography>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  width: 200,
                                  height: 120,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: 2,
                                  border: '1px solid #ddd'
                                }}
                              >
                                <Typography variant="h4">📄</Typography>
                                <Typography variant="caption" textAlign="center">
                                  {file.name}
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
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                              }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                position: 'absolute',
                                bottom: -20,
                                left: 0,
                                right: 0,
                                textAlign: 'center',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                borderRadius: 1,
                                p: 0.5
                              }}
                            >
                              Click to view
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>

              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  sx={{ 
                    borderRadius: 2,
                    py: 1.5,
                    px: 3,
                    borderColor: '#94a3b8',
                    color: '#475569',
                    '&:hover': {
                      borderColor: '#64748b',
                      backgroundColor: 'rgba(100,116,139,0.04)'
                    }
                  }}
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !formData.subject || !formData.description}
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                  sx={{ 
                    flex: { xs: '1 0 100%', sm: 1 },
                    mt: { xs: 2, sm: 0 }, 
                    ml: { xs: 0, sm: 'auto' },
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)',
                    boxShadow: '0 10px 15px -3px rgba(8,145,178,0.2)',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(90deg, #0e7490 0%, #0891b2 100%)',
                      boxShadow: '0 15px 20px -3px rgba(8,145,178,0.3)'
                    }
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Estimate Request'}
                </Button>
              </Box>
          </Paper>
        </Grid>

          {/* Info Sidebar */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              mb: 3, 
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
            }}
          >
            <Box sx={{ 
              py: 2, 
              px: 3, 
              backgroundColor: '#0891b2',
              color: 'white'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                <Star sx={{ mr: 1, color: '#fef9c3' }} />
                How It Works
              </Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              <List>
                <ListItem sx={{ 
                  borderLeft: '4px solid #22c55e', 
                  pl: 3, 
                  py: 2,
                  transition: 'all 0.2s',
                  '&:hover': { backgroundColor: 'rgba(8,145,178,0.04)' }
                }}>
                  <ListItemText 
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>1. Tell us what you need</Typography>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: '#475569' }}>Describe your project in detail with photos</Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ 
                  borderLeft: '4px solid #3b82f6', 
                  pl: 3, 
                  py: 2,
                  transition: 'all 0.2s',
                  '&:hover': { backgroundColor: 'rgba(8,145,178,0.04)' }
                }}>
                  <ListItemText 
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>2. We review & respond</Typography>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: '#475569' }}>Within 24 hours with questions or quotes</Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ 
                  borderLeft: '4px solid #a855f7', 
                  pl: 3, 
                  py: 2,
                  transition: 'all 0.2s',
                  '&:hover': { backgroundColor: 'rgba(8,145,178,0.04)' }
                }}>
                  <ListItemText 
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>3. Receive your quote</Typography>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: '#475569' }}>Detailed pricing breakdown and timeline</Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ 
                  borderLeft: '4px solid #f97316', 
                  pl: 3, 
                  py: 2,
                  transition: 'all 0.2s',
                  '&:hover': { backgroundColor: 'rgba(8,145,178,0.04)' }
                }}>
                  <ListItemText 
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>4. Book your service</Typography>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: '#475569' }}>Choose a convenient time that works for you</Typography>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
          
          {/* Additional Information Card */}
          <Card 
            elevation={0}
            sx={{ 
              mb: 3, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 80,
                background: 'linear-gradient(90deg, #0e7490 0%, #0891b2 100%)',
                zIndex: 0
              }} 
            />
            <CardContent sx={{ position: 'relative', zIndex: 1, pt: 5 }}>
              <Box 
                sx={{ 
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  bgcolor: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  mx: 'auto',
                  mb: 2,
                  position: 'relative',
                  top: -10
                }}
              >
                <RequestQuote sx={{ fontSize: 35, color: '#0891b2' }} />
              </Box>
              <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                Why Request an Estimate?
              </Typography>
              <Box sx={{ px: 1 }}>
                <Typography variant="body2" paragraph align="center" sx={{ color: '#475569' }}>
                  Our custom estimates provide detailed pricing for your specific vehicle and needs, ensuring there are no surprises when it's time for service.
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mt: 3,
                  '& > button': {
                    minWidth: '100%'
                  }
                }}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => window.open('/services', '_blank')}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                  >
                    View Our Service Packages
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ mb: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
                border: '1px solid',
                borderColor: '#e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                    boxShadow: '0 4px 12px rgba(8,145,178,0.2)',
                    mr: 2
                  }}
                >
                  <History sx={{ fontSize: 24, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                    Your Estimate Requests
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                    View and manage all your custom estimate requests
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={() => setTabValue(0)}
                startIcon={<Add />}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 1.5,
                  px: { xs: 2, sm: 3 },
                  flexShrink: 0,
                  minWidth: { xs: '100%', sm: 'auto' },
                  mt: { xs: 2, sm: 0 },
                  boxShadow: '0 4px 12px rgba(8,145,178,0.15)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #0e7490 0%, #0891b2 100%)',
                    boxShadow: '0 6px 16px rgba(8,145,178,0.25)'
                  }
                }}
              >
                <Add sx={{ mr: 0.5 }} /> New Request
              </Button>
            </Paper>
            {estimates.length === 0 ? (
              <Paper 
                sx={{ 
                  p: { xs: 5, md: 6 }, 
                  textAlign: 'center', 
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: '#e2e8f0',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  my: 3,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                elevation={0}
              >
                <Box 
                  sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(8,145,178,0.05) 0%, rgba(6,182,212,0.08) 100%)',
                    zIndex: 0
                  }}
                />
                <Box 
                  sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(8,145,178,0.08) 0%, rgba(6,182,212,0.12) 100%)',
                    zIndex: 0
                  }}
                />
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box 
                    sx={{ 
                      width: 140,
                      height: 140,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      border: '1px solid',
                      borderColor: '#bae6fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 4,
                      boxShadow: '0 8px 25px -5px rgba(8,145,178,0.2)'
                    }}
                  >
                    <RequestQuote sx={{ fontSize: 70, color: '#0891b2' }} />
                  </Box>
                  <Typography variant="h4" sx={{ color: '#0f172a', fontWeight: 800, mb: 2 }}>
                    No Estimates Yet
                  </Typography>
                  <Typography variant="body1" color="#64748b" sx={{ maxWidth: 500, mx: 'auto', mb: 5, fontSize: '1.05rem' }}>
                    Get detailed pricing for your vehicle's specific needs by submitting a custom estimate request. Our team will respond within 24 hours with a personalized quote.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setTabValue(0)}
                    startIcon={<Add />}
                    size="large"
                    sx={{
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)',
                      fontWeight: 700,
                      textTransform: 'none',
                      py: 1.5,
                      px: 5,
                      boxShadow: '0 10px 15px -3px rgba(8,145,178,0.3)',
                      fontSize: '1rem',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #0e7490 0%, #0891b2 100%)',
                        boxShadow: '0 15px 25px -3px rgba(8,145,178,0.4)'
                      }
                    }}
                  >
                    Create Your First Estimate
                  </Button>
                </Box>
              </Paper>
            ) : (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  {estimates.map((estimate) => (
                    <Grid item xs={12} sm={6} lg={4} key={estimate.id}>
                      <Card 
                        elevation={0}
                        sx={{ 
                          cursor: 'pointer',
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: '#e2e8f0',
                          overflow: 'hidden',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s ease-in-out',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          '&:hover': {
                            boxShadow: '0 15px 30px rgba(8,145,178,0.15)',
                            transform: 'translateY(-4px)',
                            borderColor: '#0891b2'
                          }
                        }}
                        onClick={() => {
                          setSelectedEstimate(estimate);
                          setDialogOpen(true);
                        }}
                      >
                        <Box 
                          sx={{ 
                            background: `linear-gradient(90deg, ${getStatusColor(estimate.status)} 0%, ${getStatusColor(estimate.status)}99 100%)`,
                            height: 10,
                          }}
                        />
                        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', flex: 1, lineHeight: 1.3 }}>
                              {estimate.subject}
                            </Typography>
                            <Chip 
                              label={estimate.status} 
                              size="small"
                              sx={{
                                background: `linear-gradient(90deg, ${getStatusColor(estimate.status)} 0%, ${getStatusColor(estimate.status)}DD 100%)`,
                                color: 'white',
                                textTransform: 'capitalize',
                                ml: 1,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                height: 26,
                                borderRadius: '12px',
                                boxShadow: `0 4px 12px ${getStatusColor(estimate.status)}40`,
                              }}
                            />
                          </Box>
                        
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 2, 
                              color: '#475569',
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              display: '-webkit-box', 
                              WebkitLineClamp: 2, 
                              WebkitBoxOrient: 'vertical',
                              flexGrow: 1 
                            }}
                          >
                            {estimate.description}
                          </Typography>
                          
                          {/* Files indicators */}
                          {estimate.files && estimate.files.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                              <Chip 
                                icon={<PhotoLibrary sx={{ fontSize: 16 }} />}
                                label={`${estimate.files.length} ${estimate.files.length === 1 ? 'file' : 'files'}`}
                                size="small"
                                sx={{ 
                                  bgcolor: '#e0f2fe', 
                                  color: '#0e7490',
                                  fontWeight: 600,
                                  borderRadius: '12px',
                                  '.MuiChip-icon': { color: '#0891b2' },
                                  border: '1px solid',
                                  borderColor: '#bae6fd'
                                }}
                              />
                            </Box>
                          )}
                          
                          <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', background: 'rgba(241,245,249,0.7)', px: 1.5, py: 0.5, borderRadius: 5 }}>
                              <CalendarToday sx={{ fontSize: 16, color: '#0891b2', mr: 0.7 }} />
                              <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                                {estimate.createdAt ? new Date(estimate.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              startIcon={<Chat sx={{ fontSize: 18 }} />}
                              sx={{ 
                                textTransform: 'none', 
                                color: '#0891b2',
                                fontWeight: 600,
                                borderRadius: 2,
                                px: 2,
                                '&:hover': { 
                                  bgcolor: 'rgba(8,145,178,0.08)',
                                  boxShadow: '0 2px 5px rgba(8,145,178,0.1)'
                                }
                              }}
                            >
                              {estimate.messages?.length > 1 ? 
                                `${estimate.messages.length - 1} messages` : 
                                'View Details'}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>
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
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <Box 
          sx={{ 
            bgcolor: getStatusColor(selectedEstimate?.status),
            py: 1,
            px: 3,
            mb: 1
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'white', 
              fontWeight: 700, 
              textTransform: 'uppercase',
              letterSpacing: 1 
            }}
          >
            {selectedEstimate?.status || 'Estimate'}
          </Typography>
        </Box>
        
        <DialogTitle sx={{ pb: 0, pt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {selectedEstimate?.subject}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <CalendarToday sx={{ fontSize: 16, color: '#94a3b8', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Created: {selectedEstimate?.createdAt ? 
                    new Date(selectedEstimate.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    }) : 
                    'Recently'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              {selectedEstimate?.status === 'pending' && !editMode && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Edit request">
                    <IconButton 
                      onClick={handleEdit}
                      size="small"
                      sx={{ 
                        color: '#0891b2',
                        bgcolor: '#e0f2fe',
                        '&:hover': { bgcolor: '#bae6fd' }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete request">
                    <IconButton 
                      onClick={handleDeleteConfirm}
                      size="small"
                      sx={{ 
                        color: '#ef4444',
                        bgcolor: '#fee2e2',
                        '&:hover': { bgcolor: '#fecaca' }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          {selectedEstimate && (
            editMode ? (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  bgcolor: '#f8fafc', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: '#e2e8f0'
                }}
              >
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Edit sx={{ mr: 1, fontSize: 20, color: '#0891b2' }} />
                    Edit Your Request
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          color: '#475569' 
                        }}
                      >
                        Project Title
                      </Typography>
                      <TextField
                        fullWidth
                        value={editData.subject}
                        onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                        variant="outlined"
                        InputProps={{
                          sx: {
                            borderRadius: 2,
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 3px rgba(8,145,178,0.2)'
                            }
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1,
                          color: '#475569' 
                        }}
                      >
                        Project Details
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        variant="outlined"
                        InputProps={{
                          sx: {
                            borderRadius: 2,
                            '&.Mui-focused': {
                              boxShadow: '0 0 0 3px rgba(8,145,178,0.2)'
                            }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
              </Paper>
            ) : (
              <Grid container spacing={3}>
              {/* Description Section */}
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 700, 
                        color: '#475569',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Description sx={{ mr: 1, fontSize: 20, color: '#0891b2' }} />
                      Description
                    </Typography>
                    
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2, 
                        bgcolor: '#f8fafc', 
                        borderColor: '#e2e8f0',
                        mb: 3
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#334155',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6
                        }}
                      >
                        {selectedEstimate.description}
                      </Typography>
                    </Paper>
                  </Grid>
              
                  {/* Attached Files */}
                  {selectedEstimate.files && selectedEstimate.files.length > 0 && (
                    <Grid item xs={12}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 700, 
                          color: '#475569',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <PhotoLibrary sx={{ mr: 1, fontSize: 20, color: '#0891b2' }} />
                        Attached Files ({selectedEstimate.files.length})
                      </Typography>
                      
                      <Box 
                        sx={{ 
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: 2,
                          mb: 3
                        }}
                      >
                        {selectedEstimate.files.map((file, index) => (
                          <Paper 
                            elevation={0} 
                            key={index} 
                            sx={{ 
                              overflow: 'hidden', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: '#e2e8f0',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                transform: 'scale(1.02)'
                              }
                            }}
                          >
                            {file.type.startsWith('image/') ? (
                              <>
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  onClick={() => window.open(file.url, '_blank')}
                                  style={{
                                    width: '100%',
                                    height: 140,
                                    objectFit: 'cover',
                                    cursor: 'pointer'
                                  }}
                                />
                                <Box sx={{ p: 1.5 }}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      display: 'block', 
                                      fontWeight: 500,
                                      mb: 0.5,
                                      color: '#0f172a',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {file.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </Typography>
                                </Box>
                              </>
                            ) : file.type.startsWith('video/') ? (
                              <>
                                <Box
                                  sx={{
                                    height: 140,
                                    bgcolor: '#f1f5f9',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  <Typography variant="h3" color="#94a3b8">🎥</Typography>
                                  <Typography variant="caption" color="#64748b" sx={{ mt: 1 }}>
                                    Click to play
                                  </Typography>
                                </Box>
                                <Box sx={{ p: 1.5 }}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      display: 'block', 
                                      fontWeight: 500,
                                      mb: 0.5,
                                      color: '#0f172a',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {file.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              <>
                                <Box
                                  sx={{
                                    height: 140,
                                    bgcolor: '#f1f5f9',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  <Typography variant="h3" color="#94a3b8">📄</Typography>
                                </Box>
                                <Box sx={{ p: 1.5 }}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      display: 'block', 
                                      fontWeight: 500,
                                      mb: 0.5,
                                      color: '#0f172a',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {file.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </Typography>
                                </Box>
                              </>
                            )}
                          </Paper>
                        ))}
                      </Box>
                    </Grid>
                  )}
              
              {selectedEstimate.timeline && (
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 700, 
                      color: '#475569',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Schedule sx={{ mr: 1, fontSize: 20, color: '#0891b2' }} />
                    Timeline
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#334155' }}>{selectedEstimate.timeline}</Typography>
                </Grid>
              )}
              
              {selectedEstimate.budget && (
                <Grid item xs={12} sm={6}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 700, 
                      color: '#475569',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Payments sx={{ mr: 1, fontSize: 20, color: '#0891b2' }} />
                    Budget
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#334155' }}>{selectedEstimate.budget}</Typography>
                </Grid>
              )}
              
              {selectedEstimate.location && (
                <Grid item xs={12}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 700, 
                      color: '#475569',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <LocationOn sx={{ mr: 1, fontSize: 20, color: '#0891b2' }} />
                    Location
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#334155' }}>{selectedEstimate.location}</Typography>
                </Grid>
              )}
              
              {selectedEstimate.additionalRequirements && (
                <Grid item xs={12}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 700, 
                      color: '#475569',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <NoteAdd sx={{ mr: 1, fontSize: 20, color: '#0891b2' }} />
                    Additional Requirements
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#334155' }}>{selectedEstimate.additionalRequirements}</Typography>
                </Grid>
              )}
              
              {/* Messages/Communication Thread */}
              {selectedEstimate.messages && selectedEstimate.messages.length > 1 && (
                <Grid item xs={12}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 700, 
                      color: '#475569',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Forum sx={{ mr: 1, fontSize: 20, color: '#0891b2' }} />
                    Communication
                  </Typography>
                  
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      maxHeight: 300, 
                      overflow: 'auto', 
                      p: 2, 
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      borderColor: '#e2e8f0',
                      mb: 3
                    }}
                  >
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
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      mt: 3,
                      borderRadius: 2,
                      borderColor: '#e2e8f0',
                      background: 'linear-gradient(to bottom, #ffffff, #f8fafc)'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#0f172a', 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center' 
                      }}
                    >
                      <Chat sx={{ mr: 1, color: '#0891b2' }} />
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
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&.Mui-focused': {
                            boxShadow: '0 0 0 3px rgba(8,145,178,0.2)'
                          }
                        }
                      }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        onClick={handleSendReply}
                        disabled={replyLoading || !replyMessage.trim()}
                        startIcon={replyLoading ? <CircularProgress size={20} /> : <Send />}
                        sx={{ 
                          borderRadius: 2,
                          py: 1,
                          px: 3,
                          fontWeight: 600,
                          textTransform: 'none',
                          background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)',
                          boxShadow: '0 4px 12px rgba(8,145,178,0.15)'
                        }}
                      >
                        {replyLoading ? 'Sending...' : 'Send Message'}
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}
              </Grid>
            )
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {editMode ? (
            <>
              <Button 
                onClick={handleCancelEdit} 
                startIcon={<Cancel />}
                sx={{ 
                  color: '#64748b',
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none'
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                variant="contained" 
                startIcon={<Save />}
                disabled={!editData.subject.trim() || !editData.description.trim()}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #0e7490 0%, #0891b2 100%)',
                  }
                }}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setDialogOpen(false)}
              sx={{ 
                borderRadius: 2, 
                px: 3,
                color: '#64748b',
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </ClientLayout>
  );
};

export default GetEstimate;