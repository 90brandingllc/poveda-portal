import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationListener from './components/Notifications/NotificationProvider';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import SetupAdmin from './components/Auth/SetupAdmin';
import ForgotPassword from './components/Auth/ForgotPassword';


// Client Components
import ClientDashboard from './components/Client/ClientDashboard';
import ClientProfile from './components/Client/ClientProfile';
import MyGarage from './components/Client/MyGarage';
import VehicleDetails from './components/Client/VehicleDetails';
import BookAppointment from './components/Client/BookAppointment';
import AppointmentsList from './components/Client/AppointmentsList';
import ContactUs from './components/Client/ContactUs';
import GetEstimate from './components/Client/GetEstimate';
import EstimatesList from './components/Client/EstimatesList';
import Notifications from './components/Client/Notifications';

// Admin Portal
import AdminRouter from './components/AdminPortal/AdminRouter';

// Public Components
import Services from './components/Public/Services';
import About from './components/Public/About';

// Layout Components
// import Navbar from './components/Layout/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Always include NotificationListener for authenticated routes
  return (
    <>
      <NotificationListener />
      {children}
    </>
  );
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

  return (
    <ErrorBoundary>
      {/* NotificationListener is now included in ProtectedRoute */}
      <div className="App">
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
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } 
        />

        
        {/* Dashboard Route - Client dashboard only */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Client Routes */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-garage" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <MyGarage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vehicle/:vehicleId" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <VehicleDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/book-appointment" 
          element={<BookAppointment />} 
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
          element={<ContactUs />} 
        />
        <Route 
          path="/get-estimate" 
          element={<GetEstimate />}
        />
        <Route 
          path="/my-estimates" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <EstimatesList />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        
        {/* Admin Portal - Separate routing system */}
        <Route path="/admin/*" element={<AdminRouter />} />
        
        {/* Default route to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  </ErrorBoundary>
);
}

export default App;
