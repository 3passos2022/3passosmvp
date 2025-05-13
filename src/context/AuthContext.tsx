
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { createUserProfile, getUserProfile } from '@/integrations/supabase/database-functions';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus } from '@/lib/types/subscriptions';
import { ExtendedUser, UserRole } from '@/lib/types';

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for logout
  refreshUser: () => Promise<void>;
  updateUser: (updates: any) => Promise<void>;
  updateProfile: (updates: any) => Promise<{ error: any | null }>;
  refreshSubscription: () => Promise<any>;
  subscription: SubscriptionStatus | null;
  subscriptionLoading: boolean;
  makeAdmin?: (userId: string) => Promise<void>;
  signIn?: (email: string) => Promise<void>; // Alias for login
  signUp?: (email: string) => Promise<void>; // Alias for login
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
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

  // Provide aliases for consistency with component usage
  const signIn = login;
  const signUp = login;

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

  // Alias for logout
  const signOut = logout;

  const refreshUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
  
      if (error) {
        console.error("Erro ao obter usuário:", error);
        throw error;
      }
  
      if (data?.user) {
        // Create extended user
        const extendedUser: ExtendedUser = data.user;
  
        // Buscar informações adicionais do perfil
        const profileData = await getUserProfile(data.user.id);
        
        // Atualizar o estado do usuário com as informações do perfil
        if (profileData) {
          const updatedUser = {
            ...extendedUser,
            ...profileData
          };
          setUser(updatedUser);
        } else {
          setUser(extendedUser);
        }
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

  // Add updateProfile function with the expected return type
  const updateProfile = async (updates: any) => {
    try {
      setLoading(true);
      
      // Handle profile updates
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
          
        if (profileError) {
          console.error("Erro ao atualizar perfil:", profileError);
          return { error: profileError };
        }
        
        // Update local user state with the new profile info
        setUser(prevUser => {
          if (!prevUser) return null;
          return { ...prevUser, ...updates };
        });
        
        toast.success('Perfil atualizado com sucesso');
        return { error: null };
      }
      
      return { error: new Error('Usuário não encontrado') };
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Add makeAdmin function
  const makeAdmin = async (userId: string) => {
    try {
      // Only allow admins to make other users admin
      if (user?.role !== UserRole.ADMIN) {
        toast.error('Você não tem permissão para executar esta ação');
        return;
      }
      
      const { error } = await supabase.rpc('update_user_role', { 
        user_id: userId,
        new_role: UserRole.ADMIN
      });
      
      if (error) throw error;
      
      toast.success('Usuário promovido a administrador com sucesso!');
    } catch (error: any) {
      console.error('Error making admin:', error);
      toast.error('Erro ao promover a administrador. Tente novamente.');
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
      
      const subscriptionStatus = {
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || 'free',
        subscription_end: data.subscription_end
      };
      
      setSubscription(subscriptionStatus);
      
      // Update user's subscription info
      setUser(prevUser => {
        if (!prevUser) return null;
        return { 
          ...prevUser, 
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || 'free',
          subscription_end: data.subscription_end
        };
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
    signOut, // Add alias
    signIn, // Add alias
    signUp, // Add alias
    refreshUser,
    updateUser,
    updateProfile, // Add new method
    refreshSubscription,
    subscription,
    subscriptionLoading,
    makeAdmin, // Add new method
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
