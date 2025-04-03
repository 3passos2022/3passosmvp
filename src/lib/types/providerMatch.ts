
import { QuoteMeasurement } from '@/lib/types';

export interface ProviderMatch {
  provider: ProviderProfile;
  distance: number | null;
  totalPrice: number;
  isWithinRadius: boolean;
}

export interface ProviderProfile {
  userId: string;
  bio: string;
  averageRating: number;
  specialties: ProviderSpecialty[];
  name?: string;
  phone?: string;
  city?: string;
  neighborhood?: string;
  relevanceScore?: number;
  hasAddress?: boolean;
}

export interface ProviderSpecialty {
  id: string;
  name: string;
  price?: number;
}

export interface ProviderDetails {
  provider: ProviderProfile;
  portfolioItems: {
    id: string;
    imageUrl: string;
    description?: string;
  }[];
  rating: number;
  distance: number | null;
  totalPrice: number;
  isWithinRadius: boolean;
}

export interface QuoteDetails {
  id?: string;
  serviceId: string;
  subServiceId: string;
  specialtyId: string;
  serviceName: string;
  subServiceName: string;
  specialtyName: string;
  items?: Record<string, number>;
  measurements?: QuoteMeasurement[];
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  description?: string;
  clientId?: string | null;
}

export interface ProviderServiceItemPrice {
  id: string;
  name: string;
  type: string;
  pricePerUnit: number;
  providerItemId?: string;
  level: 'service' | 'subService' | 'specialty';
  parentName: string;
}
