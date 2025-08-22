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
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  Cancel,
  DirectionsCar,
  Schedule,
  Email,
  Phone,
  Person,
  Edit
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
  serverTimestamp 
} from 'firebase/firestore';

const ManageEstimates = () => {
  const [estimates, setEstimates] = useState([]);
  const [, setLoading] = useState(true);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [finalPrice, setFinalPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'estimates'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const estimatesData = [];
        snapshot.forEach((doc) => {
          estimatesData.push({ id: doc.id, ...doc.data() });
        });
        setEstimates(estimatesData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (estimateId, newStatus, price = null, notes = null) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (price) {
        updateData.finalPrice = parseFloat(price);
      }

      if (notes) {
        updateData.adminNotes = notes;
      }

      if (newStatus === 'approved') {
        updateData.approvedAt = serverTimestamp();
      } else if (newStatus === 'rejected') {
        updateData.rejectedAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'estimates', estimateId), updateData);
      
      setSnackbar({
        open: true,
        message: `Estimate ${newStatus} successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating estimate:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update estimate status.',
        severity: 'error'
      });
    }
  };

  const handleReviewSubmit = async () => {
    if (!finalPrice.trim() || !selectedEstimate) return;

    try {
      await handleStatusChange(selectedEstimate.id, 'approved', finalPrice, adminNotes);
      setReviewDialogOpen(false);
      setFinalPrice('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleViewDetails = (estimate) => {
    setSelectedEstimate(estimate);
    setDetailsDialogOpen(true);
  };

  const handleReview = (estimate) => {
    setSelectedEstimate(estimate);
    setFinalPrice(estimate.estimatedPrice?.toString() || '');
    setAdminNotes('');
    setReviewDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'approved': return '#2e7d32';
      case 'rejected': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getFilteredEstimates = () => {
    switch (tabValue) {
      case 0: return estimates; // All
      case 1: return estimates.filter(estimate => estimate.status === 'pending');
      case 2: return estimates.filter(estimate => estimate.status === 'approved');
      case 3: return estimates.filter(estimate => estimate.status === 'rejected');
      default: return estimates;
    }
  };

  const getTabCounts = () => {
    return {
      all: estimates.length,
      pending: estimates.filter(e => e.status === 'pending').length,
      approved: estimates.filter(e => e.status === 'approved').length,
      rejected: estimates.filter(e => e.status === 'rejected').length
    };
  };

  const counts = getTabCounts();
  const filteredEstimates = getFilteredEstimates();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          💰 Manage Estimates
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {counts.all}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Estimates
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                  {counts.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {counts.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  {counts.rejected}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejected
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
            variant="fullWidth"
          >
            <Tab label={`All (${counts.all})`} />
            <Tab label={`Pending (${counts.pending})`} />
            <Tab label={`Approved (${counts.approved})`} />
            <Tab label={`Rejected (${counts.rejected})`} />
          </Tabs>
        </Paper>

        {/* Estimates Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Services</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Estimated Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEstimates.map((estimate) => (
                  <TableRow key={estimate.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {estimate.userName || estimate.customerName || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {estimate.userEmail || estimate.customerEmail}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {estimate.contactPhone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {estimate.selectedServices?.length || 0} Services
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {estimate.selectedServices?.slice(0, 2).join(', ')}
                        {estimate.selectedServices?.length > 2 && '...'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {estimate.vehicleYear} {estimate.vehicleMake} {estimate.vehicleModel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {estimate.vehicleType} • {estimate.vehicleCondition}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        ${estimate.finalPrice || estimate.estimatedPrice || 'TBD'}
                      </Typography>
                      {estimate.finalPrice && estimate.finalPrice !== estimate.estimatedPrice && (
                        <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          ${estimate.estimatedPrice}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={estimate.status || 'pending'} 
                        sx={{
                          bgcolor: getStatusColor(estimate.status),
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {estimate.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {estimate.createdAt?.toDate?.()?.toLocaleTimeString() || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleViewDetails(estimate)}
                          color="primary"
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                        {estimate.status === 'pending' && (
                          <>
                            <IconButton
                              onClick={() => handleReview(estimate)}
                              sx={{ color: '#2e7d32' }}
                              size="small"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              onClick={() => handleStatusChange(estimate.id, 'rejected', null, 'Estimate rejected by admin')}
                              sx={{ color: '#d32f2f' }}
                              size="small"
                            >
                              <Cancel />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEstimates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                        No estimates found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        {tabValue === 0 ? 'No estimate requests have been submitted yet.' : 'No estimates match the selected filter.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Estimate Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            Estimate Details - #{selectedEstimate?.id?.slice(-8)}
          </DialogTitle>
          <DialogContent>
            {selectedEstimate && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Customer Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Person sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedEstimate.userName || selectedEstimate.customerName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Email sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedEstimate.userEmail || selectedEstimate.customerEmail}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Phone sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedEstimate.contactPhone || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      Preferred: {selectedEstimate.preferredDate || 'Flexible'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Vehicle Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Vehicle Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DirectionsCar sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedEstimate.vehicleYear} {selectedEstimate.vehicleMake} {selectedEstimate.vehicleModel}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Type:</strong> {selectedEstimate.vehicleType}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Color:</strong> {selectedEstimate.vehicleColor}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Condition:</strong> {selectedEstimate.vehicleCondition}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Mileage:</strong> {selectedEstimate.vehicleMileage?.toLocaleString() || 'N/A'} miles
                  </Typography>
                </Grid>

                {/* Requested Services */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Requested Services
                  </Typography>
                  <List dense>
                    {selectedEstimate.selectedServices?.map((service, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={service}
                          sx={{ 
                            '& .MuiListItemText-primary': { 
                              fontSize: '0.9rem' 
                            } 
                          }}
                        />
                      </ListItem>
                    )) || (
                      <Typography variant="body2" color="text.secondary">
                        No services specified
                      </Typography>
                    )}
                  </List>
                </Grid>

                {/* Special Requirements */}
                {selectedEstimate.specialRequirements && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      Special Requirements
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {selectedEstimate.specialRequirements}
                    </Typography>
                  </Grid>
                )}

                {/* Pricing */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Pricing Information
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Estimated Price:</strong> ${selectedEstimate.estimatedPrice}
                  </Typography>
                  {selectedEstimate.finalPrice && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Final Price:</strong> ${selectedEstimate.finalPrice}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> 
                    <Chip 
                      label={selectedEstimate.status || 'pending'} 
                      size="small"
                      sx={{
                        ml: 1,
                        bgcolor: getStatusColor(selectedEstimate.status),
                        color: 'white',
                        textTransform: 'capitalize'
                      }}
                    />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Created:</strong> {selectedEstimate.createdAt?.toDate?.()?.toLocaleString() || 'Recently'}
                  </Typography>

                  {selectedEstimate.adminNotes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Admin Notes:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        p: 2, 
                        bgcolor: '#e3f2fd', 
                        borderRadius: 1
                      }}>
                        {selectedEstimate.adminNotes}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            {selectedEstimate?.status === 'pending' && (
              <>
                <Button 
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleReview(selectedEstimate);
                  }}
                  variant="contained" 
                  color="primary"
                >
                  Review & Price
                </Button>
                <Button 
                  onClick={() => {
                    handleStatusChange(selectedEstimate.id, 'rejected', null, 'Estimate rejected by admin');
                    setDetailsDialogOpen(false);
                  }}
                  variant="contained" 
                  color="error"
                >
                  Reject
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Review & Price Dialog */}
        <Dialog 
          open={reviewDialogOpen} 
          onClose={() => setReviewDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            Review Estimate - {selectedEstimate?.vehicleYear} {selectedEstimate?.vehicleMake}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              Current estimated price: ${selectedEstimate?.estimatedPrice}
            </Typography>
            <TextField
              fullWidth
              label="Final Price"
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ mb: 3 }}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Admin Notes (Optional)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes about pricing adjustments, timeline, or special considerations..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleReviewSubmit}
              variant="contained"
              disabled={!finalPrice.trim()}
            >
              Approve Estimate
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default ManageEstimates;
