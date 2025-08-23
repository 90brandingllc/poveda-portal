import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import SetupAdmin from './components/Auth/SetupAdmin';

// Client Components
import ClientDashboard from './components/Client/ClientDashboard';
import BookAppointment from './components/Client/BookAppointment';
import AppointmentsList from './components/Client/AppointmentsList';
import ContactUs from './components/Client/ContactUs';
import GetEstimate from './components/Client/GetEstimate';

// Admin Components
import AdminDashboard from './components/Admin/AdminDashboard';
import ManageAppointments from './components/Admin/ManageAppointments';
import ManageTickets from './components/Admin/ManageTickets';
import ManageEstimates from './components/Admin/ManageEstimates';
import ManageUsers from './components/Admin/ManageUsers';

// Public Components
import Services from './components/Public/Services';
import About from './components/Public/About';

// Layout Components
import Navbar from './components/Layout/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { currentUser, userRole } = useAuth();
  
  // Debug logging
  console.log('App.js - Current User:', currentUser?.email);
  console.log('App.js - User Role:', userRole);

  // Show loading spinner while checking auth state
  if (currentUser === undefined) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/setup-admin';

  return (
    <div className="App">
      {!isAuthPage && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/setup-admin" 
          element={
            <PublicRoute>
              <SetupAdmin />
            </PublicRoute>
          } 
        />
        
        {/* Dashboard Route - Redirects based on role */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              {userRole === 'admin' ? <AdminDashboard /> : <ClientDashboard />}
            </ProtectedRoute>
          } 
        />
        
        {/* Client Routes */}
        <Route 
          path="/book-appointment" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <BookAppointment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <AppointmentsList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contact" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ContactUs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/estimate" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <GetEstimate />
            </ProtectedRoute>
          } 
        />

        
        {/* Admin Routes */}
        <Route 
          path="/admin/appointments" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageAppointments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/tickets" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageTickets />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/estimates" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageEstimates />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          } 
        />
        
        {/* Default route to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
