import { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  People,
  AccountBalance,
  Assessment,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

export default function HRAdmin() {
  const [activeTab, setActiveTab] = useState(0);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'employee' as 'employee' | 'manager' | 'hr_admin',
    department: '',
    position: '',
    hourlyRate: 0,
    salary: 0,
  });
  const [payrollFormData, setPayrollFormData] = useState({
    startDate: '',
    endDate: ''
  });
  const queryClient = useQueryClient();

  // Debug useEffect to monitor dialog state
  useEffect(() => {
    console.log('editEmployeeOpen state changed to:', editEmployeeOpen);
    console.log('editingEmployee state changed to:', editingEmployee);
  }, [editEmployeeOpen, editingEmployee]);

  const { data: dashboardData } = useQuery({
    queryKey: ['hrDashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/reports/dashboard');
      return response.data;
    },
  });

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await axios.get('/api/employees?limit=20');
      return response.data;
    },
  });

  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll'],
    queryFn: async () => {
      // Get current month's payroll data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const response = await axios.get(`/api/payroll?startDate=${startOfMonth.toISOString().split('T')[0]}&endDate=${endOfMonth.toISOString().split('T')[0]}&limit=100`);
      return response.data;
    },
  });

  const { data: approvedTimesheetsData, isLoading: approvedTimesheetsLoading, error: approvedTimesheetsError } = useQuery({
    queryKey: ['approvedTimesheets'],
    queryFn: async () => {
      console.log('Fetching approved timesheets for payroll...');
      const response = await axios.get('/api/timesheets/approved-for-payroll');
      console.log('Approved timesheets response:', response.data);
      return response.data;
    },
  });

  const deactivateEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/employees/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      const response = await axios.post('/api/employees', employeeData);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Employee added successfully:', data);
      setSuccessMessage('Employee added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setAddEmployeeOpen(false);
      setNewEmployee({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        position: '',
        hourlyRate: 0,
        salary: 0,
      });
    },
    onError: (error) => {
      console.error('Error adding employee:', error);
    },
  });

  const editEmployeeMutation = useMutation({
    mutationFn: async ({ id, employeeData }: { id: string; employeeData: any }) => {
      const response = await axios.put(`/api/employees/${id}`, employeeData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditEmployeeOpen(false);
      setEditingEmployee(null);
    },
  });

  const createPayrollMutation = useMutation({
    mutationFn: async ({ employeeId }: { employeeId: string }) => {
      console.log('Creating payroll for employee ID:', employeeId);
      const response = await axios.post('/api/payroll', {
        employeeId
      });
      console.log('Payroll creation response:', response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['approvedTimesheets'] });
      setSuccessMessage('Payroll created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      console.error('Error creating payroll:', error);
      console.error('Error response:', error.response?.data);
    },
  });

  const handleDeactivateEmployee = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate ${name}?`)) {
      deactivateEmployeeMutation.mutate(id);
    }
  };

  const handleAddEmployee = () => {
    addEmployeeMutation.mutate(newEmployee);
  };

  const handleEditEmployee = (employee: any) => {
    console.log('handleEditEmployee called with:', employee);
    console.log('Setting editingEmployee to:', employee);
    console.log('Setting editEmployeeOpen to true');
    setEditingEmployee(employee);
    setEditEmployeeOpen(true);
    console.log('Dialog should now be open');
  };

  const handleUpdateEmployee = () => {
    if (editingEmployee) {
      editEmployeeMutation.mutate({
        id: editingEmployee._id,
        employeeData: editingEmployee
      });
    }
  };

  const handleCreatePayroll = (employeeId: string) => {
    // Find the employee data from the timesheet
    const employee = approvedTimesheetsData?.timesheets?.find((t: any) => t.employee._id === employeeId)?.employee;
    setSelectedEmployeeForPayroll(employee);
    setPayrollDialogOpen(true);
  };

  const handlePayrollSubmit = () => {
    if (selectedEmployeeForPayroll) {
      console.log('Creating payroll for employee:', selectedEmployeeForPayroll);
      
      createPayrollMutation.mutate({
        employeeId: selectedEmployeeForPayroll._id
      });
      setPayrollDialogOpen(false);
      setPayrollFormData({ startDate: '', endDate: '' });
      setSelectedEmployeeForPayroll(null);
    }
  };


  const getStatusChip = (isActive: boolean) => {
    return isActive ? (
      <Chip label="Active" color="success" size="small" />
    ) : (
      <Chip label="Inactive" color="error" size="small" />
    );
  };

  const getPayrollStatusChip = (status: string) => {
    switch (status) {
      case 'paid':
        return <Chip label="Paid" color="success" size="small" />;
      case 'approved':
        return <Chip label="Approved" color="info" size="small" />;
      case 'calculated':
        return <Chip label="Calculated" color="warning" size="small" />;
      case 'draft':
        return <Chip label="Draft" color="default" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        HR Admin Panel
      </Typography>

      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Employees
                  </Typography>
                  <Typography variant="h4">
                    {employeesData?.employees?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Payroll This Month
                  </Typography>
                  <Typography variant="h4">
                    ${payrollData?.payrolls?.reduce((sum: number, p: any) => sum + (p.netPay || 0), 0)?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Reports Available
                  </Typography>
                  <Typography variant="h4">
                    3
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Employee Management" />
              <Tab label="Payroll Processing" />
            </Tabs>
          </Paper>

      {/* Employee Management Tab */}
      {activeTab === 0 && (
        <Paper>
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Employee Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddEmployeeOpen(true)}
              >
                Add Employee
              </Button>
            </Box>

            {employeesLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Employee ID</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employeesData?.employees?.map((employee: any) => (
                        <TableRow key={employee._id}>
                          <TableCell>
                            {employee.firstName} {employee.lastName}
                          </TableCell>
                          <TableCell>{employee.employeeId}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department || '-'}</TableCell>
                          <TableCell>{employee.position || '-'}</TableCell>
                          <TableCell>{employee.role}</TableCell>
                          <TableCell>{getStatusChip(employee.isActive)}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<Edit />}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Edit button clicked for employee:', employee._id);
                                handleEditEmployee(employee);
                              }}
                              variant="outlined"
                              color="primary"
                              type="button"
                            >
                              Edit Employee
                            </Button>
                            {employee.isActive && (
                              <Button
                                size="small"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => handleDeactivateEmployee(employee._id, `${employee.firstName} ${employee.lastName}`)}
                                disabled={deactivateEmployeeMutation.isPending}
                              >
                                Deactivate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Payroll Processing Tab */}
      {activeTab === 1 && (
        <Paper>
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Payroll Processing
            </Typography>
            
            {/* Approved Timesheets Ready for Payroll */}
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Approved Timesheets Ready for Payroll
              </Typography>
              {approvedTimesheetsLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : approvedTimesheetsError ? (
                <Alert severity="error">
                  Error loading approved timesheets: {approvedTimesheetsError.message}
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Hours Worked</TableCell>
                        <TableCell>Hourly Rate</TableCell>
                        <TableCell>Gross Pay</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {approvedTimesheetsData?.timesheets?.map((timesheet: any) => (
                        <TableRow key={timesheet._id}>
                          <TableCell>
                            {timesheet.employee?.firstName} {timesheet.employee?.lastName}
                          </TableCell>
                          <TableCell>
                            {format(new Date(timesheet.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{timesheet.totalHours?.toFixed(2)}</TableCell>
                          <TableCell>${timesheet.employee?.hourlyRate || 0}</TableCell>
                          <TableCell>${((timesheet.totalHours || 0) * (timesheet.employee?.hourlyRate || 0)).toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip label="Approved" color="success" size="small" />
                          </TableCell>
                          <TableCell>
              <Button
                              size="small"
                variant="contained"
                              color="primary"
                              onClick={() => handleCreatePayroll(timesheet.employee._id)}
                              disabled={createPayrollMutation.isPending}
              >
                              Create Payroll
              </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* Existing Payroll Records */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Existing Payroll Records
              </Typography>
            {payrollLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Pay Period</TableCell>
                        <TableCell>Gross Pay</TableCell>
                        <TableCell>Deductions</TableCell>
                        <TableCell>Net Pay</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payrollData?.payrolls?.map((payroll: any) => (
                        <TableRow key={payroll._id}>
                          <TableCell>
                            {payroll.employee?.firstName} {payroll.employee?.lastName}
                          </TableCell>
                          <TableCell>
                            {format(new Date(payroll.payPeriod.startDate), 'MMM dd')} - {format(new Date(payroll.payPeriod.endDate), 'MMM dd')}
                          </TableCell>
                          <TableCell>${payroll.grossPay?.toFixed(2)}</TableCell>
                          <TableCell>${payroll.deductions?.total?.toFixed(2)}</TableCell>
                          <TableCell>${payroll.netPay?.toFixed(2)}</TableCell>
                          <TableCell>{getPayrollStatusChip(payroll.status)}</TableCell>
                          <TableCell>
                            {/* <Button
                              size="small"
                              onClick={() => {
                                console.log('View payroll details clicked for:', payroll._id);
                                alert(`Payroll details for ${payroll.employee?.firstName} ${payroll.employee?.lastName} - Coming soon!`);
                              }}
                              type="button"
                            >
                              View Details
                            </Button> */}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        </Paper>
      )}


      {/* Add Employee Dialog */}
      <Dialog open={addEmployeeOpen} onClose={() => setAddEmployeeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newEmployee.firstName}
                onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newEmployee.lastName}
                onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newEmployee.role}
                  label="Role"
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as 'employee' | 'manager' | 'hr_admin' })}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="hr_admin">HR Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                value={newEmployee.hourlyRate}
                onChange={(e) => setNewEmployee({ ...newEmployee, hourlyRate: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEmployeeOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddEmployee} 
            variant="contained"
            disabled={addEmployeeMutation.isPending}
          >
            {addEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editEmployeeOpen} onClose={() => setEditEmployeeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          {editingEmployee && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editingEmployee.firstName || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editingEmployee.lastName || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, lastName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editingEmployee.email || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editingEmployee.role || 'employee'}
                    label="Role"
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value as 'employee' | 'manager' | 'hr_admin' })}
                  >
                    <MenuItem value="employee">Employee</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="hr_admin">HR Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={editingEmployee.department || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Position"
                  value={editingEmployee.position || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hourly Rate"
                  type="number"
                  value={editingEmployee.hourlyRate || 0}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, hourlyRate: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary"
                  type="number"
                  value={editingEmployee.salary || 0}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEmployeeOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateEmployee} 
            variant="contained"
            disabled={editEmployeeMutation.isPending}
          >
            {editEmployeeMutation.isPending ? 'Updating...' : 'Update Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Payroll Dialog */}
      <Dialog open={payrollDialogOpen} onClose={() => setPayrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Payroll</DialogTitle>
        <DialogContent>
          {selectedEmployeeForPayroll && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Employee: {selectedEmployeeForPayroll.firstName} {selectedEmployeeForPayroll.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Department: {selectedEmployeeForPayroll.department} | Position: {selectedEmployeeForPayroll.position}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hourly Rate: ${selectedEmployeeForPayroll.hourlyRate}
              </Typography>
              
              {/* Show available timesheets */}
              {approvedTimesheetsData?.timesheets?.filter((t: any) => t.employee._id === selectedEmployeeForPayroll._id).length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Approved Timesheets for Payroll:
                  </Typography>
                  {approvedTimesheetsData?.timesheets
                    ?.filter((t: any) => t.employee._id === selectedEmployeeForPayroll._id)
                    ?.map((timesheet: any) => (
                      <Typography key={timesheet._id} variant="body2" color="text.secondary">
                        • {format(new Date(timesheet.date), 'MMM dd, yyyy')} - {timesheet.totalHours?.toFixed(2)} hours
                      </Typography>
                    ))}
                  <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Total Hours: {approvedTimesheetsData?.timesheets
                      ?.filter((t: any) => t.employee._id === selectedEmployeeForPayroll._id)
                      ?.reduce((sum: number, t: any) => sum + (t.totalHours || 0), 0)
                      ?.toFixed(2)} hours
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Estimated Gross Pay: ${(approvedTimesheetsData?.timesheets
                      ?.filter((t: any) => t.employee._id === selectedEmployeeForPayroll._id)
                      ?.reduce((sum: number, t: any) => sum + (t.totalHours || 0), 0) * (selectedEmployeeForPayroll?.hourlyRate || 0))
                      ?.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          <Typography variant="body1" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
            This will create a payroll record using ALL approved timesheets for this employee.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayrollDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePayrollSubmit} 
            variant="contained"
            disabled={createPayrollMutation.isPending}
          >
            {createPayrollMutation.isPending ? 'Creating...' : 'Create Payroll'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}
      {(deactivateEmployeeMutation.error || addEmployeeMutation.error || editEmployeeMutation.error || createPayrollMutation.error) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {deactivateEmployeeMutation.error?.message || addEmployeeMutation.error?.message || editEmployeeMutation.error?.message || createPayrollMutation.error?.message || 'An error occurred'}
        </Alert>
      )}
    </Container>
  );
}

