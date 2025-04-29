
import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole, children }) => {
  const { user, loading, session, refreshUser } = useAuth();
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

  // Attempt to refresh user data if we have a session but no user
  useEffect(() => {
    if (!loading && session && !user) {
      console.log('PrivateRoute: Session exists but no user, attempting to refresh user data');
      refreshUser().catch(err => {
        console.error('Failed to refresh user data:', err);
        toast.error('Falha ao carregar dados do usuário. Tente fazer login novamente.');
        navigate('/login', { state: { from: location.pathname }, replace: true });
      });
    }
  }, [loading, session, user, refreshUser, navigate, location.pathname]);

  // Mostrar estado de carregamento enquanto verifica autenticação
  if (loading) {
    console.log('PrivateRoute: Loading state, showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we have a session but no user profile, show extended loading state
  if (session && !user) {
    console.log('PrivateRoute: Session exists but user profile not loaded yet');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Carregando seu perfil...</p>
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
    toast.error('Você não tem permissão para acessar esta página.');
    return <Navigate to="/unauthorized" replace />;
  }

  // Renderizar o conteúdo protegido
  console.log('PrivateRoute: User authenticated with correct role, rendering children');
  return <>{children}</>;
};

export default PrivateRoute;
