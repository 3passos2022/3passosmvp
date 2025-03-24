
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
