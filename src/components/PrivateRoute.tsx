
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole, children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if not loading and no user
    if (!loading && !user) {
      navigate('/login');
    }
    
    // Only redirect if user doesn't have required role
    if (!loading && user && requiredRole && user.role !== requiredRole) {
      navigate('/unauthorized');
    }
  }, [user, loading, requiredRole, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if missing required role
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render the protected content
  return <>{children}</>;
};

export default PrivateRoute;
