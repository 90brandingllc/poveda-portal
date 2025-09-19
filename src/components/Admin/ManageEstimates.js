import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Divider,
  Avatar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Stack
} from '@mui/material';
import {
  Visibility,
  Reply,
  CheckCircle,
  Cancel,
  Schedule,
  Email,
  Phone,
  Person,
  ArrowBack,
  Send,
  AdminPanelSettings,
  AutoFixHigh,
  AttachMoney
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  arrayUnion
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// OpenAI Integration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const ManageEstimates = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [estimates, setEstimates] = useState([]);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [improvingText, setImprovingText] = useState(false);
  const [tabValue, setTabValue] = useState(0);



  useEffect(() => {
    const estimatesQuery = query(
      collection(db, 'estimates'),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(estimatesQuery, (snapshot) => {
      const estimateData = [];
      snapshot.forEach((doc) => {
        estimateData.push({ id: doc.id, ...doc.data() });
      });
      setEstimates(estimateData);
    });

    return () => unsubscribe();
  }, []);

  const improveTextWithAI = async (text) => {
    if (!text.trim() || !OPENAI_API_KEY) {
      alert('Please enter some text first, or OpenAI API key is not configured.');
      return text;
    }

    setImprovingText(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a text enhancement assistant. Your ONLY job is to improve the given text by fixing grammar, enhancing clarity, and making it more professional. DO NOT add any greetings, signatures, templates, or extra content. ONLY return the enhanced version of the exact text provided, keeping the same meaning and structure.'
            },
            {
              role: 'user',
              content: `Enhance this text (return ONLY the enhanced version, no additional content): "${text}"`
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      let improvedText = data.choices[0]?.message?.content?.trim() || text;
      
      // Clean up any potential unwanted additions (remove common template phrases)
      const unwantedPhrases = [
        'Dear Customer,',
        'Dear Client,',
        'Thank you for your inquiry.',
        'Best regards,',
        'Sincerely,',
        'Please let me know if you have any questions.',
        'Looking forward to hearing from you.',
        'Have a great day!'
      ];
      
      // Remove unwanted phrases if they were added
      unwantedPhrases.forEach(phrase => {
        if (improvedText.includes(phrase) && !text.includes(phrase)) {
          improvedText = improvedText.replace(phrase, '').trim();
        }
      });
      
      // Remove extra line breaks and clean up
      improvedText = improvedText.replace(/\n\n+/g, '\n').trim();
      
      setReplyMessage(improvedText);
      return improvedText;
    } catch (error) {
      console.error('Error improving text:', error);
      alert('Failed to improve text. Please try again.');
      return text;
    } finally {
      setImprovingText(false);
    }
  };

  const handleStatusChange = async (estimateId, newStatus) => {
    try {
      await updateDoc(doc(db, 'estimates', estimateId), {
        status: newStatus,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedEstimate) return;

    setReplyLoading(true);
    try {
      const estimateRef = doc(db, 'estimates', selectedEstimate.id);
      
      const newMessage = {
        id: Date.now(),
        sender: 'admin',
        senderName: 'Admin Team',
        message: replyMessage,
        timestamp: new Date()
      };

      const updateData = {
        messages: arrayUnion(newMessage),
        lastUpdated: new Date(),
        status: selectedEstimate.status === 'pending' ? 'in-progress' : selectedEstimate.status
      };

      // If including a quote, update the quoted price
      if (quotedPrice.trim()) {
        updateData.quotedPrice = parseFloat(quotedPrice);
        updateData.status = 'quoted';
      }

      // Add admin notes if provided
      if (adminNotes.trim()) {
        updateData.adminNotes = adminNotes;
      }

      await updateDoc(estimateRef, updateData);

      setReplyMessage('');
      setQuotedPrice('');
      setAdminNotes('');
      
      // Update selected estimate to show new message immediately
      setSelectedEstimate({
        ...selectedEstimate,
        messages: [...(selectedEstimate.messages || []), newMessage],
        quotedPrice: quotedPrice ? parseFloat(quotedPrice) : selectedEstimate.quotedPrice,
        adminNotes: adminNotes || selectedEstimate.adminNotes
      });

    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send message. Please try again.');
    }
    setReplyLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ed6c02';
      case 'in-progress': return '#1976d2';
      case 'quoted': return '#2e7d32';
      case 'approved': return '#4caf50';
      case 'declined': return '#d32f2f';
      case 'completed': return '#9c27b0';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in-progress': return '💬';
      case 'quoted': return '💰';
      case 'approved': return '✅';
      case 'declined': return '❌';
      case 'completed': return '🎉';
      default: return '📄';
    }
  };

  const filterEstimatesByStatus = (status) => {
    switch (status) {
      case 'pending':
        return estimates.filter(est => est.status === 'pending');
      case 'in-progress':
        return estimates.filter(est => est.status === 'in-progress');
      case 'quoted':
        return estimates.filter(est => est.status === 'quoted');
      case 'completed':
        return estimates.filter(est => ['approved', 'completed'].includes(est.status));
      default:
        return estimates;
    }
  };

  const getFilteredEstimates = () => {
    switch (tabValue) {
      case 0: return estimates; // All
      case 1: return filterEstimatesByStatus('pending');
      case 2: return filterEstimatesByStatus('in-progress');
      case 3: return filterEstimatesByStatus('quoted');
      case 4: return filterEstimatesByStatus('completed');
      default: return estimates;
    }
  };

  // Statistics
  const stats = {
    total: estimates.length,
    pending: estimates.filter(est => est.status === 'pending').length,
    inProgress: estimates.filter(est => est.status === 'in-progress').length,
    quoted: estimates.filter(est => est.status === 'quoted').length,
    completed: estimates.filter(est => ['approved', 'completed'].includes(est.status)).length
  };

  return (
    <Box sx={{ px: isMobile ? 1 : 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header - Mobile Responsive */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: isMobile ? 2 : 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
            <IconButton 
              onClick={() => navigate('/admin/dashboard')}
              sx={{ 
                mr: 2,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography 
              variant={isMobile ? "h5" : "h3"} 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                mb: 0,
                fontSize: isMobile ? '1.5rem' : '3rem'
              }}
            >
              {isMobile ? '💰 Estimates' : '💰 Manage Estimates'}
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards - Mobile Responsive */}
        <Grid container spacing={isMobile ? 1.5 : 3} sx={{ mb: isMobile ? 2 : 4 }}>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                <Typography 
                  variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#1976d2',
                    fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2.125rem'
                  }}
                >
                  {stats.total}
                </Typography>
                <Typography 
                  variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
                  color="text.secondary"
                  sx={{ fontSize: isSmallMobile ? '0.7rem' : 'inherit' }}
                >
                  {isSmallMobile ? 'Total' : 'Total Estimates'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                <Typography 
                  variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#ed6c02',
                    fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2.125rem'
                  }}
                >
                  {stats.pending}
                </Typography>
                <Typography 
                  variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
                  color="text.secondary"
                  sx={{ fontSize: isSmallMobile ? '0.7rem' : 'inherit' }}
                >
                  {isSmallMobile ? 'Pending' : 'Pending Review'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                <Typography 
                  variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#1976d2',
                    fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2.125rem'
                  }}
                >
                  {stats.inProgress}
                </Typography>
                <Typography 
                  variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
                  color="text.secondary"
                  sx={{ fontSize: isSmallMobile ? '0.7rem' : 'inherit' }}
                >
                  {isSmallMobile ? 'Progress' : 'In Progress'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                <Typography 
                  variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#2e7d32',
                    fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2.125rem'
                  }}
                >
                  {stats.quoted}
                </Typography>
                <Typography 
                  variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
                  color="text.secondary"
                  sx={{ fontSize: isSmallMobile ? '0.7rem' : 'inherit' }}
                >
                  Quoted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={8} sm={4} md={2.4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: isMobile ? 1 : 2,
                px: isMobile ? 1 : 2,
                '&:last-child': { pb: isMobile ? 1 : 2 }
              }}>
                <Typography 
                  variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#9c27b0',
                    fontSize: isSmallMobile ? '1.25rem' : isMobile ? '1.5rem' : '2.125rem'
                  }}
                >
                  {stats.completed}
                </Typography>
                <Typography 
                  variant={isSmallMobile ? "caption" : isMobile ? "body2" : "body2"} 
                  color="text.secondary"
                  sx={{ fontSize: isSmallMobile ? '0.7rem' : 'inherit' }}
                >
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Tabs - Mobile Responsive */}
        <Paper sx={{ mb: isMobile ? 2 : 3, overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile={isMobile}
            sx={{
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: isSmallMobile ? '0.65rem' : isMobile ? '0.75rem' : '0.875rem',
                minWidth: isSmallMobile ? 70 : isMobile ? 90 : 'auto',
                padding: isSmallMobile ? '4px 6px' : isMobile ? '6px 8px' : '12px 16px',
                minHeight: isSmallMobile ? 36 : 48
              },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3
                }
              }
            }}
          >
            <Tab label={isSmallMobile ? `All (${stats.total})` : `All (${stats.total})`} />
            <Tab label={isSmallMobile ? `Pend (${stats.pending})` : isMobile ? `Pending (${stats.pending})` : `Pending (${stats.pending})`} />
            <Tab label={isSmallMobile ? `Prog (${stats.inProgress})` : isMobile ? `Progress (${stats.inProgress})` : `In Progress (${stats.inProgress})`} />
            <Tab label={isSmallMobile ? `Quote (${stats.quoted})` : `Quoted (${stats.quoted})`} />
            <Tab label={isSmallMobile ? `Done (${stats.completed})` : `Completed (${stats.completed})`} />
          </Tabs>
        </Paper>

        {/* Estimates Display - Mobile Responsive */}
        <Paper>
          {isMobile ? (
            // Mobile Card View
            <Box sx={{ p: 2 }}>
              {getFilteredEstimates().length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                    No estimates found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    {tabValue === 0 ? 'No estimates have been submitted yet.' : 'No estimates match the current filter.'}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {getFilteredEstimates().map((estimate) => (
                    <Card 
                      key={estimate.id} 
                      variant="outlined" 
                      sx={{ 
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                          borderColor: '#1976d2'
                        }
                      }}
                      onClick={() => {
                        setSelectedEstimate(estimate);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                        {/* Project & Client Info */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                          <Avatar sx={{ 
                            bgcolor: 'primary.main', 
                            mr: isSmallMobile ? 1 : 1.5, 
                            width: isSmallMobile ? 28 : 32, 
                            height: isSmallMobile ? 28 : 32,
                            fontSize: isSmallMobile ? '0.75rem' : '0.875rem'
                          }}>
                            {estimate.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant={isSmallMobile ? "body2" : "subtitle1"} 
                              sx={{ 
                                fontWeight: 'bold', 
                                mb: 0.25,
                                fontSize: isSmallMobile ? '0.8rem' : '0.95rem',
                                lineHeight: 1.2
                              }}
                            >
                              {estimate.subject || estimate.projectTitle}
                            </Typography>
                            <Typography 
                              variant="caption"
                              color="text.secondary" 
                              sx={{ 
                                fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                                wordBreak: 'break-word',
                                display: 'block'
                              }}
                            >
                              {estimate.userName} • {estimate.userEmail}
                            </Typography>
                          </Box>
                          <Chip 
                            label={`${getStatusIcon(estimate.status)} ${estimate.status}`}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(estimate.status),
                              color: 'white',
                              textTransform: 'capitalize',
                              fontWeight: 'bold',
                              fontSize: isSmallMobile ? '0.6rem' : '0.7rem',
                              height: isSmallMobile ? 20 : 24,
                              '& .MuiChip-label': {
                                px: isSmallMobile ? 0.5 : 1
                              }
                            }}
                          />
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* Estimate Details */}
                        <Box sx={{ mb: 1.5 }}>
                          <Typography 
                            variant="caption"
                            color="text.secondary" 
                            sx={{ 
                              mb: 1,
                              fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3
                            }}
                          >
                            {estimate.description}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1,
                            mb: 0.5
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {estimate.quotedPrice ? (
                                <Typography 
                                  variant={isSmallMobile ? "subtitle1" : "h6"} 
                                  sx={{ 
                                    fontWeight: 'bold', 
                                    color: '#2e7d32',
                                    fontSize: isSmallMobile ? '0.9rem' : '1.1rem'
                                  }}
                                >
                                  ${estimate.quotedPrice}
                                </Typography>
                              ) : (
                                <Typography 
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: isSmallMobile ? '0.65rem' : '0.75rem' }}
                                >
                                  Not quoted yet
                                </Typography>
                              )}
                            </Box>
                            <Typography 
                              variant="caption" 
                              color="primary" 
                              sx={{ fontSize: isSmallMobile ? '0.65rem' : '0.75rem' }}
                            >
                              💬 {estimate.messages?.length ? estimate.messages.length - 1 : 0} msg{(estimate.messages?.length ? estimate.messages.length - 1 : 0) !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="caption"
                            color="text.secondary"
                            sx={{ 
                              fontSize: isSmallMobile ? '0.6rem' : '0.7rem',
                              display: 'block'
                            }}
                          >
                            Updated: {estimate.lastUpdated ? 
                              new Date(estimate.lastUpdated.seconds ? estimate.lastUpdated.seconds * 1000 : estimate.lastUpdated).toLocaleDateString() : 
                              'Recently'
                            }
                          </Typography>
                        </Box>

                        {/* Action Button */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          mt: 1
                        }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={!isSmallMobile && <Visibility />}
                            sx={{
                              fontSize: isSmallMobile ? '0.65rem' : '0.75rem',
                              minWidth: isSmallMobile ? 60 : 'auto',
                              px: isSmallMobile ? 1 : 1.5,
                              py: isSmallMobile ? 0.25 : 0.5
                            }}
                          >
                            {isSmallMobile ? 'View' : 'View Details'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          ) : (
            // Desktop Table View
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Client & Project</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Budget/Quote</TableCell>
                      <TableCell>Timeline</TableCell>
                      <TableCell>Last Updated</TableCell>
                      <TableCell>Messages</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredEstimates().map((estimate) => (
                      <TableRow key={estimate.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {estimate.subject || estimate.projectTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {estimate.userName} • {estimate.userEmail}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${getStatusIcon(estimate.status)} ${estimate.status}`}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(estimate.status),
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {estimate.quotedPrice ? (
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'green' }}>
                              ${estimate.quotedPrice}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not quoted yet
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            On request
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {estimate.lastUpdated ? 
                              new Date(estimate.lastUpdated.seconds ? estimate.lastUpdated.seconds * 1000 : estimate.lastUpdated).toLocaleDateString() : 
                              'Recently'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {estimate.messages?.length ? estimate.messages.length - 1 : 0} messages
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setSelectedEstimate(estimate);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {getFilteredEstimates().length === 0 && (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No estimates found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tabValue === 0 ? 'No estimates have been submitted yet.' : 'No estimates match the current filter.'}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Paper>
      </motion.div>

      {/* Estimate Details Dialog - Mobile Responsive */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: isMobile ? '100%' : '90vh',
            margin: isMobile ? 0 : '32px',
            width: isMobile ? '100%' : 'auto'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1 : 0
          }}>
            <Typography 
              variant={isMobile ? "h6" : "h6"}
              sx={{ 
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                lineHeight: 1.2,
                mb: isMobile ? 1 : 0
              }}
            >
              {selectedEstimate?.subject || selectedEstimate?.projectTitle}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
              <FormControl 
                size={isMobile ? "small" : "small"} 
                sx={{ 
                  minWidth: isMobile ? 100 : 120,
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedEstimate?.status || ''}
                  label="Status"
                  onChange={(e) => {
                    handleStatusChange(selectedEstimate.id, e.target.value);
                    setSelectedEstimate({...selectedEstimate, status: e.target.value});
                  }}
                >
                  <MenuItem value="pending">⏳ Pending</MenuItem>
                  <MenuItem value="in-progress">💬 In Progress</MenuItem>
                  <MenuItem value="quoted">💰 Quoted</MenuItem>
                  <MenuItem value="approved">✅ Approved</MenuItem>
                  <MenuItem value="declined">❌ Declined</MenuItem>
                  <MenuItem value="completed">🎉 Completed</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ 
          maxHeight: isMobile ? 'calc(100vh - 120px)' : '70vh', 
          overflow: 'auto',
          px: isMobile ? 1 : 3,
          py: isMobile ? 1 : 2
        }}>
          {selectedEstimate && (
            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Project Details */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Project Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      <Typography variant="body1">{selectedEstimate.description}</Typography>
                    </Grid>
                    
                    {/* Uploaded Files */}
                    {selectedEstimate.files && selectedEstimate.files.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                          Uploaded Files ({selectedEstimate.files.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {selectedEstimate.files.map((file, index) => (
                            <Box key={index} sx={{ position: 'relative', maxWidth: 200 }}>
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  style={{
                                    width: '100%',
                                    height: 120,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '1px solid #ddd',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(file.url, '_blank')}
                                />
                              ) : file.type.startsWith('video/') ? (
                                <Box
                                  sx={{
                                    width: 200,
                                    height: 120,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: 2,
                                    border: '1px solid #ddd',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  <Typography variant="h4">🎥</Typography>
                                  <Typography variant="caption" textAlign="center" sx={{ mt: 1 }}>
                                    {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                                  </Typography>
                                </Box>
                              ) : (
                                <Box
                                  sx={{
                                    width: 200,
                                    height: 120,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: 2,
                                    border: '1px solid #ddd',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  <Typography variant="h4">📄</Typography>
                                  <Typography variant="caption" textAlign="center" sx={{ mt: 1 }}>
                                    {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                                  </Typography>
                                </Box>
                              )}
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  position: 'absolute',
                                  bottom: -20,
                                  left: 0,
                                  right: 0,
                                  textAlign: 'center',
                                  backgroundColor: 'rgba(255,255,255,0.9)',
                                  borderRadius: 1,
                                  p: 0.5
                                }}
                              >
                                Click to view
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              {/* Client Info & Quote */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Client Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                      <Typography variant="body1">{selectedEstimate.userName}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{selectedEstimate.userEmail}</Typography>
                    </Grid>
                    {selectedEstimate.quotedPrice && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Quoted Price</Typography>
                        <Typography variant="h6" sx={{ color: 'green', fontWeight: 600 }}>
                          ${selectedEstimate.quotedPrice}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              {/* Communication Thread */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Communication Thread
                  </Typography>
                  
                  {selectedEstimate.messages && selectedEstimate.messages.length > 0 ? (
                    <Box sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
                      {selectedEstimate.messages.map((message, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            mb: 2, 
                            display: 'flex', 
                            flexDirection: message.sender === 'admin' ? 'row' : 'row-reverse',
                            alignItems: 'flex-start'
                          }}
                        >
                          <Avatar 
                            sx={{ 
                              bgcolor: message.sender === 'admin' ? 'secondary.main' : 'primary.main',
                              mx: 1
                            }}
                          >
                            {message.sender === 'admin' ? <AdminPanelSettings /> : <Person />}
                          </Avatar>
                          <Paper 
                            sx={{ 
                              p: 2, 
                              maxWidth: '70%',
                              bgcolor: message.sender === 'admin' ? 'grey.100' : 'primary.light',
                              color: message.sender === 'admin' ? 'text.primary' : 'primary.contrastText'
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {message.senderName}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {message.message}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {new Date(message.timestamp?.seconds ? message.timestamp.seconds * 1000 : message.timestamp).toLocaleString()}
                            </Typography>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      No messages yet. Start the conversation by sending a message below!
                    </Alert>
                  )}

                  {/* Admin Reply Section */}
                  <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #eee' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Admin Reply
                    </Typography>
                    
                    <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Quoted Price (Optional)"
                          value={quotedPrice}
                          onChange={(e) => setQuotedPrice(e.target.value)}
                          placeholder="e.g., 1500"
                          size={isMobile ? "small" : "medium"}
                          InputProps={{
                            startAdornment: <AttachMoney />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Admin Notes (Private)"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Internal notes..."
                          size={isMobile ? "small" : "medium"}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={isMobile ? 3 : 4}
                        placeholder="Type your response to the client..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                          size="small"
                          onClick={() => improveTextWithAI(replyMessage)}
                          disabled={improvingText || !replyMessage.trim()}
                          startIcon={improvingText ? <CircularProgress size={16} /> : <AutoFixHigh />}
                          sx={{ fontSize: isMobile ? '0.75rem' : 'inherit' }}
                        >
                          {improvingText ? 'Enhancing...' : isMobile ? 'Enhance' : 'Enhance Text'}
                        </Button>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      gap: isMobile ? 1 : 2,
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <Button
                        variant="contained"
                        onClick={handleSendReply}
                        disabled={replyLoading || !replyMessage.trim()}
                        startIcon={replyLoading ? <CircularProgress size={20} /> : <Send />}
                        size={isMobile ? "small" : "medium"}
                        sx={{ fontSize: isMobile ? '0.75rem' : 'inherit' }}
                      >
                        {replyLoading ? 'Sending...' : 'Send Reply'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        onClick={() => handleStatusChange(selectedEstimate.id, 'quoted')}
                        disabled={!quotedPrice.trim()}
                        startIcon={<AttachMoney />}
                        size={isMobile ? "small" : "medium"}
                        sx={{ fontSize: isMobile ? '0.75rem' : 'inherit' }}
                      >
                        Quote Project
                      </Button>
                    </Box>
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                      💡 Use the ✨ button to enhance your text - it will improve grammar, clarity, and professionalism without adding extra content!
                    </Alert>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageEstimates;