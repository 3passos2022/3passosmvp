
export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: 'free' | 'basic' | 'premium';
  subscription_end?: string;
}

export interface SubscriptionData {
  id: string;
  priceId?: string; // ID do preço no Stripe
  name: string;
  description: string;
  price: number;
  features: string[];
  popular?: boolean;
  tier: 'free' | 'basic' | 'premium';
}
