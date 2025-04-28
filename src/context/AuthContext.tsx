
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types';
import { SubscriptionStatus } from '@/lib/types/subscriptions';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  subscribed: boolean;
  subscription_tier: 'free' | 'basic' | 'premium';
  subscription_end: string | null;
}

interface AuthContextProps {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<SubscriptionStatus | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async (): Promise<SubscriptionStatus | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {});
      
      if (error) {
        console.error('Erro ao verificar assinatura:', error);
        return null;
      }
      
      const subscriptionStatus: SubscriptionStatus = data;
      
      // Atualizar o perfil de usuário com as informações de assinatura
      if (user) {
        setUser({
          ...user,
          subscribed: subscriptionStatus.subscribed,
          subscription_tier: subscriptionStatus.subscription_tier,
          subscription_end: subscriptionStatus.subscription_end
        });
      }
      
      return subscriptionStatus;
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      return null;
    }
  };

  // Setup auth state change listener
  useEffect(() => {
    const setupAuthListener = async () => {
      setLoading(true);
      
      // First set up the auth state listener
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          console.log('Auth state changed:', event);
          setSession(currentSession);
          
          if (currentSession?.user) {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .single();
              
              if (profileError) throw profileError;

              // Buscar informações de assinatura
              let subscriptionData: SubscriptionStatus = {
                subscribed: false,
                subscription_tier: 'free',
                subscription_end: null
              };

              try {
                const { data: subData } = await supabase
                  .from('subscribers')
                  .select('*')
                  .eq('user_id', currentSession.user.id)
                  .maybeSingle();
                
                if (subData) {
                  subscriptionData = {
                    subscribed: subData.subscribed,
                    subscription_tier: subData.subscription_tier || 'free',
                    subscription_end: subData.subscription_end
                  };
                }
              } catch (subError) {
                console.error('Erro ao buscar dados de assinatura:', subError);
              }
              
              setUser({
                id: currentSession.user.id,
                name: profile.name,
                email: currentSession.user.email || '',
                role: profile.role as UserRole,
                ...subscriptionData
              });

              // Verificar assinatura no Stripe via edge function
              setTimeout(() => {
                checkSubscription().catch(console.error);
              }, 0);

            } catch (error) {
              console.error('Erro ao buscar perfil do usuário:', error);
              setUser(null);
            }
          } else {
            setUser(null);
          }
          
          setLoading(false);
        }
      );

      // Then check for existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      setSession(existingSession);
      
      if (existingSession?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', existingSession.user.id)
            .single();
          
          if (profileError) throw profileError;

          // Buscar informações de assinatura
          let subscriptionData: SubscriptionStatus = {
            subscribed: false,
            subscription_tier: 'free',
            subscription_end: null
          };

          try {
            const { data: subData } = await supabase
              .from('subscribers')
              .select('*')
              .eq('user_id', existingSession.user.id)
              .maybeSingle();
            
            if (subData) {
              subscriptionData = {
                subscribed: subData.subscribed,
                subscription_tier: subData.subscription_tier || 'free',
                subscription_end: subData.subscription_end
              };
            }
          } catch (subError) {
            console.error('Erro ao buscar dados de assinatura:', subError);
          }
          
          setUser({
            id: existingSession.user.id,
            name: profile.name,
            email: existingSession.user.email || '',
            role: profile.role as UserRole,
            ...subscriptionData
          });

          // Verificar assinatura no Stripe via edge function
          setTimeout(() => {
            checkSubscription().catch(console.error);
          }, 0);

        } catch (error) {
          console.error('Erro ao buscar perfil do usuário:', error);
          setUser(null);
        }
      }
      
      setLoading(false);

      return () => {
        authSubscription.unsubscribe();
      };
    };

    setupAuthListener();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao fazer login' };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao criar conta' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        checkSubscription,
      }}
    >
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
