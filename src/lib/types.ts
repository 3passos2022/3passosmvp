
import { User as SupabaseUser } from '@supabase/supabase-js';

export enum UserRole {
  CLIENT = 'client',
  PROVIDER = 'provider',
  ADMIN = 'admin'
}

// Extend the Supabase User type with our custom properties
export interface ExtendedUser extends SupabaseUser {
  role?: UserRole;
  name?: string;
  email: string; // Make email required
  avatar_url?: string;
  address?: string;
  phone?: string;
  subscribed?: boolean;
  subscription_tier?: 'free' | 'basic' | 'premium';
  subscription_end?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar_url?: string;
  address?: string;
  phone?: string;
  created_at: string;
  subscribed?: boolean;
  subscription_tier?: 'free' | 'basic' | 'premium';
  subscription_end?: string | null;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  subServices: SubService[];
}

export interface SubService {
  id: string;
  name: string;
  description?: string;
  specialties: Specialty[];
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
}

export interface ServiceQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  optionText: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  type: 'quantity' | 'square_meter' | 'linear_meter';
}

export interface QuoteMeasurement {
  id?: string;
  roomName?: string;
  width: number;
  length: number;
  height?: number;
  area?: number;
}
