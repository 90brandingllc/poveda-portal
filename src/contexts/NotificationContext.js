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

  // Cargar y supervisar notificaciones
  useEffect(() => {
    if (!currentUser || !currentUser.uid) return;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Función para obtener notificaciones nuevas desde cada colección
    const loadLatestNotifications = () => {
      setLoading(true);
      const notificationsArray = [];
      
      // Monitorizar nuevas citas (appointments)
      const appointmentsUnsubscribe = onSnapshot(
        query(
          collection(db, 'appointments'),
          orderBy('createdAt', 'desc'),
          where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo)),
          limit(10)
        ),
        (snapshot) => {
          const newItems = snapshot.docChanges()
            .filter(change => change.type === 'added')
            .map(change => ({
              id: change.doc.id,
              type: 'appointment',
              title: 'Nueva Cita',
              content: `Se ha creado una nueva cita para ${change.doc.data().userName || 'un cliente'}`,
              createdAt: change.doc.data().createdAt?.toDate() || new Date(),
              read: false,
              data: change.doc.data()
            }));

          if (newItems.length > 0) {
            setNotifications(prev => {
              const combined = [...newItems, ...prev]
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 50); // Mantener un máximo de 50 notificaciones
              
              // Actualizar contador de no leídas
              const unreadItems = combined.filter(item => !item.read).length;
              setUnreadCount(unreadItems);
              
              return combined;
            });
          }
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
          const newItems = snapshot.docChanges()
            .filter(change => change.type === 'added')
            .map(change => ({
              id: change.doc.id,
              type: 'ticket',
              title: 'Nuevo Ticket de Soporte',
              content: `Se ha creado un nuevo ticket: ${change.doc.data().subject || 'Sin asunto'}`,
              createdAt: change.doc.data().createdAt?.toDate() || new Date(),
              read: false,
              data: change.doc.data()
            }));

          if (newItems.length > 0) {
            setNotifications(prev => {
              const combined = [...newItems, ...prev]
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 50);
              
              const unreadItems = combined.filter(item => !item.read).length;
              setUnreadCount(unreadItems);
              
              return combined;
            });
          }
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
          const newItems = snapshot.docChanges()
            .filter(change => change.type === 'added')
            .map(change => ({
              id: change.doc.id,
              type: 'estimate',
              title: 'Nueva Solicitud de Presupuesto',
              content: `${change.doc.data().userName || 'Un cliente'} ha solicitado un presupuesto`,
              createdAt: change.doc.data().createdAt?.toDate() || new Date(),
              read: false,
              data: change.doc.data()
            }));

          if (newItems.length > 0) {
            setNotifications(prev => {
              const combined = [...newItems, ...prev]
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 50);
              
              const unreadItems = combined.filter(item => !item.read).length;
              setUnreadCount(unreadItems);
              
              return combined;
            });
          }
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
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Recalcular contador
    const unreadItems = notifications.filter(item => !item.read).length;
    setUnreadCount(unreadItems);
  };

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = () => {
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
