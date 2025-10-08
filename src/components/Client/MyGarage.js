import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add,
  DirectionsCar,
  History,
  Edit,
  MoreVert
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import ClientLayout from '../Layout/ClientLayout';

const MyGarage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [editVehicleOpen, setEditVehicleOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    nickname: '',
    phoneNumber: ''
  });

  // Fetch vehicles
  useEffect(() => {
    if (currentUser) {
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(vehiclesQuery, (snapshot) => {
        const userVehicles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVehicles(userVehicles);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching vehicles:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleAddVehicle = () => {
    setVehicleForm({
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
      nickname: '',
      phoneNumber: ''
    });
    setAddVehicleOpen(true);
    setError('');
    setSuccess('');
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleForm({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      licensePlate: vehicle.licensePlate || '',
      nickname: vehicle.nickname || '',
      phoneNumber: vehicle.phoneNumber || ''
    });
    setEditVehicleOpen(true);
    setMenuAnchor(null);
    setError('');
    setSuccess('');
  };

  const handleFormChange = (field) => (event) => {
    setVehicleForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Ensure user document exists
  const ensureUserDocument = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || '',
          role: 'client',
          createdAt: serverTimestamp()
        });

      }
    } catch (error) {
      console.error('Error ensuring user document:', error);
      throw error;
    }
  };

  const handleSaveVehicle = async () => {
    try {
      setError('');
      
      // Validation
      if (!vehicleForm.make.trim() || !vehicleForm.model.trim() || !vehicleForm.year.trim()) {
        setError('Please fill in Make, Model, and Year fields.');
        return;
      }

      // Ensure user document exists before creating vehicle
      await ensureUserDocument();

      const vehicleData = {
        ...vehicleForm,
        year: parseInt(vehicleForm.year),
        userId: currentUser.uid,
        updatedAt: serverTimestamp()
      };

      if (selectedVehicle) {
        // Update existing vehicle
        await updateDoc(doc(db, 'vehicles', selectedVehicle.id), vehicleData);
        setSuccess('Vehicle updated successfully!');
        setEditVehicleOpen(false);
      } else {
        // Add new vehicle
        vehicleData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'vehicles'), vehicleData);
        setSuccess('Vehicle added successfully!');
        setAddVehicleOpen(false);
      }

      setSelectedVehicle(null);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setError('Failed to save vehicle. Please try again.');
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId));
      setSuccess('Vehicle deleted successfully!');
      setMenuAnchor(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setError('Failed to delete vehicle. Please try again.');
    }
  };

  const handleMenuClick = (event, vehicle) => {
    setMenuAnchor(event.currentTarget);
    setSelectedVehicle(vehicle);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedVehicle(null);
  };

  // Fetch appointment data for service counts
  const [appointmentCounts, setAppointmentCounts] = useState({});

  useEffect(() => {
    if (currentUser && vehicles.length > 0) {
      // Fetch all user appointments to count by vehicle
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
        const counts = {};
        const lastDates = {};
        
        snapshot.docs.forEach(doc => {
          const appointment = doc.data();
          const vehicleId = appointment.vehicleId;
          
          if (vehicleId) {
            // Count services per vehicle
            counts[vehicleId] = (counts[vehicleId] || 0) + 1;
            
            // Track last service date
            const appointmentDate = appointment.createdAt || appointment.date;
            if (appointmentDate && (!lastDates[vehicleId] || appointmentDate.seconds > lastDates[vehicleId].seconds)) {
              lastDates[vehicleId] = appointmentDate;
            }
          }
        });
        
        setAppointmentCounts({ counts, lastDates });
      }, (error) => {
        console.error('Error fetching appointment counts:', error);
      });

      return () => unsubscribe();
    }
  }, [currentUser, vehicles]);

  const getServiceCount = (vehicleId) => {
    return appointmentCounts.counts?.[vehicleId] || 0;
  };

  const getLastServiceDate = (vehicleId) => {
    const lastDate = appointmentCounts.lastDates?.[vehicleId];
    if (!lastDate) return null;
    
    const date = lastDate.toDate ? lastDate.toDate() : new Date(lastDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ClientLayout>
      <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 4 } }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4 
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              My Garage
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your vehicles and track their service history
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddVehicle}
            sx={{
              background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            Add Vehicle
          </Button>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Vehicles Grid */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography>Loading your vehicles...</Typography>
          </Box>
        ) : vehicles.length === 0 ? (
          <Card sx={{ 
            p: 6, 
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <DirectionsCar sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#6b7280', mb: 1 }}>
              No Vehicles Yet
            </Typography>
            <Typography variant="body1" sx={{ color: '#9ca3af', mb: 3 }}>
              Start by adding your first vehicle to track its service history
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddVehicle}
              sx={{
                background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Add Your First Vehicle
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {vehicles.map((vehicle) => (
              <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                <Card sx={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 25px -5px rgb(0, 0, 0, 0.15)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    {/* Vehicle Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DirectionsCar sx={{ color: '#0891b2', mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Typography>
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleMenuClick(e, vehicle)}
                        sx={{ color: '#6b7280' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    {/* Vehicle Details */}
                    <Box sx={{ mb: 3 }}>
                      {vehicle.nickname && (
                        <Chip 
                          label={vehicle.nickname} 
                          size="small" 
                          sx={{ 
                            mb: 1,
                            background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                            color: 'white',
                            fontWeight: 500
                          }} 
                        />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        <strong>Color:</strong> {vehicle.color}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>License:</strong> {vehicle.licensePlate}
                      </Typography>
                      {vehicle.phoneNumber && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Phone:</strong> {vehicle.phoneNumber}
                        </Typography>
                      )}
                    </Box>

                    {/* Service Info */}
                    <Box sx={{ 
                      p: 2, 
                      background: 'rgba(8, 145, 178, 0.1)', 
                      borderRadius: '12px',
                      mb: 2
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Service Summary
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Services: {getServiceCount(vehicle.id)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last Service: {getLastServiceDate(vehicle.id) || 'None yet'}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<History />}
                      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                      sx={{
                        borderColor: '#0891b2',
                        color: '#0891b2',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          borderColor: '#0891b2',
                          background: 'rgba(8, 145, 178, 0.1)'
                        }
                      }}
                    >
                      View Service History
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Vehicle Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleEditVehicle(selectedVehicle)}>
            <Edit sx={{ mr: 1 }} />
            Edit Vehicle
          </MenuItem>
          <MenuItem 
            onClick={() => handleDeleteVehicle(selectedVehicle?.id)}
            sx={{ color: 'error.main' }}
          >
            Delete Vehicle
          </MenuItem>
        </Menu>

        {/* Add Vehicle Dialog */}
        <Dialog 
          open={addVehicleOpen} 
          onClose={() => setAddVehicleOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)'
            }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600, 
            pb: 1, 
            background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <DirectionsCar fontSize="large" />
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                Add New Vehicle
              </Typography>
              <Typography variant="subtitle2" sx={{ opacity: 0.9, mt: 0.5, fontWeight: 400 }}>
                Complete the form below to add a new vehicle to your garage
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(8, 145, 178, 0.06)', borderRadius: 2, border: '1px dashed rgba(8, 145, 178, 0.2)' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#0891b2' }}>
                Vehicle Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Make *"
                    value={vehicleForm.make}
                    onChange={handleFormChange('make')}
                    placeholder="e.g., Honda"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <DirectionsCar sx={{ mr: 1, color: 'rgba(8, 145, 178, 0.7)' }} fontSize="small" />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model *"
                    value={vehicleForm.model}
                    onChange={handleFormChange('model')}
                    placeholder="e.g., Civic"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Year *"
                    type="number"
                    value={vehicleForm.year}
                    onChange={handleFormChange('year')}
                    placeholder="e.g., 2020"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Color"
                    value={vehicleForm.color}
                    onChange={handleFormChange('color')}
                    placeholder="e.g., Blue"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(8, 145, 178, 0.06)', borderRadius: 2, border: '1px dashed rgba(8, 145, 178, 0.2)' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#0891b2' }}>
                Identification & Contact
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="License Plate"
                    value={vehicleForm.licensePlate}
                    onChange={handleFormChange('licensePlate')}
                    placeholder="e.g., ABC-123"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={vehicleForm.phoneNumber}
                    onChange={handleFormChange('phoneNumber')}
                    placeholder="e.g., +1 (555) 123-4567"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <Box component="span" sx={{ mr: 1, color: 'rgba(8, 145, 178, 0.7)' }}>
                          📱
                        </Box>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nickname (Optional)"
                    value={vehicleForm.nickname}
                    onChange={handleFormChange('nickname')}
                    placeholder="e.g., My Honda"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
            <Button 
              onClick={() => setAddVehicleOpen(false)}
              variant="outlined"
              sx={{
                borderColor: '#9ca3af',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#6b7280',
                  bgcolor: 'rgba(107, 114, 128, 0.04)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveVehicle}
              startIcon={<Add />}
              disabled={!vehicleForm.make || !vehicleForm.model || !vehicleForm.year}
              sx={{
                background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.2)',
                px: 3,
                py: 1
              }}
            >
              Add Vehicle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Vehicle Dialog */}
        <Dialog 
          open={editVehicleOpen} 
          onClose={() => setEditVehicleOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)'
            }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600, 
            pb: 1, 
            background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Edit fontSize="large" />
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                Edit Vehicle
              </Typography>
              <Typography variant="subtitle2" sx={{ opacity: 0.9, mt: 0.5, fontWeight: 400 }}>
                Update your vehicle information
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(8, 145, 178, 0.06)', borderRadius: 2, border: '1px dashed rgba(8, 145, 178, 0.2)' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#0891b2' }}>
                Vehicle Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Make *"
                    value={vehicleForm.make}
                    onChange={handleFormChange('make')}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <DirectionsCar sx={{ mr: 1, color: 'rgba(8, 145, 178, 0.7)' }} fontSize="small" />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model *"
                    value={vehicleForm.model}
                    onChange={handleFormChange('model')}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Year *"
                    type="number"
                    value={vehicleForm.year}
                    onChange={handleFormChange('year')}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Color"
                    value={vehicleForm.color}
                    onChange={handleFormChange('color')}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(8, 145, 178, 0.06)', borderRadius: 2, border: '1px dashed rgba(8, 145, 178, 0.2)' }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#0891b2' }}>
                Identification & Contact
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="License Plate"
                    value={vehicleForm.licensePlate}
                    onChange={handleFormChange('licensePlate')}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={vehicleForm.phoneNumber}
                    onChange={handleFormChange('phoneNumber')}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <Box component="span" sx={{ mr: 1, color: 'rgba(8, 145, 178, 0.7)' }}>
                          📱
                        </Box>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nickname (Optional)"
                    value={vehicleForm.nickname}
                    onChange={handleFormChange('nickname')}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
            <Button 
              onClick={() => setEditVehicleOpen(false)}
              variant="outlined"
              sx={{
                borderColor: '#9ca3af',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#6b7280',
                  bgcolor: 'rgba(107, 114, 128, 0.04)'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveVehicle}
              startIcon={<Edit />}
              disabled={!vehicleForm.make || !vehicleForm.model || !vehicleForm.year}
              sx={{
                background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.2)',
                px: 3,
                py: 1
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ClientLayout>
  );
};

export default MyGarage;
