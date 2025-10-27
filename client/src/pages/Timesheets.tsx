import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

export default function Timesheets() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: timesheetsData, isLoading, error } = useQuery({
    queryKey: ['timesheets', page, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(`/api/timesheets/my-timesheets?${params}`);
      return response.data;
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

  const formatTime = (date: string | Date) => {
    if (!date) return '-';
    return format(new Date(date), 'HH:mm:ss');
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          Error loading timesheets. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        My Timesheets
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Timesheets
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Timesheets Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Clock In</TableCell>
                <TableCell>Clock Out</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Regular Hours</TableCell>
                <TableCell>Overtime Hours</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timesheetsData?.timesheets?.map((timesheet: any) => (
                <TableRow key={timesheet._id}>
                  <TableCell>{formatDate(timesheet.date)}</TableCell>
                  <TableCell>{formatTime(timesheet.clockIn)}</TableCell>
                  <TableCell>{formatTime(timesheet.clockOut)}</TableCell>
                  <TableCell>{timesheet.totalHours?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{timesheet.regularHours?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{timesheet.overtimeHours?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{getStatusChip(timesheet.status)}</TableCell>
                  <TableCell>{timesheet.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {timesheetsData?.timesheets?.length === 0 && (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              No timesheets found for the selected period.
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        {timesheetsData?.totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={timesheetsData.totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
}

