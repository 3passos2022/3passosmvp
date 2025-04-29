
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

  // Function to check user role - using the imported hasRole from ProfileService
  const checkUserRole = (role: UserRole | string) => {
    return hasRole(user, role);
  };

  // Esta função será usada para buscar o perfil do usuário
  const fetchUserProfile = async (sessionUser: User) => {
    try {
      // Tentar obter o perfil do usuário usando a função do ProfileService
      const profileData = await ProfileService.getUserProfile(
        sessionUser.id,
        sessionUser.email || undefined,
        true // forçar atualização do cache
      );
      
      if (profileData) {
        console.log('Perfil do usuário encontrado:', profileData);
        setUser(profileData);
        return;
      }
      
      console.log('Nenhum perfil encontrado, criando perfil padrão...');
      
      // Criar um perfil padrão se não encontrado
      const newProfile = await ProfileService.createDefaultProfile(
        sessionUser.id,
        sessionUser.email || '',
        UserRole.CLIENT
      );
      
      if (newProfile) {
        setUser(newProfile);
        console.log('Perfil padrão criado com sucesso');
      } else {
        console.error('Falha ao criar perfil padrão');
        // Criar um perfil mínimo localmente para permitir a navegação
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
      console.error('Erro ao buscar perfil de usuário:', error);
      // Criar um perfil mínimo para permitir a navegação
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

  // Set up auth state listener and check current session
  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    
    // Function to handle auth state changes
    const handleAuthChange = (event: string, newSession: Session | null) => {
      console.log('Auth state changed:', event, newSession?.user?.id);
      
      // Update session state immediately
      setSession(newSession);
      
      // Se o usuário fez logout, limpe os dados
      if (!newSession) {
        console.log('Auth state change: No session, setting user to null');
        setUser(null);
        setSubscription(null);
        setLoading(false);
        return;
      }
      
      // Usando setTimeout(0) para evitar problemas de recursão com useEffect
      setTimeout(() => {
        if (newSession.user) {
          fetchUserProfile(newSession.user);
        }
        setLoading(false);
      }, 0);
    };
    
    // Set up the auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Then check current session
    const checkCurrentSession = async () => {
      try {
        console.log('AuthProvider: Checking current session');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('Current session:', data.session?.user?.id);
        
        // Atualizar a sessão 
        setSession(data.session);
        
        // Se temos uma sessão, buscar o perfil
        if (data.session?.user) {
          await fetchUserProfile(data.session.user);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };
    
    checkCurrentSession();

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign up function
  async function signUp(email: string, password: string, role: UserRole) {
    try {
      console.log('Signing up user with email:', email, 'and role:', role);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
        },
      });

      if (error) {
        console.error('Error signing up:', error);
        return { error, data: null };
      }

      console.log('Sign up successful:', data);
      
      // Se o registro foi bem sucedido e temos um usuário, criar perfil
      if (data?.user) {
        try {
          // Esperar um momento para garantir que o usuário seja criado no Supabase
          setTimeout(async () => {
            await ProfileService.createDefaultProfile(data.user.id, email, role);
          }, 500);
        } catch (profileError) {
          console.error('Error creating profile after signup:', profileError);
        }
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      return { error: error as Error, data: null };
    }
  }

  // Sign in function
  async function signIn(email: string, password: string) {
    try {
      console.log('Signing in user with email:', email);
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Sign in result:', result);
      
      if (result.error) {
        console.error('Sign in error:', result.error);
      } else {
        console.log('Sign in successful, user ID:', result.data.user?.id);
      }
      
      return result;
    } catch (error) {
      console.error('Exception during sign in:', error);
      return { error: error as Error, data: null };
    }
  }

  // Sign out function
  async function signOut() {
    console.log('Signing out user');
    ProfileService.clearCache(); // Limpar cache de perfis
    await supabase.auth.signOut();
    console.log('Sign out completed');
  }

  // Password reset functions
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

  // Profile management functions - using ProfileService
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

  // Refresh user profile data
  async function refreshUser() {
    console.log('Refreshing user profile');
    if (!session?.user?.id) {
      console.error("Cannot refresh user: No user ID available");
      return;
    }
    
    try {
      // Force refresh from database
      const refreshedProfile = await ProfileService.getUserProfile(
        session.user.id,
        session.user.email || undefined,
        true // force refresh
      );
      
      if (refreshedProfile) {
        console.log("User profile refreshed successfully with role:", refreshedProfile.role);
        setUser(refreshedProfile);
      } else {
        console.log("No profile found during refresh, attempting to create one");
        
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
      console.error("Error refreshing user profile:", error);
      toast.error('Falha ao atualizar dados do usuário');
    }
  }

  // Admin functions
  async function makeAdmin(userId: string) {
    if (!user) {
      return { error: new Error('No user logged in'), data: null };
    }
    
    return await ProfileService.makeAdmin(user.id, userId);
  }

  // Subscription management
  async function checkSubscription() {
    if (!session) return;

    try {
      setSubscriptionLoading(true);
      console.log('Checking subscription status');
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription({
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null
        });
        return;
      }
      
      if (data) {
        console.log('Subscription check returned:', data);
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
      console.error('Error invoking check-subscription function:', error);
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

  console.log('AuthProvider: Current auth state:', {
    isAuthenticated: !!user,
    userId: user?.id,
    userRole: user?.role,
    userRoleType: user ? typeof user.role : 'undefined',
    sessionExists: !!session
  });

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
