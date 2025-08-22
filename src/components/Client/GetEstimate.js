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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  RequestQuote,
  CheckCircle,
  Star,
  Send
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';

const GetEstimate = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    vehicleType: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    services: [],
    specialRequests: '',
    contactPreference: 'email',
    phone: '',
    urgency: 'standard',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    additionalNotes: ''
  });

  const steps = ['Vehicle Info', 'Services Needed', 'Contact & Location', 'Submit Request'];

  const vehicleTypes = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible', 'Van', 'Motorcycle', 'RV', 'Other'];
  
  const serviceOptions = [
    { id: 'exterior_wash', name: 'Exterior Hand Wash', basePrice: 50 },
    { id: 'interior_clean', name: 'Interior Deep Clean', basePrice: 80 },
    { id: 'paint_correction', name: 'Paint Correction', basePrice: 200 },
    { id: 'ceramic_coating', name: 'Ceramic Coating', basePrice: 400 },
    { id: 'headlight_restoration', name: 'Headlight Restoration', basePrice: 60 },
    { id: 'engine_bay', name: 'Engine Bay Cleaning', basePrice: 40 },
    { id: 'leather_treatment', name: 'Leather Conditioning', basePrice: 70 },
    { id: 'odor_removal', name: 'Odor Elimination', basePrice: 90 },
    { id: 'scratch_removal', name: 'Scratch Removal', basePrice: 150 },
    { id: 'wax_sealant', name: 'Wax & Sealant', basePrice: 80 }
  ];

  useEffect(() => {
    if (currentUser) {
      const estimatesQuery = query(
        collection(db, 'estimates'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleServiceToggle = (serviceId) => {
    const updatedServices = formData.services.includes(serviceId)
      ? formData.services.filter(id => id !== serviceId)
      : [...formData.services, serviceId];
    
    setFormData({
      ...formData,
      services: updatedServices
    });
  };

  const calculateEstimate = () => {
    let total = 0;
    formData.services.forEach(serviceId => {
      const service = serviceOptions.find(s => s.id === serviceId);
      if (service) {
        total += service.basePrice;
      }
    });

    // Vehicle type multiplier
    const multipliers = {
      'Sedan': 1.0,
      'SUV': 1.3,
      'Truck': 1.4,
      'Van': 1.3,
      'RV': 1.8,
      'Other': 1.2
    };
    
    total *= (multipliers[formData.vehicleType] || 1.0);

    // Urgency multiplier
    if (formData.urgency === 'urgent') {
      total *= 1.25;
    }

    return Math.round(total);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      navigate('/dashboard');
    } else {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const estimateData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        vehicleInfo: {
          type: formData.vehicleType,
          year: formData.vehicleYear,
          make: formData.vehicleMake,
          model: formData.vehicleModel
        },
        services: formData.services,
        serviceDetails: formData.services.map(serviceId => {
          const service = serviceOptions.find(s => s.id === serviceId);
          return service ? { id: serviceId, name: service.name, basePrice: service.basePrice } : null;
        }).filter(Boolean),
        specialRequests: formData.specialRequests,
        contactPreference: formData.contactPreference,
        phone: formData.phone,
        urgency: formData.urgency,
        address: formData.address,
        additionalNotes: formData.additionalNotes,
        estimatedPrice: calculateEstimate(),
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'estimates'), estimateData);
      setSuccess(true);
      setActiveStep(0);
      setFormData({
        vehicleType: '',
        vehicleYear: '',
        vehicleMake: '',
        vehicleModel: '',
        services: [],
        specialRequests: '',
        contactPreference: 'email',
        phone: '',
        urgency: 'standard',
        address: { street: '', city: '', state: '', zipCode: '' },
        additionalNotes: ''
      });
    } catch (error) {
      console.error('Error creating estimate:', error);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'reviewed': return '#1976d2';
      case 'quoted': return '#2e7d32';
      case 'declined': return '#d32f2f';
      default: return '#757575';
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                >
                  {vehicleTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="vehicleYear"
                label="Year"
                value={formData.vehicleYear}
                onChange={handleChange}
                placeholder="e.g., 2020"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="vehicleMake"
                label="Make"
                value={formData.vehicleMake}
                onChange={handleChange}
                placeholder="e.g., Toyota"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="vehicleModel"
                label="Model"
                value={formData.vehicleModel}
                onChange={handleChange}
                placeholder="e.g., Camry"
                required
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Select Services Needed:
            </Typography>
            <Grid container spacing={2}>
              {serviceOptions.map(service => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: formData.services.includes(service.id) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                    }}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {service.name}
                        </Typography>
                        {formData.services.includes(service.id) && (
                          <CheckCircle sx={{ color: '#1976d2' }} />
                        )}
                      </Box>
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                        From ${service.basePrice}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Special Requests"
              placeholder="Any specific requirements or areas of concern..."
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              sx={{ mt: 3 }}
            />
          </Box>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Contact Preference</InputLabel>
                <Select
                  name="contactPreference"
                  value={formData.contactPreference}
                  onChange={handleChange}
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="phone">Phone</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                required={formData.contactPreference !== 'email'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Urgency</InputLabel>
                <Select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                >
                  <MenuItem value="standard">Standard (3-5 days)</MenuItem>
                  <MenuItem value="urgent">Urgent (+25% fee)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Service Location:
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="address.street"
                label="Street Address"
                value={formData.address.street}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="address.city"
                label="City"
                value={formData.address.city}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="address.state"
                label="State"
                value={formData.address.state}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="address.zipCode"
                label="Zip Code"
                value={formData.address.zipCode}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="additionalNotes"
                label="Additional Notes"
                placeholder="Any other information that would help us provide an accurate estimate..."
                value={formData.additionalNotes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Estimate Request Summary
            </Typography>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formData.vehicleYear} {formData.vehicleMake} {formData.vehicleModel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.vehicleType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Services Selected</Typography>
                    {formData.services.map(serviceId => {
                      const service = serviceOptions.find(s => s.id === serviceId);
                      return service ? (
                        <Typography key={serviceId} variant="body2">
                          • {service.name}
                        </Typography>
                      ) : null;
                    })}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                    <Typography variant="body2">{formData.contactPreference}</Typography>
                    {formData.phone && <Typography variant="body2">{formData.phone}</Typography>}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Estimated Price Range</Typography>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                      ${calculateEstimate()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      *Final price may vary based on vehicle condition
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return 'Unknown step';
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
            Our team will contact you via your preferred method with a detailed quote and available appointment times.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setSuccess(false)}
          >
            Request Another Estimate
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Get Custom Estimate
      </Typography>

      <Grid container spacing={4}>
        {/* Estimate Request Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={handleBack}
                variant="outlined"
              >
                {activeStep === 0 ? 'Back to Dashboard' : 'Back'}
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  size="large"
                  startIcon={<Send />}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && (!formData.vehicleType || !formData.vehicleYear || !formData.vehicleMake)) ||
                    (activeStep === 1 && formData.services.length === 0) ||
                    (activeStep === 2 && (!formData.address.street || !formData.address.city))
                  }
                >
                  Next
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Estimate History & Info */}
        <Grid item xs={12} md={4}>
          {/* Why Choose Us */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Star sx={{ mr: 1, color: '#FFD700' }} />
                Why Get an Estimate?
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Accurate Pricing"
                    secondary="Customized based on your vehicle and needs"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="No Surprises"
                    secondary="Transparent pricing with no hidden fees"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Expert Consultation"
                    secondary="Personalized service recommendations"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Previous Estimates */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Your Estimate Requests
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {estimates.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <RequestQuote sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No estimates requested yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {estimates.slice(0, 3).map((estimate) => (
                    <ListItem 
                      key={estimate.id}
                      button
                      onClick={() => {
                        setSelectedEstimate(estimate);
                        setDialogOpen(true);
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {estimate.vehicleInfo?.year} {estimate.vehicleInfo?.make}
                            </Typography>
                            <Chip 
                              label={estimate.status} 
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(estimate.status),
                                color: 'white',
                                textTransform: 'capitalize'
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {estimate.createdAt ? new Date(estimate.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                            {estimate.estimatedPrice && ` • $${estimate.estimatedPrice}`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Estimate Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Estimate Request Details</DialogTitle>
        <DialogContent>
          {selectedEstimate && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
                <Typography variant="body1">
                  {selectedEstimate.vehicleInfo?.year} {selectedEstimate.vehicleInfo?.make} {selectedEstimate.vehicleInfo?.model}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={selectedEstimate.status} 
                  sx={{
                    bgcolor: getStatusColor(selectedEstimate.status),
                    color: 'white',
                    textTransform: 'capitalize'
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Services Requested</Typography>
                {selectedEstimate.serviceDetails?.map((service, index) => (
                  <Typography key={index} variant="body2">
                    • {service.name}
                  </Typography>
                ))}
              </Grid>
              {selectedEstimate.estimatedPrice && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Estimated Price</Typography>
                  <Typography variant="h6" color="primary">
                    ${selectedEstimate.estimatedPrice}
                  </Typography>
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
