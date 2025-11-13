// Imports commented out since we're using real Firebase services
// import { connectFirestoreEmulator } from 'firebase/firestore';
// import { connectAuthEmulator } from 'firebase/auth';
// import { connectFunctionsEmulator } from 'firebase/functions';
// import { db, auth, functions } from './config';

// Configurar emuladores para desarrollo local
export const setupEmulators = () => {
  // Desactivamos el uso de emuladores y utilizamos Firebase real
  console.log('Using real Firebase services instead of emulators');
  
  // Si quieres volver a usar emuladores en el futuro, descomenta el código siguiente:
  /*
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    try {
      // Conectar con Auth Emulator
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('Connected to Auth Emulator');
      
      // Conectar con Firestore Emulator
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firestore Emulator');
      
      // Conectar con Functions Emulator
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('Connected to Functions Emulator');
    } catch (error) {
      console.error('Error connecting to emulators:', error);
    }
  }
  */
};
