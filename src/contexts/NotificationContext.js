import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy, where, limit, Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';

// Crear el contexto
const NotificationContext = createContext();

// Hook personalizado para usar el contexto
export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar notificaciones leídas desde localStorage
  const getReadNotifications = () => {
    try {
      const stored = localStorage.getItem('readNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading read notifications:', error);
      return [];
    }
  };

  // Guardar notificaciones leídas en localStorage
  const saveReadNotifications = (readIds) => {
    try {
      localStorage.setItem('readNotifications', JSON.stringify(readIds));
    } catch (error) {
      console.error('Error saving read notifications:', error);
    }
  };

  // Cargar y supervisar notificaciones
  useEffect(() => {
    if (!currentUser || !currentUser.uid) return;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Función para obtener notificaciones nuevas desde cada colección
    const loadLatestNotifications = () => {
      setLoading(true);
      // const notificationsArray = []; // Reserved for future use
      
      // Monitorizar nuevas citas (appointments)
      const appointmentsUnsubscribe = onSnapshot(
        query(
          collection(db, 'appointments'),
          orderBy('createdAt', 'desc'),
          where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo)),
          limit(10)
        ),
        (snapshot) => {
          const readIds = getReadNotifications();
          
          // Procesar todos los documentos, no solo los cambios
          const allItems = snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'appointment',
            title: 'Nueva Cita',
            content: `Se ha creado una nueva cita para ${doc.data().userName || 'un cliente'}`,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            read: readIds.includes(doc.id),
            data: doc.data()
          }));

          setNotifications(prev => {
            // Combinar con otras notificaciones (tickets, estimates)
            const otherNotifications = prev.filter(n => n.type !== 'appointment');
            const combined = [...allItems, ...otherNotifications]
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 50); // Mantener un máximo de 50 notificaciones
            
            // Actualizar contador de no leídas
            const unreadItems = combined.filter(item => !item.read).length;
            setUnreadCount(unreadItems);
            
            return combined;
          });
        }
      );
      
      // Monitorizar nuevos tickets de soporte
      const ticketsUnsubscribe = onSnapshot(
        query(
          collection(db, 'tickets'), 
          orderBy('createdAt', 'desc'),
          where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo)),
          limit(10)
        ),
        (snapshot) => {
          const readIds = getReadNotifications();
          
          // Procesar todos los documentos
          const allItems = snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'ticket',
            title: 'Nuevo Ticket de Soporte',
            content: `Se ha creado un nuevo ticket: ${doc.data().subject || 'Sin asunto'}`,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            read: readIds.includes(doc.id),
            data: doc.data()
          }));

          setNotifications(prev => {
            // Combinar con otras notificaciones (appointments, estimates)
            const otherNotifications = prev.filter(n => n.type !== 'ticket');
            const combined = [...allItems, ...otherNotifications]
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 50);
            
            const unreadItems = combined.filter(item => !item.read).length;
            setUnreadCount(unreadItems);
            
            return combined;
          });
        }
      );
      
      // Monitorizar nuevas estimaciones
      const estimatesUnsubscribe = onSnapshot(
        query(
          collection(db, 'estimates'), 
          orderBy('createdAt', 'desc'),
          where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo)),
          limit(10)
        ),
        (snapshot) => {
          const readIds = getReadNotifications();
          
          // Procesar todos los documentos
          const allItems = snapshot.docs.map(doc => ({
            id: doc.id,
            type: 'estimate',
            title: 'Nueva Solicitud de Presupuesto',
            content: `${doc.data().userName || 'Un cliente'} ha solicitado un presupuesto`,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            read: readIds.includes(doc.id),
            data: doc.data()
          }));

          setNotifications(prev => {
            // Combinar con otras notificaciones (appointments, tickets)
            const otherNotifications = prev.filter(n => n.type !== 'estimate');
            const combined = [...allItems, ...otherNotifications]
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 50);
            
            const unreadItems = combined.filter(item => !item.read).length;
            setUnreadCount(unreadItems);
            
            return combined;
          });
        }
      );
      
      setLoading(false);
      
      // Limpiar al desmontar
      return () => {
        appointmentsUnsubscribe();
        ticketsUnsubscribe();
        estimatesUnsubscribe();
      };
    };
    
    const unsubscribe = loadLatestNotifications();
    return unsubscribe;
  }, [currentUser]);

  // Marcar una notificación como leída
  const markAsRead = (notificationId) => {
    // Obtener IDs leídos actuales
    const readIds = getReadNotifications();
    
    // Agregar el nuevo ID si no existe
    if (!readIds.includes(notificationId)) {
      readIds.push(notificationId);
      saveReadNotifications(readIds);
    }
    
    // Actualizar estado
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      );
      
      // Recalcular contador
      const unreadItems = updated.filter(item => !item.read).length;
      setUnreadCount(unreadItems);
      
      return updated;
    });
  };

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = () => {
    // Obtener todos los IDs de notificaciones actuales
    const allIds = notifications.map(n => n.id);
    
    // Combinar con IDs ya leídos
    const readIds = getReadNotifications();
    const combinedIds = [...new Set([...readIds, ...allIds])];
    
    // Guardar en localStorage
    saveReadNotifications(combinedIds);
    
    // Actualizar estado
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Valor que provee el contexto
  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
