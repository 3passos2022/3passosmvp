
import { createClient } from '@supabase/supabase-js';
import { User, UserRole } from './types';

// Use environment variables with fallback to avoid runtime errors in a browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string, userData: Partial<User>) => {
  // For admin sign-up, we'd require a special route/endpoint in a real app
  // Here we're just simulating basic sign-up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: userData.name,
        role: userData.role || UserRole.CLIENT,
      },
    },
  });

  if (error) throw error;

  // In a real app, we'd create a profile record in a separate table
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      name: userData.name,
      role: userData.role || UserRole.CLIENT,
      phone: userData.phone || '',
    });
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  if (!data.user) return null;

  // Fetch profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return {
    id: data.user.id,
    email: data.user.email,
    ...profile,
  };
};

// Data encryption helpers (in a real app, use a more secure approach)
export const encryptData = (data: string) => {
  // This is a placeholder. In production, use proper encryption
  return btoa(data);
};

export const decryptData = (encryptedData: string) => {
  // This is a placeholder. In production, use proper decryption
  return atob(encryptedData);
};
