
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export enum UserRole {
  CLIENT = "client",
  PROVIDER = "provider",
  ADMIN = "admin"
}

export interface Service {
  id: string;
  name: string;
  subServices: SubService[];
}

export interface SubService {
  id: string;
  name: string;
  description?: string;
  serviceId: string;
  specialties: Specialty[];
}

export interface Specialty {
  id: string;
  name: string;
  subServiceId: string;
  price?: number;
  providerId?: string;
}

export interface Quote {
  id: string;
  clientId: string;
  serviceId: string;
  subServiceId: string;
  specialtyId: string;
  providerId?: string;
  status: QuoteStatus;
  address: Address;
  description: string;
  createdAt: string;
  rating?: number;
}

export enum QuoteStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  COMPLETED = "completed"
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ProviderProfile {
  userId: string;
  bio: string;
  averageRating: number;
  specialties: Specialty[];
}

// Define types for our multi-step quote form
export interface ServiceQuestion {
  id: string;
  question: string;
  serviceId?: string;
  subServiceId?: string;
  specialtyId?: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  type: 'quantity' | 'square_meter' | 'linear_meter';
  serviceId?: string;
  subServiceId?: string;
  specialtyId?: string;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  itemId: string;
  quantity: number;
}

export interface QuoteMeasurement {
  id: string;
  quoteId: string;
  roomName?: string;
  width: number;
  length: number;
  height?: number;
  area?: number;
}

export interface QuoteAnswer {
  id: string;
  quoteId: string;
  questionId: string;
  optionId: string;
}

export interface ProviderService {
  id: string;
  providerId: string;
  specialtyId: string;
  basePrice: number;
}

export interface ProviderItemPrice {
  id: string;
  providerId: string;
  itemId: string;
  pricePerUnit: number;
}

export interface ProviderSettings {
  id: string;
  providerId: string;
  serviceRadiusKm?: number;
  bio?: string;
  latitude?: number;
  longitude?: number;
}

export interface ProviderPortfolio {
  id: string;
  providerId: string;
  imageUrl: string;
  description?: string;
}

export interface QuoteProvider {
  id: string;
  quoteId: string;
  providerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  totalPrice?: number;
}
