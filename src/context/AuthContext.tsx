import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '@/lib/types';
import { SubscriptionStatus } from '@/lib/types/subscriptions';
import { toast } from 'sonner';
import { getUserProfile } from '@/integrations/supabase/database-functions';

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

  // Setup auth state listener and check current session
  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    
    // First set up the auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.id);
      
      // Update session state immediately
      setSession(newSession);
      
      if (newSession) {
        try {
          // Fetch user profile data
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching user profile during auth state change:', error);
            
            // Create fallback user profile with basic information
            const fallbackUser: UserProfile = {
              id: newSession.user.id,
              email: newSession.user.email || '',
              role: UserRole.CLIENT, // Default to CLIENT role
              created_at: new Date().toISOString(),
              subscribed: false,
              subscription_tier: 'free' as 'free' | 'basic' | 'premium',
              subscription_end: null
            };
            
            setUser(fallbackUser);
            
            // Attempt to create profile in database
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{ 
                id: newSession.user.id,
                name: newSession.user.email?.split('@')[0] || '',
                role: UserRole.CLIENT,
                phone: ''
              }]);
            
            if (insertError) {
              console.error('Error creating default profile:', insertError);
            } else {
              console.log('Default profile created successfully');
            }
          } else if (profileData) {
            console.log('User profile found:', profileData);
            
            // Debug the role coming from database
            console.log('Role from database:', profileData.role);
            console.log('Type of role from database:', typeof profileData.role);
            
            // Map database role string to UserRole enum correctly
            let userRole: UserRole;
            
            if (profileData.role === 'provider') {
              userRole = UserRole.PROVIDER;
            } else if (profileData.role === 'admin') {
              userRole = UserRole.ADMIN;
            } else {
              userRole = UserRole.CLIENT;
            }
            
            console.log('Mapped role to enum:', userRole);
            
            // Map database profile to UserProfile type with correctly mapped role
            setUser({
              id: profileData.id,
              email: newSession.user.email || profileData.id,
              role: userRole,
              name: profileData.name || undefined,
              avatar_url: undefined,
              address: undefined,
              phone: profileData.phone || undefined,
              created_at: profileData.created_at,
              subscribed: false,
              subscription_tier: 'free',
              subscription_end: null
            });
          } else {
            console.log('No profile found, creating default profile');
            
            // Create default profile if not found
            const defaultProfile: UserProfile = {
              id: newSession.user.id,
              email: newSession.user.email || '',
              role: UserRole.CLIENT,
              created_at: new Date().toISOString(),
              subscribed: false,
              subscription_tier: 'free',
              subscription_end: null
            };
            
            setUser(defaultProfile);
            
            // Create profile in database
            const { error: createError } = await supabase
              .from('profiles')
              .insert([{ 
                id: newSession.user.id,
                name: newSession.user.email?.split('@')[0] || '',
                role: UserRole.CLIENT,
                phone: ''
              }]);
              
            if (createError) {
              console.error('Error creating profile:', createError);
            } else {
              console.log('Default profile created successfully');
            }
          }
        } catch (error) {
          console.error('Exception in auth state change handler:', error);
          
          // Fallback to minimal profile on error
          if (newSession.user) {
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
        } finally {
          setLoading(false);
        }
      } else {
        console.log('Auth state change: No session, setting user to null');
        setUser(null);
        setSubscription(null);
        setLoading(false);
      }
    });

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
        
        // The onAuthStateChange handler will handle setting the user
        // We don't need to duplicate that logic here
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

  // Profile management functions
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

  // Refresh user profile data
  async function refreshUser() {
    console.log('Refreshing user profile');
    if (!session?.user?.id) {
      console.error("Cannot refresh user: No user ID available");
      return;
    }
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error refreshing user profile:", error);
        return;
      }
      
      if (profileData) {
        console.log("Original profile data from database:", profileData);
        
        // Debug the role coming from database
        console.log('Role from database during refresh:', profileData.role);
        console.log('Type of role from database during refresh:', typeof profileData.role);
        
        // Map database role string to UserRole enum correctly
        let userRole: UserRole;
        
        if (profileData.role === 'provider') {
          userRole = UserRole.PROVIDER;
        } else if (profileData.role === 'admin') {
          userRole = UserRole.ADMIN;
        } else {
          userRole = UserRole.CLIENT;
        }
        
        console.log('Mapped role to enum during refresh:', userRole);
        
        setUser({
          id: profileData.id,
          email: session.user.email || profileData.id,
          role: userRole,
          name: profileData.name || undefined,
          avatar_url: undefined,
          address: undefined,
          phone: profileData.phone || undefined,
          created_at: profileData.created_at,
          subscribed: false,
          subscription_tier: 'free',
          subscription_end: null
        });
        console.log("User profile refreshed successfully with role:", userRole);
      } else {
        console.log("No profile found during refresh");
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  }

  // Admin functions
  async function makeAdmin(userId: string) {
    if (!user || user.role !== UserRole.ADMIN) {
      return { error: new Error('Unauthorized'), data: null };
    }

    try {
      const { error, data: updatedData } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: UserRole.ADMIN
      });

      return { error: error || null, data: updatedData };
    } catch (error) {
      return { error: error as Error, data: null };
    }
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
