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
  MenuItem,
  Divider
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
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

  const handleDeleteClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteConfirmOpen(true);
    setMenuAnchor(null);
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;
    
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'vehicles', selectedVehicle.id));
      setSuccess('Vehicle deleted successfully!');
      setDeleteConfirmOpen(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setError('Failed to delete vehicle. Please try again.');
    } finally {
      setDeleteLoading(false);
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
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: { xs: 2, sm: 0 },
          mb: { xs: 3, sm: 5 },
          pb: { xs: 2, sm: 3 },
          borderBottom: '1px solid rgba(203, 213, 225, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 1.5 
            }}>
              <Box sx={{ 
                width: 50, 
                height: 50, 
                borderRadius: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.1) 0%, rgba(30, 64, 175, 0.1) 100%)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
                position: 'relative'
              }}>
                <DirectionsCar sx={{ 
                  fontSize: '2rem', 
                  color: '#0891b2',
                  filter: 'drop-shadow(0 4px 6px rgba(8, 145, 178, 0.3))'
                }} />
                <Box sx={{ 
                  position: 'absolute', 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bottom: -4, 
                  right: -4, 
                  background: '#0891b2',
                  boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.8)'
                }}></Box>
              </Box>
              
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.75rem', sm: '2.25rem' },
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}
              >
                My Garage
              </Typography>
            </Box>
            
            <Typography variant="body1" sx={{ 
              color: '#475569',
              maxWidth: '500px',
              fontWeight: 500
            }}>
              Manage your vehicles and track their service history with detailed records
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
              px: 4,
              py: 1.5,
              boxShadow: '0 10px 20px rgba(8, 145, 178, 0.25)',
              position: 'relative',
              zIndex: 2,
              '&:hover': {
                boxShadow: '0 12px 25px rgba(8, 145, 178, 0.35)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Add Vehicle
          </Button>
          
          {/* Decorative elements */}
          <Box sx={{ 
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(8, 145, 178, 0.03) 0%, rgba(8, 145, 178, 0) 70%)',
            borderRadius: '50%',
            zIndex: 1
          }} />
          <Box sx={{ 
            position: 'absolute',
            bottom: -20,
            left: '20%',
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(30, 64, 175, 0.02) 0%, rgba(30, 64, 175, 0) 70%)',
            borderRadius: '50%',
            zIndex: 1
          }} />
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
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(8, 145, 178, 0.1)',
              mb: 2
            }}>
              <DirectionsCar sx={{ fontSize: '2rem', color: '#0891b2', opacity: 0.7 }} />
            </Box>
            <Typography sx={{ color: '#6b7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                component="span" 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  background: '#0891b2',
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite ease-in-out'
                }}
              />
              Loading your vehicles...
            </Typography>
          </Box>
        ) : vehicles.length === 0 ? (
          <Card sx={{ 
            p: { xs: 4, sm: 6 }, 
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 20px 30px rgba(0, 0, 0, 0.07)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              position: 'relative',
              zIndex: 2
            }}>
              <Box sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 15px 25px rgba(8, 145, 178, 0.1)',
                position: 'relative'
              }}>
                <DirectionsCar sx={{ 
                  fontSize: 52, 
                  color: '#0891b2', 
                  filter: 'drop-shadow(0 4px 6px rgba(8, 145, 178, 0.3))'
                }} />
                <Box sx={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <Add sx={{ fontSize: '1rem', color: '#0891b2' }} />
                </Box>
              </Box>
              
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#334155', mb: 2 }}>
                No Vehicles Yet
              </Typography>
              
              <Typography variant="body1" sx={{ 
                color: '#64748b', 
                mb: 4, 
                maxWidth: '500px', 
                mx: 'auto',
                lineHeight: 1.6
              }}>
                Start by adding your first vehicle to track its service history. You can add details like make, model, and year to keep everything organized.
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddVehicle}
                sx={{
                  background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                  borderRadius: '14px',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  px: 4,
                  boxShadow: '0 10px 20px rgba(8, 145, 178, 0.2)',
                  '&:hover': {
                    boxShadow: '0 15px 25px rgba(8, 145, 178, 0.3)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease',
                  fontSize: '1rem'
                }}
              >
                Add Your First Vehicle
              </Button>
            </Box>
            
            {/* Decorative Elements */}
            <Box sx={{ 
              position: 'absolute',
              top: -50,
              left: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(8, 145, 178, 0.04) 0%, rgba(8, 145, 178, 0) 70%)',
              zIndex: 1
            }} />
            <Box sx={{ 
              position: 'absolute',
              bottom: -30,
              right: -30,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(30, 64, 175, 0.05) 0%, rgba(30, 64, 175, 0) 70%)',
              zIndex: 1
            }} />
            <Box sx={{ 
              position: 'absolute',
              top: '40%',
              right: '20%',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#0891b2',
              opacity: 0.5,
              boxShadow: '0 0 15px 5px rgba(8, 145, 178, 0.2)',
              zIndex: 1
            }} />
          </Card>
        ) : (
          <Grid container spacing={3}>
            {vehicles.map((vehicle) => (
              <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                <Card sx={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 25px 35px rgba(0, 0, 0, 0.1)'
                  },
                  height: '100%'
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    height: '8px', 
                    background: 'linear-gradient(90deg, #0891b2, #1e40af)',
                    zIndex: 2
                  }}></Box>
                  
                  <CardContent sx={{ 
                    p: 0, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column' 
                  }}>
                    {/* Vehicle Header */}
                    <Box sx={{ 
                      p: 3, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        width: '80%'
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1.5, 
                          mb: 1 
                        }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(8, 145, 178, 0.15)'
                          }}>
                            <DirectionsCar sx={{ 
                              color: '#0891b2', 
                              fontSize: '1.5rem',
                              filter: 'drop-shadow(0 2px 4px rgba(8, 145, 178, 0.2))'
                            }} />
                          </Box>
                          
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700,
                            color: '#334155',
                            fontSize: '1.1rem',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                          }}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Typography>
                        </Box>
                        
                        {vehicle.nickname && (
                          <Chip 
                            label={vehicle.nickname} 
                            size="small" 
                            sx={{ 
                              alignSelf: 'flex-start',
                              mb: 1.5,
                              background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              borderRadius: '8px',
                              py: 0.5,
                              boxShadow: '0 3px 8px rgba(8, 145, 178, 0.2)'
                            }} 
                          />
                        )}
                      </Box>
                      
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleMenuClick(e, vehicle)}
                        sx={{ 
                          color: '#64748b',
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.95)'
                          }
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Vehicle Details */}
                    <Box sx={{ 
                      px: 3, 
                      pb: 2, 
                      mb: 'auto',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 2
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1.5 
                      }}>
                        <Box>
                          <Typography sx={{ 
                            fontSize: '0.7rem', 
                            color: '#94a3b8', 
                            fontWeight: 600, 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5 
                          }}>
                            Color
                          </Typography>
                          <Typography sx={{ color: '#334155', fontWeight: 500 }}>
                            {vehicle.color || 'Not specified'}
                          </Typography>
                        </Box>
                        
                        {vehicle.phoneNumber && (
                          <Box>
                            <Typography sx={{ 
                              fontSize: '0.7rem', 
                              color: '#94a3b8', 
                              fontWeight: 600, 
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              mb: 0.5 
                            }}>
                              Phone
                            </Typography>
                            <Typography sx={{ color: '#334155', fontWeight: 500 }}>
                              {vehicle.phoneNumber}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1.5 
                      }}>
                      </Box>
                    </Box>

                    {/* Service Info */}
                    <Box sx={{ 
                      mx: 3,
                      p: 2, 
                      background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.08) 0%, rgba(30, 64, 175, 0.05) 100%)', 
                      borderRadius: '12px',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(148, 163, 184, 0.1)',
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box>
                        <Typography sx={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          mb: 1, 
                          color: '#0e7490',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Service History
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 3 }}>
                          <Box>
                            <Typography sx={{ 
                              fontSize: '0.75rem', 
                              color: '#64748b', 
                              mb: 0.5 
                            }}>
                              Total Services
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '1.125rem', 
                              fontWeight: 700, 
                              color: '#0891b2' 
                            }}>
                              {getServiceCount(vehicle.id)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            height: '80%', 
                            width: '1px', 
                            background: 'rgba(148, 163, 184, 0.3)', 
                            alignSelf: 'center' 
                          }} />
                          
                          <Box>
                            <Typography sx={{ 
                              fontSize: '0.75rem', 
                              color: '#64748b', 
                              mb: 0.5 
                            }}>
                              Last Service
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 600, 
                              color: '#334155' 
                            }}>
                              {getLastServiceDate(vehicle.id) || 'None yet'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ 
                      px: 3, 
                      pb: 3, 
                      pt: 1 
                    }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<History />}
                        onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                        sx={{
                          borderColor: '#0891b2',
                          color: '#0891b2',
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.2,
                          '&:hover': {
                            borderColor: '#0891b2',
                            background: 'rgba(8, 145, 178, 0.05)',
                            boxShadow: '0 4px 12px rgba(8, 145, 178, 0.1)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        View Service History
                      </Button>
                    </Box>
                    
                    {/* Decorative corner */}
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      right: 0, 
                      width: '80px', 
                      height: '80px',
                      background: 'radial-gradient(circle at top right, rgba(8, 145, 178, 0.03), rgba(255,255,255,0) 70%)',
                      zIndex: 0
                    }} />
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
          PaperProps={{
            sx: {
              borderRadius: '12px',
              minWidth: 180,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              mt: 1.5,
              overflow: 'visible',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: -6,
                right: 14,
                width: 12,
                height: 12,
                bgcolor: 'background.paper',
                transform: 'rotate(45deg)',
                borderTop: '1px solid rgba(255, 255, 255, 0.8)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.8)',
                zIndex: 0
              }
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem 
            onClick={() => handleEditVehicle(selectedVehicle)}
            sx={{ 
              borderRadius: '8px',
              mx: 0.5,
              my: 0.3,
              py: 1.2,
              px: 2,
              gap: 1.5,
              color: '#334155',
              '&:hover': {
                backgroundColor: 'rgba(8, 145, 178, 0.08)'
              }
            }}
          >
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              backgroundColor: 'rgba(8, 145, 178, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Edit sx={{ fontSize: '1.1rem', color: '#0891b2' }} />
            </Box>
            <Typography sx={{ fontWeight: 500 }}>Edit Vehicle</Typography>
          </MenuItem>
          
          <Divider sx={{ my: 0.5, opacity: 0.6 }} />
          
          <MenuItem 
            onClick={() => handleDeleteClick(selectedVehicle)}
            sx={{ 
              borderRadius: '8px',
              mx: 0.5,
              my: 0.3,
              py: 1.2,
              px: 2,
              gap: 1.5,
              color: '#ef4444',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.08)'
              }
            }}
          >
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box component="span" sx={{ fontSize: '1.3rem' }}>🗑️</Box>
            </Box>
            <Typography sx={{ fontWeight: 500 }}>Delete Vehicle</Typography>
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
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.97) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600, 
            p: 0,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
              color: 'white',
              p: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2.5
            }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '16px', 
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)'
              }}>
                <DirectionsCar sx={{ 
                  fontSize: '2rem', 
                  color: 'white',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                }} />
              </Box>
              
              <Box sx={{ flex: 1, pr: { sm: 7 } }}>
                <Typography variant="h5" component="div" sx={{ 
                  fontWeight: 700, 
                  mb: 0.5,
                  lineHeight: 1.2,
                  fontSize: { xs: '1.5rem', sm: '1.8rem' } 
                }}>
                  Add New Vehicle
                </Typography>
                <Typography sx={{ 
                  opacity: 0.9, 
                  fontWeight: 400,
                  maxWidth: '400px',
                  lineHeight: 1.4
                }}>
                  Complete the form below to add a new vehicle to your garage
                </Typography>
              </Box>
              
              {/* Decorative elements */}
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 1
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: -30,
                left: '30%',
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 1
              }} />
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: { xs: 2.5, sm: 4 }, pt: { xs: 3, sm: 4 } }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                {error}
              </Alert>
            )}
            
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              bgcolor: 'rgba(8, 145, 178, 0.04)', 
              borderRadius: '16px', 
              border: '1px solid rgba(8, 145, 178, 0.15)',
              boxShadow: '0 4px 20px rgba(8, 145, 178, 0.06)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 2, 
                fontWeight: 700, 
                color: '#0e7490',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <Box sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DirectionsCar sx={{ fontSize: '1.2rem', color: 'white' }} />
                </Box>
                Vehicle Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Make *"
                    value={vehicleForm.make}
                    onChange={handleFormChange('make')}
                    placeholder="e.g., Honda"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0891b2',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0891b2'
                      }
                    }}
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0891b2',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0891b2'
                      }
                    }}
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0891b2',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0891b2'
                      }
                    }}
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0891b2',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0891b2'
                      }
                    }}
                  />
                </Grid>
              </Grid>
              
              {/* Decorative element */}
              <Box sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(8, 145, 178, 0.04) 0%, rgba(8, 145, 178, 0) 70%)',
                zIndex: 0
              }} />
            </Box>
            
            <Box sx={{ 
              p: 3, 
              bgcolor: 'rgba(30, 64, 175, 0.04)', 
              borderRadius: '16px', 
              border: '1px solid rgba(30, 64, 175, 0.15)',
              boxShadow: '0 4px 20px rgba(30, 64, 175, 0.06)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 2, 
                fontWeight: 700, 
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <Box sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Box component="span" sx={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>ID</Box>
                </Box>
                Identification & Contact
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={vehicleForm.phoneNumber}
                    onChange={handleFormChange('phoneNumber')}
                    placeholder="e.g., +1 (555) 123-4567"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#3b82f6'
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <Box component="span" sx={{ mr: 1, color: 'rgba(59, 130, 246, 0.7)' }}>
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#3b82f6'
                      }
                    }}
                  />
                </Grid>
              </Grid>
              
              {/* Decorative element */}
              <Box sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, rgba(59, 130, 246, 0) 70%)',
                zIndex: 0
              }} />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: { xs: 2.5, sm: 3 }, 
            pt: 2,
            bgcolor: 'rgba(248, 250, 252, 0.7)', 
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            justifyContent: 'space-between'
          }}>
            <Button 
              onClick={() => setAddVehicleOpen(false)}
              variant="outlined"
              sx={{
                borderColor: '#cbd5e1',
                color: '#64748b',
                borderRadius: '10px',
                px: 3,
                py: 1,
                '&:hover': {
                  borderColor: '#94a3b8',
                  bgcolor: 'rgba(148, 163, 184, 0.04)'
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
                borderRadius: '10px',
                boxShadow: '0 8px 16px -1px rgba(8, 145, 178, 0.25)',
                px: 3,
                py: 1.2,
                '&:hover': {
                  boxShadow: '0 12px 20px -1px rgba(8, 145, 178, 0.35)',
                  transform: 'translateY(-2px)'
                },
                '&.Mui-disabled': {
                  background: '#cbd5e1',
                  color: '#94a3b8'
                },
                transition: 'all 0.2s ease'
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
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.97) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600, 
            p: 0,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
              color: 'white',
              p: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2.5
            }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '16px', 
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)'
              }}>
                <Edit sx={{ 
                  fontSize: '2rem', 
                  color: 'white',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                }} />
              </Box>
              
              <Box sx={{ flex: 1, pr: { sm: 7 } }}>
                <Typography variant="h5" component="div" sx={{ 
                  fontWeight: 700, 
                  mb: 0.5,
                  lineHeight: 1.2,
                  fontSize: { xs: '1.5rem', sm: '1.8rem' } 
                }}>
                  Edit Vehicle
                </Typography>
                <Typography sx={{ 
                  opacity: 0.9, 
                  fontWeight: 400,
                  maxWidth: '400px',
                  lineHeight: 1.4
                }}>
                  Update information for your {vehicleForm.year} {vehicleForm.make} {vehicleForm.model}
                </Typography>
              </Box>
              
              {/* Decorative elements */}
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 1
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: -30,
                left: '30%',
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 1
              }} />
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: { xs: 2.5, sm: 4 }, pt: { xs: 3, sm: 4 } }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}
              >
                {error}
              </Alert>
            )}
            
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              bgcolor: 'rgba(59, 130, 246, 0.04)', 
              borderRadius: '16px', 
              border: '1px solid rgba(59, 130, 246, 0.15)',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.06)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 2, 
                fontWeight: 700, 
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <Box sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DirectionsCar sx={{ fontSize: '1.2rem', color: 'white' }} />
                </Box>
                Vehicle Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Make *"
                    value={vehicleForm.make}
                    onChange={handleFormChange('make')}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#3b82f6'
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <DirectionsCar sx={{ mr: 1, color: 'rgba(59, 130, 246, 0.7)' }} fontSize="small" />
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#3b82f6'
                      }
                    }}
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#3b82f6'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Color"
                    value={vehicleForm.color}
                    onChange={handleFormChange('color')}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#3b82f6'
                      }
                    }}
                  />
                </Grid>
              </Grid>
              
              {/* Decorative element */}
              <Box sx={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, rgba(59, 130, 246, 0) 70%)',
                zIndex: 0
              }} />
            </Box>
            
            <Box sx={{ 
              p: 3, 
              bgcolor: 'rgba(8, 145, 178, 0.04)', 
              borderRadius: '16px', 
              border: '1px solid rgba(8, 145, 178, 0.15)',
              boxShadow: '0 4px 20px rgba(8, 145, 178, 0.06)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Typography variant="subtitle1" sx={{ 
                mb: 2, 
                fontWeight: 700, 
                color: '#0e7490',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <Box sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Box component="span" sx={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>ID</Box>
                </Box>
                Identification & Contact
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={vehicleForm.phoneNumber}
                    onChange={handleFormChange('phoneNumber')}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0891b2',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0891b2'
                      }
                    }}
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0891b2',
                          borderWidth: 2
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0891b2'
                      }
                    }}
                  />
                </Grid>
              </Grid>
              
              {/* Decorative element */}
              <Box sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(8, 145, 178, 0.04) 0%, rgba(8, 145, 178, 0) 70%)',
                zIndex: 0
              }} />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: { xs: 2.5, sm: 3 }, 
            pt: 2,
            bgcolor: 'rgba(248, 250, 252, 0.7)', 
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            justifyContent: 'space-between'
          }}>
            <Button 
              onClick={() => setEditVehicleOpen(false)}
              variant="outlined"
              sx={{
                borderColor: '#cbd5e1',
                color: '#64748b',
                borderRadius: '10px',
                px: 3,
                py: 1,
                '&:hover': {
                  borderColor: '#94a3b8',
                  bgcolor: 'rgba(148, 163, 184, 0.04)'
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                borderRadius: '10px',
                boxShadow: '0 8px 16px -1px rgba(59, 130, 246, 0.25)',
                px: 3,
                py: 1.2,
                '&:hover': {
                  boxShadow: '0 12px 20px -1px rgba(59, 130, 246, 0.35)',
                  transform: 'translateY(-2px)'
                },
                '&.Mui-disabled': {
                  background: '#cbd5e1',
                  color: '#94a3b8'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => !deleteLoading && setDeleteConfirmOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.97) 0%, rgba(254, 242, 242, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600, 
            p: 0,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: { xs: 2.5, sm: 3 }, 
              pb: { xs: 2, sm: 2.5 },
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.12) 100%)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Box sx={{
                width: { xs: 45, sm: 50 },
                height: { xs: 45, sm: 50 },
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(239, 68, 68, 0.25)',
                color: 'white'
              }}>
                <Box component="span" sx={{ fontSize: '1.8rem' }}>🗑️</Box>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  color: '#dc2626',
                  fontSize: { xs: '1.3rem', sm: '1.5rem' }
                }}>
                  Delete Vehicle
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                  This action cannot be undone
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ 
            p: { xs: 2.5, sm: 3 }, 
            pt: { xs: 2.5, sm: 3 } 
          }}>
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3,
                borderRadius: '12px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                bgcolor: 'rgba(254, 243, 199, 0.5)'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                <strong>⚠️ Warning:</strong> Deleting this vehicle will permanently remove all associated service history and data.
              </Typography>
            </Alert>

            {selectedVehicle && (
              <Box sx={{ 
                p: 3,
                borderRadius: '16px',
                border: '2px solid rgba(239, 68, 68, 0.15)',
                bgcolor: 'rgba(254, 242, 242, 0.5)',
                position: 'relative'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600, 
                  color: '#64748b', 
                  mb: 2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.75rem'
                }}>
                  Vehicle to Delete:
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <DirectionsCar sx={{ fontSize: '1.8rem' }} />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      color: '#0f172a',
                      fontSize: '1.2rem',
                      lineHeight: 1.2
                    }}>
                      {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                    </Typography>
                    {selectedVehicle.nickname && (
                      <Typography variant="body2" sx={{ 
                        color: '#64748b',
                        fontWeight: 500,
                        mt: 0.5
                      }}>
                        "{selectedVehicle.nickname}"
                      </Typography>
                    )}
                  </Box>
                </Box>

                {selectedVehicle.color && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid rgba(226, 232, 240, 0.5)'
                  }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Color:
                    </Typography>
                    <Chip 
                      label={selectedVehicle.color}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        color: '#dc2626'
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}

            <Typography variant="body2" sx={{ 
              color: '#64748b', 
              mt: 3,
              textAlign: 'center',
              fontWeight: 500
            }}>
              Are you absolutely sure you want to delete this vehicle?
            </Typography>
          </DialogContent>

          <DialogActions sx={{ 
            p: { xs: 2.5, sm: 3 }, 
            pt: 2,
            bgcolor: 'rgba(254, 242, 242, 0.5)', 
            borderTop: '1px solid rgba(239, 68, 68, 0.15)',
            gap: 2
          }}>
            <Button 
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteLoading}
              variant="outlined"
              fullWidth
              sx={{
                borderColor: '#cbd5e1',
                color: '#64748b',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#94a3b8',
                  bgcolor: 'rgba(148, 163, 184, 0.04)'
                },
                '&.Mui-disabled': {
                  borderColor: '#e2e8f0',
                  color: '#cbd5e1'
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleDeleteVehicle}
              disabled={deleteLoading}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '12px',
                boxShadow: '0 8px 16px -1px rgba(239, 68, 68, 0.35)',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  boxShadow: '0 12px 20px -1px rgba(239, 68, 68, 0.45)',
                  transform: 'translateY(-2px)'
                },
                '&.Mui-disabled': {
                  background: '#fca5a5',
                  color: 'white',
                  boxShadow: 'none'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {deleteLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" className="spinner" sx={{ 
                    width: 16, 
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                  <span>Deleting...</span>
                </Box>
              ) : (
                <>🗑️ Delete Vehicle</>
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ClientLayout>
  );
};

export default MyGarage;
