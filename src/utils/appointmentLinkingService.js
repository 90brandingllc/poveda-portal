import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Links guest appointments to a newly registered user account
 * @param {string} userId - The new user's UID
 * @param {string} email - The user's email address
 * @returns {Promise<number>} - Number of appointments linked
 */
export const linkGuestAppointmentsToUser = async (userId, email) => {
  if (!userId || !email) {
    console.error('linkGuestAppointmentsToUser: Missing userId or email');
    return 0;
  }

  try {
    console.log(`Searching for guest appointments with email: ${email}`);
    
    // Query for appointments that:
    // 1. Have userId = 'guest'
    // 2. Have userEmail matching the new user's email
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('userId', '==', 'guest'),
      where('userEmail', '==', email)
    );

    const querySnapshot = await getDocs(appointmentsQuery);
    
    if (querySnapshot.empty) {
      console.log('No guest appointments found for this email');
      return 0;
    }

    console.log(`Found ${querySnapshot.size} guest appointment(s) to link`);

    // Use batch write for better performance and atomicity
    const batch = writeBatch(db);
    let linkedCount = 0;

    querySnapshot.forEach((appointmentDoc) => {
      const appointmentRef = doc(db, 'appointments', appointmentDoc.id);
      
      // Update the appointment to link it to the new user
      batch.update(appointmentRef, {
        userId: userId,
        isGuestBooking: false,
        linkedToAccount: true,
        linkedAt: new Date(),
        // Keep the original guest info for reference
        wasGuestBooking: true
      });
      
      linkedCount++;
      console.log(`Linking appointment ${appointmentDoc.id} to user ${userId}`);
    });

    // Commit all updates
    await batch.commit();
    
    console.log(`Successfully linked ${linkedCount} appointment(s) to user ${userId}`);
    return linkedCount;

  } catch (error) {
    console.error('Error linking guest appointments:', error);
    // Don't throw - we don't want to fail user registration if linking fails
    return 0;
  }
};

/**
 * Checks if a user has any guest appointments before registration
 * @param {string} email - The email to check
 * @returns {Promise<number>} - Number of guest appointments found
 */
export const checkGuestAppointments = async (email) => {
  if (!email) {
    return 0;
  }

  try {
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('userId', '==', 'guest'),
      where('userEmail', '==', email)
    );

    const querySnapshot = await getDocs(appointmentsQuery);
    return querySnapshot.size;

  } catch (error) {
    console.error('Error checking guest appointments:', error);
    return 0;
  }
};
