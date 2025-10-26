import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const RoleBasedDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route users to their role-specific dashboard
  switch (user.role) {
    case 'employee':
      return <Navigate to="/employee-portal" replace />;
    case 'manager':
      return <Navigate to="/manager-dashboard" replace />;
    case 'hr_admin':
      return <Navigate to="/hr-admin" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default RoleBasedDashboard;
