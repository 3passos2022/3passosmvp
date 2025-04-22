
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';
import DOMPurify from 'dompurify';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

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
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Função para atualizar a última atividade
  const updateLastActivity = () => {
    setLastActivity(Date.now());
  };

  // Monitor de atividade do usuário
  useEffect(() => {
    if (!user) return;

    const checkActivity = () => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        handleSignOut();
        toast.warning('Sessão expirada por inatividade');
      }
    };

    const activityEvents = ['mousemove', 'keypress', 'click', 'scroll'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateLastActivity);
    });

    const intervalId = setInterval(checkActivity, 1000);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateLastActivity);
      });
      clearInterval(intervalId);
    };
  }, [user, lastActivity]);

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        setSession(null);
        return;
      }

      setSession(session);
      
      // Use the safer function to get the user role to avoid recursion
      const { data: userRole, error: roleError } = await supabase.rpc('get_user_role_safely', {
        user_id: session.user.id
      });
      
      if (roleError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error fetching user role:', roleError);
        }
        // Try to get profile directly if RPC fails
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, phone, role, created_at')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching profile data:', error);
          }
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: DOMPurify.sanitize(session.user.user_metadata?.name || ''),
            phone: DOMPurify.sanitize(session.user.user_metadata?.phone || ''),
            role: (session.user.user_metadata?.role as UserRole) || UserRole.CLIENT,
            createdAt: session.user.created_at,
          });
          return;
        }
        
        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: DOMPurify.sanitize(profile.name || ''),
            phone: DOMPurify.sanitize(profile.phone || ''),
            role: profile.role as UserRole,
            createdAt: profile.created_at || session.user.created_at,
          });
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone, created_at')
          .eq('id', session.user.id)
          .maybeSingle();
          
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: DOMPurify.sanitize(profile?.name || session.user.user_metadata?.name || ''),
          phone: DOMPurify.sanitize(profile?.phone || session.user.user_metadata?.phone || ''),
          role: userRole as UserRole,
          createdAt: profile?.created_at || session.user.created_at,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error refreshing user:', error);
      }
      setUser(null);
      setSession(null);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Auth state changed:', event);
      }
      
      setSession(session);
      
      if (session) {
        // Use setTimeout to avoid recursive policy issues
        setTimeout(async () => {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('name, phone, role, created_at')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              if (process.env.NODE_ENV !== 'production') {
                console.error('Error fetching profile:', error);
              }
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: DOMPurify.sanitize(session.user.user_metadata?.name || ''),
                phone: DOMPurify.sanitize(session.user.user_metadata?.phone || ''),
                role: (session.user.user_metadata?.role as UserRole) || UserRole.CLIENT,
                createdAt: session.user.created_at,
              });
              return;
            }
            
            if (profile) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: DOMPurify.sanitize(profile.name || ''),
                phone: DOMPurify.sanitize(profile.phone || ''),
                role: profile.role as UserRole,
                createdAt: profile.created_at || session.user.created_at,
              });
            }
          } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('Error fetching profile:', error);
            }
          }
        }, 0);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

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
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: DOMPurify.sanitize(email), 
        password 
      });
      
      if (error) throw error;
      
      setSession(data.session);
      await refreshUser();
      updateLastActivity();
      toast.success('Login realizado com sucesso');
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error signing in:', error);
      }
      toast.error(error.message || 'Erro ao fazer login. Verifique suas credenciais');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, userData: Partial<User>) => {
    setLoading(true);
    try {
      const sanitizedData = {
        name: DOMPurify.sanitize(userData.name || ''),
        role: userData.role,
        phone: DOMPurify.sanitize(userData.phone || ''),
      };

      const { data, error } = await supabase.auth.signUp({
        email: DOMPurify.sanitize(email),
        password,
        options: {
          data: sanitizedData,
          emailRedirectTo: window.location.origin + '/login',
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name: sanitizedData.name,
          role: sanitizedData.role,
          phone: sanitizedData.phone,
        });
        
        if (profileError) throw profileError;
      }
      
      toast.success('Conta criada com sucesso');
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error signing up:', error);
      }
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
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error signing out:', error);
      }
      toast.error('Erro ao fazer logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('update_user_role', { 
        user_id: DOMPurify.sanitize(userId),
        new_role: UserRole.ADMIN
      });
      
      if (error) throw error;
      
      toast.success('Usuário promovido a administrador com sucesso');
      
      if (user && user.id === userId) {
        await supabase.auth.refreshSession();
        await refreshUser();
      }
      
      return;
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error making user admin:', error);
      }
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
