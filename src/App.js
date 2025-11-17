import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import { useAuth } from './contexts/AuthContext'; // COMMENTED: No longer needed for client routes
import { CircularProgress, Box, Button } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';
// import NotificationListener from './components/Notifications/NotificationProvider'; // COMMENTED: Auth-dependent

// Auth Components - COMMENTED: Client auth removed, only admin uses auth
// import Login from './components/Auth/Login';
// import Register from './components/Auth/Register';
// import SetupAdmin from './components/Auth/SetupAdmin';
// import ForgotPassword from './components/Auth/ForgotPassword';


// Client Components
// COMMENTED: Auth-dependent features removed
// import ClientDashboard from './components/Client/ClientDashboard';
// import ClientProfile from './components/Client/ClientProfile';
// import MyGarage from './components/Client/MyGarage';
// import VehicleDetails from './components/Client/VehicleDetails';
// import Notifications from './components/Client/Notifications';

// Public Client Components - No auth required
import BookAppointment from './components/Client/BookAppointment';
import AppointmentsList from './components/Client/AppointmentsList';
import ContactUs from './components/Client/ContactUs';
import GetEstimate from './components/Client/GetEstimate';
// import EstimatesList from './components/Client/EstimatesList'; // COMMENTED: May need auth to list user's estimates

// Admin Portal
import AdminRouter from './components/AdminPortal/AdminRouter';

// Public Components
import Services from './components/Public/Services';
import About from './components/Public/About';

// Layout Components
// import Navbar from './components/Layout/Navbar';

// COMMENTED: ProtectedRoute and PublicRoute no longer needed for client routes
// Only admin routes use authentication now
/*
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={40} />
        <Box>Verificando acceso...</Box>
      </Box>
    );
  }
  
  if (!currentUser) {
    console.log('No hay usuario autenticado, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }
  
  const effectiveRole = userRole === undefined ? 'client' : userRole;
  console.log('Rol efectivo del usuario:', effectiveRole);
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(effectiveRole)) {
    console.log(`Usuario no tiene rol permitido: ${effectiveRole}, roles permitidos:`, allowedRoles);
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('Acceso permitido para el usuario con rol:', effectiveRole);
  return (
    <>
      <NotificationListener />
      {children}
    </>
  );
};

const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={40} />
        <Box>Verificando sesión...</Box>
      </Box>
    );
  }
  
  if (currentUser) {
    console.log('Usuario ya autenticado, redirigiendo a dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('Mostrando ruta pública para usuario no autenticado');
  return children;
};
*/

function App() {
  console.log('App componente inicializado - Client auth removed');
  // COMMENTED: No auth checks needed for client routes
  // const { currentUser, userRole, loading, authError } = useAuth();
  // console.log('Estado de App:', { currentUser: !!currentUser, userRole, loading, hasError: !!authError });

  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
        {/* Public Routes */}
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        
        {/* COMMENTED: Client Auth Routes - No longer needed */}
        {/*
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/setup-admin" element={<PublicRoute><SetupAdmin /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        */}

        {/* COMMENTED: Auth-dependent Client Routes */}
        {/*
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['client']}><ClientProfile /></ProtectedRoute>} />
        <Route path="/my-garage" element={<ProtectedRoute allowedRoles={['client']}><MyGarage /></ProtectedRoute>} />
        <Route path="/vehicle/:vehicleId" element={<ProtectedRoute allowedRoles={['client']}><VehicleDetails /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute allowedRoles={['client']}><Notifications /></ProtectedRoute>} />
        <Route path="/my-estimates" element={<ProtectedRoute allowedRoles={['client']}><EstimatesList /></ProtectedRoute>} />
        */}
        
        {/* Public Client Routes - No auth required */}
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/appointments" element={<AppointmentsList />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/get-estimate" element={<GetEstimate />} />

        {/* Admin Portal - Separate routing system (still uses auth) */}
        <Route path="/admin/*" element={<AdminRouter />} />
        
        {/* Default route to book-appointment */}
        <Route path="/" element={<Navigate to="/book-appointment" replace />} />
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/book-appointment" replace />} />
      </Routes>
    </div>
  </ErrorBoundary>
);
}

export default App;
