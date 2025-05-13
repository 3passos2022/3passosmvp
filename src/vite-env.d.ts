
/// <reference types="vite/client" />

import { UserRole } from '@/lib/types';

// Extending the Supabase User type to include our custom fields
declare module '@supabase/supabase-js' {
  interface User {
    role?: UserRole;
    name?: string;
    avatar_url?: string;
    address?: string;
    phone?: string;
    subscribed?: boolean;
    subscription_tier?: 'free' | 'basic' | 'premium';
    subscription_end?: string | null;
  }
}

// Add custom toast types for sonner
declare module 'sonner' {
  interface ToastT {
    title?: React.ReactNode;
    description?: React.ReactNode;
  }
}
