import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

console.log('Inicializando configuración de Firebase...');

// Firebase configuration from environment variables with fallbacks
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:demo",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-DEMO"
};

// Log para depuración (sin mostrar la apiKey completa por seguridad)
const safeConfig = { ...firebaseConfig };
if (safeConfig.apiKey) {
  safeConfig.apiKey = safeConfig.apiKey.substring(0, 5) + '...';
}
if (safeConfig.appId) {
  safeConfig.appId = safeConfig.appId.substring(0, 5) + '...';
}
console.log('Configuración de Firebase:', safeConfig);

// Validate Firebase configuration
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('Missing Firebase environment variables:', missingVars);
  console.warn('Using demo configuration. Please create a .env file with your Firebase credentials for full functionality.');
  console.warn('Copy .env.example to .env and add your Firebase project credentials.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with better error handling
let auth, db, functions, storage;

try {
  console.log('Inicializando servicios de Firebase...');
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, process.env.REACT_APP_FIREBASE_FUNCTIONS_REGION || 'us-central1');
  storage = getStorage(app);
  console.log('Servicios de Firebase inicializados correctamente');
} catch (error) {
  console.error('Error al inicializar servicios de Firebase:', error);
  // Crear servicios dummy para evitar errores en cascada
  auth = { currentUser: null };
  db = {};
  functions = {};
  storage = {};
}

// Exportar los servicios
export { auth, db, functions, storage };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
