import React, { useState } from 'react';
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
  Avatar
} from '@mui/material';
import {
  Phone,
  Email,
  LocationOn,
  Send,
  Support,
  Chat
} from '@mui/icons-material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const phoneNumber = '6146535882';
  const whatsappLink = `https://wa.me/${phoneNumber}`;

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
        userEmail: formData.email,
        userName: formData.name,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        status: 'open',
        createdAt: serverTimestamp(),
        messages: [
          {
            sender: 'user',
            senderName: formData.name,
            message: formData.message,
            timestamp: new Date()
          }
        ],
        lastUpdated: serverTimestamp()
      };

      await addDoc(collection(db, 'tickets'), ticketData);
      
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium'
      });

      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
    setLoading(false);
  };

  return (
    <ClientLayout>
      <Box
        sx={{
          mb: 5,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: '#e2e8f0',
          p: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              width: 70,
              height: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)'
            }}
          >
            <Support sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, mb: 1 }}>
              Contact & Support
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Get help from our team - we'll respond within 24 hours
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
            elevation={0}
          >
            <Box sx={{ 
              bgcolor: '#1976d2', 
              p: 3,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                <Support sx={{ mr: 1.5, fontSize: 24 }} />
                Get In Touch
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 1 }}>
                We're here to help with all your questions
              </Typography>
            </Box>
            
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3 }}>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      bgcolor: '#f0f7ff',
                      border: '1px solid',
                      borderColor: '#bbdefb',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 12px rgba(25, 118, 210, 0.15)'
                      }
                    }}
                  >
                    <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                      <Phone />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        Phone Support
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                        (614) 653 5882
                      </Typography>
                    </Box>
                  </Paper>
                </a>

                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    bgcolor: '#f0f7ff',
                    border: '1px solid',
                    borderColor: '#bbdefb',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 12px rgba(25, 118, 210, 0.15)'
                    }
                  }}
                >
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                    <Email />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      Email Us
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                      support@poveda.com
                    </Typography>
                  </Box>
                </Paper>

                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    bgcolor: '#f0f7ff',
                    border: '1px solid',
                    borderColor: '#bbdefb'
                  }}
                >
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2, mt: 0.5 }}>
                    <LocationOn />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                      Service Location
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                      4529 Parkwick Dr, Columbus, OH 43228
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Form */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
            elevation={0}
          >
            <Box sx={{ 
              bgcolor: '#1976d2', 
              p: 3,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                <Chat sx={{ mr: 1.5, fontSize: 24 }} />
                Send Us a Message
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 1 }}>
                Fill out the form below and we'll get back to you soon
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {success && (
                <Alert 
                  severity="success" 
                  variant="filled"
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2
                  }}
                >
                  Your message has been sent successfully! We'll respond within 24 hours.
                </Alert>
              )}

              <Box 
                component="form" 
                onSubmit={handleSubmit}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
                      Your Name
                    </Typography>
                    <TextField
                      fullWidth
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
                      Email Address
                    </Typography>
                    <TextField
                      fullWidth
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
                      Subject
                    </Typography>
                    <TextField
                      fullWidth
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="What can we help you with?"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
                      Priority
                    </Typography>
                    <TextField
                      fullWidth
                      select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
                      Message
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Please describe your question or concern in detail..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<Send />}
                        disabled={loading}
                        sx={{ 
                          bgcolor: '#1976d2',
                          background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                          fontWeight: 600,
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                            boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)'
                          }
                        }}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        size="large"
                        onClick={() => setFormData({ name: '', email: '', subject: '', message: '', priority: 'medium' })}
                        sx={{ 
                          fontWeight: 600,
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          borderWidth: '2px',
                          textTransform: 'none',
                          fontSize: '1rem',
                          color: '#64748b',
                          borderColor: '#cbd5e1',
                          '&:hover': {
                            borderColor: '#94a3b8',
                            bgcolor: 'rgba(226, 232, 240, 0.2)'
                          }
                        }}
                      >
                        Clear Form
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </ClientLayout>
  );
};

export default ContactUs;
