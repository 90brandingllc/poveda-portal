import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle,
  Star,
  Schedule,
  LocationOn,
  DirectionsCar,
  Payment,
  Info,
  CreditCard
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Services = () => {
  const serviceCategories = [
    {
      title: 'General Services',
      description: 'Essential car care services for everyday maintenance',
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=400&fit=crop',
      services: [
        'Mobile service - We come to you',
        'Protection against fading and UV damage',
        'Paint preservation and enhancement',
        'Scratch protection and minor correction',
        'Headlight restoration for improved visibility',
        'Removal of insect residues and bird droppings',
        'Interior air freshening for you and passengers'
      ]
    },
    {
      title: 'Interior Services',
      description: 'Deep cleaning and restoration of your vehicle\'s interior',
      image: 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=600&h=400&fit=crop',
      services: [
        'Steam cleaning & decontamination',
        'Thorough vacuuming of all surfaces',
        'Panel & console care and protection',
        'Glass & mirror detailing',
        'Carpet & seat shampooing',
        'Surface restoration and conditioning',
        'Leather treatment and protection'
      ]
    },
    {
      title: 'Exterior Services',
      description: 'Complete exterior care for showroom-quality results',
      image: 'https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=600&h=400&fit=crop',
      services: [
        'Hand wash & dirt removal',
        'Insect and bug splatter removal',
        'Door jamb and edge cleaning',
        'Exterior window & mirror cleaning',
        'Restoration of faded plastic trim',
        'Professional polishing & ceramic coating',
        'Tire and wheel detailing'
      ]
    }
  ];

  const packages = [
    {
      name: 'Silver Interior',
      subtitle: 'Interior Maintenance',
      price: '$75-95',
      duration: '2-3 hours',
      description: 'Perfect for keeping your vehicle clean and presentable on a daily basis',
      features: [
        'Air blow to remove dust and dirt',
        'Full interior vacuuming',
        'Plastic shine treatment',
        'Carpet mat cleaning',
        'Trunk cleaning',
        'Interior glass and mirror cleaning'
      ],
      popular: false,
      note: 'Not suitable for vehicles in poor condition or with extreme dirt'
    },
    {
      name: 'Gold Interior',
      subtitle: 'Deep Interior Cleaning',
      price: '$145-185',
      duration: '3-4 hours',
      description: 'A complete cleaning to make your interior look like new',
      features: [
        'Deep cleaning of seats, carpets, headliner, and upholstery',
        'Cleaning of windows and door edges',
        'Use of extractor and steam as needed',
        'Plastic cleaning and conditioning with shine and UV protection',
        'Complimentary air freshener'
      ],
      popular: true
    },
    {
      name: 'Diamond Interior',
      subtitle: 'Extreme Interior Restoration',
      price: 'From $182',
      duration: '4-6 hours',
      description: 'Specially designed for vehicles with high level of dirt or challenging conditions',
      features: [
        'All services from the Gold Package',
        'Intensive treatment for stains and odors',
        'Deep decontamination and surface restoration',
        'Recommended for 50%+ stains, heavy pet hair, strong odors',
        'Full-vehicle extractor and/or steam cleaning'
      ],
      popular: false,
      note: 'Customized package - pricing depends on vehicle condition'
    },
    {
      name: 'Gold Exterior',
      subtitle: 'Exterior Maintenance',
      price: '$55-75',
      duration: '1-2 hours',
      description: 'Ideal for keeping your vehicle exterior clean, protected, and presentable',
      features: [
        'Full exterior wash using safe two-bucket method',
        'Wheel cleaning (good condition wheels)',
        'Tire cleaning and shine',
        'Wheel well cleaning',
        'Exterior glass and mirror cleaning',
        'Gas cap cleaning',
        'Hand-dry with premium microfiber towels'
      ],
      popular: true,
      note: 'Not suitable for vehicles with heavy contamination, tar, or stubborn stains'
    },
    {
      name: 'Step Polish',
      subtitle: 'Light Correction',
      price: '$200-250',
      duration: '3-4 hours',
      description: 'Light cleaning and correction to remove small imperfections and enhance shine',
      features: [
        '1 step of polishing with professional polisher',
        'Shine enhancement and removal of light scratches',
        'Ideal for maintenance and vehicles with minor surface wear'
      ],
      popular: false
    },
    {
      name: 'Gold Step Polish',
      subtitle: 'Deep Correction',
      price: '$280-350',
      duration: '4-5 hours',
      description: 'Deeper treatment to correct more noticeable defects and restore uniform finish',
      features: [
        '2 polishing steps to remove moderate scratches and oxidation',
        'Preparation for ceramic or sealant protection',
        'Enhanced shine and refined finish'
      ],
      popular: false
    },
    {
      name: 'Diamond Polish + Ceramic',
      subtitle: 'Maximum Protection & Shine',
      price: 'From $480',
      duration: '6-8 hours',
      description: 'Maximum protection and long-lasting shine with ceramic coating applied after polishing',
      features: [
        '2 polishing steps for deep correction',
        'Application of high-durability ceramic coating',
        'Protection against scratches, dirt, water, and environmental contaminants',
        'Intense shine and mirror-like finish',
        'Coating durability customizable from 1 to 5 years based on preference'
      ],
      popular: false
    }
  ];

  const additionalServices = [
    {
      name: 'Light Pet Hair Removal 🐾',
      price: '+$25',
      description: 'Professional removal of light pet hair from interior'
    },
    {
      name: 'Heavy Pet Hair Removal 🐾',
      price: '+$45',
      description: 'Intensive removal of heavy pet hair from all surfaces'
    },
    {
      name: 'Baby Car Seat Cleaning 👶',
      price: '+$25',
      description: 'Thorough cleaning and sanitizing of baby car seats'
    },
    {
      name: 'Paint Decontamination (Clay Bar)',
      price: '+$45',
      description: 'Removes embedded particles and surface contaminants'
    },
    {
      name: 'Headlight Restoration',
      price: '+$70',
      description: 'Restore clarity and improve night driving safety'
    },
    {
      name: 'Full Exterior Plastic Restoration',
      price: '+$20',
      description: 'Restore faded plastic trim to like-new condition'
    },
    {
      name: 'Engine Cleaning',
      price: '+$35',
      description: 'Additional service for combined interior & exterior packages only'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: 8
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 700 }}>
                Our Services
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
                Professional car detailing services designed to keep your vehicle looking and feeling like new.
              </Typography>
              <Button
                component={Link}
                to="/book-appointment"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: '#FFD700',
                  color: '#000',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': { bgcolor: '#FFC107' }
                }}
              >
                Book Service Now
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <img
                src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&h=400&fit=crop"
                alt="Professional Car Detailing"
                style={{
                  width: '100%',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Service Categories */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Service Categories
        </Typography>
        <Typography variant="h6" align="center" sx={{ color: 'text.secondary', mb: 6 }}>
          Comprehensive car care solutions for every need
        </Typography>

        <Grid container spacing={4}>
          {serviceCategories.map((category, index) => (
            <Grid item xs={12} key={index}>
              <Card sx={{ mb: 4 }}>
                <Grid container>
                  <Grid item xs={12} md={4}>
                    <CardMedia
                      component="img"
                      height="300"
                      image={category.image}
                      alt={category.title}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {category.title}
                      </Typography>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                        {category.description}
                      </Typography>
                      <List>
                        {category.services.map((service, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5 }}>
                            <ListItemIcon>
                              <CheckCircle sx={{ color: '#2e7d32' }} />
                            </ListItemIcon>
                            <ListItemText primary={service} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Payment Information Banner */}
      <Box sx={{ bgcolor: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', py: 4 }}>
        <Container maxWidth="lg">
          <Paper sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.95)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Info sx={{ mr: 2, color: '#1976d2', fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2' }}>
                Easy Payment Process
              </Typography>
            </Box>
            <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 3 }}>
              We've made booking and payment simple and secure
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <CreditCard sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Step 1: Book & Pay Online
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pay <strong>$50 deposit</strong> securely online when booking your appointment
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <DirectionsCar sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Step 2: Service Delivered
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Our team arrives at your location and completes the professional service
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* Service Packages */}
      <Box sx={{ bgcolor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Service Packages
          </Typography>
          <Typography variant="h6" align="center" sx={{ color: 'text.secondary', mb: 6 }}>
            Choose the perfect package for your vehicle's needs
          </Typography>

          <Grid container spacing={4}>
            {packages.map((pkg, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    position: 'relative',
                    border: pkg.popular ? '2px solid #1976d2' : 'none',
                    transform: pkg.popular ? 'scale(1.05)' : 'none'
                  }}
                >
                  {pkg.popular && (
                    <Chip 
                      label="Most Popular"
                      color="primary"
                      sx={{ 
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 600
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                      {pkg.name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {pkg.subtitle}
                    </Typography>
                    <Typography variant="h3" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
                      {pkg.price}
                    </Typography>
                    
                    {/* Payment Info */}
                    <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Payment sx={{ mr: 1, color: '#1976d2', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          Payment Structure
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CreditCard sx={{ mr: 1, color: '#4caf50', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          <strong>$50 deposit</strong> - Paid online when booking
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {pkg.duration}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {pkg.description}
                    </Typography>
                    <List dense>
                      {pkg.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      component={Link}
                      to="/book-appointment"
                      variant={pkg.popular ? "contained" : "outlined"}
                      fullWidth
                      size="large"
                      sx={{ mt: 3 }}
                    >
                      Choose {pkg.name}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Additional Services */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Additional Services
        </Typography>
        <Typography variant="h6" align="center" sx={{ color: 'text.secondary', mb: 6 }}>
          Specialized treatments for enhanced protection and appearance
        </Typography>

        <Grid container spacing={3}>
          {additionalServices.map((service, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {service.name}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    {service.price}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {service.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Why Choose Us */}
      <Box sx={{ bgcolor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 600, mb: 6 }}>
            Why Choose POVEDA?
          </Typography>
          
          <Grid container spacing={4}>
            {[
              {
                icon: <LocationOn sx={{ fontSize: 40, color: '#1976d2' }} />,
                title: 'Mobile Convenience',
                description: 'We come to you - home, office, or anywhere convenient'
              },
              {
                icon: <Star sx={{ fontSize: 40, color: '#1976d2' }} />,
                title: 'Premium Quality',
                description: 'Professional-grade products and techniques for superior results'
              },
              {
                icon: <CheckCircle sx={{ fontSize: 40, color: '#1976d2' }} />,
                title: 'Satisfaction Guaranteed',
                description: '100% satisfaction guarantee on all services'
              },
              {
                icon: <DirectionsCar sx={{ fontSize: 40, color: '#1976d2' }} />,
                title: 'Expert Technicians',
                description: 'Trained professionals with years of detailing experience'
              }
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
                Ready to Transform Your Vehicle?
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Experience the POVEDA difference with our premium mobile car detailing services.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                component={Link}
                to="/book-appointment"
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  bgcolor: '#FFD700',
                  color: '#000',
                  fontWeight: 600,
                  py: 2,
                  '&:hover': { bgcolor: '#FFC107' }
                }}
              >
                Book Your Service Today
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Services;

