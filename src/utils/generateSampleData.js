import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Generate sample data for demo purposes
export const generateSampleData = async (userId, userEmail, userName) => {
  try {


    // Sample Estimates
    const sampleEstimates = [
      {
        userId,
        userEmail,
        userName,
        serviceType: 'Full Detailing Package',
        vehicleDetails: {
          make: 'BMW',
          model: 'X5',
          year: 2021,
          color: 'Black',
          size: 'Large SUV'
        },
        address: {
          street: '123 Main Street',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43215'
        },
        description: 'Complete exterior and interior detailing for BMW X5. Includes wash, wax, polish, interior vacuum, leather conditioning, and paint protection.',
        estimatedPrice: 189.99,
        status: 'pending',
        priority: 'medium',
        adminResponse: '',
        createdAt: serverTimestamp(),
        notes: 'Vehicle has some minor scratches on the driver side door that need attention.'
      },
      {
        userId,
        userEmail,
        userName,
        serviceType: 'Premium Wash & Wax',
        vehicleDetails: {
          make: 'Mercedes',
          model: 'C-Class',
          year: 2020,
          color: 'Silver',
          size: 'Sedan'
        },
        address: {
          street: '456 Oak Avenue',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43212'
        },
        description: 'Premium exterior wash and wax service for Mercedes C-Class. Hand wash, clay bar treatment, premium wax application.',
        estimatedPrice: 89.99,
        status: 'approved',
        priority: 'low',
        adminResponse: 'Estimate approved! Your Mercedes will look amazing after our premium service. We can schedule this for next week.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        notes: 'Customer requested eco-friendly products.'
      },
      {
        userId,
        userEmail,
        userName,
        serviceType: 'Interior Deep Clean',
        vehicleDetails: {
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          color: 'Blue',
          size: 'Compact'
        },
        address: {
          street: '789 Pine Road',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43220'
        },
        description: 'Deep interior cleaning including carpet shampooing, leather conditioning, dashboard cleaning, and odor elimination.',
        estimatedPrice: 129.99,
        status: 'completed',
        priority: 'high',
        adminResponse: 'Service completed successfully! Your Honda Civic interior has been thoroughly cleaned and treated. Thank you for choosing our services.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        notes: 'Pet hair removal needed, vehicle has coffee stain on passenger seat.'
      }
    ];

    // Sample Appointments
    const sampleAppointments = [
      {
        userId,
        userEmail,
        userName,
        service: 'Premium Wash & Wax',
        category: 'Exterior',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        timeSlot: '10:00 AM - 12:00 PM',
        time: '10:00',
        address: {
          street: '456 Oak Avenue',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43212'
        },
        notes: 'Please use eco-friendly products as requested.',
        emailReminders: true,
        smsReminders: true,
        userPhoneNumber: '(614) 555-0123',
        estimatedPrice: 89.99,
        finalPrice: 89.99,
        depositAmount: 50.00,
        remainingBalance: 39.99,
        paymentStatus: 'deposit_paid',
        paymentId: 'pi_demo_12345',
        status: 'approved',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        vehicleDetails: 'Mercedes C-Class 2020, Silver'
      },
      {
        userId,
        userEmail,
        userName,
        service: 'Full Detailing Package',
        category: 'Complete',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        timeSlot: '2:00 PM - 6:00 PM',
        time: '14:00',
        address: {
          street: '123 Main Street',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43215'
        },
        notes: 'BMW X5 needs extra attention on driver side door scratches.',
        emailReminders: true,
        smsReminders: false,
        userPhoneNumber: '',
        estimatedPrice: 189.99,
        finalPrice: 189.99,
        depositAmount: 95.00,
        remainingBalance: 94.99,
        paymentStatus: 'deposit_paid',
        paymentId: 'pi_demo_67890',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        vehicleDetails: 'BMW X5 2021, Black'
      },
      {
        userId,
        userEmail,
        userName,
        service: 'Interior Deep Clean',
        category: 'Interior',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago (completed)
        timeSlot: '9:00 AM - 12:00 PM',
        time: '09:00',
        address: {
          street: '789 Pine Road',
          city: 'Columbus',
          state: 'OH',
          zipCode: '43220'
        },
        notes: 'Pet hair removal and coffee stain treatment completed successfully.',
        emailReminders: true,
        smsReminders: true,
        userPhoneNumber: '(614) 555-0123',
        estimatedPrice: 129.99,
        finalPrice: 129.99,
        depositAmount: 65.00,
        remainingBalance: 0, // Fully paid
        paymentStatus: 'completed',
        paymentId: 'pi_demo_54321',
        status: 'completed',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        vehicleDetails: 'Honda Civic 2019, Blue'
      }
    ];

    // Sample Support Tickets
    const sampleTickets = [
      {
        userId,
        userEmail,
        userName,
        subject: 'Question about wax protection duration',
        message: 'Hi! I recently had the premium wax service done on my Mercedes and I\'m wondering how long the protection typically lasts. Also, do you have any recommendations for maintaining the finish between services?',
        priority: 'low',
        status: 'resolved',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        responses: [
          {
            id: 1,
            message: 'Thank you for your question! Our premium wax typically provides protection for 3-4 months depending on weather conditions and usage. For maintenance, we recommend washing with pH-neutral soap and avoiding automatic car washes with harsh brushes.',
            isAdmin: true,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            adminName: 'Support Team'
          },
          {
            id: 2,
            message: 'Perfect! Thank you for the detailed information. I\'ll follow those recommendations.',
            isAdmin: false,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            adminName: ''
          }
        ]
      },
      {
        userId,
        userEmail,
        userName,
        subject: 'Rescheduling my upcoming appointment',
        message: 'Hello, I need to reschedule my appointment scheduled for this Friday. Would it be possible to move it to next week? I have a family emergency that came up. Thank you for understanding.',
        priority: 'medium',
        status: 'open',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        responses: [
          {
            id: 1,
            message: 'I\'m sorry to hear about your family emergency. We absolutely understand and can help you reschedule. Let me check our availability for next week and get back to you with options.',
            isAdmin: true,
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
            adminName: 'Customer Service'
          }
        ]
      },
      {
        userId,
        userEmail,
        userName,
        subject: 'Payment confirmation needed',
        message: 'I made a payment for my recent service but haven\'t received a confirmation email yet. Could you please verify that the payment went through? The service was completed yesterday and I paid the remaining balance.',
        priority: 'high',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        responses: [
          {
            id: 1,
            message: 'I\'ll check on your payment status right away and send you a confirmation email within the next hour. Thank you for bringing this to our attention.',
            isAdmin: true,
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            adminName: 'Billing Department'
          }
        ]
      }
    ];

    // Add estimates to Firestore

    for (const estimate of sampleEstimates) {
      await addDoc(collection(db, 'estimates'), estimate);
    }

    // Add appointments to Firestore

    for (const appointment of sampleAppointments) {
      await addDoc(collection(db, 'appointments'), appointment);
    }

    // Add support tickets to Firestore

    for (const ticket of sampleTickets) {
      await addDoc(collection(db, 'tickets'), ticket);
    }


    return {
      estimates: sampleEstimates.length,
      appointments: sampleAppointments.length,
      tickets: sampleTickets.length
    };

  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  }
};

// Function to clear existing user data (for demo reset)
// eslint-disable-next-line no-unused-vars
export const clearUserData = async (userId) => {
  try {

    
    // This would require Firebase Admin SDK to actually delete documents
    // For demo purposes, we'll just log what would be deleted
    
    return { message: 'User data clearing is referenced but requires admin privileges' };
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
};

export default { generateSampleData, clearUserData };
