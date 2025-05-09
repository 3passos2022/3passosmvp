
import { QuoteMeasurement } from '@/lib/types';

export interface PriceDetail {
  itemId: string;
  itemName?: string; // Added item name for better debugging
  quantity?: number;
  area?: number;
  pricePerUnit: number;
  total: number;
}

export interface ProviderMatch {
  provider: ProviderProfile;
  distance: number | null;
  totalPrice: number;
  isWithinRadius: boolean;
  priceDetails?: PriceDetail[];
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
  serviceRadiusKm?: number; // Added to track provider's service radius
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
  priceDetails?: PriceDetail[]; // Added to ProviderDetails
}

export interface QuoteDetails {
  id?: string;
  serviceId: string;
  subServiceId?: string;
  specialtyId?: string;
  serviceName: string;
  subServiceName?: string;
  specialtyName?: string;
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
  // Metadados para processamento interno
  _storedAt?: string;
  _itemTypes?: Record<string, string>;
  _itemNames?: Record<string, string>;
}

// Re-export QuoteMeasurement from lib/types to fix the import issue
export type { QuoteMeasurement };

export interface ProviderServiceItemPrice {
  id: string;
  name: string;
  type: string;
  pricePerUnit: number;
  providerItemId?: string;
  level: 'service' | 'subService' | 'specialty';
  parentName: string;
}

export interface ProviderRating {
  id: string;
  provider_id: string;
  quote_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface QuoteWithProviders {
  id: string;
  status: string;
  description: string;
  city: string;
  neighborhood: string;
  created_at: string;
  serviceName: string;
  subServiceName: string;
  specialtyName: string;
  providers: {
    id: string;
    providerId: string;
    providerName: string;
    status: string;
  }[];
}
