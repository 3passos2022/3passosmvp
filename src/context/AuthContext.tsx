
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  makeAdmin: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        setSession(null);
        return;
      }

      setSession(session);
      
      // Fetch additional user data from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile data:', error);
        // Continue with basic user data if profile fetch fails
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '',
          phone: session.user.user_metadata?.phone || '',
          role: (session.user.user_metadata?.role as UserRole) || UserRole.CLIENT,
          createdAt: session.user.created_at,
        });
        return;
      }
      
      if (profile) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: profile.name || '',
          phone: profile.phone || '',
          role: profile.role as UserRole,
          createdAt: profile.created_at || session.user.created_at,
        });
      } else {
        // If no profile exists yet, use basic auth data
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '',
          phone: session.user.user_metadata?.phone || '',
          role: (session.user.user_metadata?.role as UserRole) || UserRole.CLIENT,
          createdAt: session.user.created_at,
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setSession(null);
    }
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      // Update session state synchronously
      setSession(session);
      
      if (session) {
        // Use setTimeout to prevent potential deadlocks with Supabase client
        setTimeout(async () => {
          try {
            // Fetch profile data
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error('Error fetching profile:', error);
              // Fall back to basic user data
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || '',
                phone: session.user.user_metadata?.phone || '',
                role: (session.user.user_metadata?.role as UserRole) || UserRole.CLIENT,
                createdAt: session.user.created_at,
              });
              return;
            }
            
            if (profile) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profile.name || '',
                phone: profile.phone || '',
                role: profile.role as UserRole,
                createdAt: profile.created_at || session.user.created_at,
              });
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || '',
                phone: session.user.user_metadata?.phone || '',
                role: (session.user.user_metadata?.role as UserRole) || UserRole.CLIENT,
                createdAt: session.user.created_at,
              });
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        }, 0);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // THEN check for existing session
    const initializeAuth = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };

    initializeAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      setSession(data.session);
      await refreshUser();
      toast.success('Login realizado com sucesso');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Erro ao fazer login. Verifique suas credenciais');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, userData: Partial<User>) => {
    setLoading(true);
    try {
      // Add site URL for redirections
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            phone: userData.phone,
          },
          emailRedirectTo: window.location.origin + '/login',
        },
      });
      
      if (error) throw error;
      
      // Create profile entry
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name: userData.name,
          role: userData.role,
          phone: userData.phone || '',
        });
        
        if (profileError) throw profileError;
      }
      
      toast.success('Conta criada com sucesso');
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId: string) => {
    try {
      // Use RPC function to update user role
      const { error } = await supabase.rpc('update_user_role', { 
        user_id: userId,
        new_role: UserRole.ADMIN
      });
      
      if (error) throw error;
      
      toast.success('Usuário promovido a administrador com sucesso');
      
      // If the current user is being promoted, refresh their session
      if (user && user.id === userId) {
        await refreshUser();
      }
      
      return;
    } catch (error: any) {
      console.error('Error making user admin:', error);
      toast.error(error.message || 'Erro ao promover usuário');
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    refreshUser,
    makeAdmin,
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
