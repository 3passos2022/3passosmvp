
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, ExtendedUser, UserProfile } from '@/lib/types';
import { getUserProfile } from '@/integrations/supabase/database-functions';
import { toast } from 'sonner';
import { SubscriptionStatus } from '@/lib/types/subscriptions';

interface AuthContextType {
  session: Session | null;
  user: ExtendedUser | null;
  loading: boolean;
  subscriptionLoading: boolean;
  subscription: SubscriptionStatus | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subscriptionRefreshedAt, setSubscriptionRefreshedAt] = useState<Date | null>(null);
  
  // Throttle subscription checks to prevent too many API calls
  const SUBSCRIPTION_CHECK_COOLDOWN = 30000; // 30 seconds

  useEffect(() => {
    async function initializeAuth() {
      try {
        // Get session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        console.log('Initial session check:', currentSession ? 'Session exists' : 'No session');
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          await loadUserData(currentSession.user);
        } else {
          setLoading(false);
        }
        
        // Set up auth listener
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth state changed:', event, newSession ? 'Session exists' : 'No session');
            setSession(newSession);
            
            if (event === 'SIGNED_IN' && newSession?.user) {
              await loadUserData(newSession.user);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setSubscription(null);
            } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
              // Just update the session, don't reload all user data
              setSession(newSession);
            }
          }
        );
        
        return () => {
          authListener.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    }
    
    initializeAuth();
  }, []);
  
  const loadUserData = async (supabaseUser: SupabaseUser) => {
    try {
      setLoading(true);
      console.log('Loading user data for:', supabaseUser.id);
      
      // Create extended user with basic info from auth
      const extendedUser: ExtendedUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: UserRole.CLIENT, // Default role
        created_at: supabaseUser.created_at || new Date().toISOString(),
        subscribed: false,
        subscription_tier: 'free'
      };
      
      setUser(extendedUser);
      
      // Load profile data in the background
      try {
        const profileData = await getUserProfile(supabaseUser.id);
        
        // Update user state with profile information
        if (profileData) {
          // Properly merge the profile data with extendedUser
          setUser({
            ...extendedUser,
            // Only add properties from profileData that exist
            name: profileData.name,
            phone: profileData.phone,
            // Always use UserRole enum for role
            role: profileData.role || extendedUser.role
          });
        } else {
          console.log('No profile found for user, using default values');
        }
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
      }
      
      // Check subscription status
      try {
        await checkSubscriptionStatus();
      } catch (subError) {
        console.error('Error checking subscription:', subError);
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkSubscriptionStatus = async () => {
    if (!session?.access_token) {
      console.log('No session token, skipping subscription check');
      return;
    }
    
    // Don't check too frequently
    if (subscriptionRefreshedAt && 
        (new Date().getTime() - subscriptionRefreshedAt.getTime() < SUBSCRIPTION_CHECK_COOLDOWN)) {
      console.log('Subscription check throttled - checked recently');
      return;
    }
    
    try {
      setSubscriptionLoading(true);
      console.log('Checking subscription status...');
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(`Error checking subscription: ${error.message}`);
      }
      
      console.log('Subscription status result:', data);
      
      setSubscription({
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || 'free',
        subscription_end: data.subscription_end || null
      });
      
      // Also update the user object with subscription data
      setUser(current => 
        current ? {
          ...current,
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || 'free',
          subscription_end: data.subscription_end || null
        } : null
      );
      
      setSubscriptionRefreshedAt(new Date());
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // Don't set defaults here to avoid overwriting good data with nulls
    } finally {
      setSubscriptionLoading(false);
    }
  };
  
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      console.log('Login successful');
      
    } catch (error: any) {
      console.error('Login error:', error.message);
      toast.error(error.message);
      throw error;
    }
  };
  
  const signup = async (email: string, password: string, name: string, role: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });
      
      if (error) throw error;
      
      console.log('Signup successful');
      toast.success('Conta criada com sucesso! Por favor, verifique seu email.');
      
    } catch (error: any) {
      console.error('Signup error:', error.message);
      toast.error(error.message);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error.message);
      toast.error('Erro ao fazer logout: ' + error.message);
    }
  };
  
  const refreshUser = async () => {
    if (!session?.user?.id) {
      console.log('No user to refresh');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Refreshing user data');
      
      // Get updated user profile
      const profileData = await getUserProfile(session.user.id);
      
      if (profileData) {
        // Make sure to preserve existing user data
        setUser(currentUser => {
          if (!currentUser) return null;
          
          return {
            ...currentUser,
            name: profileData.name,
            phone: profileData.phone,
            role: profileData.role
          };
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const refreshSubscription = async () => {
    try {
      await checkSubscriptionStatus();
      return subscription;
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      throw error;
    }
  };
  
  const value = {
    session,
    user,
    loading,
    subscriptionLoading,
    subscription,
    login,
    signup,
    logout,
    refreshUser,
    refreshSubscription
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
