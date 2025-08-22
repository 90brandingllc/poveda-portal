import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  LocalOffer,
  CheckCircle,
  Cancel,
  ContentCopy
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

const AnimatedCard = motion(Card);

const Coupons = () => {
  const { currentUser } = useAuth();
  const [userCoupons, setUserCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      let couponsLoaded = false;
      let userCouponsLoaded = false;
      
      const checkLoadingComplete = () => {
        if (couponsLoaded && userCouponsLoaded) {
          setLoading(false);
        }
      };

      // Load available coupons from admin
      const couponsQuery = query(
        collection(db, 'coupons'),
        where('status', '==', 'active')
      );

      const unsubscribeCoupons = onSnapshot(couponsQuery, (snapshot) => {
        const couponsData = [];
        snapshot.forEach((doc) => {
          const couponData = doc.data();
          // Convert Firestore timestamp to Date
          if (couponData.validUntil?.toDate) {
            couponData.validUntil = couponData.validUntil.toDate();
          }
          couponsData.push({ id: doc.id, ...couponData });
        });
        setAvailableCoupons(couponsData);
        couponsLoaded = true;
        checkLoadingComplete();
      }, (error) => {
        console.error('Error loading coupons:', error);
        setAvailableCoupons([]);
        couponsLoaded = true;
        checkLoadingComplete();
      });

      // Load user's redeemed coupons
      const userCouponsQuery = query(
        collection(db, 'userCoupons'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribeUserCoupons = onSnapshot(userCouponsQuery, (snapshot) => {
        const userCouponData = [];
        snapshot.forEach((doc) => {
          userCouponData.push({ id: doc.id, ...doc.data() });
        });
        setUserCoupons(userCouponData);
        userCouponsLoaded = true;
        checkLoadingComplete();
      }, (error) => {
        console.error('Error loading user coupons:', error);
        setUserCoupons([]);
        userCouponsLoaded = true;
        checkLoadingComplete();
      });

      // Fallback timeout to ensure loading stops
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 2000);

      return () => {
        unsubscribeCoupons();
        unsubscribeUserCoupons();
        clearTimeout(timeoutId);
      };
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const isCouponUsed = (couponCode) => {
    return userCoupons.some(uc => uc.couponCode === couponCode && uc.status === 'used');
  };

  const isCouponRedeemed = (couponCode) => {
    return userCoupons.some(uc => uc.couponCode === couponCode);
  };

  const handleRedeemCoupon = async (coupon) => {
    setSelectedCoupon(coupon);
    setRedeemDialogOpen(true);
  };

  const confirmRedeem = async () => {
    if (!selectedCoupon || !serviceType) {
      setSnackbar({
        open: true,
        message: 'Please select a service type',
        severity: 'warning'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'userCoupons'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        couponCode: selectedCoupon.code,
        couponTitle: selectedCoupon.title,
        discount: selectedCoupon.discount,
        discountType: selectedCoupon.type,
        serviceType: serviceType,
        status: 'redeemed',
        redeemedAt: serverTimestamp(),
        validUntil: selectedCoupon.validUntil,
        minAmount: selectedCoupon.minAmount,
        maxDiscount: selectedCoupon.maxDiscount || null
      });

      setSnackbar({
        open: true,
        message: `Coupon ${selectedCoupon.code} redeemed successfully!`,
        severity: 'success'
      });

      setRedeemDialogOpen(false);
      setSelectedCoupon(null);
      setServiceType('');
    } catch (error) {
      console.error('Error redeeming coupon:', error);
      setSnackbar({
        open: true,
        message: 'Failed to redeem coupon. Please try again.',
        severity: 'error'
      });
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setSnackbar({
      open: true,
      message: `Coupon code ${code} copied to clipboard!`,
      severity: 'info'
    });
  };

  const getCouponStatus = (coupon) => {
    if (isCouponUsed(coupon.code)) {
      return { label: 'Used', color: 'default', icon: <CheckCircle /> };
    }
    if (isCouponRedeemed(coupon.code)) {
      return { label: 'Redeemed', color: 'success', icon: <CheckCircle /> };
    }
    if (new Date() > coupon.validUntil) {
      return { label: 'Expired', color: 'error', icon: <Cancel /> };
    }
    return { label: 'Available', color: 'primary', icon: <LocalOffer /> };
  };

  const formatDiscount = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.discount}% OFF`;
    }
    return `$${coupon.discount} OFF`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>Available Coupons</Typography>
          <LinearProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h3" gutterBottom align="center" sx={{ mb: 4, fontWeight: 'bold' }}>
          💰 Available Coupons & Deals
        </Typography>
        
        {/* Active Coupons Grid */}
        {availableCoupons.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', mb: 4 }}>
            <Box sx={{ mb: 3 }}>
              <LocalOffer sx={{ fontSize: 64, color: '#ddd' }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ color: '#666' }}>
              No Coupons Available
            </Typography>
            <Typography variant="body1" sx={{ color: '#999' }}>
              Check back later for new deals and offers!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {availableCoupons.map((coupon, index) => {
            const status = getCouponStatus(coupon);
            const isAvailable = status.label === 'Available';
            
            return (
              <Grid item xs={12} md={6} lg={4} key={coupon.id}>
                <AnimatedCard
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  sx={{
                    height: '100%',
                    background: isAvailable 
                      ? `linear-gradient(135deg, ${coupon.color}15, ${coupon.color}05)`
                      : '#f5f5f5',
                    border: isAvailable ? `2px solid ${coupon.color}` : '2px solid #ddd',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isAvailable ? 1 : 0.7
                  }}
                >
                  {/* Discount Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: coupon.color,
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    {formatDiscount(coupon)}
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    {/* Icon and Title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: '50%',
                          background: coupon.color,
                          color: 'white',
                          mr: 2
                        }}
                      >
                        {coupon.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {coupon.title}
                      </Typography>
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                      {coupon.description}
                    </Typography>

                    {/* Coupon Code */}
                    <Box
                      sx={{
                        background: '#f8f9fa',
                        border: '2px dashed #ddd',
                        borderRadius: '8px',
                        p: 2,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          color: coupon.color
                        }}
                      >
                        {coupon.code}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => copyToClipboard(coupon.code)}
                        startIcon={<ContentCopy />}
                        sx={{ minWidth: 'auto' }}
                      >
                        Copy
                      </Button>
                    </Box>

                    {/* Terms */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                        Valid until: {coupon.validUntil.toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                        Minimum order: ${coupon.minAmount}
                      </Typography>
                      {coupon.maxDiscount && (
                        <Typography variant="caption" display="block" sx={{ color: '#666' }}>
                          Max discount: ${coupon.maxDiscount}
                        </Typography>
                      )}
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Status and Action */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip
                        icon={status.icon}
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                      
                      {isAvailable && !isCouponRedeemed(coupon.code) && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleRedeemCoupon(coupon)}
                          sx={{
                            background: coupon.color,
                            '&:hover': {
                              background: coupon.color,
                              filter: 'brightness(0.9)'
                            }
                          }}
                        >
                          Redeem
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            );
          })}
        </Grid>
        )}

        {/* My Redeemed Coupons Section */}
        {userCoupons.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
              🎫 My Redeemed Coupons
            </Typography>
            <Grid container spacing={2}>
              {userCoupons.map((userCoupon, index) => (
                <Grid item xs={12} md={6} key={userCoupon.id}>
                  <Paper
                    sx={{
                      p: 3,
                      background: userCoupon.status === 'used' ? '#f5f5f5' : '#e8f5e8',
                      border: userCoupon.status === 'used' ? '1px solid #ddd' : '1px solid #4caf50'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{userCoupon.couponTitle}</Typography>
                      <Chip
                        label={userCoupon.status === 'used' ? 'Used' : 'Available'}
                        color={userCoupon.status === 'used' ? 'default' : 'success'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Code: <strong>{userCoupon.couponCode}</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Service: {userCoupon.serviceType}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Redeemed: {userCoupon.redeemedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Redeem Dialog */}
        <Dialog open={redeemDialogOpen} onClose={() => setRedeemDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Redeem Coupon: {selectedCoupon?.code}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              {selectedCoupon?.description}
            </Typography>
            <TextField
              fullWidth
              label="Service Type"
              select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="">Select service type</option>
              <option value="Basic Wash & Wax">Basic Wash & Wax</option>
              <option value="Premium Detail">Premium Detail</option>
              <option value="Ceramic Coating">Ceramic Coating</option>
              <option value="Paint Protection">Paint Protection</option>
              <option value="Interior Detail">Interior Detail</option>
              <option value="Exterior Detail">Exterior Detail</option>
              <option value="Full Service">Full Service</option>
            </TextField>
            <Alert severity="info" sx={{ mt: 2 }}>
              This coupon will be saved to your account and can be used when booking your next service.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRedeemDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmRedeem} variant="contained">
              Redeem Coupon
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

export default Coupons;
