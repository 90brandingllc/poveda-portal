import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Admin Portal Components
import AdminLogin from './AdminLogin';
import AdminRegister from './AdminRegister';

// Admin Dashboard Components  
import AdminDashboard from '../Admin/AdminDashboard';
import ManageAppointments from '../Admin/ManageAppointments';
import ManageTickets from '../Admin/ManageTickets';
import ManageEstimates from '../Admin/ManageEstimates';
import ManageUsers from '../Admin/ManageUsers';
import ManageSlots from '../Admin/ManageSlots';

// Protected Route Component for Admin Portal
const AdminProtectedRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }
  
  if (userRole !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

// Public Route Component for Admin Portal (redirect if authenticated admin)
const AdminPublicRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  
  if (currentUser && userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return children;
};

const AdminRouter = () => {
  const { currentUser, userRole } = useAuth();

  // Show loading spinner while checking auth state
  if (currentUser === undefined || userRole === undefined) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 50%, #9b59b6 100%)'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Admin Authentication Routes */}
      <Route 
        path="/login" 
        element={
          <AdminPublicRoute>
            <AdminLogin />
          </AdminPublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <AdminPublicRoute>
            <AdminRegister />
          </AdminPublicRoute>
        } 
      />

      {/* Admin Dashboard Routes */}
      <Route 
        path="/dashboard" 
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/appointments" 
        element={
          <AdminProtectedRoute>
            <ManageAppointments />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/tickets" 
        element={
          <AdminProtectedRoute>
            <ManageTickets />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/estimates" 
        element={
          <AdminProtectedRoute>
            <ManageEstimates />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <AdminProtectedRoute>
            <ManageUsers />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/slots" 
        element={
          <AdminProtectedRoute>
            <ManageSlots />
          </AdminProtectedRoute>
        } 
      />

      {/* Default admin route */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};

export default AdminRouter;
