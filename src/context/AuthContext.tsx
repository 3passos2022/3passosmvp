import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { createUserProfile, getUserProfile } from '@/integrations/supabase/database-functions';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus } from '@/lib/types/subscriptions';
import { ExtendedUser, UserRole } from '@/lib/types';

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for logout
  refreshUser: () => Promise<void>;
  updateUser: (updates: any) => Promise<void>;
  updateProfile: (updates: any) => Promise<{ error: any | null }>;
  refreshSubscription: () => Promise<any>;
  subscription: SubscriptionStatus | null;
  subscriptionLoading: boolean;
  makeAdmin?: (userId: string) => Promise<void>;
  signIn?: (email: string, password?: string) => Promise<{ error: any | null }>;
  signUp?: (email: string, password: string, role: UserRole) => Promise<{ error: any | null }>;
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
      if (session?.user) {
        // Cast to ExtendedUser with required fields
        const extendedUser: ExtendedUser = {
          ...session.user,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as UserRole) || UserRole.CLIENT
        };
        setUser(extendedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    loadSession();

    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        // Cast to ExtendedUser with required fields
        const extendedUser: ExtendedUser = {
          ...session.user,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as UserRole) || UserRole.CLIENT
        };
        setUser(extendedUser);
      } else {
        setUser(null);
      }
    });
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      let result;
      if (password) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signInWithOtp({ email });
      }
      
      if (result.error) {
        toast({
          title: 'Erro ao fazer login',
          description: result.error.message,
          variant: "destructive"
        });
        return { error: result.error };
      }
      
      toast({
        title: 'Login realizado com sucesso!',
        variant: "default"
      });
      
      // Atraso para garantir atualização do estado
      setTimeout(() => {
        if (!user || !session) {
          navigate('/');
        }
      }, 500);
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro inesperado ao fazer login',
        variant: "destructive"
      });
      return { error };
    }
  };

  // Provide aliases for consistency with component usage
  const signIn = login;

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role: role
          }
        }
      });
      
      if (error) {
        toast({
          title: 'Erro ao criar conta',
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }
      
      // Create user profile
      if (data.user) {
        try {
          await createUserProfile(data.user.id, data.user.email || '', role);
        } catch (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }
      
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu e-mail para confirmar seu cadastro.',
        variant: "default"
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        variant: "destructive"
      });
      return { error };
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
        variant: "destructive"
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
        const extendedUser: ExtendedUser = {
          ...data.user,
          email: data.user.email || '',
          role: (data.user.user_metadata?.role as UserRole) || UserRole.CLIENT
        };
  
        // Buscar informações adicionais do perfil
        const profileData = await getUserProfile(data.user.id);
        
        // Atualizar o estado do usuário com as informações do perfil
        if (profileData) {
          const updatedUser: ExtendedUser = {
            ...extendedUser,
            ...(profileData as Record<string, any>),
            // Ensure required fields
            email: profileData.email || extendedUser.email,
            role: profileData.role || extendedUser.role
          };
          setUser(updatedUser);
        } else {
          setUser(extendedUser);
        }
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Erro ao atualizar informações do usuário:", error);
      toast({
        title: "Falha ao carregar informações do usuário",
        variant: "destructive"
      });
      throw error;
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
      if (updates.name && user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: updates.name })
          .eq('id', user.id);

        if (profileError) {
          console.error("Erro ao atualizar perfil:", profileError);
          toast({
            title: "Falha ao atualizar informações do perfil",
            variant: "destructive"
          });
        }
      }

      const result = await refreshUser();
      if (result && result.success) {
        toast({
          title: 'Perfil atualizado!',
          variant: "default"
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: "destructive"
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
        
        toast({
          title: 'Perfil atualizado com sucesso',
          variant: "default"
        });
        return { error: null };
      }
      
      return { error: new Error('Usuário não encontrado') };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: "destructive"
      });
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
        toast({
          title: 'Você não tem permissão para executar esta ação',
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase.rpc('update_user_role', { 
        user_id: userId,
        new_role: UserRole.ADMIN
      });
      
      if (error) throw error;
      
      toast({
        title: 'Usuário promovido a administrador com sucesso!',
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error making admin:', error);
      toast({
        title: 'Erro ao promover a administrador',
        description: 'Tente novamente.',
        variant: "destructive"
      });
    }
  };

  // Function to refresh subscription status
  const refreshSubscription = async () => {
    if (!session || !user) {
      setSubscription({ subscribed: false, subscription_tier: 'free' });
      setSubscriptionLoading(false);
      return { subscribed: false, subscription_tier: 'free' };
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
      if (user) {
        setUser(prevUser => {
          if (!prevUser) return null;
          return { 
            ...prevUser, 
            subscribed: data.subscribed || false,
            subscription_tier: data.subscription_tier || 'free',
            subscription_end: data.subscription_end
          };
        });
      }
      
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
