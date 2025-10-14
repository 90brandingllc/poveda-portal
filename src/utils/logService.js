import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Servicio de registro (logging) para operaciones en Poveda Portal
 * Ayuda a la depuración y seguimiento de problemas
 */

/**
 * Registra una operación exitosa
 * @param {string} operation - Tipo de operación (ej: 'status_change', 'appointment_delete')
 * @param {Object} data - Datos asociados a la operación
 * @returns {Promise<string|null>} - ID del registro o null si falla
 */
export const logOperation = async (operation, data) => {
  try {
    const logEntry = {
      operation,
      data,
      timestamp: serverTimestamp(),
      user: 'admin', // En una versión futura, obtener el usuario actual
      success: true
    };
    
    const docRef = await addDoc(collection(db, 'operationLogs'), logEntry);
    return docRef.id;
  } catch (error) {
    console.error('Error registrando operación:', error);
    // No propagamos el error para que no afecte la operación principal
    return null;
  }
};

/**
 * Registra un error en una operación
 * @param {string} operation - Tipo de operación que falló
 * @param {Error} error - Objeto de error o mensaje
 * @param {Object} data - Datos asociados a la operación
 * @returns {Promise<string|null>} - ID del registro de error o null si falla
 */
export const logError = async (operation, error, data = {}) => {
  try {
    const logEntry = {
      operation,
      error: error.message || String(error),
      errorStack: error.stack,
      data,
      timestamp: serverTimestamp(),
      user: 'admin', // En una versión futura, obtener el usuario actual
      success: false
    };
    
    const docRef = await addDoc(collection(db, 'operationLogs'), logEntry);
    return docRef.id;
  } catch (logError) {
    console.error('Error registrando error:', logError);
    // No propagamos el error para que no afecte la operación principal
    return null;
  }
};

export default {
  logOperation,
  logError
};
