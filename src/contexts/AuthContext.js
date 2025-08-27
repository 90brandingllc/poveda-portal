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
  const [currentUser, setCurrentUser] = useState(undefined);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      const role = userDoc.exists() ? userDoc.data().role : 'client';

      return role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'client';
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    signup,
    signin,
    signInWithGoogle,
    logout,
    createUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
