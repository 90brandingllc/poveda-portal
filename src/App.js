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
  const { currentUser, userRole, loading } = useAuth();
  
  // Si todavía estamos cargando, mostramos un indicador de carga
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
  
  // Si no hay usuario autenticado, redirigimos al login
  if (!currentUser) {
    console.log('No hay usuario autenticado, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }
  
  // Si el rol del usuario es undefined, asumimos que es cliente
  const effectiveRole = userRole === undefined ? 'client' : userRole;
  console.log('Rol efectivo del usuario:', effectiveRole);
  
  // Si se especificaron roles permitidos y el usuario no tiene uno de ellos
  if (allowedRoles.length > 0 && !allowedRoles.includes(effectiveRole)) {
    console.log(`Usuario no tiene rol permitido: ${effectiveRole}, roles permitidos:`, allowedRoles);
    return <Navigate to="/dashboard" replace />;
  }
  
  // Si todo está bien, mostramos el contenido protegido
  console.log('Acceso permitido para el usuario con rol:', effectiveRole);
  return (
    <>
      <NotificationListener />
      {children}
    </>
  );
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  // Si todavía estamos cargando, mostramos un indicador de carga
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
  
  // Si el usuario ya está autenticado, lo redirigimos al dashboard
  if (currentUser) {
    console.log('Usuario ya autenticado, redirigiendo a dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  // Si no hay usuario autenticado, mostramos la ruta pública
  console.log('Mostrando ruta pública para usuario no autenticado');
  return children;
};

function App() {
  console.log('App componente inicializado');
  const { currentUser, userRole, loading, authError } = useAuth();
  
  console.log('Estado de App:', { currentUser: !!currentUser, userRole, loading, hasError: !!authError });
  
  // Show loading spinner while checking auth state
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
        <CircularProgress size={60} />
        <Box>Cargando la aplicación...</Box>
        <Box sx={{ mt: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
          Verificando autenticación...
        </Box>
      </Box>
    );
  }
  
  // Si hay un error de autenticación, mostrarlo
  if (authError) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        gap={2}
        p={3}
      >
        <Box sx={{ color: 'error.main', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Error de autenticación
        </Box>
        <Box sx={{ color: 'error.main', textAlign: 'center', maxWidth: '600px' }}>
          {authError}
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
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
          path="/get-estimate" 
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <GetEstimate />
            </ProtectedRoute>
          }
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
