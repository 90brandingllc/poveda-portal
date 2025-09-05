import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Email,
  Edit,
  Preview,
  Save,
  Restore,
  Close,
  Add
} from '@mui/icons-material';
import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

// Default email templates
const defaultTemplates = {
  appointment_confirmation: {
    id: 'appointment_confirmation',
    name: 'Appointment Confirmation',
    subject: 'Appointment Confirmation - POVEDA PREMIUM AUTO CARE',
    description: 'Sent when a new appointment is booked',
    category: 'appointment',
    isActive: true,
    variables: ['userName', 'service', 'date', 'time', 'address', 'finalPrice', 'estimatedPrice'],
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">POVEDA PREMIUM AUTO CARE</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your Appointment is Confirmed!</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #1976d2; margin-top: 0;">Hello {{userName}}!</h2>
          <p>Thank you for choosing POVEDA PREMIUM AUTO CARE. Your appointment has been successfully booked and is pending approval.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">Appointment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Service:</td>
                <td style="padding: 8px 0;">{{service}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0;">{{date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Time:</td>
                <td style="padding: 8px 0;">{{time}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0;">{{address}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Total Price:</td>
                <td style="padding: 8px 0; color: #1976d2; font-weight: bold;">${'{{finalPrice}}'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>What's Next?</strong></p>
            <p style="margin: 5px 0 0 0;">Our team will review your booking and contact you within 24 hours to confirm the details.</p>
          </div>
          
          <p>If you have any questions, please contact us:</p>
          <ul>
            <li>Phone: (614) 653-5882</li>
            <li>Email: support@povedapremiumautocare.com</li>
            <li>Address: 4529 Parkwick Dr, Columbus, OH 43228</li>
          </ul>
          
          <p>Thank you for choosing POVEDA PREMIUM AUTO CARE!</p>
          <p><strong>The POVEDA Team</strong></p>
        </div>
        
        <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE. All rights reserved.</p>
        </div>
      </div>
    `
  },
  appointment_reminder_24h: {
    id: 'appointment_reminder_24h',
    name: '24-Hour Appointment Reminder',
    subject: 'Appointment Reminder - Tomorrow - POVEDA PREMIUM AUTO CARE',
    description: 'Sent 24 hours before appointment',
    category: 'reminder',
    isActive: true,
    variables: ['userName', 'service', 'date', 'time', 'address', 'finalPrice', 'estimatedPrice'],
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">POVEDA PREMIUM AUTO CARE</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">⏰ Appointment Reminder - 24 hours</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #1976d2; margin-top: 0;">Hello {{userName}}!</h2>
          <p style="font-size: 18px;">Your car detailing appointment is scheduled for <strong>tomorrow</strong>.</p>
          
          <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">
              📅 Don't forget about your appointment tomorrow!
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="color: #1976d2; margin-top: 0;">📋 Appointment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">🚗 Service:</td>
                <td style="padding: 8px 0;">{{service}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">📅 Date:</td>
                <td style="padding: 8px 0;">{{date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">⏰ Time:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #1976d2;">{{time}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">📍 Location:</td>
                <td style="padding: 8px 0;">{{address}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">💰 Total:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #2e7d32;">${'{{finalPrice}}'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-weight: bold;">✅ Preparation Checklist:</p>
            <ul style="margin: 10px 0 0 0; color: #856404;">
              <li>Remove all personal items from your vehicle</li>
              <li>Ensure your vehicle is accessible</li>
              <li>Have a water source available nearby</li>
              <li>Clear any obstacles around the vehicle</li>
              <li>Make sure gates/driveways are accessible</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32; font-weight: bold;">📞 Need to Reschedule or Have Questions?</p>
            <p style="margin: 5px 0 0 0; color: #2e7d32;">Contact us immediately:</p>
            <ul style="margin: 5px 0 0 0; color: #2e7d32;">
              <li>📱 Phone: (614) 653-5882</li>
              <li>📧 Email: support@povedapremiumautocare.com</li>
              <li>📍 Address: 4529 Parkwick Dr, Columbus, OH 43228</li>
              <li>🕒 Hours: Mon-Sun 7AM-6PM (Summer: 7AM-9PM)</li>
            </ul>
          </div>
          
          <p style="text-align: center; font-size: 16px;">We look forward to making your vehicle shine! ✨</p>
          <p style="text-align: center;"><strong>The POVEDA Team</strong></p>
        </div>
        
        <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE. All rights reserved.</p>
        </div>
      </div>
    `
  },
  appointment_reminder_2h: {
    id: 'appointment_reminder_2h',
    name: '2-Hour Appointment Reminder',
    subject: 'Appointment Reminder - In 2 Hours - POVEDA PREMIUM AUTO CARE',
    description: 'Sent 2 hours before appointment',
    category: 'reminder',
    isActive: true,
    variables: ['userName', 'service', 'date', 'time', 'address', 'finalPrice', 'estimatedPrice'],
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">POVEDA PREMIUM AUTO CARE</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">⏰ Appointment Reminder - 2 hours</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #1976d2; margin-top: 0;">Hello {{userName}}!</h2>
          <p style="font-size: 18px;">Your car detailing appointment is scheduled for <strong>in about 2 hours</strong>.</p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-weight: bold;">
              🚨 Final Reminder - Please prepare your vehicle now!
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="color: #1976d2; margin-top: 0;">📋 Appointment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">🚗 Service:</td>
                <td style="padding: 8px 0;">{{service}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">📅 Date:</td>
                <td style="padding: 8px 0;">{{date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">⏰ Time:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #1976d2;">{{time}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">📍 Location:</td>
                <td style="padding: 8px 0;">{{address}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">💰 Total:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #2e7d32;">${'{{finalPrice}}'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
            <p style="margin: 0; color: #c62828; font-weight: bold;">⚠️ Last-Minute Preparation:</p>
            <ul style="margin: 10px 0 0 0; color: #c62828;">
              <li>Move your vehicle to an accessible location NOW</li>
              <li>Remove all personal items immediately</li>
              <li>Unlock any gates or barriers</li>
              <li>Be available to answer our call</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32; font-weight: bold;">📞 Need to Reschedule or Have Questions?</p>
            <p style="margin: 5px 0 0 0; color: #2e7d32;">Contact us immediately:</p>
            <ul style="margin: 5px 0 0 0; color: #2e7d32;">
              <li>📱 Phone: (614) 653-5882</li>
              <li>📧 Email: support@povedapremiumautocare.com</li>
              <li>📍 Address: 4529 Parkwick Dr, Columbus, OH 43228</li>
              <li>🕒 Hours: Mon-Sun 7AM-6PM (Summer: 7AM-9PM)</li>
            </ul>
          </div>
          
          <p style="text-align: center; font-size: 16px;">We look forward to making your vehicle shine! ✨</p>
          <p style="text-align: center;"><strong>The POVEDA Team</strong></p>
        </div>
        
        <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">© 2024 POVEDA PREMIUM AUTO CARE. All rights reserved.</p>
        </div>
      </div>
    `
  }
};

const ManageEmailTemplates = () => {
  const { currentUser, userRole } = useAuth();
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    description: '',
    htmlContent: '',
    isActive: true
  });

  const initializeDefaultTemplates = useCallback(async () => {
    try {
      const batch = [];
      for (const [key, template] of Object.entries(defaultTemplates)) {
        batch.push(
          setDoc(doc(db, 'emailTemplates', key), {
            ...template,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: currentUser.uid
          })
        );
      }
      await Promise.all(batch);
      setSnackbar({ open: true, message: 'Default templates initialized successfully', severity: 'success' });
    } catch (error) {
      console.error('Error initializing templates:', error);
      setSnackbar({ open: true, message: 'Error initializing templates', severity: 'error' });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      console.log('No current user, skipping template load');
      return;
    }

    console.log('Loading templates for user:', currentUser.uid, 'with role:', userRole);
    
    // Load templates from Firestore
    const unsubscribe = onSnapshot(
      collection(db, 'emailTemplates'),
      (snapshot) => {
        console.log('Templates snapshot received:', snapshot.size, 'documents');
        const templatesData = {};
        snapshot.docs.forEach(doc => {
          console.log('Template doc:', doc.id, doc.data());
          templatesData[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        // If no templates exist, initialize with defaults
        if (snapshot.empty) {
          console.log('No templates found, initializing defaults');
          initializeDefaultTemplates();
        } else {
          console.log('Setting templates:', templatesData);
          setTemplates(templatesData);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading templates:', error);
        setSnackbar({ open: true, message: `Error loading templates: ${error.message}`, severity: 'error' });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, initializeDefaultTemplates]);

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      description: template.description,
      htmlContent: template.htmlContent,
      isActive: template.isActive
    });
    setEditDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      await updateDoc(doc(db, 'emailTemplates', selectedTemplate.id), {
        ...editForm,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });
      
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: 'Template updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating template:', error);
      setSnackbar({ open: true, message: 'Error updating template', severity: 'error' });
    }
  };

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleRestoreDefault = async (templateId) => {
    if (!defaultTemplates[templateId]) return;

    try {
      await updateDoc(doc(db, 'emailTemplates', templateId), {
        ...defaultTemplates[templateId],
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });
      
      setSnackbar({ open: true, message: 'Template restored to default', severity: 'success' });
    } catch (error) {
      console.error('Error restoring template:', error);
      setSnackbar({ open: true, message: 'Error restoring template', severity: 'error' });
    }
  };

  const handleToggleActive = async (templateId, isActive) => {
    try {
      await updateDoc(doc(db, 'emailTemplates', templateId), {
        isActive: !isActive,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });
      
      setSnackbar({ 
        open: true, 
        message: `Template ${!isActive ? 'activated' : 'deactivated'}`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error toggling template:', error);
      setSnackbar({ open: true, message: 'Error updating template', severity: 'error' });
    }
  };

  const renderPreviewContent = (htmlContent, variables) => {
    let preview = htmlContent;
    
    // Replace variables with sample data
    const sampleData = {
      userName: 'John Doe',
      service: 'Premium Car Detailing',
      date: 'December 15, 2024',
      time: '2:00 PM',
      address: '123 Main St, Columbus, OH 43215',
      finalPrice: '149.00',
      estimatedPrice: '149.00'
    };

    variables?.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      preview = preview.replace(regex, sampleData[variable] || `[${variable}]`);
    });

    return preview;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'appointment': return '#1976d2';
      case 'reminder': return '#ed6c02';
      case 'status': return '#2e7d32';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading templates...</Typography>
      </Box>
    );
  }

  // Debug info
  console.log('Current user:', currentUser?.uid);
  console.log('User role:', userRole);
  console.log('Templates:', templates);

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#4b5563', fontSize: { xs: '1.75rem', sm: '2.5rem' } }}>
          Email Templates
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => initializeDefaultTemplates()}
            sx={{ bgcolor: '#1976d2' }}
          >
            Initialize Templates
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{ borderColor: '#1976d2', color: '#1976d2' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Debug Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Debug Info:</strong> User: {currentUser?.email || 'Not logged in'} | 
          Role: {userRole || 'No role'} | 
          Templates loaded: {Object.keys(templates).length}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {Object.values(templates).map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(229, 231, 235, 0.8)',
              borderRadius: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease'
              }
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ color: getCategoryColor(template.category) }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {template.name}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={template.isActive}
                        onChange={() => handleToggleActive(template.id, template.isActive)}
                        size="small"
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                <Chip
                  label={template.category}
                  size="small"
                  sx={{
                    bgcolor: getCategoryColor(template.category),
                    color: 'white',
                    textTransform: 'capitalize',
                    mb: 2
                  }}
                />

                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Subject: {template.subject}
                </Typography>

                {template.variables && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Variables: {template.variables.join(', ')}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditTemplate(template)}
                    variant="outlined"
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Preview />}
                    onClick={() => handlePreviewTemplate(template)}
                    variant="outlined"
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Restore />}
                    onClick={() => handleRestoreDefault(template.id)}
                    variant="outlined"
                    color="warning"
                  >
                    Reset
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Template Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Edit Template: {selectedTemplate?.name}
            <IconButton onClick={() => setEditDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Basic Info" />
              <Tab label="HTML Content" />
              <Tab label="Variables" />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Template Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Email Subject"
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                fullWidth
              />
              <TextField
                label="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                }
                label="Template Active"
              />
            </Box>
          )}

          {tabValue === 1 && (
            <TextField
              label="HTML Content"
              value={editForm.htmlContent}
              onChange={(e) => setEditForm({ ...editForm, htmlContent: e.target.value })}
              multiline
              rows={20}
              fullWidth
              sx={{ fontFamily: 'monospace' }}
              helperText="Use double curly braces for dynamic content (e.g., userName, service)"
            />
          )}

          {tabValue === 2 && selectedTemplate && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Available Variables
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use these variables in your template by wrapping them in double curly braces: {'{{'} variableName {'}}'}
              </Typography>
              <List>
                {selectedTemplate.variables?.map((variable) => (
                  <ListItem key={variable}>
                    <ListItemText
                      primary={`{{${variable}}}`}
                      secondary={`Dynamic ${variable} content`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained" startIcon={<Save />}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Preview: {selectedTemplate?.name}
            <IconButton onClick={() => setPreviewDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This preview shows sample data. Variables like {'{{'} userName {'}}'}  are replaced with example values.
          </Alert>
          <Paper 
            sx={{ 
              p: 2, 
              maxHeight: '600px', 
              overflow: 'auto',
              border: '1px solid #e0e0e0'
            }}
          >
            <div 
              dangerouslySetInnerHTML={{ 
                __html: selectedTemplate ? renderPreviewContent(
                  selectedTemplate.htmlContent, 
                  selectedTemplate.variables
                ) : '' 
              }} 
            />
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageEmailTemplates;
