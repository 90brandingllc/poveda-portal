import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcW22D7hoF9e2xydMY6_fUP3HtYpx4DTk",
  authDomain: "clients-portal-a3fdf.firebaseapp.com",
  projectId: "clients-portal-a3fdf",
  storageBucket: "clients-portal-a3fdf.firebasestorage.app",
  messagingSenderId: "997737542547",
  appId: "1:997737542547:web:1fc6701ae06e7aa27d2e66",
  measurementId: "G-RB2DZTXTV2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
