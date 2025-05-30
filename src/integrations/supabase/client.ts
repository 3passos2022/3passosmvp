
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { ENV } from '@/env';
import Cookies from 'js-cookie';

// Obtém as variáveis de ambiente
const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas');
}

// Cookie storage implementation for Supabase
const cookieStorage = {
  getItem: (key: string) => {
    const value = Cookies.get(key);
    return value || null;
  },
  setItem: (key: string, value: string) => {
    // Set secure cookies with max age of 7 days, HTTP only where possible
    Cookies.set(key, value, { 
      expires: 7, 
      secure: window.location.protocol === 'https:',
      sameSite: 'Lax'
    });
  },
  removeItem: (key: string) => {
    Cookies.remove(key);
  }
};

// Configure localStorage fallback for environments where cookies aren't supported
const getStorageProvider = () => {
  // Try to use cookieStorage by default
  try {
    if (typeof window !== 'undefined') {
      return cookieStorage;
    }
  } catch (error) {
    console.warn('Error setting up cookie storage, falling back to localStorage', error);
  }
  
  // Fallback to localStorage if cookies aren't supported
  return undefined;
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      storageKey: '3passos-auth',
      storage: getStorageProvider(),
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-application-name': '3passos',
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'x-xss-protection': '1; mode=block'
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Debug current auth state
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Error checking session:', error);
    } else {
      console.log('Supabase client initialized with session:', !!data.session);
    }
  });
}
