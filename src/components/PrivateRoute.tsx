
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { hasRole } from '@/services/ProfileService';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole, children }) => {
  const { user, loading, session, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const MAX_REFRESH_ATTEMPTS = 3;

  console.log('PrivateRoute: Rendering with', {
    isAuthenticated: !!user, 
    userRole: user?.role,
    userRoleType: user?.role ? typeof user.role : 'undefined',
    userRoleString: user?.role ? String(user.role).toLowerCase() : null,
    requiredRoleEnum: requiredRole,
    requiredRoleStr: requiredRole ? String(requiredRole).toLowerCase() : null,
    loading,
    sessionExists: !!session,
    path: location.pathname,
    refreshAttempts
  });

  // Attempt to refresh user data if we have a session but no user
  useEffect(() => {
    const attemptRefresh = async () => {
      if (isRefreshing || !session?.user?.id) return;
      
      console.log('PrivateRoute: Session exists but no user or refresh needed, attempting to refresh user data');
      setIsRefreshing(true);
      
      try {
        await refreshUser();
        // After refreshing, wait a brief moment to see if user state updates
        setTimeout(() => {
          setIsRefreshing(false);
          setRefreshAttempts(prev => prev + 1);
        }, 500);
      } catch (err) {
        console.error('Failed to refresh user data:', err);
        toast.error('Falha ao carregar dados do usuário. Tente fazer login novamente.');
        setIsRefreshing(false);
        navigate('/login', { state: { from: location.pathname }, replace: true });
      }
    };
    
    if (!loading && session && (!user || refreshAttempts < MAX_REFRESH_ATTEMPTS)) {
      attemptRefresh();
    }
  }, [loading, session, user, refreshUser, navigate, location.pathname, refreshAttempts, isRefreshing]);

  // If max refresh attempts reached and still no user, redirect to login
  useEffect(() => {
    if (!loading && session && !user && refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      console.error('PrivateRoute: Maximum refresh attempts reached, redirecting to login');
      toast.error('Não foi possível carregar seu perfil. Por favor, tente fazer login novamente.');
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [loading, session, user, refreshAttempts, navigate, location.pathname]);

  // Mostrar estado de carregamento enquanto verifica autenticação
  if (loading || isRefreshing) {
    console.log('PrivateRoute: Loading state, showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we have a session but no user profile, show extended loading state
  if (session && !user && refreshAttempts < MAX_REFRESH_ATTEMPTS) {
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

  // Verificar a role do usuário usando o helper hasRole importado do ProfileService
  if (requiredRole) {
    // Melhorado o log para mostrar valores exatos nas strings
    console.log('PrivateRoute: Role check details:', { 
      userRole: user.role, 
      userRoleType: typeof user.role,
      userRoleStr: String(user.role).toLowerCase().trim(),
      requiredRole, 
      requiredRoleType: typeof requiredRole,
      requiredRoleStr: String(requiredRole).toLowerCase().trim(),
      comparison: String(user.role).toLowerCase().trim() === String(requiredRole).toLowerCase().trim()
    });
    
    const hasRequiredRole = hasRole(user, requiredRole);
    
    if (!hasRequiredRole) {
      console.log('PrivateRoute: User lacks required role, redirecting to unauthorized');
      toast.error('Você não tem permissão para acessar esta página.');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Renderizar o conteúdo protegido
  console.log('PrivateRoute: User authenticated with correct role, rendering children');
  return <>{children}</>;
};

export default PrivateRoute;
