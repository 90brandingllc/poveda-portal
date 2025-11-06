import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createWelcomeNotification } from '../utils/notificationService';
import { linkGuestAppointmentsToUser } from '../utils/appointmentLinkingService';
import { auth, googleProvider, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('AuthProvider inicializado');
  const [currentUser, setCurrentUser] = useState(undefined);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Create user profile in Firestore
  const createUserProfile = async (user, additionalData = {}) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const { displayName, email } = user;
      const { role = 'client' } = additionalData;
      
      try {

        const userName = displayName || email.split('@')[0];
        await setDoc(userRef, {
          displayName: userName,
          email,
          role,
          createdAt: new Date(),
          ...additionalData
        });
        setUserRole(role);

        // Link any existing guest appointments to this new account
        try {
          const linkedCount = await linkGuestAppointmentsToUser(user.uid, email);
          if (linkedCount > 0) {
            console.log(`Successfully linked ${linkedCount} guest appointment(s) to new account`);
          }
        } catch (linkingError) {
          console.error('Error linking guest appointments:', linkingError);
          // Don't fail registration if linking fails
        }

        // Create welcome notification for new clients
        if (role === 'client') {
          try {
            await createWelcomeNotification(user.uid, userName);
          } catch (notificationError) {
            console.error('Error creating welcome notification:', notificationError);
          }
        }

      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    } else {
      const existingRole = userDoc.data().role;

      setUserRole(existingRole);
    }
    
    return userRef;
  };

  // Sign up with email and password
  const signup = async (email, password, additionalData = {}) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (additionalData.displayName) {
        await updateProfile(user, {
          displayName: additionalData.displayName
        });
      }
      
      await createUserProfile(user, additionalData);
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign in with email and password
  const signin = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      // Load user role after successful login
      const role = await getUserRole(user.uid);

      setUserRole(role);
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (additionalData = {}) => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await createUserProfile(user, additionalData);
      // Load user role after successful login
      const role = await getUserRole(user.uid);
      setUserRole(role);
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  // Get user role
  const getUserRole = async (uid) => {
    try {
      console.log('Intentando obtener rol del usuario desde Firestore...');
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        console.log('Documento de usuario encontrado en Firestore');
        const role = userDoc.data().role || 'client';
        console.log('Rol obtenido de Firestore:', role);
        return role;
      } else {
        console.log('Documento de usuario no encontrado en Firestore, usando rol predeterminado: client');
        return 'client';
      }
    } catch (error) {
      console.error('Error getting user role:', error);
      console.log('Usando rol predeterminado debido a error: client');
      // En caso de error, devolvemos 'client' como rol predeterminado
      // para evitar bloqueos en la autenticación
      return 'client';
    }
  };

  useEffect(() => {
    console.log('AuthProvider useEffect iniciado');
    
    try {
      console.log('Configurando listener de autenticación...');
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('Estado de autenticación cambiado:', user ? `Usuario autenticado: ${user.email}` : 'No hay usuario autenticado');
        
        try {
          setCurrentUser(user);
          if (user) {
            try {
              console.log('Obteniendo rol del usuario...');
              const role = await getUserRole(user.uid);
              console.log('Rol del usuario obtenido:', role);
              setUserRole(role);
            } catch (roleError) {
              console.error('Error obteniendo el rol del usuario:', roleError);
              // Si hay un error al obtener el rol, establecemos un rol predeterminado
              console.log('Estableciendo rol predeterminado: client');
              setUserRole('client');
              setAuthError(roleError.message);
            }
          } else {
            console.log('No hay usuario autenticado, estableciendo rol a null');
            setUserRole(null);
          }
        } catch (authError) {
          console.error('Error en la autenticación:', authError);
          setAuthError(authError.message);
        } finally {
          // Siempre establecemos loading en false para evitar bloqueos
          console.log('Finalizando estado de carga');
          setLoading(false);
        }
      }, (error) => {
        // Manejador de errores para onAuthStateChanged
        console.error('Error en onAuthStateChanged:', error);
        setAuthError(error.message);
        setLoading(false);
      });
      
      // Establecer un timeout de seguridad para evitar bloqueos
      const timeoutId = setTimeout(() => {
        console.log('Timeout de seguridad activado después de 5 segundos');
        setLoading(false);
      }, 5000);
      
      return () => {
        console.log('Limpiando listener de autenticación');
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (setupError) {
      console.error('Error al configurar el listener de autenticación:', setupError);
      setAuthError(setupError.message);
      setLoading(false);
      return () => {};
    }
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    authError,
    signup,
    signin,
    signInWithGoogle,
    logout,
    createUserProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
