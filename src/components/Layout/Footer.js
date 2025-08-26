import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider
} from '@mui/material';
import {
  Facebook,
  Instagram,
  Twitter,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1a1a1a',
        color: 'white',
        pt: 6,
        pb: 3,
        mt: 8
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <img 
                src="/logo.svg" 
                alt="POVEDA PREMIUM AUTO CARE" 
                style={{ height: 40, marginRight: 12, filter: 'brightness(0) invert(1)' }} 
              />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              POVEDA PREMIUM AUTO CARE
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#cccccc' }}>
              Professional mobile car detailing services bringing premium care 
              directly to your location. Expert protection for your investment.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: '#4267B2' }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: '#E4405F' }}>
                <Instagram />
              </IconButton>
              <IconButton sx={{ color: '#1DA1F2' }}>
                <Twitter />
              </IconButton>
            </Box>
          </Grid>

          {/* Services */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Services
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/services" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                Interior Detailing
              </Link>
              <Link href="/services" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                Exterior Detailing
              </Link>
              <Link href="/services" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                Ceramic Coating
              </Link>
              <Link href="/services" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                Paint Protection
              </Link>
              <Link href="/services" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                Mobile Service
              </Link>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                Home
              </Link>
              <Link href="/about" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                About Us
              </Link>
              <Link href="/book-appointment" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                Book Now
              </Link>
              <Link href="/estimate" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                Get Estimate
              </Link>
              <Link href="/contact" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
                Contact
              </Link>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Contact Info
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ color: '#1976d2' }} />
                <Typography variant="body2" sx={{ color: '#cccccc' }}>
                  {process.env.REACT_APP_SUPPORT_PHONE || '(614) 653-5882'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ color: '#1976d2' }} />
                <Typography variant="body2" sx={{ color: '#cccccc' }}>
                  {process.env.REACT_APP_SUPPORT_EMAIL || 'support@povedapremiumautocare.com'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ color: '#1976d2' }} />
                <Typography variant="body2" sx={{ color: '#cccccc' }}>
                  4529 Parkwick Dr, Columbus, OH 43228
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Business Hours
              </Typography>
              <Typography variant="body2" sx={{ color: '#cccccc' }}>
                Regular: Monday–Sunday, 7:00 a.m. – 6:00 p.m.<br />
                Summer: Monday–Sunday, 7:00 a.m. – 9:00 p.m.<br />
                Customer Service Phone Support 24/7
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, bgcolor: '#333' }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ color: '#cccccc' }}>
            © 2024 POVEDA PREMIUM AUTO CARE. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="#" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
              Privacy Policy
            </Link>
            <Link href="#" color="inherit" underline="hover" sx={{ color: '#cccccc' }}>
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
