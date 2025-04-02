
import { ProviderProfile, QuoteMeasurement } from '@/lib/types';

export interface ProviderMatch {
  provider: ProviderProfile;
  distance: number;
  totalPrice: number;
  isWithinRadius: boolean;
}

export interface ProviderDetails extends ProviderMatch {
  portfolioItems: {
    id: string;
    imageUrl: string;
    description?: string;
  }[];
  rating: number;
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
