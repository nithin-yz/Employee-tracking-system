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
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Pause,
  PlayCircleOutline,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

export default function EmployeePortal() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
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
    getCurrentLocation();
    clockInMutation.mutate({ location });
  };

  const handleClockOut = () => {
    if (!currentStatus?.isClockedIn) return; // extra safety
    clockOutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['currentStatus'] });
      },
    });
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
            icon={currentStatus?.isClockedIn ? <PlayArrow /> : <Stop />}
            label={currentStatus?.isClockedIn ? 'Clocked In' : 'Not Clocked In'}
            color={currentStatus?.isClockedIn ? 'success' : 'default'}
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

      {/* Action Buttons */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clock In/Out
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                {!currentStatus?.isClockedIn ? (
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
                {currentStatus?.isClockedIn && !currentStatus?.isClockedOut && (
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
                )}
                {!currentStatus?.isClockedIn && (
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
    </Container>
  );
}

