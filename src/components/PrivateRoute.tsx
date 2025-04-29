
import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole, children }) => {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('PrivateRoute: Rendering with', {
    isAuthenticated: !!user, 
    userRole: user?.role,
    requiredRole,
    loading,
    sessionExists: !!session,
    path: location.pathname
  });

  // Mostrar estado de carregamento enquanto verifica autenticação
  if (loading) {
    console.log('PrivateRoute: Loading state, showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirecionar se não estiver autenticado
  if (!user || !session) {
    console.log('PrivateRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Redirecionar se não tiver a role necessária
  if (requiredRole && user.role !== requiredRole) {
    console.log('PrivateRoute: User lacks required role, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  // Renderizar o conteúdo protegido
  console.log('PrivateRoute: User authenticated with correct role, rendering children');
  return <>{children}</>;
};

export default PrivateRoute;
