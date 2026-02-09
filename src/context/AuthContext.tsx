import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '@/lib/types';
import { SubscriptionStatus } from '@/lib/types/subscriptions';
import { toast } from 'sonner';
import ProfileService, { hasRole } from '@/services/ProfileService';

type AuthContextType = {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionStatus | null;
  subscriptionLoading: boolean;
  checkUserRole: (role: UserRole | string) => boolean;
  signUp: (userData: {
    email: string;
    password: string;
    role: UserRole;
    name: string;
    phone?: string;
    cpf?: string;
    cnpj?: string;
  }) => Promise<any>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: { user: User; session: Session } | { user: null; session: null }; error: any }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ data: any; error: any }>;
  resetPassword: (newPassword: string) => Promise<{ data: any; error: any }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null; data: UserProfile | null }>;
  refreshUser: () => Promise<void>;
  makeAdmin: (userId: string) => Promise<{ error: Error | null; data: any }>;
  refreshSubscription: () => Promise<void>;
  hasRole: (role: UserRole | string) => boolean;
  isRecoveringPassword: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

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
        } as UserProfile);
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
      } as UserProfile);
    }
  };

  // Configuração do listener de autenticação
  useEffect(() => {
    // Função para lidar com mudanças de estado de autenticação
    const handleAuthChange = async (event: string, newSession: Session | null) => {
      setSession(newSession);

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveringPassword(true);
      }

      if (!newSession) {
        setUser(null);
        setSubscription(null);
        setLoading(false);
        setIsRecoveringPassword(false);
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

  // Função de registro simplificada - removida a criação manual de perfil
  async function signUp(userData: {
    email: string;
    password: string;
    role: UserRole;
    name: string;
    phone?: string;
    cpf?: string;
    cnpj?: string;
  }) {
    const { email, password, role, name, phone, cpf, cnpj } = userData;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // Dados que serão usados pelo trigger handle_new_user()
            name: name,
            role: role,
            phone: phone || '',
            cpf: cpf || '',
            cnpj: cnpj || '',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return { error, data: null };
      }

      if (data?.user) {
        // Aguardar um pouco para o trigger processar
        setTimeout(async () => {
          await fetchUserProfile(data.user);
        }, 1000);
      }

      return { data, error: null };
    } catch (error) {
      const e = error as Error;
      toast.error(e.message);
      return { error: e, data: null };
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

    // @ts-ignore - ProfileService might need to be updated but we use this as is for now
    return await ProfileService.makeAdmin(user.id, userId);
  }

  // Gerenciamento de assinatura
  async function checkSubscription() {
    if (!session) return;

    try {
      setSubscriptionLoading(true);

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        setSubscription({
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null
        });
        return;
      }

      if (data) {
        setSubscription({
          subscribed: data.subscribed,
          subscription_tier: (data.subscription_tier || 'free') as 'free' | 'basic' | 'premium',
          subscription_end: data.subscription_end
        });
      } else {
        setSubscription({
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null
        });
      }
    } catch (error) {
      setSubscription({
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null
      });
    } finally {
      setSubscriptionLoading(false);
    }
  }

  async function refreshSubscription() {
    if (!user) {
      return;
    }
    await checkSubscription();
  }

  // Context value
  const value: AuthContextType = {
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
    checkUserRole,
    hasRole: checkUserRole,
    isRecoveringPassword
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
