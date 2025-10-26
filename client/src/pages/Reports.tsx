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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Divider,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  People,
  AccessTime,
  Refresh,
  GetApp,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Reports() {
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper function to get last month's date range
  const getLastMonthRange = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
      start: lastMonth.toISOString().split('T')[0],
      end: endOfLastMonth.toISOString().split('T')[0]
    };
  };

  // Helper function to get this month's date range
  const getThisMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  };

  // Helper function to get last 3 months range
  const getLastThreeMonthsRange = () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
      start: threeMonthsAgo.toISOString().split('T')[0],
      end: endOfLastMonth.toISOString().split('T')[0]
    };
  };

  // Set default to last month on component mount
  useEffect(() => {
    const lastMonth = getLastMonthRange();
    setStartDate(lastMonth.start);
    setEndDate(lastMonth.end);
  }, []);

  const { data: attendanceReport, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendanceReport', startDate, endDate, department],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (department) params.append('department', department);

      const response = await axios.get(`/api/reports/attendance?${params}`);
      return response.data;
    },
  });

  const { data: leaveReport, isLoading: leaveLoading } = useQuery({
    queryKey: ['leaveReport', startDate, endDate, department],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (department) params.append('department', department);

      const response = await axios.get(`/api/reports/leave?${params}`);
      return response.data;
    },
  });

  const { data: payrollReport, isLoading: payrollLoading } = useQuery({
    queryKey: ['payrollReport', startDate, endDate, department],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (department) params.append('department', department);

      const response = await axios.get(`/api/reports/payroll?${params}`);
      return response.data;
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const attendanceChartData = attendanceReport?.timesheets?.slice(0, 7).map((ts: any) => ({
    date: new Date(ts.date).toLocaleDateString(),
    hours: ts.totalHours || 0,
  })) || [];

  const leaveTypeData = leaveReport?.leaveTypeStats ? Object.entries(leaveReport.leaveTypeStats).map(([type, data]: [string, any]) => ({
    name: type,
    value: data.days,
  })) : [];

  const payrollChartData = payrollReport?.payrolls?.slice(0, 10).map((p: any) => ({
    employee: `${p.employee?.firstName} ${p.employee?.lastName}`,
    grossPay: p.grossPay,
    netPay: p.netPay,
  })) || [];

  const handleExport = async (type: string) => {
    try {
      setIsGenerating(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (department) params.append('department', department);

      const response = await axios.get(`/api/reports/export/${type}?${params}`, {
        responseType: 'blob',
      });

      // Create better file name with date range
      const startDateFormatted = startDate ? new Date(startDate).toLocaleDateString('en-CA') : 'all';
      const endDateFormatted = endDate ? new Date(endDate).toLocaleDateString('en-CA') : 'all';
      const fileName = `${type}-report_${startDateFormatted}_to_${endDateFormatted}.csv`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = async (type: string) => {
    try {
      setIsGenerating(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (department) params.append('department', department);

      // Trigger the report generation
      await axios.get(`/api/reports/${type}?${params}`);
      
      // Then export it
      await handleExport(type);
    } catch (error) {
      console.error('Generate report failed:', error);
      alert('Generate report failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDatePreset = (preset: string) => {
    let dateRange;
    switch (preset) {
      case 'lastMonth':
        dateRange = getLastMonthRange();
        break;
      case 'thisMonth':
        dateRange = getThisMonthRange();
        break;
      case 'lastThreeMonths':
        dateRange = getLastThreeMonthsRange();
        break;
      default:
        return;
    }
    setStartDate(dateRange.start);
    setEndDate(dateRange.end);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Reports & Analytics
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Filters
        </Typography>
        
        {/* Date Presets */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Date Ranges:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="Last Month" 
              onClick={() => handleDatePreset('lastMonth')}
              color={startDate === getLastMonthRange().start ? 'primary' : 'default'}
              variant={startDate === getLastMonthRange().start ? 'filled' : 'outlined'}
            />
            <Chip 
              label="This Month" 
              onClick={() => handleDatePreset('thisMonth')}
              color={startDate === getThisMonthRange().start ? 'primary' : 'default'}
              variant={startDate === getThisMonthRange().start ? 'filled' : 'outlined'}
            />
            <Chip 
              label="Last 3 Months" 
              onClick={() => handleDatePreset('lastThreeMonths')}
              color={startDate === getLastThreeMonthsRange().start ? 'primary' : 'default'}
              variant={startDate === getLastThreeMonthsRange().start ? 'filled' : 'outlined'}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box display="flex" gap={1} flexDirection="column">
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
                disabled={isGenerating}
              >
                Refresh Data
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Attendance Report" />
          <Tab label="Leave Report" />
          <Tab label="Payroll Report" />
        </Tabs>
      </Paper>

      {/* Attendance Report */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Report Actions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Attendance Report - {startDate && endDate ? 
                    `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : 
                    'All Time'
                  }
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<Assessment />}
                    onClick={() => handleGenerateReport('attendance')}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
          {/* Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccessTime color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Days
                    </Typography>
                    <Typography variant="h4">
                      {attendanceReport?.summary?.totalDays || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Hours
                    </Typography>
                    <Typography variant="h4">
                      {attendanceReport?.summary?.totalHours?.toFixed(1) || '0.0'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assessment color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Regular Hours
                    </Typography>
                    <Typography variant="h4">
                      {attendanceReport?.summary?.totalRegularHours?.toFixed(1) || '0.0'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <People color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Overtime Hours
                    </Typography>
                    <Typography variant="h4">
                      {attendanceReport?.summary?.totalOvertimeHours?.toFixed(1) || '0.0'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Daily Hours Trend
              </Typography>
              {attendanceLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <LineChart width={600} height={300} data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#8884d8" />
                </LineChart>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Average Hours per Day
              </Typography>
              <Typography variant="h3" color="primary">
                {attendanceReport?.summary?.averageHoursPerDay?.toFixed(1) || '0.0'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Leave Report */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Report Actions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Leave Report - {startDate && endDate ? 
                    `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : 
                    'All Time'
                  }
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<Assessment />}
                    onClick={() => handleGenerateReport('leave')}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Leave Type Distribution
              </Typography>
              {leaveLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <PieChart width={400} height={300}>
                  <Pie
                    data={leaveTypeData}
                    cx={200}
                    cy={150}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leaveTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Leave Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="text.secondary">Total Leaves</Typography>
                  <Typography variant="h4">{leaveReport?.summary?.totalLeaves || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary">Total Days</Typography>
                  <Typography variant="h4">{leaveReport?.summary?.totalDays || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary">Approved</Typography>
                  <Typography variant="h4" color="success.main">
                    {leaveReport?.summary?.approvedLeaves || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary">Pending</Typography>
                  <Typography variant="h4" color="warning.main">
                    {leaveReport?.summary?.pendingLeaves || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Payroll Report */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Report Actions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Payroll Report - {startDate && endDate ? 
                    `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : 
                    'All Time'
                  }
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<Assessment />}
                    onClick={() => handleGenerateReport('payroll')}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payroll Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary">Total Payrolls</Typography>
                  <Typography variant="h4">{payrollReport?.summary?.totalPayrolls || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary">Total Gross Pay</Typography>
                  <Typography variant="h4">${payrollReport?.summary?.totalGrossPay?.toFixed(2) || '0.00'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary">Total Deductions</Typography>
                  <Typography variant="h4">${payrollReport?.summary?.totalDeductions?.toFixed(2) || '0.00'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="text.secondary">Total Net Pay</Typography>
                  <Typography variant="h4">${payrollReport?.summary?.totalNetPay?.toFixed(2) || '0.00'}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Employee Payroll Comparison
              </Typography>
              {payrollLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <BarChart width={800} height={300} data={payrollChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="employee" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="grossPay" fill="#8884d8" name="Gross Pay" />
                  <Bar dataKey="netPay" fill="#82ca9d" name="Net Pay" />
                </BarChart>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}



