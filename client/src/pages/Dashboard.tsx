import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
} from '@mui/material';
import {
  AccessTime,
  Event,
  People,
  Assessment,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/reports/dashboard');
      return response.data;
    },
  });

  const { data: currentStatus } = useQuery({
    queryKey: ['currentStatus'],
    queryFn: async () => {
      const response = await axios.get('/api/timesheets/current-status');
      return response.data;
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleBasedCards = () => {
    const baseCards = [
      {
        title: 'My Timesheets',
        description: 'View and manage your timesheets',
        icon: <AccessTime />,
        color: '#1976d2',
        path: '/timesheets',
      },
      {
        title: 'Leave Requests',
        description: 'Request and track your leave',
        icon: <Event />,
        color: '#dc004e',
        path: '/leaves',
      },
    ];

    if (user?.role === 'employee') {
      return [
        ...baseCards,
        {
          title: 'Employee Portal',
          description: 'Access your employee portal',
          icon: <People />,
          color: '#2e7d32',
          path: '/employee-portal',
        },
      ];
    }

    if (user?.role === 'manager') {
      return [
        ...baseCards,
        {
          title: 'Manager Dashboard',
          description: 'Manage your team',
          icon: <People />,
          color: '#2e7d32',
          path: '/manager-dashboard',
        },
        {
          title: 'Reports',
          description: 'View team reports',
          icon: <Assessment />,
          color: '#ed6c02',
          path: '/reports',
        },
      ];
    }

    if (user?.role === 'hr_admin') {
      return [
        ...baseCards,
        {
          title: 'HR Admin',
          description: 'Manage employees and payroll',
          icon: <People />,
          color: '#2e7d32',
          path: '/hr-admin',
        },
        {
          title: 'Reports',
          description: 'View comprehensive reports',
          icon: <Assessment />,
          color: '#ed6c02',
          path: '/reports',
        },
      ];
    }

    return baseCards;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {getGreeting()}, {user?.firstName}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome to your Employee Time Tracking Dashboard
        </Typography>
      </Box>

      {/* Current Status */}
      {currentStatus && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Current Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={currentStatus.isClockedIn ? <CheckCircle /> : <Pending />}
              label={currentStatus.isClockedIn ? 'Clocked In' : 'Not Clocked In'}
              color={currentStatus.isClockedIn ? 'success' : 'default'}
            />
            {currentStatus.isOnBreak && (
              <Chip
                icon={<AccessTime />}
                label="On Break"
                color="warning"
              />
            )}
            {currentStatus.totalHours > 0 && (
              <Chip
                label={`${currentStatus.totalHours.toFixed(2)} hours today`}
                color="info"
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Dashboard Stats */}
      {dashboardData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                Today's Attendance
              </Typography>
              <Typography variant="h4">
                {dashboardData.today.clockedIn + dashboardData.today.clockedOut}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                Pending Timesheets
              </Typography>
              <Typography variant="h4">
                {dashboardData.pending.timesheets}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                Pending Leaves
              </Typography>
              <Typography variant="h4">
                {dashboardData.pending.leaves}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                Hours This Month
              </Typography>
              <Typography variant="h4">
                {dashboardData.thisMonth.totalHours.toFixed(1)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {getRoleBasedCards().map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: card.color,
                      color: 'white',
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6" component="h2">
                    {card.title}
                  </Typography>
                </Box>
                <Typography color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  href={card.path}
                  sx={{ color: card.color }}
                >
                  Go to {card.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

