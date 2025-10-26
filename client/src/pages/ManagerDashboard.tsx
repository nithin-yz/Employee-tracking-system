import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  AccessTime,
  Event,
  CalendarMonth,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const queryClient = useQueryClient();

  const { data: dashboardData } = useQuery({
    queryKey: ['managerDashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/reports/dashboard');
      return response.data;
    },
  });

  const { data: debugData } = useQuery({
    queryKey: ['debugTimesheets'],
    queryFn: async () => {
      console.log('Fetching debug timesheets...');
      const response = await axios.get('/api/timesheets/debug');
      console.log('Debug timesheets response:', response.data);
      return response.data;
    },
    onError: (error) => {
      console.error('Error fetching debug timesheets:', error);
    },
  });

  const { data: timesheetsData, isLoading: timesheetsLoading, error: timesheetsError } = useQuery({
    queryKey: ['teamTimesheets'],
    queryFn: async () => {
      console.log('Fetching team timesheets...');
      const response = await axios.get('/api/timesheets/team-timesheets?limit=10');
      console.log('Team timesheets response:', response.data);
      return response.data;
    },
    onError: (error) => {
      console.error('Error fetching team timesheets:', error);
    },
  });

  const { data: leavesData, isLoading: leavesLoading, error: leavesError } = useQuery({
    queryKey: ['teamLeaves'],
    queryFn: async () => {
      console.log('Fetching team leaves...');
      const response = await axios.get('/api/leaves/team-leaves?limit=10');
      console.log('Team leaves response:', response.data);
      return response.data;
    },
    onError: (error) => {
      console.error('Error fetching team leaves:', error);
    },
  });

  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ['teamCalendar'],
    queryFn: async () => {
      const response = await axios.get('/api/leaves/calendar');
      return response.data;
    },
  });

  const approveTimesheetMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await axios.put(`/api/timesheets/${id}/approve`, { notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamTimesheets'] });
    },
  });

  const rejectTimesheetMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await axios.put(`/api/timesheets/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamTimesheets'] });
    },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.put(`/api/leaves/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamLeaves'] });
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason: string }) => {
      const response = await axios.put(`/api/leaves/${id}/reject`, { rejectionReason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamLeaves'] });
    },
  });

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'approved':
        return <Chip icon={<CheckCircle />} label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip icon={<Cancel />} label="Rejected" color="error" size="small" />;
      case 'pending':
        return <Chip icon={<Pending />} label="Pending" color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const handleApproveTimesheet = (id: string) => {
    approveTimesheetMutation.mutate({ id });
  };

  const handleRejectTimesheet = (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectTimesheetMutation.mutate({ id, reason });
    }
  };

  const handleApproveLeave = (id: string) => {
    approveLeaveMutation.mutate(id);
  };

  const handleRejectLeave = (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectLeaveMutation.mutate({ id, rejectionReason: reason });
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Manager Dashboard
      </Typography>

      {/* Debug Information */}
      {/* <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          Debug Information
        </Typography>
        <Typography variant="body2">
          <strong>Debug Timesheets:</strong> {debugData ? `All: ${debugData.allTimesheets}, Pending: ${debugData.pendingTimesheets}` : 'Loading...'}<br/>
          <strong>Timesheets Loading:</strong> {timesheetsLoading ? 'Yes' : 'No'}<br/>
          <strong>Timesheets Error:</strong> {timesheetsError ? timesheetsError.message : 'None'}<br/>
          <strong>Timesheets Data:</strong> {timesheetsData ? JSON.stringify(timesheetsData, null, 2) : 'No data'}<br/>
          <strong>Leaves Loading:</strong> {leavesLoading ? 'Yes' : 'No'}<br/>
          <strong>Leaves Error:</strong> {leavesError ? leavesError.message : 'None'}<br/>
          <strong>Leaves Data:</strong> {leavesData ? JSON.stringify(leavesData, null, 2) : 'No data'}
        </Typography>
      </Paper> */}

      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccessTime color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Timesheets
                  </Typography>
                  <Typography variant="h4">
                    {timesheetsData?.timesheets?.filter((t: any) => t.status === 'pending').length || 0}
                  </Typography>
                  {timesheetsData && (
                    <Typography variant="caption" color="text.secondary">
                      Total: {timesheetsData.timesheets?.length || 0} timesheets
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Event color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Leave Requests
                  </Typography>
                  <Typography variant="h4">
                    {leavesData?.leaves?.filter((l: any) => l.status === 'pending').length || 0}
                  </Typography>
                  {leavesData && (
                    <Typography variant="caption" color="text.secondary">
                      Total: {leavesData.leaves?.length || 0} leave requests
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Timesheet Approvals" />
          <Tab label="Team Calendar" />
        </Tabs>
      </Paper>
      {/* Timesheet Approvals Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Pending Timesheets */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Pending Timesheets
              </Typography>
              {timesheetsLoading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timesheetsData?.timesheets?.map((timesheet: any) => (
                        <TableRow key={timesheet._id}>
                          <TableCell>
                            {timesheet.employee?.firstName} {timesheet.employee?.lastName}
                          </TableCell>
                          <TableCell>
                            {format(new Date(timesheet.date), 'MMM dd')}
                          </TableCell>
                          <TableCell>{timesheet.totalHours?.toFixed(2)}</TableCell>
                          <TableCell>{getStatusChip(timesheet.status)}</TableCell>
                          <TableCell>
                            {timesheet.status === 'pending' && (
                              <>
                                <Button
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproveTimesheet(timesheet._id)}
                                  disabled={approveTimesheetMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => handleRejectTimesheet(timesheet._id)}
                                  disabled={rejectTimesheetMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Pending Leave Requests */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Pending Leave Requests
              </Typography>
              {leavesLoading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Days</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leavesData?.leaves?.map((leave: any) => (
                        <TableRow key={leave._id}>
                          <TableCell>
                            {leave.employee?.firstName} {leave.employee?.lastName}
                          </TableCell>
                          <TableCell>{leave.leaveType}</TableCell>
                          <TableCell>{leave.totalDays}</TableCell>
                          <TableCell>{getStatusChip(leave.status)}</TableCell>
                          <TableCell>
                            {leave.status === 'pending' && (
                              <>
                                <Button
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproveLeave(leave._id)}
                                  disabled={approveLeaveMutation.isPending}
                                  >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => handleRejectLeave(leave._id)}
                                  disabled={rejectLeaveMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Team Calendar Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Team Calendar - Who's Off & Scheduled
          </Typography>
          {calendarLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {calendarData?.map((leave: any) => (
                <Grid item xs={12} sm={6} md={4} key={leave._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {leave.totalDays} day(s)
                      </Typography>
                      <Chip 
                        label={leave.status} 
                        color={leave.status === 'approved' ? 'success' : 'warning'} 
                        size="small" 
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {(!calendarData || calendarData.length === 0) && (
                <Grid item xs={12}>
                  <Typography color="text.secondary" align="center">
                    No approved leaves scheduled for your team.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </Paper>
      )}

      {/* Error Messages */}
      {(timesheetsError || leavesError) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading data: {timesheetsError?.message || leavesError?.message}
        </Alert>
      )}
      {(approveTimesheetMutation.error || rejectTimesheetMutation.error || 
        approveLeaveMutation.error || rejectLeaveMutation.error) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          An error occurred while processing the request.
        </Alert>
      )}
    </Container>
  );
}

