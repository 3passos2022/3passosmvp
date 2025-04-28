export type UserRole = 'user' | 'provider' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar_url?: string;
  address?: string;
  phone?: string;
  created_at: string;
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
