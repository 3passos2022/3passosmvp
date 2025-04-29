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
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        console.log('New session e USER:', newSession.user.id);
        setSession(newSession);
        
        if (newSession) {
          await fetchUserProfile(newSession.user.id);
        } else {
          setUser(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    checkCurrentSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkCurrentSession() {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      if (data.session) {
        await fetchUserProfile(data.session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProfile(userId: string) {
    try {
      console.log('Fetching profile for user:', userId);
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.log('Profile not found, creating new profile');
        
        // Criar um perfil básico
        const newProfile = {
          id: userId,
          email: session?.user?.email || '',
          role: UserRole.CLIENT,
          name: null,
          phone: null,
          created_at: new Date().toISOString(),
        };

        // Inserir o novo perfil
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return;
        }

        console.log('New profile created:', insertedProfile);
        
        // Definir o usuário com o perfil criado
        const userProfile = {
          id: userId,
          email: session?.user?.email || '',
          role: UserRole.CLIENT,
          name: undefined,
          avatar_url: undefined,
          address: undefined,
          phone: undefined,
          created_at: new Date().toISOString(),
          subscribed: false,
          subscription_tier: 'free' as const,
          subscription_end: null
        };

        console.log('Setting user profile after creation:', userProfile);
        setUser(userProfile);
        return;
      }

      if (existingProfile) {
        console.log('Existing profile found:', existingProfile);
        const userProfile = {
          id: existingProfile.id,
          email: session?.user?.email || '',
          role: existingProfile.role as UserRole || UserRole.CLIENT,
          name: existingProfile.name || undefined,
          avatar_url: undefined,
          address: undefined,
          phone: existingProfile.phone || undefined,
          created_at: existingProfile.created_at,
          subscribed: false,
          subscription_tier: 'free' as const,
          subscription_end: null
        };

        console.log('Setting existing user profile:', userProfile);
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Definir um perfil padrão em caso de erro
      if (session?.user) {
        const fallbackProfile = {
          id: session.user.id,
          email: session.user.email || '',
          role: UserRole.CLIENT,
          created_at: new Date().toISOString(),
          subscribed: false,
          subscription_tier: 'free' as const,
          subscription_end: null
        };
        console.log('Setting fallback profile:', fallbackProfile);
        setUser(fallbackProfile);
      }
    }
  }

  async function signUp(email: string, password: string, role: UserRole) {
    try {
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
        return { error, data: null };
      }

      return { data, error: null };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error, data: null };
      }

      if (data.session) {
        setSession(data.session);
        await fetchUserProfile(data.session.user.id);
      }

      return { data, error: null };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
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

  // Implement the refreshUser function that was missing
  async function refreshUser() {
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
