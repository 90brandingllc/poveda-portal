import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  const [currentUser, setCurrentUser] = useState(null);
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
        console.log('AuthContext - Creating new user profile with role:', role);
        await setDoc(userRef, {
          displayName: displayName || email.split('@')[0],
          email,
          role,
          createdAt: new Date(),
          ...additionalData
        });
        setUserRole(role);
        console.log('AuthContext - User profile created successfully');
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    } else {
      const existingRole = userDoc.data().role;
      console.log('AuthContext - User profile exists, role:', existingRole);
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
      console.log('AuthContext - Login successful for:', user.email);
      console.log('AuthContext - User role loaded:', role);
      setUserRole(role);
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await createUserProfile(user);
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

  // Get user role
  const getUserRole = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      const role = userDoc.exists() ? userDoc.data().role : 'client';
      console.log('AuthContext - getUserRole for UID:', uid, 'Role:', role);
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
    signup,
    signin,
    signInWithGoogle,
    logout,
    createUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
