import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Paper,
  Avatar
} from '@mui/material';
import {
  Star,
  Schedule,
  LocationOn,
  CheckCircle,
  Phone,
  CalendarToday
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedSection from '../Animations/AnimatedSection';
import AnimatedCard from '../Animations/AnimatedCard';
import AnimatedButton from '../Animations/AnimatedButton';

const Home = () => {
  const services = [
    {
      title: 'Interior Detailing',
      description: 'Deep cleaning, steam treatment, and protection for your vehicle\'s interior',
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop',
      features: ['Steam Cleaning', 'Vacuuming', 'Leather Treatment', 'Odor Removal']
    },
    {
      title: 'Exterior Detailing',
      description: 'Complete exterior care including washing, polishing, and protection',
      image: 'https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=400&h=250&fit=crop',
      features: ['Hand Wash', 'Paint Correction', 'Wax/Sealant', 'Tire Shine']
    },
    {
      title: 'Ceramic Coating',
      description: 'Long-lasting protection with enhanced gloss and hydrophobic properties',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=250&fit=crop',
      features: ['Paint Protection', '2-5 Year Warranty', 'Hydrophobic', 'Enhanced Gloss']
    }
  ];

  const packages = [
    {
      name: 'Silver Package',
      price: '$89',
      duration: '2-3 hours',
      services: ['Exterior wash', 'Interior vacuum', 'Dashboard wipe', 'Window cleaning']
    },
    {
      name: 'Gold Package',
      price: '$149',
      duration: '3-4 hours',
      services: ['Everything in Silver', 'Paint decontamination', 'Interior deep clean', 'Tire dressing']
    },
    {
      name: 'Diamond Package',
      price: '$249',
      duration: '4-6 hours',
      services: ['Everything in Gold', 'Paint correction', 'Ceramic coating', 'Leather conditioning']
    }
  ];

  const testimonials = [
    {
      name: 'Maria Rodriguez',
      rating: 5,
      comment: 'Exceptional service! My car looks brand new. The mobile service is so convenient.',
      location: 'Miami, FL'
    },
    {
      name: 'James Wilson',
      rating: 5,
      comment: 'Professional team, attention to detail is amazing. Highly recommend!',
      location: 'Orlando, FL'
    },
    {
      name: 'Sarah Chen',
      rating: 5,
      comment: 'Best car detailing service I\'ve ever used. The ceramic coating is incredible.',
      location: 'Tampa, FL'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box className="hero-section">
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center" sx={{ minHeight: '70vh' }}>
            <Grid item xs={12} md={6}>
              <AnimatedSection direction="left" delay={0.2}>
                <Stack spacing={3}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Chip 
                      label="🚗 Mobile Car Detailing" 
                      sx={{ 
                        alignSelf: 'flex-start',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600
                      }} 
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                  >
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                        lineHeight: 1.2
                      }}
                    >
                      Premium Auto Care
                      <br />
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                        style={{
                          color: '#FFD700',
                          fontWeight: 700,
                          fontSize: 'inherit',
                          display: 'inline-block'
                        }}
                      >
                        Delivered
                      </motion.span>
                    </Typography>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                  >
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        opacity: 0.9,
                        fontWeight: 300,
                        maxWidth: '500px'
                      }}
                    >
                      Professional mobile detailing services that bring showroom quality results to your location.
                    </Typography>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
                      <AnimatedButton variant="glow">
                        <Button
                          component={Link}
                          to="/book-appointment"
                          variant="contained"
                          size="large"
                          startIcon={<CalendarToday />}
                          sx={{
                            bgcolor: '#FFD700',
                            color: '#000',
                            fontWeight: 600,
                            px: 4,
                            py: 1.5,
                            '&:hover': { bgcolor: '#FFC107' }
                          }}
                        >
                          Book Now
                        </Button>
                      </AnimatedButton>
                      
                      <AnimatedButton variant="float">
                        <Button
                          component={Link}
                          to="/estimate"
                          variant="outlined"
                          size="large"
                          startIcon={<Phone />}
                          sx={{
                            color: 'white',
                            borderColor: 'white',
                            fontWeight: 600,
                            px: 4,
                            py: 1.5,
                            '&:hover': { 
                              borderColor: '#FFD700',
                              bgcolor: 'rgba(255,215,0,0.1)'
                            }
                          }}
                        >
                          Get Estimate
                        </Button>
                      </AnimatedButton>
                    </Stack>
                  </motion.div>
                </Stack>
              </AnimatedSection>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <AnimatedSection direction="right" delay={0.4}>
                <Box
                  sx={{
                    position: 'relative',
                    textAlign: 'center'
                  }}
                >
                  <motion.img
                    src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&h=400&fit=crop"
                    alt="Premium Car Detailing"
                    style={{
                      width: '100%',
                      maxWidth: '500px',
                      borderRadius: '20px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }}
                    initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    whileHover={{ 
                      scale: 1.05, 
                      rotateY: -5,
                      transition: { duration: 0.3 }
                    }}
                    className="animate-float"
                  />
                </Box>
              </AnimatedSection>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Why Choose Poveda Premium?
        </Typography>
        <Typography variant="h6" align="center" sx={{ color: 'text.secondary', mb: 6 }}>
          Experience the difference with our professional mobile car detailing
        </Typography>
        
        <Grid container spacing={4}>
          {[
            {
              icon: <LocationOn sx={{ fontSize: 40, color: '#1976d2' }} />,
              title: 'Mobile Service',
              description: 'We come to your location - home, office, or anywhere convenient for you'
            },
            {
              icon: <Schedule sx={{ fontSize: 40, color: '#1976d2' }} />,
              title: 'Flexible Scheduling',
              description: 'Book appointments that fit your schedule, including weekends and evenings'
            },
            {
              icon: <Star sx={{ fontSize: 40, color: '#1976d2' }} />,
              title: 'Premium Quality',
              description: 'Professional-grade products and techniques for showroom-quality results'
            },
            {
              icon: <CheckCircle sx={{ fontSize: 40, color: '#1976d2' }} />,
              title: 'Satisfaction Guarantee',
              description: '100% satisfaction guarantee on all our services and workmanship'
            }
          ].map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  height: '100%',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'translateY(-8px)' }
                }}
              >
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

      {/* Services Section */}
      <Box sx={{ bgcolor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Our Services
          </Typography>
          <Typography variant="h6" align="center" sx={{ color: 'text.secondary', mb: 6 }}>
            Comprehensive car care solutions for every need
          </Typography>
          
          <Grid container spacing={4}>
            {services.map((service, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  className="service-card"
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={service.image}
                    alt={service.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      {service.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {service.description}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {service.features.map((feature, idx) => (
                        <Chip 
                          key={idx}
                          label={feature} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Packages Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
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
                  border: index === 1 ? '2px solid #1976d2' : 'none',
                  transform: index === 1 ? 'scale(1.05)' : 'none'
                }}
              >
                {index === 1 && (
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
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                    {pkg.name}
                  </Typography>
                  <Typography variant="h3" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
                    {pkg.price}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {pkg.duration}
                  </Typography>
                  <Box sx={{ mt: 3, mb: 3 }}>
                    {pkg.services.map((service, idx) => (
                      <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                        ✓ {service}
                      </Typography>
                    ))}
                  </Box>
                  <Button
                    component={Link}
                    to="/book-appointment"
                    variant={index === 1 ? "contained" : "outlined"}
                    fullWidth
                    size="large"
                    sx={{ mt: 2 }}
                  >
                    Book {pkg.name}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials Section */}
      <Box sx={{ bgcolor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            What Our Clients Say
          </Typography>
          <Typography variant="h6" align="center" sx={{ color: 'text.secondary', mb: 6 }}>
            Real reviews from satisfied customers
          </Typography>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%', p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {testimonial.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.location}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} sx={{ color: '#FFD700', fontSize: 20 }} />
                    ))}
                  </Box>
                  <Typography variant="body2">
                    "{testimonial.comment}"
                  </Typography>
                </Card>
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
                Ready to Experience Premium Care?
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Book your appointment today and see why thousands of customers trust us with their vehicles.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
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
                    '&:hover': { bgcolor: '#FFC107' }
                  }}
                >
                  Book Appointment
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  size="large"
                  fullWidth
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': { borderColor: '#FFD700', bgcolor: 'rgba(255,215,0,0.1)' }
                  }}
                >
                  Create Account
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
