import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocalOffer,
  Star,
  DirectionsCar,
  Brush,
  Shield,
  Schedule
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discount: '',
    type: 'percentage',
    category: 'all',
    validUntil: dayjs().add(1, 'month'),
    minAmount: '',
    maxDiscount: '',
    status: 'active',
    icon: 'LocalOffer',
    color: '#1976d2'
  });

  const iconOptions = [
    { value: 'LocalOffer', label: 'Coupon', icon: <LocalOffer /> },
    { value: 'Star', label: 'Star', icon: <Star /> },
    { value: 'DirectionsCar', label: 'Car', icon: <DirectionsCar /> },
    { value: 'Brush', label: 'Brush', icon: <Brush /> },
    { value: 'Shield', label: 'Shield', icon: <Shield /> },
    { value: 'Schedule', label: 'Schedule', icon: <Schedule /> }
  ];

  const colorOptions = [
    { value: '#1976d2', label: 'Blue' },
    { value: '#FFD700', label: 'Gold' },
    { value: '#4caf50', label: 'Green' },
    { value: '#ff9800', label: 'Orange' },
    { value: '#9c27b0', label: 'Purple' },
    { value: '#f44336', label: 'Red' }
  ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const couponsData = [];
      snapshot.forEach((doc) => {
        const couponData = doc.data();
        // Convert Firestore timestamp to dayjs
        if (couponData.validUntil?.toDate) {
          couponData.validUntil = dayjs(couponData.validUntil.toDate());
        }
        couponsData.push({ id: doc.id, ...couponData });
      });
      setCoupons(couponsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const couponData = {
        ...formData,
        validUntil: Timestamp.fromDate(formData.validUntil.toDate()),
        discount: parseFloat(formData.discount),
        minAmount: parseFloat(formData.minAmount),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        createdAt: editingCoupon ? undefined : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), couponData);
        setSnackbar({
          open: true,
          message: 'Coupon updated successfully!',
          severity: 'success'
        });
      } else {
        await addDoc(collection(db, 'coupons'), couponData);
        setSnackbar({
          open: true,
          message: 'Coupon created successfully!',
          severity: 'success'
        });
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving coupon:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save coupon. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      ...coupon,
      validUntil: dayjs(coupon.validUntil)
    });
    setDialogOpen(true);
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteDoc(doc(db, 'coupons', couponId));
        setSnackbar({
          open: true,
          message: 'Coupon deleted successfully!',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting coupon:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete coupon. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'coupons', coupon.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setSnackbar({
        open: true,
        message: `Coupon ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating coupon status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update coupon status.',
        severity: 'error'
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      discount: '',
      type: 'percentage',
      category: 'all',
      validUntil: dayjs().add(1, 'month'),
      minAmount: '',
      maxDiscount: '',
      status: 'active',
      icon: 'LocalOffer',
      color: '#1976d2'
    });
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      LocalOffer: <LocalOffer />,
      Star: <Star />,
      DirectionsCar: <DirectionsCar />,
      Brush: <Brush />,
      Shield: <Shield />,
      Schedule: <Schedule />
    };
    return iconMap[iconName] || <LocalOffer />;
  };

  const formatDiscount = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.discount}% OFF`;
    }
    return `$${coupon.discount} OFF`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            🎫 Manage Coupons
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            size="large"
          >
            Add New Coupon
          </Button>
        </Box>

        {/* Coupons Table */}
        <Paper sx={{ mb: 4 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Coupon</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: '50%',
                            background: coupon.color,
                            color: 'white'
                          }}
                        >
                          {getIconComponent(coupon.icon)}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {coupon.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {coupon.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={coupon.code} 
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" sx={{ color: coupon.color, fontWeight: 'bold' }}>
                        {formatDiscount(coupon)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        Min: ${coupon.minAmount}
                        {coupon.maxDiscount && ` | Max: $${coupon.maxDiscount}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {coupon.validUntil?.format?.('MMM DD, YYYY') || 'Invalid Date'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={coupon.status === 'active'}
                            onChange={() => handleToggleStatus(coupon)}
                            color="primary"
                          />
                        }
                        label={coupon.status === 'active' ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleEdit(coupon)}
                          color="primary"
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(coupon.id)}
                          color="error"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {coupons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                        No coupons found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        Click "Add New Coupon" to create your first coupon
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Add/Edit Coupon Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Coupon Code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    inputProps={{ style: { fontFamily: 'monospace' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={2}
                    required
                  />
                </Grid>

                {/* Discount Configuration */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Discount Amount"
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Discount Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Discount Type"
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <MenuItem value="percentage">Percentage (%)</MenuItem>
                      <MenuItem value="fixed">Fixed Amount ($)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <MenuItem value="all">All Services</MenuItem>
                      <MenuItem value="basic">Basic Wash</MenuItem>
                      <MenuItem value="premium">Premium Detail</MenuItem>
                      <MenuItem value="ceramic">Ceramic Coating</MenuItem>
                      <MenuItem value="subscription">Monthly Plans</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Terms */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Minimum Order Amount"
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Maximum Discount (Optional)"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Valid Until"
                      value={formData.validUntil}
                      onChange={(newValue) => setFormData({ ...formData, validUntil: newValue })}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </LocalizationProvider>
                </Grid>

                {/* Appearance */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Icon</InputLabel>
                    <Select
                      value={formData.icon}
                      label="Icon"
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    >
                      {iconOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {option.icon}
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Color</InputLabel>
                    <Select
                      value={formData.color}
                      label="Color"
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    >
                      {colorOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: option.value
                              }}
                            />
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </DialogActions>
          </form>
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

export default ManageCoupons;
