import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { createUserProfile, getUserProfile } from '@/integrations/supabase/database-functions';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus } from '@/lib/types/subscriptions';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: any) => Promise<void>;
  refreshSubscription: () => Promise<any>;
  subscription: SubscriptionStatus | null;
  subscriptionLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    loadSession();

    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
  }, []);

  const login = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast({
        title: 'Verifique seu email',
        description: 'Enviamos um link mágico para seu email.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer logout',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
  
      if (error) {
        console.error("Erro ao obter usuário:", error);
        throw error;
      }
  
      if (data?.user) {
        setUser(data.user);
  
        // Buscar informações adicionais do perfil
        const profileData = await getUserProfile(data.user.id);
        
        // Atualizar o estado do usuário com as informações do perfil
        setUser(prevUser => ({
          ...prevUser,
          ...profileData
        }));
      }
    } catch (error: any) {
      console.error("Erro ao atualizar informações do usuário:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar informações do usuário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      // Update user profile in "profiles" table
      if (updates.name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: updates.name })
          .eq('id', user?.id);

        if (profileError) {
          console.error("Erro ao atualizar perfil:", profileError);
          toast({
            title: "Erro",
            description: "Falha ao atualizar informações do perfil.",
            variant: "destructive"
          });
        }
      }

      await refreshUser();
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh subscription status
  const refreshSubscription = async () => {
    if (!session || !user) {
      setSubscription({ subscribed: false, subscription_tier: 'free' });
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);
    try {
      console.log("Checking subscription status for user:", user.id);
      
      const { data, error } = await supabase.functions.invoke('stripe-subscription');
      
      if (error) {
        console.error("Error checking subscription:", error);
        throw new Error(error.message);
      }
      
      console.log("Subscription status response:", data);
      
      setSubscription({
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || 'free',
        subscription_end: data.subscription_end
      });
      
      return data;
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      setSubscription({ subscribed: false, subscription_tier: 'free' });
      throw error;
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // When authentication state changes, refresh subscription
  useEffect(() => {
    if (session && user) {
      refreshSubscription().catch(err => {
        console.error("Failed to refresh subscription on auth state change:", err);
      });
    }
  }, [session, user]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    login,
    logout,
    refreshUser,
    updateUser,
    refreshSubscription,
    subscription,
    subscriptionLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
