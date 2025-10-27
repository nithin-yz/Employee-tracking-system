import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Timesheets from './pages/Timesheets';
import LeaveRequests from './pages/LeaveRequests';
import EmployeePortal from './pages/EmployeePortal';
import ManagerDashboard from './pages/ManagerDashboard';
import HRAdmin from './pages/HRAdmin';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import RoleBasedDashboard from './components/RoleBasedDashboard';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f6f6d',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<RoleBasedDashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="timesheets" element={<Timesheets />} />
                <Route path="leaves" element={<LeaveRequests />} />
                <Route path="employee-portal" element={
                  <ProtectedRoute requiredRole="employee">
                    <EmployeePortal />
                  </ProtectedRoute>
                } />
                <Route path="manager-dashboard" element={
                  <ProtectedRoute requiredRole="manager">
                    <ManagerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="hr-admin" element={
                  <ProtectedRoute requiredRole="hr_admin">
                    <HRAdmin />
                  </ProtectedRoute>
                } />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;