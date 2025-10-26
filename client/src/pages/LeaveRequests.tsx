import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Cancel,
  Pending,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

export default function LeaveRequests() {
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const queryClient = useQueryClient();

  const { data: leavesData, isLoading, error } = useQuery({
    queryKey: ['leaves', page],
    queryFn: async () => {
      const response = await axios.get(`/api/leaves/my-leaves?page=${page}&limit=10`);
      return response.data;
    },
  });

  const createLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/leaves', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setOpenDialog(false);
      setFormData({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
      });
    },
    onError: (error: any) => {
      console.error('Leave request error:', error.response?.data);
    },
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/leaves/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate total days
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    
    // Convert dates to ISO format for backend
    const submitData = {
      ...formData,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalDays: totalDays,
    };
    
    console.log('Submitting leave request:', submitData);
    createLeaveMutation.mutate(submitData);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      deleteLeaveMutation.mutate(id);
    }
  };

  const handleEdit = (leave: any) => {
    setEditingLeave(leave);
    setFormData({
      leaveType: leave.leaveType,
      startDate: format(new Date(leave.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(leave.endDate), 'yyyy-MM-dd'),
      reason: leave.reason,
    });
    setOpenDialog(true);
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
          Error loading leave requests. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Leave Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          New Leave Request
        </Button>
      </Box>

      {/* Leave Requests Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Leave Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Total Days</TableCell>
                <TableCell>Reason</TableCell>   
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leavesData?.leaves?.map((leave: any) => (
                <TableRow key={leave._id}>
                  <TableCell>{leave.leaveType}</TableCell>
                  <TableCell>{format(new Date(leave.startDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(leave.endDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{leave.totalDays}</TableCell>
                  <TableCell>{leave.reason}</TableCell>
                  <TableCell>{getStatusChip(leave.status)}</TableCell>
                  <TableCell>
                    {leave.status === 'pending' && (
                      <>
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => handleEdit(leave)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleDelete(leave._id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {leavesData?.leaves?.length === 0 && (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              No leave requests found.
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        {leavesData?.totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={leavesData.totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Leave Request Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    label="Leave Type"
                  >
                    <MenuItem value="sick">Sick Leave</MenuItem>
                    <MenuItem value="vacation">Vacation</MenuItem>
                    <MenuItem value="personal">Personal</MenuItem>
                    <MenuItem value="maternity">Maternity</MenuItem>
                    <MenuItem value="paternity">Paternity</MenuItem>
                    <MenuItem value="bereavement">Bereavement</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason"
                  multiline
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createLeaveMutation.isPending}
            >
              {createLeaveMutation.isPending ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Error Messages */}
      {(createLeaveMutation.error || deleteLeaveMutation.error) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {createLeaveMutation.error?.response?.data?.message || 
           createLeaveMutation.error?.response?.data?.errors?.map((err: any) => err.msg).join(', ') ||
           createLeaveMutation.error?.message || 
           deleteLeaveMutation.error?.message}
        </Alert>
      )}
    </Container>
  );
}

