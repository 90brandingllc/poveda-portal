import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { listenForAppointmentStatusChanges } from '../../utils/notificationTriggers';
import { useAuth } from '../../contexts/AuthContext';
import NotificationToast from './NotificationToast';

/**
 * Component that sets up global notification listeners and displays toast notifications
 * This component should be placed near the root of your application
 */
const NotificationListener = () => {
  const { currentUser } = useAuth();
  const [latestNotification, setLatestNotification] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [previouslyShown, setPreviouslyShown] = useState(new Set());

  // Listen for new notifications
  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting up notification listeners for user:', currentUser.uid);

    // Set up a listener for new notifications in Firestore
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      if (snapshot.empty) return;

      // Get the most recent notification
      const notificationDoc = snapshot.docs[0];
      const notification = {
        id: notificationDoc.id,
        ...notificationDoc.data(),
      };

      // If we haven't shown this notification before, show it
      if (!previouslyShown.has(notification.id)) {
        setLatestNotification(notification);
        setShowToast(true);
        
        // Add to set of shown notifications
        setPreviouslyShown(prev => new Set([...prev, notification.id]));
      }
    }, (error) => {
      console.error('Error setting up notification listener:', error);
    });

    // Set up appointment status change listener
    const unsubscribeAppointmentChanges = listenForAppointmentStatusChanges((appointmentId, status, data) => {
      console.log(`Appointment ${appointmentId} changed to ${status}`);
      // This will trigger the notifications listener above
    });

    return () => {
      console.log('Cleaning up notification listeners');
      unsubscribeNotifications();
      unsubscribeAppointmentChanges();
    };
  }, [currentUser]);

  // Handle closing the toast
  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') return;
    setShowToast(false);
  };

  return (
    <>
      {latestNotification && (
        <NotificationToast
          notification={latestNotification}
          open={showToast}
          onClose={handleCloseToast}
        />
      )}
    </>
  );
};

export default NotificationListener;
