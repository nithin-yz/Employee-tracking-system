import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Pause,
  PlayCircleOutline,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

export default function EmployeePortal() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [currentHours, setCurrentHours] = useState(0);
  const queryClient = useQueryClient();

  const { data: currentStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['currentStatus'],
    queryFn: async () => {
      const response = await axios.get('/api/timesheets/current-status');
      return response.data;
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/timesheets/clock-in', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentStatus'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.put('/api/timesheets/clock-out');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentStatus'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });

  const breakStartMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.put('/api/timesheets/break-start');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentStatus'] });
    },
  });

  const breakEndMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.put('/api/timesheets/break-end');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentStatus'] });
    },
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleClockIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(locationData);
          clockInMutation.mutate({ location: locationData });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Clock in without location if geolocation fails
          clockInMutation.mutate({ location: null });
        }
      );
    } else {
      // Clock in without location if geolocation is not supported
      clockInMutation.mutate({ location: null });
    }
  };

  const handleClockOut = () => {
    if (!currentStatus?.isClockedIn) return; // extra safety
    
    // Calculate current hours worked
    const now = new Date();
    const clockInTime = new Date(currentStatus.clockInTime);
    const hoursWorked = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    
    // If less than 4 hours, show confirmation dialog
    if (hoursWorked < 4) {
      setCurrentHours(hoursWorked);
      setConfirmDialogOpen(true);
    } else {
      // Clock out normally if 4+ hours
      performClockOut();
    }
  };

  const performClockOut = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(locationData);
          clockOutMutation.mutate({ location: locationData });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Clock out without location if geolocation fails
          clockOutMutation.mutate({ location: null });
        }
      );
    } else {
      // Clock out without location if geolocation is not supported
      clockOutMutation.mutate({ location: null });
    }
  };

  const confirmClockOut = () => {
    setConfirmDialogOpen(false);
    performClockOut();
  };

  const handleBreakStart = () => {
    breakStartMutation.mutate();
  };

  const handleBreakEnd = () => {
    breakEndMutation.mutate();
  };

  if (statusLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Employee Portal
      </Typography>

      {/* Current Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Status
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            icon={currentStatus?.isSessionCompleted ? <CheckCircle /> : currentStatus?.isClockedIn ? <PlayArrow /> : <Stop />}
            label={currentStatus?.isSessionCompleted ? 'Session Completed' : currentStatus?.isClockedIn ? 'Clocked In' : 'Not Clocked In'}
            color={currentStatus?.isSessionCompleted ? 'success' : currentStatus?.isClockedIn ? 'success' : 'default'}
          />
          {currentStatus?.isOnBreak && (
            <Chip
              icon={<Pause />}
              label="On Break"
              color="warning"
            />
          )}
          {currentStatus?.totalHours > 0 && (
            <Chip
              label={`${currentStatus.totalHours.toFixed(2)} hours today`}
              color="info"
            />
          )}
        </Box>

        {currentStatus?.clockInTime && (
          <Typography variant="body2" color="text.secondary">
            Clocked in at: {format(new Date(currentStatus.clockInTime), 'HH:mm:ss')}
          </Typography>
        )}
        {currentStatus?.clockOutTime && (
          <Typography variant="body2" color="text.secondary">
            Clocked out at: {format(new Date(currentStatus.clockOutTime), 'HH:mm:ss')}
          </Typography>
        )}
      </Paper>

      {/* Session Completed Message */}
      {currentStatus?.isSessionCompleted && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ✅ Today's Session Completed!
          </Typography>
          <Typography variant="body2">
            You have already completed your work session for today. 
            Total hours worked: <strong>{currentStatus.totalHours.toFixed(2)} hours</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Your timesheet is now pending manager approval.
          </Typography>
        </Alert>
      )}

      {/* Action Buttons */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clock In/Out
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                {currentStatus?.isSessionCompleted ? (
                  <Alert severity="info">
                    <Typography variant="body2">
                      Your work session for today is complete. 
                      No further clock in/out actions are needed.
                    </Typography>
                  </Alert>
                ) : !currentStatus?.isClockedIn ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={handleClockIn}
                    disabled={clockInMutation.isPending}
                    fullWidth
                  >
                    {clockInMutation.isPending ? <CircularProgress size={24} /> : 'Clock In'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    startIcon={<Stop />}
                    onClick={handleClockOut}
                    disabled={clockOutMutation.isPending || !currentStatus?.isClockedIn}
                    fullWidth
                  >
                    {clockOutMutation.isPending ? <CircularProgress size={24} /> : 'Clock Out'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Break Management
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                {currentStatus?.isSessionCompleted ? (
                  <Alert severity="info">
                    <Typography variant="body2">
                      Break management is not available after completing your work session.
                    </Typography>
                  </Alert>
                ) : currentStatus?.isClockedIn && !currentStatus?.isClockedOut ? (
                  <>
                    {!currentStatus?.isOnBreak ? (
                      <Button
                        variant="outlined"
                        color="warning"
                        size="large"
                        startIcon={<Pause />}
                        onClick={handleBreakStart}
                        disabled={breakStartMutation.isPending}
                        fullWidth
                      >
                        {breakStartMutation.isPending ? <CircularProgress size={24} /> : 'Start Break'}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="success"
                        size="large"
                        startIcon={<PlayCircleOutline />}
                        onClick={handleBreakEnd}
                        disabled={breakEndMutation.isPending}
                        fullWidth
                      >
                        {breakEndMutation.isPending ? <CircularProgress size={24} /> : 'End Break'}
                      </Button>
                    )}
                  </>
                ) : (
                  <Alert severity="info">
                    You need to clock in before you can take a break.
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Messages */}
      {(clockInMutation.error || clockOutMutation.error || breakStartMutation.error || breakEndMutation.error) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {
            axios.isAxiosError(clockInMutation.error) && clockInMutation.error.response?.data?.message ? clockInMutation.error.response.data.message :
            axios.isAxiosError(clockOutMutation.error) && clockOutMutation.error.response?.data?.message ? clockOutMutation.error.response.data.message :
            axios.isAxiosError(breakStartMutation.error) && breakStartMutation.error.response?.data?.message ? breakStartMutation.error.response.data.message :
            axios.isAxiosError(breakEndMutation.error) && breakEndMutation.error.response?.data?.message ? breakEndMutation.error.response.data.message :
            clockInMutation.error?.message ||
            clockOutMutation.error?.message ||
            breakStartMutation.error?.message ||
            breakEndMutation.error?.message
          }
        </Alert>
      )}

      {/* Early Clock Out Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>⚠️ Early Clock Out Warning</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You have only worked for <strong>{currentHours.toFixed(2)} hours</strong> today.
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Company Policy:</strong>
          </Typography>
          <Typography variant="body2" component="div" sx={{ ml: 2 }}>
            • Half day = 4 hours minimum<br/>
            • Full day = 8 hours<br/>
            • Clocking out before 4 hours breaks company rules
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Are you sure you want to clock out early? This will be flagged for manager review.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={confirmClockOut} 
            variant="contained" 
            color="error"
            disabled={clockOutMutation.isPending}
          >
            {clockOutMutation.isPending ? <CircularProgress size={24} /> : 'Yes, Clock Out'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

