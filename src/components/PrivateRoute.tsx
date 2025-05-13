
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { RoleUtils } from '@/lib/utils/RoleUtils';

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

  // Tentar atualizar dados do usuário se temos sessão mas não temos usuário
  useEffect(() => {
    const attemptRefresh = async () => {
      if (isRefreshing || !session?.user?.id) return;
      
      setIsRefreshing(true);
      
      try {
        await refreshUser();
        setTimeout(() => {
          setIsRefreshing(false);
          setRefreshAttempts(prev => prev + 1);
        }, 500);
      } catch (err) {
        toast.error('Falha ao carregar dados do usuário. Tente fazer login novamente.');
        setIsRefreshing(false);
        navigate('/login', { state: { from: location.pathname }, replace: true });
      }
    };
    
    if (!loading && session && (!user || refreshAttempts < MAX_REFRESH_ATTEMPTS)) {
      attemptRefresh();
    }
  }, [loading, session, user, refreshUser, navigate, location.pathname, refreshAttempts, isRefreshing]);

  // Redirecionar para login após tentativas máximas
  useEffect(() => {
    if (!loading && session && !user && refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      toast.error('Não foi possível carregar seu perfil. Por favor, tente fazer login novamente.');
      navigate('/login', { state: { from: location.pathname }, replace: true });
    }
  }, [loading, session, user, refreshAttempts, navigate, location.pathname]);

  // Mostrar estado de carregamento
  if (loading || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Estado de carregamento estendido
  if (session && !user && refreshAttempts < MAX_REFRESH_ATTEMPTS) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Carregando seu perfil...</p>
      </div>
    );
  }

  // Redirecionar se não estiver autenticado
  if (!user || !session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Verificar permissão de role usando a nova classe utilitária
  if (requiredRole) {
    const hasRequiredRole = RoleUtils.hasRole(user, requiredRole);
    
    if (!hasRequiredRole) {
      toast.error('Você não tem permissão para acessar esta página.');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Renderizar conteúdo protegido
  return <>{children}</>;
};

export default PrivateRoute;
