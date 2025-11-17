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
// import { useAuth } from '../../contexts/AuthContext'; // COMMENTED: No longer needed
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { query, where, orderBy, onSnapshot, updateDoc, doc, arrayUnion, deleteDoc } from 'firebase/firestore'; // COMMENTED: History removed
import { db } from '../../firebase/config';
// import { storage } from '../../firebase/config'; // COMMENTED: File upload removed
// import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // COMMENTED: File upload removed
import ClientLayout from '../Layout/ClientLayout';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';



const GetEstimate = () => {
  // const { currentUser } = useAuth(); // COMMENTED: No longer needed
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // COMMENTED: Estimate history removed
  // const [estimates, setEstimates] = useState([]);
  // const [selectedEstimate, setSelectedEstimate] = useState(null);
  // const [dialogOpen, setDialogOpen] = useState(false);
  // const [tabValue, setTabValue] = useState(0);
  // const [replyMessage, setReplyMessage] = useState('');
  // const [replyLoading, setReplyLoading] = useState(false);
  // const [editMode, setEditMode] = useState(false);
  // const [editData, setEditData] = useState({ subject: '', description: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: ''
  });



  // COMMENTED: Estimate history removed - no auth needed
  /*
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
        
        estimateData.sort((a, b) => {
          const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
        
        setEstimates(estimateData);
        
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
  */

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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const estimateData = {
        // No userId - guest user
        userEmail: formData.email,
        userName: formData.name,
        subject: formData.subject,
        description: formData.description,
        status: 'pending',
        messages: [{
          id: Date.now(),
          sender: 'client',
          senderName: formData.name,
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
        name: '',
        email: '',
        subject: '',
        description: ''
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
              onClick={() => navigate('/appointments')}
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
              View Our Services
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
      </Box>

      {/* Estimate Request Form */}
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

              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/appointments')}
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
                  View Our Services
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
            </Grid>
          </Grid>
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
    </ClientLayout>
  );
};

export default GetEstimate;
