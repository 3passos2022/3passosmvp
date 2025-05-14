
/// <reference types="vite/client" />

// Add AuthContextType for TypeScript to recognize in components
import { User, Session } from '@supabase/supabase-js';
import { UserRole, UserProfile } from './lib/types';
import { SubscriptionStatus } from './lib/types/subscriptions';

declare global {
  interface AuthContextType {
    user: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null; data: any }>;
    signUp: (email: string, password: string, role: UserRole) => Promise<{ error: Error | null; data: any }>;
    signOut: () => Promise<void>;
    forgotPassword: (email: string) => Promise<{ error: Error | null; data: any }>;
    resetPassword: (newPassword: string) => Promise<{ error: Error | null; data: any }>;
    updateProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null; data: any }>;
    refreshUser: () => Promise<void>;
    makeAdmin: (userId: string) => Promise<{ error: Error | null; data: any }>;
    subscription: SubscriptionStatus | null;
    refreshSubscription: () => Promise<void>;
    subscriptionLoading: boolean;
    hasRole: (role: UserRole | string) => boolean;
  }
}
