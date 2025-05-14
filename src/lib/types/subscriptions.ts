
export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: 'free' | 'basic' | 'premium';
  subscription_end: string | null;
  subscription_status?: string;
  trial_end?: string | null;
  is_trial_used?: boolean;
  stripe_subscription_id?: string | null;
  last_invoice_url?: string | null;
  next_invoice_amount?: number | null;
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
