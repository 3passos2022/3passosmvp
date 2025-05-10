import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '@/lib/types';
import { SubscriptionStatus } from '@/lib/types/subscriptions';
import { toast } from 'sonner';
import ProfileService, { hasRole } from '@/services/ProfileService';

export interface AuthContextProps {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole) => Promise<{
    error: Error | null;
    data: any;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  resetPassword: (newPassword: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{
    error: Error | null;
    data: any;
  }>;
  refreshUser: () => Promise<void>;
  makeAdmin: (userId: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  subscription: SubscriptionStatus | null;
  refreshSubscription: () => Promise<void>;
  subscriptionLoading: boolean;
  hasRole: (role: UserRole | string) => boolean;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);

  // Function to check user role
  const checkUserRole = (role: UserRole | string) => {
    return hasRole(user, role);
  };

  // Buscar perfil do usuário de forma simplificada
  const fetchUserProfile = async (sessionUser: User) => {
    try {
      const profileData = await ProfileService.getUserProfile(
        sessionUser.id,
        sessionUser.email || undefined
      );
      
      if (profileData) {
        setUser(profileData);
        return;
      }
      
      // Criar um perfil padrão se não encontrado
      const newProfile = await ProfileService.createDefaultProfile(
        sessionUser.id,
        sessionUser.email || '',
        UserRole.CLIENT
      );
      
      if (newProfile) {
        setUser(newProfile);
      } else {
        // Perfil mínimo para navegação
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          role: UserRole.CLIENT,
          created_at: new Date().toISOString(),
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null
        });
      }
    } catch (error) {
      // Perfil mínimo em caso de erro
      setUser({
        id: sessionUser.id,
        email: sessionUser.email || '',
        role: UserRole.CLIENT,
        created_at: new Date().toISOString(),
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null
      });
    }
  };

  // Configuração do listener de autenticação
  useEffect(() => {
    // Função para lidar com mudanças de estado de autenticação
    const handleAuthChange = async (event: string, newSession: Session | null) => {
      setSession(newSession);
      
      if (!newSession) {
        setUser(null);
        setSubscription(null);
        setLoading(false);
        return;
      }
      
      // Usar setTimeout para evitar recursão
      setTimeout(async () => {
        if (newSession.user) {
          await fetchUserProfile(newSession.user);
        }
        setLoading(false);
      }, 0);
    };
    
    // Configurar o listener de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Verificar a sessão atual
    const checkCurrentSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setLoading(false);
          return;
        }
        
        setSession(data.session);
        
        if (data.session?.user) {
          await fetchUserProfile(data.session.user);
        }
        
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    
    checkCurrentSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Função de registro simplificada
  async function signUp(email: string, password: string, role: UserRole) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });

      if (error) {
        return { error, data: null };
      }
      
      if (data?.user) {
        // Criar perfil após registro bem-sucedido
        setTimeout(async () => {
          await ProfileService.createDefaultProfile(data.user.id, email, role);
        }, 500);
      }
      
      return { data, error: null };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }

  // Função de login simplificada
  async function signIn(email: string, password: string) {
    try {
      return await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }

  // Função de logout simplificada
  async function signOut() {
    ProfileService.clearCache();
    await supabase.auth.signOut();
  }

  // Funções para redefinição de senha
  async function forgotPassword(email: string) {
    try {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }

  async function resetPassword(newPassword: string) {
    try {
      return await supabase.auth.updateUser({
        password: newPassword,
      });
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }

  // Gerenciamento de perfil simplificado
  async function updateProfile(data: Partial<UserProfile>) {
    if (!user) return { error: new Error('No user logged in'), data: null };

    try {
      const result = await ProfileService.updateProfile(user.id, data);
      
      if (!result.error) {
        setUser((prev) => (prev ? { ...prev, ...data } : null));
      }
      
      return result;
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }

  // Atualizar dados do usuário
  async function refreshUser() {
    if (!session?.user?.id) {
      return;
    }
    
    try {
      const refreshedProfile = await ProfileService.getUserProfile(
        session.user.id,
        session.user.email || undefined,
        true
      );
      
      if (refreshedProfile) {
        setUser(refreshedProfile);
      } else {
        const newProfile = await ProfileService.createDefaultProfile(
          session.user.id,
          session.user.email || '',
          UserRole.CLIENT
        );
        
        if (newProfile) {
          setUser(newProfile);
        }
      }
    } catch (error) {
      toast.error('Falha ao atualizar dados do usuário');
    }
  }

  // Funções administrativas
  async function makeAdmin(userId: string) {
    if (!user) {
      return { error: new Error('No user logged in'), data: null };
    }
    
    return await ProfileService.makeAdmin(user.id, userId);
  }

  // Gerenciamento de assinatura com timeout
  async function checkSubscription() {
    if (!session) return;

    try {
      setSubscriptionLoading(true);
      setSubscriptionError(null);
      
      // Criar uma promessa que rejeita após o timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido ao verificar assinatura")), 10000);
      });
      
      // Corrida entre a chamada à API e o timeout
      const result = await Promise.race([
        supabase.functions.invoke('check-subscription'),
        timeoutPromise
      ]);
      
      if ('error' in result && result.error) {
        console.error("Erro na resposta da função edge:", result.error);
        throw new Error(result.error);
      }
      
      if ('data' in result && result.data) {
        setSubscription({
          subscribed: result.data.subscribed,
          subscription_tier: (result.data.subscription_tier || 'free') as 'free' | 'basic' | 'premium',
          subscription_end: result.data.subscription_end
        });
      } else {
        console.warn("Resposta da verificação de assinatura sem dados");
        setSubscription({
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null
        });
      }
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error);
      setSubscriptionError(error as Error);
      
      // Definir um estado básico em caso de erro
      setSubscription({
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null
      });
      
      // Não mostrar toast aqui para evitar spam de erros
    } finally {
      setSubscriptionLoading(false);
    }
  }

  async function refreshSubscription() {
    if (!user) {
      return;
    }
    
    try {
      await checkSubscription();
    } catch (error) {
      console.error("Erro ao atualizar assinatura:", error);
      throw error; // Propagar o erro para permitir tratamento específico
    }
  }

  // Context value
  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshUser,
    makeAdmin,
    subscription,
    refreshSubscription,
    subscriptionLoading,
    hasRole: checkUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
