import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  Avatar,
  Paper
} from '@mui/material';
import {
  Star,
  CheckCircle,
  Schedule,
  LocationOn
} from '@mui/icons-material';

const About = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 600, mb: 6 }}>
        About POVEDA PREMIUM AUTO CARE
      </Typography>

      <Grid container spacing={6} alignItems="center" sx={{ mb: 8 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
            Our Story
          </Typography>
          <Typography variant="body1" paragraph>
            Founded with a passion for automotive excellence, POVEDA PREMIUM AUTO CARE has been 
            providing top-tier mobile car detailing services for over a decade. We believe that 
            every vehicle deserves the finest care, and we're committed to delivering exceptional 
            results that exceed our customers' expectations.
          </Typography>
          <Typography variant="body1" paragraph>
            Our team of skilled professionals uses only the highest quality products and 
            state-of-the-art techniques to ensure your vehicle receives the premium treatment 
            it deserves. From basic maintenance to complete restoration, we bring showroom-quality 
            results directly to your location.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <img
            src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&h=400&fit=crop"
            alt="Professional Car Detailing"
            style={{
              width: '100%',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}
          />
        </Grid>
      </Grid>

      <Box sx={{ bgcolor: '#f8f9fa', py: 6, px: 4, borderRadius: 3, mb: 8 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Our Mission
        </Typography>
        <Typography variant="h6" align="center" sx={{ maxWidth: '800px', mx: 'auto', color: 'text.secondary' }}>
          To provide convenient, professional, and eco-friendly car detailing services that enhance 
          the appearance, value, and longevity of our customers' vehicles while delivering an 
          exceptional service experience.
        </Typography>
      </Box>

      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600, mb: 6 }}>
        Why Choose Us?
      </Typography>

      <Grid container spacing={4} sx={{ mb: 8 }}>
        {[
          {
            icon: <Star sx={{ fontSize: 40, color: '#FFD700' }} />,
            title: 'Premium Quality',
            description: 'We use only the finest products and proven techniques to deliver showroom-quality results every time.'
          },
          {
            icon: <LocationOn sx={{ fontSize: 40, color: '#1976d2' }} />,
            title: 'Mobile Convenience',
            description: 'Our fully equipped mobile units bring professional detailing services directly to your location.'
          },
          {
            icon: <CheckCircle sx={{ fontSize: 40, color: '#2e7d32' }} />,
            title: 'Satisfaction Guaranteed',
            description: 'We stand behind our work with a 100% satisfaction guarantee on all services.'
          },
          {
            icon: <Schedule sx={{ fontSize: 40, color: '#ed6c02' }} />,
            title: 'Flexible Scheduling',
            description: 'Book appointments that work with your schedule, including evenings and weekends.'
          }
        ].map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Experience the POVEDA Difference
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Join thousands of satisfied customers who trust us with their vehicle care needs.
        </Typography>
      </Paper>
    </Container>
  );
};

export default About;
