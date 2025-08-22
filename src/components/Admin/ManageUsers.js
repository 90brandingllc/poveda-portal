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
  Avatar,
  FormControl,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  PersonAdd,
  Email,
  Person,
  Security
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
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/config';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);

  // Create admin form state
  const [createAdminForm, setCreateAdminForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const usersData = [];
        snapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (createAdminForm.password !== createAdminForm.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match',
        severity: 'error'
      });
      return;
    }

    if (createAdminForm.password.length < 6) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 6 characters',
        severity: 'error'
      });
      return;
    }

    try {
      // Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(
        auth,
        createAdminForm.email,
        createAdminForm.password
      );

      // Update display name
      await updateProfile(user, {
        displayName: createAdminForm.displayName
      });

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: createAdminForm.displayName,
        email: createAdminForm.email,
        role: 'admin',
        createdAt: serverTimestamp(),
        createdBy: 'admin' // Track who created this admin
      });

      setSnackbar({
        open: true,
        message: 'Admin account created successfully!',
        severity: 'success'
      });

      setCreateAdminDialogOpen(false);
      setCreateAdminForm({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      setSnackbar({
        open: true,
        message: getErrorMessage(error.code),
        severity: 'error'
      });
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password is too weak.';
      default:
        return 'Failed to create admin account. Please try again.';
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      setSnackbar({
        open: true,
        message: `User role updated to ${newRole} successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update user role.',
        severity: 'error'
      });
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#d32f2f';
      case 'client': return '#1976d2';
      default: return '#757575';
    }
  };

  const getFilteredUsers = () => {
    switch (tabValue) {
      case 0: return users; // All
      case 1: return users.filter(user => user.role === 'admin');
      case 2: return users.filter(user => user.role === 'client');
      default: return users;
    }
  };

  const getTabCounts = () => {
    return {
      all: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      client: users.filter(u => u.role === 'client').length
    };
  };

  const counts = getTabCounts();
  const filteredUsers = getFilteredUsers();

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
            👥 Manage Users
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setCreateAdminDialogOpen(true)}
            size="large"
          >
            Create Admin Account
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {counts.all}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  {counts.admin}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admin Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {counts.client}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Client Users
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
            <Tab label={`All Users (${counts.all})`} />
            <Tab label={`Admins (${counts.admin})`} />
            <Tab label={`Clients (${counts.client})`} />
          </Tabs>
        </Paper>

        {/* Users Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: getRoleColor(user.role) }}>
                          {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {user.displayName || 'Unknown User'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.role === 'admin' ? 'Administrator' : 'Client'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role || 'client'} 
                        sx={{
                          bgcolor: getRoleColor(user.role),
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.createdAt?.toDate?.()?.toLocaleTimeString() || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleViewDetails(user)}
                          color="primary"
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={user.role || 'client'}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            sx={{ height: 40 }}
                          >
                            <MenuItem value="client">Client</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                        No users found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        {tabValue === 0 ? 'No users have been registered yet.' : 'No users match the selected filter.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* User Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            User Details
          </DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: getRoleColor(selectedUser.role) }}>
                      {selectedUser.displayName?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {selectedUser.displayName || 'Unknown User'}
                      </Typography>
                      <Chip 
                        label={selectedUser.role || 'client'} 
                        sx={{
                          bgcolor: getRoleColor(selectedUser.role),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Email sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body1">
                      {selectedUser.email}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Person sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body1">
                      <strong>Display Name:</strong> {selectedUser.displayName || 'Not set'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ mr: 1, color: '#666' }} />
                    <Typography variant="body1">
                      <strong>Role:</strong> {selectedUser.role || 'client'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    <strong>Created:</strong> {selectedUser.createdAt?.toDate?.()?.toLocaleString() || 'Recently'}
                  </Typography>
                  
                  {selectedUser.createdBy && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Created by:</strong> {selectedUser.createdBy}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create Admin Dialog */}
        <Dialog 
          open={createAdminDialogOpen} 
          onClose={() => setCreateAdminDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <form onSubmit={handleCreateAdmin}>
            <DialogTitle>
              Create Admin Account
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                Create a new administrator account with full access to the system.
              </Typography>
              
              <TextField
                fullWidth
                label="Full Name"
                value={createAdminForm.displayName}
                onChange={(e) => setCreateAdminForm({ ...createAdminForm, displayName: e.target.value })}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={createAdminForm.email}
                onChange={(e) => setCreateAdminForm({ ...createAdminForm, email: e.target.value })}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={createAdminForm.password}
                onChange={(e) => setCreateAdminForm({ ...createAdminForm, password: e.target.value })}
                required
                sx={{ mb: 2 }}
                helperText="Password must be at least 6 characters"
              />
              
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={createAdminForm.confirmPassword}
                onChange={(e) => setCreateAdminForm({ ...createAdminForm, confirmPassword: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateAdminDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                Create Admin Account
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

export default ManageUsers;
