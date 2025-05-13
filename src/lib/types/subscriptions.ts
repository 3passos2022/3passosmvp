
export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: 'free' | 'basic' | 'premium';
  subscription_end: string | null;
}

export interface SubscriptionData {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  popular?: boolean;
  tier: 'free' | 'basic' | 'premium';
}
