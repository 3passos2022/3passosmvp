
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '@/lib/types';
import { SubscriptionStatus } from '@/lib/types/subscriptions';
import { toast } from 'sonner';

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
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        setSession(newSession);
        
        if (newSession) {
          try {
            await fetchUserProfile(newSession.user.id);
          } catch (error) {
            console.error('Error fetching user profile during auth state change:', error);
            // Criar perfil básico para garantir funcionamento
            setUser({
              id: newSession.user.id,
              email: newSession.user.email || '',
              role: UserRole.CLIENT,
              created_at: new Date().toISOString(),
              subscribed: false,
              subscription_tier: 'free',
              subscription_end: null
            });
          }
        } else {
          console.log('Auth state change: No session, setting user to null');
          setUser(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    // Verificar sessão atual
    checkCurrentSession();

    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkCurrentSession() {
    try {
      console.log('AuthProvider: Checking current session');
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      
      console.log('Current session:', data.session?.user?.id);
      setSession(data.session);

      if (data.session) {
        try {
          await fetchUserProfile(data.session.user.id);
        } catch (error) {
          console.error('Error fetching user profile during session check:', error);
          // Criar perfil básico para garantir funcionamento
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            role: UserRole.CLIENT,
            created_at: new Date().toISOString(),
            subscribed: false,
            subscription_tier: 'free',
            subscription_end: null
          });
        }
      } else {
        console.log('No current session found');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProfile(userId: string) {
    try {
      console.log('Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Se o perfil não existe, tentar criar um
        if (error.code === 'PGRST116') { // código para "nenhum resultado encontrado"
          console.log('No profile found, creating default profile');
          
          if (session?.user) {
            const defaultProfile = {
              id: session.user.id,
              email: session.user.email || '',
              role: UserRole.CLIENT,
              created_at: new Date().toISOString(),
              subscribed: false,
              subscription_tier: 'free',
              subscription_end: null
            };
            
            setUser(defaultProfile);
            
            // Tentar criar o perfil na base de dados
            const { error: createError } = await supabase
              .from('profiles')
              .insert([{ 
                id: session.user.id,
                name: '',
                role: UserRole.CLIENT,
                phone: ''
              }]);
              
            if (createError) {
              console.error('Error creating profile:', createError);
            } else {
              console.log('Default profile created successfully');
            }
            
            return;
          }
        }
        
        // Definir um usuário básico para permitir navegação
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: UserRole.CLIENT,
            created_at: new Date().toISOString(),
            subscribed: false,
            subscription_tier: 'free',
            subscription_end: null
          });
        }
        return;
      }

      if (data) {
        console.log('User profile found:', data);
        
        setUser({
          id: data.id,
          email: session?.user.email || data.id,
          role: data.role as UserRole,
          name: data.name || undefined,
          avatar_url: undefined,
          address: undefined,
          phone: data.phone || undefined,
          created_at: data.created_at,
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null
        });
        
        console.log('User state updated with profile data');
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      if (session?.user) {
        // Definir um usuário básico para permitir navegação
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: UserRole.CLIENT,
          created_at: new Date().toISOString(),
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null
        });
      }
    }
  }

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
      return { data, error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      return { error: error as Error, data: null };
    }
  }

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

  async function signOut() {
    console.log('Signing out user');
    await supabase.auth.signOut();
    console.log('Sign out completed');
  }

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

  async function updateProfile(data: Partial<UserProfile>) {
    if (!user) return { error: new Error('No user logged in'), data: null };

    try {
      const { error, data: updatedData } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        return { error, data: null };
      }

      setUser((prev) => (prev ? { ...prev, ...data } : null));
      return { data: updatedData, error: null };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }

  // Implementar a função refreshUser
  async function refreshUser() {
    console.log('Refreshing user profile');
    if (!session?.user?.id) {
      console.error("Cannot refresh user: No user ID available");
      return;
    }
    
    try {
      await fetchUserProfile(session.user.id);
      console.log("User profile refreshed successfully");
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  }

  async function makeAdmin(userId: string) {
    if (!user || user.role !== UserRole.ADMIN) {
      return { error: new Error('Unauthorized'), data: null };
    }

    try {
      const { error, data: updatedData } = await supabase
        .from('profiles')
        .update({ role: UserRole.ADMIN })
        .eq('id', userId);

      return { error, data: updatedData };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }

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
          subscription_tier: data.subscription_tier as 'free' | 'basic' | 'premium' || 'free',
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
    subscriptionLoading
  };

  console.log('AuthProvider: Current auth state:', {
    isAuthenticated: !!user,
    userId: user?.id,
    userRole: user?.role,
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
