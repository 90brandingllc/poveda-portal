import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  Chip,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  CheckCircle,
  Schedule,
  Block,
  DirectionsCar,
  Home,
  LocationOn,
  Check,
  ArrowBack,
  ArrowForward,
  Phone,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DepositPayment from '../Payment/DepositPayment';
import { calculateDepositAmount, formatCurrency } from '../../services/stripeService';
import { createAppointmentConfirmedNotification, createPaymentReceivedNotification } from '../../utils/notificationService';
import { sendAppointmentConfirmationEmail } from '../../utils/emailService';
import { handleError, withRetry } from '../../utils/errorHandler';
import { handleAppointmentStatusChange } from '../../utils/notificationTriggers';
import { LoadingSpinner, FormLoadingOverlay } from '../LoadingState';
import ClientLayout from '../Layout/ClientLayout';

const BookAppointment = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(0); // Add this for forcing re-renders
  
  // Helper function to force a re-render
  const triggerRerender = () => {
    setForceUpdate(prev => prev + 1);
  };

  const [formData, setFormData] = useState({
    selectedServices: [], // Array of selected services
    vehicleType: '', // small, suv, threeRow
    vehicleId: '',
    vehiclePhone: '', // Campo para almacenar el teléfono del vehículo
    // Guest user info (when not logged in)
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    date: null,
    timeSlot: null,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    notes: '',
    emailReminders: true,
    estimatedPrice: 0,
    preselectedFromUrl: false // Flag para controlar si el servicio se cargó desde la URL
  });

  // Adjust steps based on whether user is logged in
  const steps = currentUser 
    ? ['Select Services', 'Select Vehicle Type', 'Select Vehicle', 'Choose Date & Time', 'Location Details', 'Review & Payment']
    : ['Select Services', 'Select Vehicle Type', 'Your Information', 'Choose Date & Time', 'Location Details', 'Review & Payment'];

  // Service categories definition (moved up for URL parameter processing)
  const serviceCategories = {
    interior: {
      name: 'INTERIOR SERVICES',
      services: [
        { 
          name: 'SILVER PACKAGE', 
          price: 75, 
          description: 'Perfect for keeping your vehicle clean and presentable on a daily basis',
          details: 'Air blow, full vacuuming, plastic shine, carpet mat cleaning, trunk cleaning, interior glass cleaning',
          vehicleTypes: { small: 75, suv: 85, threeRow: 95 }
        },
        { 
          name: 'GOLD PACKAGE', 
          price: 145, 
          description: 'A complete cleaning to make your interior look like new',
          details: 'Deep cleaning of seats/carpets/headliner, window cleaning, extractor/steam, plastic conditioning, air freshener',
          vehicleTypes: { small: 145, suv: 165, threeRow: 185 }
        },
        { 
          name: 'DIAMOND PACKAGE', 
          price: 225, 
          description: 'For vehicles with high dirt levels or challenging conditions (50%+ stains, heavy pet hair, strong odors)',
          details: 'All Gold services + intensive stain/odor treatment + deep decontamination + surface restoration',
          vehicleTypes: { small: 225, suv: 245, threeRow: 265 }
        }
      ]
    },
    interior_addons: {
      name: 'INTERIOR PACKAGE ADD-ONS',
      services: [
        { name: 'Light Pet Hair', price: 25, description: 'Professional removal of light pet hair' },
        { name: 'Heavy Pet Hair', price: 50, description: 'Intensive removal of heavy pet hair' },
        { name: 'Baby Seat', price: 25, description: 'Thorough cleaning of baby car seats' },
        { name: 'Full Cleaning for Dirty Headliners', price: 50, description: 'Deep cleaning of headliner surfaces' },
        { name: 'Engine', price: 40, description: 'Thorough cleaning of engine compartment' },
        { name: 'Headlight Restoration', price: 70, description: 'Restore clarity and visibility' }
      ]
    },
    exterior: {
      name: 'EXTERIOR SERVICES',
      services: [
        { 
          name: 'GOLD PACKAGE', 
          price: 55, 
          description: 'Ideal for keeping your vehicle exterior clean, protected, and presentable',
          details: 'Two-bucket wash, wheel cleaning, tire shine, wheel well cleaning, exterior glass, gas cap, hand-dry',
          vehicleTypes: { small: 55, suv: 65, threeRow: 75 }
        }
      ]
    },
    exterior_addons: {
      name: 'EXTERIOR PACKAGE ADD-ONS',
      services: [
        { name: 'Headlight Restoration', price: 70, description: 'Restore clarity and visibility' },
        { name: 'Plastic Restoration', price: 30, description: 'Restore faded plastic trim' },
        { name: 'Engine Cleaning', price: 40, description: 'Thorough cleaning of engine compartment' },
        { name: 'Clay Bar Treatment', price: 45, description: 'Removes contaminants, reduces oxidation risk, and helps wax or ceramic coating last longer' },
        { name: 'Ceramic Protection (3 months) + Clay Bar', price: 75, description: 'Short-term ceramic coating with clay bar treatment' }
      ]
    },
    polishing: {
      name: 'POLISHING & CERAMIC COATING SERVICES',
      services: [
        { 
          name: 'SILVER PACKAGE', 
          price: 220, 
          description: 'Light cleaning and correction to remove small imperfections and enhance shine',
          details: '1 step polishing, shine enhancement, light scratch removal',
          vehicleTypes: { small: 220, suv: 240, threeRow: 270 }
        },
        { 
          name: 'GOLD PACKAGE', 
          price: 300, 
          description: 'Deeper treatment to correct noticeable defects and restore uniform, glossy finish',
          details: '2 polishing steps, moderate scratch/oxidation removal, preparation for ceramic/sealant',
          vehicleTypes: { small: 300, suv: 320, threeRow: 350 }
        },
        { 
          name: 'DIAMOND PACKAGE', 
          price: 650, 
          description: 'Maximum protection and long-lasting shine with ceramic coating',
          details: '2 polishing steps + high-durability ceramic coating (3-year protection)',
          vehicleTypes: { small: 650, suv: 750, threeRow: 850 }
        }
      ]
    },
    packages: {
      name: 'VIEW PACKAGES',
      services: [
        { 
          name: 'SILVER MAINTENANCE PACKAGE', 
          price: 110, 
          description: 'Basic interior and exterior maintenance',
          details: 'Basic cleaning and maintenance for both interior and exterior',
          vehicleTypes: { small: 110, suv: 130, threeRow: 150 }
        },
        { 
          name: 'GOLD FULL CLEANING PACKAGE', 
          price: 185, 
          description: 'Complete interior and exterior cleaning',
          details: 'Deep cleaning for both interior and exterior surfaces',
          vehicleTypes: { small: 185, suv: 210, threeRow: 240 }
        },
        { 
          name: 'XTREME FULL RENOVATION PACKAGE', 
          price: 450, 
          description: 'Complete renovation and restoration for your vehicle',
          details: 'Intensive cleaning, restoration and protection for both interior and exterior',
          vehicleTypes: { small: 450, suv: 480, threeRow: 520 }
        },
        { 
          name: 'XTREME FULL RENOVATION WITH 5-YEAR CERAMIC PACKAGE', 
          price: 765, 
          description: 'Complete renovation with long-lasting ceramic protection',
          details: 'Full renovation package plus premium 5-year ceramic coating protection',
          vehicleTypes: { small: 765, suv: 800, threeRow: 850 }
        }
      ]
    }
  };

  // Generate time slots for business hours (7 AM - 4 PM, Monday to Friday)
  // Slots are spaced 3 hours apart: 7 AM, 10 AM, 1 PM, 4 PM
  const generateTimeSlots = (selectedDate) => {
    if (!selectedDate) return [];
    
    const slots = [];
    const date = dayjs(selectedDate);
    
    // Check if it's a weekend
    if (date.day() === 0 || date.day() === 6) {
      return []; // No slots on weekends
    }
    
    // Generate slots every 3 hours starting from 7 AM
    // Available slots: 7 AM, 10 AM, 1 PM, 4 PM
    for (let hour = 7; hour <= 16; hour += 3) {
      const slotTime = date.hour(hour).minute(0).second(0);
      
      // Don't show past time slots for today
      if (date.isSame(dayjs(), 'day') && slotTime.isBefore(dayjs())) {
        continue;
      }
      
      slots.push({
        time: slotTime,
        label: slotTime.format('h:mm A'),
        available: true // Will be updated when checking against booked appointments
      });
    }
    
    return slots;
  };

  // Check slot availability against existing appointments and admin-blocked slots
  const checkSlotAvailability = async (selectedDate) => {
    if (!selectedDate) return;
    
    setLoadingSlots(true);
    try {
      await withRetry(async () => {
      const dayStart = dayjs(selectedDate).startOf('day').toDate();
      const dayEnd = dayjs(selectedDate).endOf('day').toDate();
      
      // Query appointments for the selected date
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('date', '>=', dayStart),
        where('date', '<=', dayEnd)
      );
      
      // Query admin-blocked slots for the selected date (using same Date object approach as admin)
      const blockedSlotsQuery = query(
        collection(db, 'blockedSlots'),
        where('date', '>=', dayStart),
        where('date', '<=', dayEnd)
      );
      
      const [appointmentsSnapshot, blockedSlotsSnapshot] = await Promise.all([
        getDocs(appointmentsQuery),
        getDocs(blockedSlotsQuery)
      ]);
      
      const bookedSlots = [];
      const blockedSlots = [];
      
      // Get booked slots from appointments
      appointmentsSnapshot.forEach((doc) => {
        const appointment = doc.data();
        if (appointment.timeSlot) {
          bookedSlots.push(appointment.timeSlot);
        }
      });
      
      // Get admin-blocked slots
      blockedSlotsSnapshot.forEach((doc) => {
        const blockedSlot = doc.data();
        if (blockedSlot.timeSlot) {
          blockedSlots.push(blockedSlot.timeSlot);
        }
      });
      

      
      // Generate slots and mark availability
      const slots = generateTimeSlots(selectedDate);
      const availableSlots = slots.map(slot => ({
        ...slot,
        available: slot.available && 
                  !bookedSlots.includes(slot.label) && 
                  !blockedSlots.includes(slot.label)
      }));
      
        setAvailableSlots(availableSlots);
      });
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'checking_slot_availability',
        date: selectedDate?.toISOString()
      });
      setError(errorInfo.message);
    }
    setLoadingSlots(false);
  };

  // Para controlar que el efecto de URL solo se ejecute una vez
  const [urlProcessed, setUrlProcessed] = useState(false);
  // Para forzar la actualización de la UI cuando cambia la URL
  const [urlParams, setUrlParams] = useState({ service: null, serviceName: null });

  // Extraer y guardar parámetros de URL para usarlos en la selección visual
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const serviceNameParam = searchParams.get('serviceName');
    
    // Guardar parámetros para usarlos en la lógica de selección visual
    setUrlParams({ service: serviceParam, serviceName: serviceNameParam });
    
    // Preselect service from URL parameters - con protección contra bucle infinito
    if (urlProcessed) {
      return; // Sólo para evitar cargar múltiples veces el servicio en el estado
    }
    
    const priceParam = searchParams.get('price');
    
    if (serviceParam && serviceNameParam && priceParam) {
      console.log('URL Params:', { serviceParam, serviceNameParam, priceParam });
      
      // Marcar como procesada ANTES de actualizar el estado para evitar bucle infinito
      setUrlProcessed(true);
      
      // Solución SIMPLIFICADA: Crear un servicio directo desde los parámetros
      const price = parseInt(priceParam, 10);
      if (!isNaN(price)) {
        // Crear un servicio con la información básica
        const directService = {
          id: `url_service_${Date.now()}`, // ID único para identificación
          name: serviceNameParam,
          price: price,
          description: serviceNameParam,
          fromUrl: true, // Flag especial para saber que viene de URL
          urlId: serviceParam, // Guardar el id original de la URL
          // Asumimos valores por defecto para los tipos de vehículos
          vehicleTypes: {
            small: price,
            suv: price + 20,
            threeRow: price + 40
          }
        };
        
        // Asignar a una categoría basada en el parámetro service
        let serviceCategory = 'packages'; // Por defecto
        
        // Reglas precisas para determinar la categoría y ajustar precio si es necesario
        if (serviceParam.includes('interior')) {
          serviceCategory = 'interior';
          
          // Casos especiales para servicios interiores
          if (serviceParam === 'silver-interior') {
            // Buscar el servicio Silver Package en la categoría interior para obtener el precio correcto
            const silverService = serviceCategories.interior.services.find(s => 
              s.name.toLowerCase().includes('silver') && s.name.toLowerCase().includes('package'));
            
            if (silverService) {
              console.log('Encontrado Silver Package en la categoría interior:', silverService);
              // Actualizar precio según el servicio encontrado
              directService.price = silverService.price || price;
              directService.vehicleTypes = silverService.vehicleTypes || {
                small: price,
                suv: price + 10,
                threeRow: price + 20
              };
            }
          }
          // Caso especial para gold-interior
          else if (serviceParam === 'gold-interior') {
            serviceCategory = 'interior';
            // Buscar el servicio Gold Package en la categoría interior
            const goldService = serviceCategories.interior.services.find(s => 
              s.name.toLowerCase().includes('gold') && s.name.toLowerCase().includes('package'));
            
            if (goldService) {
              console.log('Encontrado Gold Package en la categoría interior:', goldService);
              // Actualizar precio según el servicio encontrado
              directService.price = goldService.price || price;
              directService.vehicleTypes = goldService.vehicleTypes || {
                small: price,
                suv: price + 20,
                threeRow: price + 40
              };
            }
          }
        }
        else if (serviceParam.includes('exterior')) serviceCategory = 'exterior';
        else if (serviceParam.includes('polish')) serviceCategory = 'polishing';
        else if (serviceParam.includes('package')) serviceCategory = 'packages';
        
        // Crear objeto final con categoría y marcas especiales
        const finalService = {
          ...directService,
          category: serviceCategory,
          fromUrl: true,   // Marcar que viene de URL
          urlId: serviceParam,  // Guardar el ID del servicio en URL
          manuallySelected: true // Añadir para indicar que debe ser mostrado como seleccionado
        };
        
        // Establecer en el estado
        console.log('Preselecting service from URL:', finalService);
        console.log('URL params detected - serviceParam:', serviceParam);
        console.log('URL params detected - serviceNameParam:', serviceNameParam);
        console.log('URL params detected - priceParam:', priceParam);
        
        // Buscar servicio existente que podría coincidir para usar sus datos exactos
        let exactMatchFound = false;
        
        // BUSCAR COINCIDENCIA EXACTA en el catálogo de servicios de manera consistente
        Object.entries(serviceCategories).forEach(([catKey, category]) => {
          category.services.forEach(service => {
            const serviceName = service.name.toLowerCase().trim();
            const urlName = serviceNameParam ? serviceNameParam.toLowerCase().trim() : '';
            
            // Extraer categoría y tipo de la URL
            let urlCategory = '';
            let urlServiceType = '';
            
            // Extraer categoría basado en el patrón service=xxxx-yyyy
            if (serviceParam && serviceParam.includes('-')) {
              const parts = serviceParam.split('-');
              if (parts.length >= 2) {
                urlServiceType = parts[0]; // gold, silver, etc.
                urlCategory = parts[1];   // interior, exterior, etc.
              }
            }
            
            // CASO 1: Coincidencia por categoría y tipo de servicio
            if (urlCategory && urlServiceType && 
                catKey.toLowerCase().includes(urlCategory) && 
                serviceName.includes(urlServiceType)) {
              console.log('MATCH FOUND by Category+Type:', service.name, 'in', catKey);
              exactMatchFound = true;
              
              // Actualizar el servicio final con los datos del servicio real
              finalService.name = service.name;
              finalService.price = service.price;
              finalService.vehicleTypes = service.vehicleTypes;
              finalService.description = service.description;
              finalService.exactMatchService = service;
              finalService.category = catKey;
            }
            // CASO 2: Casos especiales para gold-interior y silver-interior (retrocompatibilidad)
            else if ((serviceParam === 'gold-interior' && 
                      catKey === 'interior' && 
                      serviceName.includes('gold')) || 
                    (serviceParam === 'silver-interior' && 
                      catKey === 'interior' && 
                      serviceName.includes('silver'))) {
              console.log('MATCH FOUND for Special Case:', service.name, 'in', catKey);
              exactMatchFound = true;
              
              // Actualizar el servicio final con los datos del servicio real
              finalService.name = service.name;
              finalService.price = service.price;
              finalService.vehicleTypes = service.vehicleTypes;
              finalService.description = service.description;
              finalService.exactMatchService = service;
              finalService.category = catKey;
            }
            // CASO 3: Coincidencia exacta por nombre del servicio
            else if (urlName && (serviceName === urlName || 
                                serviceName.includes(urlName) || 
                                urlName.includes(serviceName))) {
              // Verificar precio si está disponible para evitar coincidencias múltiples
              const price = parseInt(priceParam, 10);
              if (!isNaN(price) && service.price === price) {
                console.log('MATCH FOUND by Name+Price:', service.name, '($' + service.price + ')', 'in', catKey);
                exactMatchFound = true;
                
                // Actualizar el servicio final con los datos del servicio real
                finalService.name = service.name;
                finalService.price = service.price;
                finalService.vehicleTypes = service.vehicleTypes;
                finalService.description = service.description;
                finalService.exactMatchService = service;
                finalService.category = catKey;
              }
            }
          });
        });
        
        // Si no encontramos coincidencia exacta, mostrar advertencia
        if (!exactMatchFound) {
          console.warn(`No se encontró una coincidencia exacta para el servicio: ${serviceParam} / ${serviceNameParam}`);
        }
        
        // Establecer el servicio en el estado (una sola vez)
        // Para usuarios no logueados que vienen desde URL, forzamos emailReminders a true
        setFormData(prev => ({
          ...prev,
          selectedServices: [finalService],
          preselectedFromUrl: true,
          emailReminders: !currentUser ? true : prev.emailReminders // Forzar emails para usuarios no logueados
        }));
        
        // Forzar actualización del estado - múltiples veces para garantizar que se aplique
        setTimeout(() => {
          console.log('Primera actualización después de selección desde URL');
          setForceUpdate(prev => prev + 1);
          
          // Segunda actualización para garantizar que se apliquen los estilos
          setTimeout(() => {
            console.log('Segunda actualización después de selección desde URL');
            setForceUpdate(prev => prev + 2);
          }, 300);
        }, 100);
      }
    } else {
      // Si no hay parámetros de servicio, igual marcamos como procesado
      setUrlProcessed(true);
    }
  }, [searchParams, serviceCategories]); // Dependemos de searchParams y serviceCategories

  // Fetch user's vehicles (only if logged in)
  useEffect(() => {
    if (currentUser) {
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(vehiclesQuery, (snapshot) => {
        const userVehicles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVehicles(userVehicles);
      }, (error) => {
        console.error('Error fetching vehicles:', error);
      });

      return () => unsubscribe();
    } else {
      // No vehicles for guest users
      setVehicles([]);
    }
  }, [currentUser]);

  // Effect to check availability when date changes
  useEffect(() => {
    if (formData.date) {
      checkSlotAvailability(formData.date);
      setSelectedSlot(null);
      setFormData(prev => ({ ...prev, timeSlot: null }));
    } else {
      setAvailableSlots([]);
    }
  }, [formData.date]);

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    if (!slot.available) return;
    
    setSelectedSlot(slot);
    setFormData(prev => ({ 
      ...prev, 
      timeSlot: slot.label,
      time: slot.time // Keep for backward compatibility
    }));
    
    // Force a re-render to ensure UI reflects selection
    setTimeout(triggerRerender, 10);
  };

  const handleServiceSelect = (category, service) => {
    console.log('Selecting service:', { category, service });
    
    // Siempre usar copia con categoría y marcar como seleccionado manualmente
    const serviceWithCategory = { 
      ...service, 
      category,
      manuallySelected: true, // Marcar que fue seleccionado manualmente
      // Añadimos estos campos para mayor compatibilidad con servicios desde URL
      fromUser: true,
      id: `manual_service_${Date.now()}`
    };
    
    // Verificar si el servicio está seleccionado usando la misma lógica mejorada
    let isSelected = false;
    
    // Buscar el servicio en los seleccionados
    for (const s of formData.selectedServices) {
      // Verificar datos válidos
      if (!s || !s.name) continue;
      
      // Obtener nombres normalizados
      const selectedName = s.name.toLowerCase().trim();
      const cardName = service.name.toLowerCase().trim();
      
      // Verificar coincidencia exacta de nombre y categoría
      if (selectedName === cardName && s.category === category) {
        console.log(`Servicio ya seleccionado: ${s.name} (${s.category})`);
        isSelected = true;
        break;
      }
      
      // Verificar caso especial Gold Interior desde URL para usuarios no logueados
      if (!currentUser && s.fromUrl) {
        const serviceParam = new URLSearchParams(window.location.search).get('service');
        if (serviceParam === 'gold-interior' && 
            cardName.includes('gold') && 
            category === 'interior' && 
            (cardName.includes('package') || service.name.includes('Package'))) {
          console.log(`Coincidencia especial Gold Interior: ${s.name} ~ ${service.name}`);
          isSelected = true;
          break;
        }
      }
    }
    
    console.log('¿Está seleccionado este servicio?:', isSelected);
    
    let updatedServices;
    
    if (isSelected) {
      // DESELECCIONAR: Remover el servicio
      console.log('Deseleccionando servicio...');
      updatedServices = formData.selectedServices.filter(s => {
        // Verificar datos válidos
        if (!s || !s.name) return true; // Mantener entradas inválidas
        
        const selectedName = s.name.toLowerCase().trim();
        const cardName = service.name.toLowerCase().trim();
        
        // Caso 1: Coincidencia exacta - remover
        if (selectedName === cardName && s.category === category) {
          return false;
        }
        
        // Caso 2: Para usuarios no logueados - Gold Interior especial desde URL
        if (!currentUser && s.fromUrl) {
          const serviceParam = new URLSearchParams(window.location.search).get('service');
          if (serviceParam === 'gold-interior' && 
              cardName.includes('gold') && 
              category === 'interior') {
            return false;
          }
        }
        
        return true; // Mantener todos los demás servicios
      });
    } else {
      // SELECCIONAR: Agregar el servicio
      console.log('Seleccionando nuevo servicio...');
      updatedServices = [...formData.selectedServices, serviceWithCategory];
    }
    
    console.log('Servicios actualizados:', updatedServices);
    
    // Actualizar el estado
    setFormData({
      ...formData,
      selectedServices: updatedServices,
      estimatedPrice: 0, // Se recalculará cuando se seleccione tipo de vehículo
      preselectedFromUrl: false // Limpiar bandera de preselección desde URL
    });
    
    // Forzar múltiples actualizaciones para garantizar que se apliquen los estilos
    setTimeout(() => {
      console.log('Primera actualización después de selección manual');
      setForceUpdate(prev => prev + 1);
      
      setTimeout(() => {
        console.log('Segunda actualización después de selección manual');
        setForceUpdate(prev => prev + 2);
      }, 200);
    }, 50);
  };

  const handleVehicleTypeSelect = (vehicleType) => {
    // Calculate total price for all selected services based on vehicle type
    let totalPrice = 0;
    
    formData.selectedServices.forEach(service => {
      let servicePrice = service.price; // default price
      
      // Calculate price based on vehicle type if vehicleTypes exist
      if (service.vehicleTypes) {
        switch(vehicleType) {
          case 'small':
            servicePrice = service.vehicleTypes.small;
            break;
          case 'suv':
            servicePrice = service.vehicleTypes.suv;
            break;
          case 'threeRow':
            servicePrice = service.vehicleTypes.threeRow;
            break;
          default:
            servicePrice = service.price;
        }
      }
      
      totalPrice += servicePrice;
    });
    
    setFormData({
      ...formData,
      vehicleType: vehicleType,
      estimatedPrice: totalPrice
    });
    
    // Force a re-render to ensure UI reflects selection
    setTimeout(triggerRerender, 10);
  };



  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePaymentSuccess = async (paymentResult) => {
    setPaymentResult(paymentResult);
    setError('');
    
    // Automatically book appointment after successful payment
    setLoading(true);
    
    try {
      // Validate required fields before booking
      if (!formData.date) {
        setError('Please select a date for your appointment.');
        setLoading(false);
        return;
      }

      if (!formData.timeSlot) {
        setError('Please select a time slot for your appointment.');
        setLoading(false);
        return;
      }

      if (!formData.address.street?.trim() || !formData.address.city?.trim() || !formData.address.state?.trim() || !formData.address.zipCode?.trim()) {
        setError('Please provide a complete service address (street, city, state, and zip code).');
        setLoading(false);
        return;
      }

      const depositAmount = parseFloat(formatCurrency(calculateDepositAmount(formData.estimatedPrice)));
      const remainingBalance = formData.estimatedPrice - depositAmount;

      // Build appointment data - works for both logged in and guest users
      const appointmentData = {
        // User info - use guest info if not logged in
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || formData.customerEmail,
        userName: currentUser?.displayName || formData.customerName,
        ...(!currentUser && formData.customerPhone ? { userPhone: formData.customerPhone } : {}), // Solo incluir userPhone para usuarios no logueados
        isGuestBooking: !currentUser,
        bookingSource: formData.preselectedFromUrl ? 'web_url' : 'portal', // Identificar si viene desde URL
        services: formData.selectedServices.map(service => `${service.name} (${serviceCategories[service.category].name})`), // Array of service names with categories
        servicesDetails: formData.selectedServices, // Full service objects for reference
        vehicleType: formData.vehicleType,
        vehicleId: formData.vehicleId || 'guest-vehicle',
        ...(formData.vehiclePhone ? { vehiclePhone: formData.vehiclePhone } : {}), // Solo incluir si tiene valor
        date: formData.date.toDate(),
        timeSlot: formData.timeSlot,
        time: formData.time ? formData.time.format('HH:mm') : formData.timeSlot,
        address: formData.address,
        notes: formData.notes || '',
        emailReminders: formData.emailReminders,
        estimatedPrice: formData.estimatedPrice,
        finalPrice: formData.estimatedPrice,
        depositAmount: depositAmount,
        remainingBalance: remainingBalance,
        paymentStatus: 'deposit_paid',
        paymentId: paymentResult.id,
        status: 'approved', // Automatically approved - no admin confirmation needed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      
      // Send automatic approval notifications
      try {
        // Trigger notification system for approved status
        await handleAppointmentStatusChange(docRef.id, 'approved', {
          ...appointmentData,
          id: docRef.id
        });
        
        // Create payment notification for logged in users
        if (currentUser && paymentResult) {
          await createPaymentReceivedNotification(currentUser.uid, {
            id: paymentResult.id,
            amount: depositAmount,
            remaining: remainingBalance,
            service: formData.selectedServices.map(s => `${s.name} (${serviceCategories[s.category].name})`).join(', ')
          });
        }
      } catch (notificationError) {
        console.error('Error creating notifications:', notificationError);
        // Don't fail the whole process if notifications fail
      }
      
      setSuccess(true);
      setTimeout(() => {
        // Redirect based on user status
        if (currentUser) {
          navigate('/appointments');
        } else {
          navigate('/login');
        }
      }, 2000);
      
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'booking_appointment',
        step: 'payment_processing',
        userId: currentUser?.uid || 'guest'
      }, {
        showNotification: currentUser ? true : false,
        userId: currentUser?.uid
      });
      
      setError(errorInfo.message);
    }
    
    setLoading(false);
  };

  const handlePaymentError = (error) => {
    setError('Payment failed. Please try again.');
    console.error('Payment error:', error);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      navigate(currentUser ? '/dashboard' : '/login');
    } else {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  // Note: handleSubmit is no longer used since booking happens automatically after payment
  // Keeping it for potential future use or fallback scenarios

  // Función para forzar la selección visual correcta
  const forceSelectionRefresh = () => {
    if (!currentUser && formData.preselectedFromUrl) {
      // Si es un usuario no logueado y hay un servicio preseleccionado, reforzar la selección
      console.log('Forzando refresco de servicios preseleccionados para usuario no logueado');
      // Forzar una actualización después de un pequeño retraso
      setTimeout(() => {
        setForceUpdate(prev => prev + 10);
      }, 100);
    }
  };

  // Llamar al refresco cuando cambian los servicios seleccionados o parámetros de URL
  useEffect(() => {
    forceSelectionRefresh();
    // Forzar múltiples actualizaciones para garantizar que las tarjetas se marquen correctamente
    setTimeout(() => setForceUpdate(prev => prev + 5), 100);
    setTimeout(() => setForceUpdate(prev => prev + 10), 300);
  }, [formData.selectedServices, currentUser, formData.preselectedFromUrl, urlParams]);

  const renderStepContent = (step) => {
    // Forzar refresco al renderizar
    forceSelectionRefresh();
    
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                Select one or more services for your vehicle. You can choose multiple services to combine them.
              </Typography>
            </Grid>
            
            {/* Sección de servicios seleccionados - DUPLICADA ARRIBA */}
            {formData.selectedServices.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ mt: 1, mb: 3, p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                    Selected Services ({formData.selectedServices.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.selectedServices.map((service, idx) => (
                      <Chip 
                        key={`top-${idx}`}
                        label={`${service.name} (${serviceCategories[service.category].name})`}
                        onDelete={() => handleServiceSelect(service.category, service)}
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1, maxWidth: '100%' }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* Navigation Buttons - Después de la card de servicios seleccionados */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mb: 4,
                  gap: 2
                }}>
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                    size="large"
                    sx={{
                      borderRadius: '12px',
                      borderColor: '#cbd5e1',
                      color: '#475569',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '1rem',
                      py: 1.5,
                      px: 4,
                      '&:hover': {
                        borderColor: '#94a3b8',
                        backgroundColor: '#f8fafc'
                      }
                    }}
                  >
                    {activeStep === 0 ? 'Back to Dashboard' : 'Back'}
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    size="large"
                    disabled={formData.selectedServices.length === 0}
                    sx={{
                      borderRadius: '12px',
                      background: '#1e40af',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      py: 1.5,
                      px: 4,
                      boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                      '&:hover': {
                        background: '#1e3a8a',
                        boxShadow: '0 6px 16px rgba(30, 64, 175, 0.4)'
                      },
                      '&:disabled': {
                        background: '#cbd5e1',
                        color: '#64748b'
                      }
                    }}
                  >
                    Next
                  </Button>
                </Box>
              </Grid>
            )}
            {Object.entries(serviceCategories).map(([key, category]) => (
              <Grid item xs={12} key={key}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 700, 
                  color: '#1976d2',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid #1976d2',
                  paddingBottom: 1,
                  marginBottom: 2
                }}>
                  {category.name}
                </Typography>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {category.services.map((service, index) => {
                    // Lógica para verificar si un servicio está seleccionado (corregida para usuarios logueados y no logueados)
                    // Añadir más información de depuración
                    console.log(`Verificando selección para: ${service.name} (${key})`);
                    
                    // Mostrar servicios seleccionados en este momento
                    console.log('Servicios actualmente seleccionados:', JSON.stringify(formData.selectedServices));
                    
                    // Algoritmo directo para marcar tarjetas desde URL
                    let isSelected = false;
                    
                    // 1. Verificar si viene de URL (solo para usuarios no logueados)
                    // Usar los parámetros guardados en el estado para evitar múltiples lecturas de URL
                    
                    // Marcado directo por URL para usuarios no logueados
                    if (!currentUser && urlParams.service) {
                      // ENFOQUE 1: Comprobación por patrones específicos de servicio
                      const serviceParam = urlParams.service;
                      
                      // Extraer la categoría y tipo de servicio de la URL
                      let urlCategory = '';
                      let urlServiceType = '';
                      
                      // Extraer categoría basado en el patrón service=xxxx-yyyy
                      if (serviceParam.includes('-')) {
                        const parts = serviceParam.split('-');
                        if (parts.length >= 2) {
                          urlServiceType = parts[0]; // gold, silver, etc.
                          urlCategory = parts[1];   // interior, exterior, etc.
                        }
                      }
                      
                      // CASO 1: Verificar si el servicio actual corresponde a la URL por categoría y tipo
                      if (urlCategory && urlServiceType && 
                          key.toLowerCase().includes(urlCategory) && 
                          service.name.toLowerCase().includes(urlServiceType)) {
                        console.log(`✅ URL MATCH (CATEGORY+TYPE): ${service.name}`);
                        isSelected = true;
                      }
                      // CASO 2: Verificar por parámetros gold-interior y silver-interior (retrocompatibilidad)
                      else if ((serviceParam === 'gold-interior' && 
                              key === 'interior' && 
                              service.name.toLowerCase().includes('gold')) ||
                            (serviceParam === 'silver-interior' && 
                              key === 'interior' && 
                              service.name.toLowerCase().includes('silver'))) {
                        console.log(`✅ URL MATCH (SPECIAL CASE): ${service.name}`);
                        isSelected = true;
                      }
                      // CASO 3: Verificar por nombre exacto del servicio en la URL
                      else if (urlParams.serviceName) {
                        const urlServiceName = urlParams.serviceName.toLowerCase().trim();
                        const currentServiceName = service.name.toLowerCase().trim();
                        
                        // A. Coincidencia exacta por nombre
                        if (currentServiceName === urlServiceName) {
                          console.log(`✅ URL MATCH (EXACT NAME): ${service.name}`);
                          isSelected = true;
                        }
                        // B. Coincidencia si el nombre del servicio está contenido en el URL o viceversa
                        else if (currentServiceName.includes(urlServiceName) || 
                                urlServiceName.includes(currentServiceName)) {
                          // Obtener precio para verificar coincidencia exacta
                          const priceParam = new URLSearchParams(window.location.search).get('price');
                          const price = parseInt(priceParam, 10);
                          
                          // Sólo seleccionar si el precio coincide (evita selecciones múltiples)
                          if (!isNaN(price) && service.price === price) {
                            console.log(`✅ URL MATCH (NAME+PRICE): ${service.name} - $${price}`);
                            isSelected = true;
                          }
                        }
                      }
                    }
                    
                    // 2. Verificación normal por servicios seleccionados
                    if (!isSelected) {
                      for (const s of formData.selectedServices) {
                        // Verificar datos válidos
                        if (!s || !s.name) continue;
                        
                        // Obtener nombres normalizados para comparación
                        const selectedName = s.name.toLowerCase().trim();
                        const cardName = service.name.toLowerCase().trim();
                        
                        // Coincidencia exacta por nombre y categoría
                        if (selectedName === cardName && s.category === key) {
                          isSelected = true;
                          break;
                        }
                      }
                    }
                    
                    console.log(`${service.name} (${key}): ${isSelected ? '✅ SELECCIONADO' : '❌ NO'}`);
                    
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #ff5555' : '1px solid #e0e0e0',
                            backgroundColor: isSelected ? '#fff8f8' : 'white',
                            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                            height: '100%',
                            borderRadius: { xs: '12px', sm: '16px' },
                            position: 'relative',
                            transition: 'all 0.25s ease-in-out',
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            boxShadow: isSelected ? '0 5px 15px rgba(255, 0, 0, 0.2)' : 'none',
                            zIndex: isSelected ? 2 : 1,
                            outline: isSelected ? '1px dashed #ff6666' : 'none',
                            outlineOffset: '2px',
                            animation: isSelected && !currentUser && urlParams.service ? 'subtlePulse 2s infinite' : 'none',
                            '@keyframes subtlePulse': {
                              '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.2)' },
                              '70%': { boxShadow: '0 0 0 8px rgba(255, 0, 0, 0)' },
                              '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' }
                            },
                            // Borde interno más sutil
                            '&:after': isSelected ? {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              borderRadius: { xs: '12px', sm: '16px' },
                              border: '1px solid rgba(255,0,0,0.3)',
                              pointerEvents: 'none'
                            } : {}
                          }}
                          onClick={() => handleServiceSelect(key, service)}
                        >
                          {isSelected && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: '#ff5555',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                zIndex: 3,
                                opacity: 0.9
                              }}
                            >
                              ✓
                            </Box>
                          )}
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography variant="h6" gutterBottom sx={{ 
                              fontWeight: 700,
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              pr: 2,
                              color: key.includes('addons') ? '#555' : '#1976d2',
                              textTransform: key.includes('addons') ? 'none' : 'uppercase'
                            }}>
                              {service.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              mb: 2,
                              fontSize: { xs: '0.875rem', sm: '0.875rem' },
                              lineHeight: 1.4
                            }}>
                              {service.description}
                            </Typography>
                            {service.vehicleTypes ? (
                              <Typography variant="body2" color="primary" sx={{ 
                                fontWeight: 500,
                                fontSize: { xs: '0.75rem', sm: '0.8rem' }
                              }}>
                                💰 Small: ${service.vehicleTypes.small} | SUV: ${service.vehicleTypes.suv} | 3-Row: ${service.vehicleTypes.threeRow}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="primary" sx={{ 
                                fontWeight: 500,
                                fontSize: { xs: '0.75rem', sm: '0.8rem' }
                              }}>
                                💰 ${service.price}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            ))}
            
            {formData.selectedServices.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ mt: 3, p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                    Selected Services ({formData.selectedServices.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.selectedServices.map((service, idx) => (
                      <Chip 
                        key={idx}
                        label={`${service.name} (${serviceCategories[service.category].name})`}
                        onDelete={() => handleServiceSelect(service.category, service)}
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1, maxWidth: '100%' }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Select Your Vehicle Type
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Choose your vehicle type to see the exact pricing for your selected services:
              </Typography>
              
              {/* Show selected services */}
              <Box sx={{ mb: 4, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Selected Services:
                </Typography>
                {formData.selectedServices.map((service, idx) => (
                  <Chip 
                    key={idx}
                    label={`${service.name} (${serviceCategories[service.category].name})`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5, maxWidth: '100%' }}
                  />
                ))}
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {[
                  { 
                    type: 'small', 
                    label: '🚗 Small Car', 
                    description: 'Compact cars, sedans, coupes',
                    price: formData.selectedServices.reduce((total, service) => {
                      return total + (service.vehicleTypes?.small || service.price);
                    }, 0)
                  },
                  { 
                    type: 'suv', 
                    label: '🚙 SUV', 
                    description: 'Standard SUVs, crossovers',
                    price: formData.selectedServices.reduce((total, service) => {
                      return total + (service.vehicleTypes?.suv || service.price);
                    }, 0)
                  },
                  { 
                    type: 'threeRow', 
                    label: '🚐 3-Row Seating', 
                    description: 'Large SUVs, vans, trucks',
                    price: formData.selectedServices.reduce((total, service) => {
                      return total + (service.vehicleTypes?.threeRow || service.price);
                    }, 0)
                  }
                ].map((vehicleOption) => (
                  <Grid item xs={12} sm={4} key={vehicleOption.type}>
                    <Card 
                      id={`vehicleType_${vehicleOption.type}`}
                      data-selected={formData.vehicleType === vehicleOption.type ? 'true' : 'false'}
                      sx={{ 
                        cursor: 'pointer',
                        border: formData.vehicleType === vehicleOption.type ? '3px solid #1976d2' : '1px solid #e0e0e0',
                        backgroundColor: formData.vehicleType === vehicleOption.type ? '#e3f2fd' : 'white',
                        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                        height: '100%',
                        borderRadius: { xs: '12px', sm: '16px' },
                        position: 'relative',
                        transition: 'all 0.2s ease-in-out',
                        transform: formData.vehicleType === vehicleOption.type ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: formData.vehicleType === vehicleOption.type ? '0 4px 15px rgba(25, 118, 210, 0.3)' : 'none'
                      }}
                      onClick={() => handleVehicleTypeSelect(vehicleOption.type)}
                    >
                      {formData.vehicleType === vehicleOption.type && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: '#1976d2',
                            color: 'white',
                            borderRadius: '50%',
                            width: 30,
                            height: 30,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 800,
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.5)',
                            zIndex: 10
                          }}
                        >
                          ✓
                        </Box>
                      )}
                      <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                        <Typography variant="h5" gutterBottom sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          mb: 2
                        }}>
                          {vehicleOption.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mb: 3,
                          fontSize: { xs: '0.875rem', sm: '0.875rem' },
                          lineHeight: 1.4
                        }}>
                          {vehicleOption.description}
                        </Typography>
                        <Typography variant="h4" color="primary" sx={{ 
                          fontWeight: 700,
                          fontSize: { xs: '1.5rem', sm: '2rem' }
                        }}>
                          ${vehicleOption.price}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mt: 1,
                          fontSize: { xs: '0.75rem', sm: '0.8rem' }
                        }}>
                          Total for {formData.selectedServices.length} service{formData.selectedServices.length !== 1 ? 's' : ''}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        );

      case 2:
        // If user is not logged in, show customer information form
        if (!currentUser) {
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Your Contact Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Please provide your contact details so we can confirm your appointment.
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                  placeholder="(555) 123-4567"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info">
                  💡 Your information will only be used to confirm and manage your appointment.
                </Alert>
              </Grid>
            </Grid>
          );
        }
        
        // If user is logged in, show vehicle selection
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Select Vehicle for Service
              </Typography>
              
              {vehicles.length === 0 ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  You haven't added any vehicles yet. 
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => navigate('/my-garage')}
                    sx={{ ml: 2 }}
                  >
                    Add Vehicle
                  </Button>
                </Alert>
              ) : (
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {vehicles.map((vehicle) => (
                    <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                      <Card 
                        id={`vehicle_${vehicle.id}`}
                        data-selected={formData.vehicleId === vehicle.id ? 'true' : 'false'}
                        sx={{ 
                          cursor: 'pointer',
                          border: formData.vehicleId === vehicle.id ? '3px solid #1976d2' : '1px solid #e0e0e0',
                          backgroundColor: formData.vehicleId === vehicle.id ? '#e3f2fd' : 'white',
                          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                          height: '100%',
                          borderRadius: { xs: '12px', sm: '16px' },
                          position: 'relative',
                          transition: 'all 0.2s ease-in-out',
                          transform: formData.vehicleId === vehicle.id ? 'scale(1.02)' : 'scale(1)',
                          boxShadow: formData.vehicleId === vehicle.id ? '0 4px 15px rgba(25, 118, 210, 0.3)' : 'none'
                        }}
                        onClick={() => {
                          // Transferir tanto el ID como el teléfono del vehículo al formulario
                          setFormData(prev => ({ 
                            ...prev, 
                            vehicleId: vehicle.id,
                            vehiclePhone: vehicle.phoneNumber // Transferir el teléfono del vehículo
                          }));
                          
                          // Forzar actualización para reflejar la selección
                          setTimeout(triggerRerender, 10);
                        }}
                      >
                        {formData.vehicleId === vehicle.id && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: '#1976d2',
                              color: 'white',
                              borderRadius: '50%',
                              width: 30,
                              height: 30,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              fontWeight: 800,
                              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.5)',
                              zIndex: 10
                            }}
                          >
                            ✓
                          </Box>
                        )}
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                            <DirectionsCar sx={{ color: '#1976d2', mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.9rem', sm: '1.25rem' },
                              lineHeight: 1.2
                            }}>
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}>
                            <strong>Color:</strong> {vehicle.color || 'Not specified'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Date Selection */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Select Date"
                  value={formData.date}
                  onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                  minDate={dayjs()}
                  maxDate={dayjs().add(30, 'day')}
                  shouldDisableDate={(date) => {
                    // Disable weekends
                    return date.day() === 0 || date.day() === 6;
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      required 
                      sx={{
                        '& .MuiInputBase-root': {
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }
                      }}
                    />
                  )}
                />
              </Grid>



              {/* Time Slot Selection */}
              {formData.date && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Available Time Slots for {dayjs(formData.date).format('dddd, MMMM D, YYYY')}
                  </Typography>
                  
                  {loadingSlots ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Loading available slots...</Typography>
                    </Box>
                  ) : availableSlots.length === 0 ? (
                    <Alert severity="warning">
                      No available slots for this date. Please select a different date.
                    </Alert>
                  ) : (
                    <Grid container spacing={{ xs: 1, sm: 2 }}>
                      {availableSlots.map((slot, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Chip
                            id={`timeslot_${slot.label.replace(/[: ]/g, '_')}`}
                            data-selected={selectedSlot?.label === slot.label ? 'true' : 'false'}
                            label={slot.label}
                            onClick={() => handleSlotSelect(slot)}
                            color={selectedSlot?.label === slot.label ? 'primary' : 'default'}
                            variant={selectedSlot?.label === slot.label ? 'filled' : 'outlined'}
                            disabled={!slot.available}
                            icon={slot.available ? <Schedule /> : <Block />}
                            sx={{
                              width: '100%',
                              height: { xs: 40, sm: 48 },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              cursor: slot.available ? 'pointer' : 'not-allowed',
                              opacity: slot.available ? 1 : 0.5,
                              borderRadius: { xs: '8px', sm: '16px' },
                              '& .MuiChip-icon': {
                                fontSize: { xs: '1rem', sm: '1.25rem' }
                              },
                              '&:hover': {
                                backgroundColor: slot.available ? 'primary.light' : 'inherit'
                              },
                              transition: 'all 0.2s ease-in-out',
                              transform: selectedSlot?.label === slot.label ? 'scale(1.05)' : 'scale(1)',
                              border: selectedSlot?.label === slot.label ? '2px solid #1976d2' : '1px solid rgba(0, 0, 0, 0.23)',
                              boxShadow: selectedSlot?.label === slot.label ? '0 2px 10px rgba(25, 118, 210, 0.4)' : 'none',
                              fontWeight: selectedSlot?.label === slot.label ? 700 : 400
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Service Info */}
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 3 }}>
                  📍 We provide mobile service! Our team will come to your specified location at the scheduled time.
                </Alert>
              </Grid>
            </Grid>
          </LocalizationProvider>
        );

      case 4:
        return (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                label="Zip Code"
                value={formData.address.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, zipCode: e.target.value }
                })}
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={{ xs: 4, sm: 5 }}
                label="🐾👶 Special Requests & Notes"
                placeholder="Please let us know about any special requests:
• Pet hair cleaning 🐾
• Baby car seat cleaning 👶
• Specific stains or odors
• Access instructions
• Any other special requirements..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.emailReminders}
                    onChange={(e) => setFormData({ ...formData, emailReminders: e.target.checked })}
                    sx={{
                      '& .MuiSvgIcon-root': {
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Send me email reminders about this appointment
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        );

      case 5:
        return (
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: { xs: '12px', sm: '16px' } }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.125rem', sm: '1.25rem' }
                  }}>
                    📋 Booking Summary
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Services:
                      </Typography>
                      <Box sx={{ textAlign: 'right', maxWidth: '60%' }}>
                        {formData.selectedServices.map((service, idx) => (
                          <Typography key={idx} variant="body1" sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            mb: idx < formData.selectedServices.length - 1 ? 0.5 : 0
                          }}>
                            {service.name} ({serviceCategories[service.category].name})
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Vehicle Type:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        textAlign: 'right',
                        maxWidth: '60%'
                      }}>
                        {formData.vehicleType === 'small' ? '🚗 Small Car' : 
                         formData.vehicleType === 'suv' ? '🚙 SUV' : 
                         formData.vehicleType === 'threeRow' ? '🚐 3-Row Seating' : 
                         'Not selected'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Vehicle:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        textAlign: 'right',
                        maxWidth: '60%'
                      }}>
                        {vehicles.find(v => v.id === formData.vehicleId) ? 
                          `${vehicles.find(v => v.id === formData.vehicleId).year} ${vehicles.find(v => v.id === formData.vehicleId).make} ${vehicles.find(v => v.id === formData.vehicleId).model}` : 
                          'Not selected'}
                      </Typography>
                    </Box>
                    
                    {formData.vehiclePhone && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, display: 'flex', alignItems: 'center' }}>
                          <Phone fontSize="small" sx={{ mr: 0.5, color: '#0891b2' }} />
                          Vehicle Phone:
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          textAlign: 'right',
                          maxWidth: '60%'
                        }}>
                          {formData.vehiclePhone}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Date:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        textAlign: 'right'
                      }}>
                        {formData.date?.format('MMMM DD, YYYY')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Time:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        textAlign: 'right'
                      }}>
                        {formData.timeSlot || 'Not selected'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Location:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        textAlign: 'right',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        maxWidth: '60%',
                        lineHeight: 1.4
                      }}>
                        {formData.address.street}<br />
                        {formData.address.city}, {formData.address.state} {formData.address.zipCode}
                      </Typography>
                    </Box>
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Total Service Price:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}>
                        ${formData.estimatedPrice}
                      </Typography>
                    </Box>
                    
                    {/* Payment Structure Information */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        color: '#1976d2', 
                        mb: 2,
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}>
                        💳 Payment Required
                      </Typography>
                      
                      {/* Online Deposit */}
                      <Box sx={{ 
                        bgcolor: '#e3f2fd', 
                        p: { xs: 1.5, sm: 2 }, 
                        borderRadius: { xs: '8px', sm: '12px' },
                        border: '1px solid #bbdefb',
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 600, 
                            color: '#1976d2',
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}>
                            Online Deposit ($50)
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 'bold', 
                          color: '#1976d2',
                          fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }}>
                          ${formatCurrency(calculateDepositAmount(formData.estimatedPrice))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          Secure payment processed through Stripe
                        </Typography>
                      </Box>

                    </Box>
                    
                    {paymentResult && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        ✅ Payment successful! Payment ID: {paymentResult.id}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {!paymentResult ? (
                <DepositPayment
                  servicePrice={formData.estimatedPrice}
                  servicePackage={formData.selectedServices.map(s => `${s.name} (${serviceCategories[s.category].name})`).join(', ')}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  customerName={currentUser?.displayName || currentUser?.email || 'Customer'}
                  customerEmail={currentUser?.email || ''}
                />
              ) : (
              <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
                      Payment Completed! 
                  </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Your deposit has been processed successfully and your appointment is being booked automatically.
                    </Typography>
                    <Alert severity="success">
                      ✅ Appointment booking in progress... You'll be redirected shortly!
                    </Alert>
                </CardContent>
              </Card>
              )}
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  if (success) {
    return (
      <ClientLayout>
        <Box sx={{ 
          maxWidth: 600, 
          mx: 'auto', 
          mt: 8,
          p: 6, 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <CheckCircle sx={{ 
            fontSize: 100, 
            color: '#22c55e', 
            mb: 3,
            filter: 'drop-shadow(0 4px 8px rgba(34, 197, 94, 0.3))'
          }} />
          
          <Typography variant="h3" gutterBottom sx={{ 
            fontWeight: 700, 
            color: '#1f2937',
            mb: 2
          }}>
            🎉 Booking Confirmed!
          </Typography>
          
          <Typography variant="h6" sx={{ 
            color: '#6b7280',
            mb: 3,
            fontWeight: 500
          }}>
            Your appointment request has been successfully submitted.
          </Typography>
          
          <Typography variant="body1" sx={{ 
            mb: 4,
            color: '#374151',
            lineHeight: 1.6
          }}>
            Your deposit has been processed and your appointment is pending approval. Our team will review and confirm your booking shortly. You'll receive a notification once confirmed.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/appointments')}
            sx={{
              background: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5
            }}
          >
            View My Appointments
          </Button>
        </Box>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
        {/* Modern Header */}
        <Box sx={{ 
          mb: 8,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.875rem', md: '2.25rem' },
              color: '#1e293b',
              mb: 2,
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Book Your Service
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#64748b',
              fontWeight: 400,
              fontSize: '1.125rem',
              mb: 4
            }}
          >
            Premium car care at your location
          </Typography>

          {/* Modern Progress Steps - Mobile Responsive */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            px: { xs: 1, sm: 0 }
          }}>
            {steps.map((label, index) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    borderRadius: { xs: '8px', sm: '12px' },
                    background: index <= activeStep 
                      ? 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)'
                      : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: index <= activeStep ? '#1e293b' : '#94a3b8',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    transition: 'all 0.3s',
                    boxShadow: index <= activeStep ? '0 4px 12px rgba(234, 179, 8, 0.3)' : 'none'
                  }}
                >
                  {index + 1}
                </Box>
                {index < steps.length - 1 && (
                  <Box 
                    sx={{
                      width: { xs: 16, sm: 24, md: 48 },
                      height: 2,
                      background: index < activeStep 
                        ? 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)'
                        : '#e2e8f0',
                      mx: { xs: 0.5, sm: 1 },
                      borderRadius: 1
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
          
          {/* Step Labels - Hidden on mobile for space */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            justifyContent: 'center', 
            gap: 4, 
            mt: 2 
          }}>
            {steps.map((label, index) => (
              <Typography 
                key={label}
                variant="caption" 
                sx={{ 
                  color: index <= activeStep ? '#1e293b' : '#94a3b8',
                  fontWeight: index === activeStep ? 600 : 400,
                  fontSize: '0.75rem'
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>
          
          {/* Current Step Label - Visible on mobile */}
          <Box sx={{ display: { xs: 'block', sm: 'none' }, textAlign: 'center', mt: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              Step {activeStep + 1}: {steps[activeStep]}
            </Typography>
          </Box>
        </Box>

        {/* Modern Step Content */}
        <Box sx={{ 
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          p: { xs: 4, md: 6 },
          mb: 4,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
        }}>

        {/* Loading overlay */}
        {loading && <FormLoadingOverlay message="Processing your booking..." />}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        {/* Navigation Buttons - Modernos como en la imagen */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          gap: 2
        }}>
          <Button
            onClick={handleBack}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: '12px',
              borderColor: '#cbd5e1',
              color: '#475569',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              py: 1.5,
              px: 4,
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: '#f8fafc'
              }
            }}
          >
            {activeStep === 0 ? 'Back to Dashboard' : 'Back'}
          </Button>
          
          {activeStep === steps.length - 1 ? (
            paymentResult ? (
              <Button
                variant="contained"
                disabled={true}
                size="large"
                sx={{
                  borderRadius: '12px',
                  background: '#10b981',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  py: 1.5,
                  px: 4,
                  opacity: 0.8,
                  '&:hover': {
                    background: '#059669'
                  }
                }}
              >
                {loading ? '🔄 Booking Appointment...' : '✅ Appointment Booked!'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                disabled={true}
                size="large"
                sx={{
                  borderRadius: '12px',
                  borderColor: '#1e40af',
                  color: '#1e40af',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  py: 1.5,
                  px: 4,
                  opacity: 0.6
                }}
              >
                💳 Complete Payment to Book
              </Button>
            )
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              size="large"
              disabled={
                (activeStep === 0 && formData.selectedServices.length === 0) ||
                (activeStep === 1 && !formData.vehicleType) ||
                (activeStep === 2 && currentUser && !formData.vehicleId) ||
                (activeStep === 2 && !currentUser && (!formData.customerName?.trim() || !formData.customerEmail?.trim() || !formData.customerPhone?.trim())) ||
                (activeStep === 3 && (!formData.date || !formData.timeSlot)) ||
                (activeStep === 4 && (!formData.address.street?.trim() || !formData.address.city?.trim() || !formData.address.state?.trim() || !formData.address.zipCode?.trim()))
              }
              sx={{
                borderRadius: '12px',
                background: '#1e40af',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                py: 1.5,
                px: 4,
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                '&:hover': {
                  background: '#1e3a8a',
                  boxShadow: '0 6px 16px rgba(30, 64, 175, 0.4)'
                },
                '&:disabled': {
                  background: '#cbd5e1',
                  color: '#64748b'
                }
              }}
            >
              Next
            </Button>
          )}
        </Box>
        </Box>
    </ClientLayout>
  );
};

export default BookAppointment;
