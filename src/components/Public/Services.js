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
  ListItemText,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Star,
  Schedule,
  LocationOn,
  DirectionsCar
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
      name: 'Silver Package',
      subtitle: 'Interior Maintenance',
      price: '$89',
      duration: '2-3 hours',
      description: 'Perfect for regular maintenance and basic care',
      features: [
        'Complete exterior hand wash',
        'Interior vacuuming',
        'Dashboard and console wipe down',
        'Window cleaning (interior & exterior)',
        'Tire shine application',
        'Basic interior protection'
      ],
      popular: false
    },
    {
      name: 'Gold Package',
      subtitle: 'Deep Interior Cleaning',
      price: '$149',
      duration: '3-4 hours',
      description: 'Comprehensive cleaning for optimal results',
      features: [
        'Everything in Silver Package',
        'Paint decontamination',
        'Interior deep cleaning',
        'Carpet and upholstery shampooing',
        'Leather conditioning',
        'Paint sealant application',
        'Wheel and tire deep clean'
      ],
      popular: true
    },
    {
      name: 'Diamond Package',
      subtitle: 'Extreme Interior Restoration',
      price: '$249',
      duration: '4-6 hours',
      description: 'Ultimate care for maximum protection and shine',
      features: [
        'Everything in Gold Package',
        'Paint correction and polishing',
        'Ceramic coating application',
        'Complete interior restoration',
        'Engine bay cleaning',
        '6-month protection guarantee',
        'Premium aftercare kit included'
      ],
      popular: false
    }
  ];

  const additionalServices = [
    {
      name: 'Ceramic Coating',
      price: 'From $299',
      description: '2-5 year paint protection with hydrophobic properties'
    },
    {
      name: 'Paint Correction',
      price: 'From $199',
      description: 'Professional scratch and swirl mark removal'
    },
    {
      name: 'Headlight Restoration',
      price: '$79',
      description: 'Restore clarity and improve night driving safety'
    },
    {
      name: 'Engine Bay Cleaning',
      price: '$59',
      description: 'Deep cleaning and protection for your engine compartment'
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
