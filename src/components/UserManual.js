import React, { useState } from 'react';
import {
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import {
  HelpOutline,
  Close,
  ExpandMore,
  CalendarToday,
  DirectionsCar,
  RequestQuote,
  SupportAgent,
  Notifications,
  AccountCircle,
  Dashboard,
  Assignment,
  People,
  BarChart,
  Email,
  Settings,
  CheckCircle,
  Schedule,
  Cancel,
  Payment,
  AttachMoney,
  Description,
  Star
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const UserManual = () => {
  const { currentUser, userRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Determinar si el usuario es admin
  const isAdmin = userRole === 'admin';

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleTabChange = (event, newValue) => setTabValue(newValue);

  // Manual para CLIENTES
  const clientSections = [
    {
      title: '🏠 Dashboard',
      icon: <Dashboard />,
      items: [
        {
          subtitle: 'Vista General',
          description: 'El dashboard muestra un resumen de tus citas, estimados y estadísticas.',
          steps: [
            'Ver el número total de citas programadas',
            'Revisar citas ',
            
            'Acceder rápidamente a las próximas citas'
          ]
        },
        {
          subtitle: 'Clima',
          description: 'Widget de clima que muestra las condiciones actuales para planificar tu servicio.',
          steps: [
            'Temperatura y condiciones actuales',
            'Recomendaciones para el servicio según el clima'
          ]
        }
      ]
    },
    {
      title: '📅 Agendar Cita',
      icon: <CalendarToday />,
      items: [
        {
          subtitle: 'Cómo Reservar',
          description: 'Proceso completo para agendar un servicio de detailing.',
          steps: [
            'Click en "Agendar Cita" en el menú lateral',
            'Selecciona el tipo de servicio (Exterior, Interior, Completo, etc.)',
            'Elige la fecha y hora disponible',
            'Ingresa la dirección donde se realizará el servicio',
            'Selecciona o agrega un vehículo de tu garaje',
            'Agrega notas especiales si es necesario',
            'Revisa el precio estimado',
            'Realiza el pago del depósito ($50)',
            'Recibe confirmación por email'
          ]
        },
        {
          subtitle: 'Métodos de Pago',
          description: 'Opciones disponibles para pagar tu depósito.',
          steps: [
            '💳 Tarjeta de Crédito/Débito (Stripe) - Instantáneo',
            '📱 Zelle - Sube comprobante de pago',
            '💵 Cash App - Sube comprobante de pago (Próximamente)',
            'El saldo restante se paga al completar el servicio'
          ]
        }
      ]
    },
    {
      title: '📋 Mis Citas',
      icon: <Assignment />,
      items: [
        {
          subtitle: 'Gestionar Citas',
          description: 'Ver y administrar todas tus citas programadas.',
          steps: [
            'Ver lista completa de citas (pasadas y futuras)',
          
            'Ver detalles completos de cada cita',
            'Cancelar citas si es necesario (no permitido 24 horas antes de la cita)',
            'Descargar recibo de pago',
           
          ]
        },
        {
          subtitle: 'Estados de Cita',
          description: 'Significado de cada estado.',
          steps: [
            
            '🟢 Aprobada: Confirmada, el equipo llegará a la hora programada',
            
            '🔴 Cancelada: Cita cancelada por ti o el administrador',
            
          ]
        }
      ]
    },
    {
      title: '💰 Solicitar Estimado',
      icon: <RequestQuote />,
      items: [
        {
          subtitle: 'Obtener Cotización',
          description: 'Solicita un estimado personalizado para servicios especiales.',
          steps: [
            'Click en "Solicitar Estimado"',
            'Selecciona el tipo de servicio',
            'Describe detalladamente lo que necesitas',
            'Sube fotos del vehículo (opcional pero recomendado)',
            'Ingresa información del vehículo',
            'Envía la solicitud',
            'Recibe respuesta del administrador en 24-48 horas'
          ]
        },
        {
          subtitle: 'Seguimiento',
          description: 'Revisa el estado de tus estimados.',
          steps: [
            'Ver todos los estimados solicitados',
            'Estados: Pendiente, En Revisión, Aprobado, Rechazado',
            'Convertir estimado aprobado en cita',
            'Ver historial de comunicación'
          ]
        }
      ]
    },
    {
      title: '🚗 Mi Garaje',
      icon: <DirectionsCar />,
      items: [
        {
          subtitle: 'Gestionar Vehículos',
          description: 'Administra la información de tus vehículos.',
          steps: [
            'Agregar nuevos vehículos (marca, modelo, año, color)',
            'Editar información de vehículos existentes',
            'Eliminar vehículos que ya no tienes',
            'Ver historial de servicios por vehículo',
            'Seleccionar vehículo predeterminado para citas'
          ]
        }
      ]
    },
    {
      title: '🎫 Soporte',
      icon: <SupportAgent />,
      items: [
        {
          subtitle: 'Crear Ticket',
          description: 'Obtén ayuda del equipo de soporte.',
          steps: [
            'Click en "Soporte" en el menú',
            'Describe tu problema o pregunta',
            'Selecciona prioridad (Baja, Media, Alta)',
            'Adjunta capturas de pantalla si es necesario',
            'Envía el ticket',
            'Recibe respuesta por email y en el portal'
          ]
        },
        {
          subtitle: 'Seguimiento de Tickets',
          description: 'Revisa el estado de tus solicitudes.',
          steps: [
            'Ver todos tus tickets',
            'Estados: Abierto, En Progreso, Resuelto, Cerrado',
            'Agregar comentarios a tickets existentes',
            'Cerrar tickets resueltos'
          ]
        }
      ]
    },
    {
      title: '👤 Mi Perfil',
      icon: <AccountCircle />,
      items: [
        {
          subtitle: 'Actualizar Información',
          description: 'Mantén tu información personal actualizada.',
          steps: [
            'Editar nombre y apellido',
            'Actualizar número de teléfono',
            'Cambiar dirección predeterminada',
            'Actualizar foto de perfil',
            'Cambiar contraseña',
            'Configurar preferencias de notificaciones'
          ]
        }
      ]
    },
    {
      title: '🔔 Notificaciones',
      icon: <Notifications />,
      items: [
        {
          subtitle: 'Mantenerse Informado',
          description: 'Recibe actualizaciones importantes.',
          steps: [
            'Notificaciones cuando tu cita es aprobada',
           
            'Actualizaciones de estimados',
            'Respuestas a tickets de soporte',
            'Configurar preferencias de email'
          ]
        }
      ]
    }
  ];

  // Manual para ADMINISTRADORES
  const adminSections = [
    {
      title: '📊 Dashboard Administrativo',
      icon: <Dashboard />,
      items: [
        {
          subtitle: 'Métricas Principales',
          description: 'Vista general del negocio.',
          steps: [
            'Total de citas programadas',
            'Ingresos totales y por período',
            'Número de clientes activos',
            'Tickets de soporte pendientes',
            'Citas recientes y próximas',
            'Gráficos de rendimiento'
          ]
        }
      ]
    },
    {
      title: '📅 Gestión de Citas',
      icon: <Assignment />,
      items: [
        {
          subtitle: 'Aprobar/Rechazar Citas',
          description: 'Administra las solicitudes de citas de clientes.',
          steps: [
            'Ver todas las citas en una tabla filtrable',
            'Filtrar por estado, fecha, cliente',
            'Rechazar citas con motivo',
            'Marcar citas como completadas',
            'Ver información de pago',
            'Enviar notificaciones personalizadas'
          ]
        },
        {
          subtitle: 'Calendario',
          description: 'Vista de calendario para planificación.',
          steps: [
            'Ver citas en formato de calendario',
            'Identificar días ocupados',
            'Evitar sobrecarga de trabajo',
            'Planificar rutas eficientemente'
          ]
        }
      ]
    },
    {
      title: '💰 Gestión de Estimados',
      icon: <RequestQuote />,
      items: [
        {
          subtitle: 'Revisar Solicitudes',
          description: 'Procesa solicitudes de cotización.',
          steps: [
            'Ver todas las solicitudes de estimado',
            'Revisar fotos y descripción del cliente',
            'Establecer precio estimado',
            'Agregar notas internas',
            'Aprobar o rechazar estimado',
            
          ]
        }
      ]
    },
    {
      title: '👥 Gestión de Usuarios',
      icon: <People />,
      items: [
        {
          subtitle: 'Administrar Clientes',
          description: 'Ver y gestionar usuarios del sistema.',
          steps: [
            'Ver lista completa de usuarios',
            'Buscar por nombre o email',
            
            'Cambiar roles (Cliente/Admin)',
            'Desactivar cuentas si es necesario'
          ]
        }
      ]
    },
    {
      title: '🎫 Gestión de Tickets',
      icon: <SupportAgent />,
      items: [
        {
          subtitle: 'Soporte al Cliente',
          description: 'Responde a solicitudes de ayuda.',
          steps: [
            'Ver todos los tickets de soporte',
            'Filtrar por estado y prioridad',
           
            'Responder con comentarios',
            'Cambiar estado (Abierto → En Progreso → Resuelto)',
            'Cerrar tickets completados',
            'Ver historial completo de conversación'
          ]
        }
      ]
    },
    
    {
      title: '⏰ Gestión de Horarios',
      icon: <Schedule />,
      items: [
        {
          subtitle: 'Configurar Disponibilidad',
          description: 'Define cuándo puedes aceptar citas.',
          steps: [
            
            'Bloquear días específicos (vacaciones, feriados)',
      
            'Limitar número de citas por día'
          ]
        }
      ]
    },
    {
      title: '📈 Analíticas',
      icon: <BarChart />,
      items: [
        {
          subtitle: 'Reportes y Estadísticas',
          description: 'Analiza el rendimiento del negocio.',
          steps: [
            'Ingresos por período (día, semana, mes, año)',
            'Servicios más solicitados',
            'Clientes más frecuentes',
            'Tasa de conversión de estimados',
            'Tiempo promedio de respuesta',
            'Exportar reportes a Excel/PDF'
          ]
        }
      ]
    },
    {
      title: '⚙️ Configuración',
      icon: <Settings />,
      items: [
        {
          subtitle: 'Configuración del Sistema',
          description: 'Ajustes generales de la aplicación.',
          steps: [
            'Configurar información del negocio',
            
          ]
        }
      ]
    }
  ];

  const renderSection = (section) => (
    <Accordion key={section.title} sx={{ mb: 1, boxShadow: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white'
          }}>
            {section.icon}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {section.title}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        {section.items.map((item, idx) => (
          <Box key={idx} sx={{ mb: idx < section.items.length - 1 ? 3 : 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
              {item.subtitle}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              {item.description}
            </Typography>
            <List dense>
              {item.steps.map((step, stepIdx) => (
                <ListItem key={stepIdx} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle sx={{ fontSize: 20, color: '#4caf50' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={step}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { color: '#333' }
                    }}
                  />
                </ListItem>
              ))}
            </List>
            {idx < section.items.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );

  return (
    <>
      {/* Botón Flotante */}
      <Fab
        color="primary"
        aria-label="manual de usuario"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          boxShadow: '0 8px 24px rgba(25, 118, 210, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
            boxShadow: '0 12px 32px rgba(25, 118, 210, 0.5)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
      >
        <HelpOutline sx={{ fontSize: 28 }} />
      </Fab>

      {/* Dialog del Manual */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HelpOutline sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Manual de Usuario
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Guía completa de funcionalidades
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        {/* Mostrar tabs solo si es admin, si no, mostrar solo el contenido del cliente */}
        {isAdmin && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8f9fa' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '1rem',
                  py: 2
                }
              }}
            >
              <Tab
                icon={<AccountCircle />}
                iconPosition="start"
                label="Manual del Cliente"
              />
              <Tab
                icon={<Settings />}
                iconPosition="start"
                label="Manual del Administrador"
              />
            </Tabs>
          </Box>
        )}

        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          {/* Si es admin, mostrar tabs. Si es cliente, solo mostrar manual de cliente */}
          {!isAdmin ? (
            // Usuario normal - Solo manual de cliente
            <Box>
              <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1565c0' }}>
                  👋 Bienvenido al Portal de Clientes
                </Typography>
                <Typography variant="body2" sx={{ color: '#424242' }}>
                  Esta guía te ayudará a aprovechar al máximo todas las funcionalidades disponibles.
                  Explora cada sección para aprender cómo agendar citas, gestionar tu garaje, solicitar estimados y más.
                </Typography>
              </Paper>
              {clientSections.map(renderSection)}
            </Box>
          ) : (
            // Administrador - Mostrar ambos manuales con tabs
            <>
              {/* Tab Panel - Cliente */}
              {tabValue === 0 && (
                <Box>
                  <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1565c0' }}>
                      👋 Bienvenido al Portal de Clientes
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#424242' }}>
                      Esta guía te ayudará a aprovechar al máximo todas las funcionalidades disponibles.
                      Explora cada sección para aprender cómo agendar citas, gestionar tu garaje, solicitar estimados y más.
                    </Typography>
                  </Paper>
                  {clientSections.map(renderSection)}
                </Box>
              )}

              {/* Tab Panel - Administrador */}
              {tabValue === 1 && (
                <Box>
                  <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#e65100' }}>
                      🔧 Panel de Administración
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#424242' }}>
                      Como administrador, tienes acceso completo para gestionar citas, usuarios, estimados y configuraciones del sistema.
                      Esta guía cubre todas las herramientas disponibles para administrar eficientemente el negocio.
                    </Typography>
                  </Paper>
                  {adminSections.map(renderSection)}
                </Box>
              )}
            </>
          )}

          {/* Footer con información de contacto */}
          <Paper sx={{ p: 3, mt: 3, borderRadius: '16px', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#6a1b9a' }}>
              📞 ¿Necesitas más ayuda?
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#424242' }}>
              <strong>Email:</strong> support@povedapremiumautocare.com
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: '#424242' }}>
              <strong>Teléfono:</strong> (614) 653-5882
            </Typography>
            <Typography variant="body2" sx={{ color: '#424242' }}>
              <strong>Horario:</strong> Lunes a Sábado, 8:00 AM - 6:00 PM
            </Typography>
          </Paper>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManual;
