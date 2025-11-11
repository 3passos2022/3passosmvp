-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
  avatar_url TEXT,
  address TEXT,
  phone TEXT,
  bio TEXT,
  city TEXT,
  neighborhood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  subscribed BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  subscription_end TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services"
  ON public.services FOR SELECT
  USING (true);

-- Create sub_services table
CREATE TABLE IF NOT EXISTS public.sub_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sub_services"
  ON public.sub_services FOR SELECT
  USING (true);

-- Create specialties table
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_service_id UUID NOT NULL REFERENCES public.sub_services ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view specialties"
  ON public.specialties FOR SELECT
  USING (true);

-- Create service_questions table
CREATE TABLE IF NOT EXISTS public.service_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services ON DELETE CASCADE,
  sub_service_id UUID REFERENCES public.sub_services ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service_questions"
  ON public.service_questions FOR SELECT
  USING (true);

-- Create question_options table
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.service_questions ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view question_options"
  ON public.question_options FOR SELECT
  USING (true);

-- Create service_items table
CREATE TABLE IF NOT EXISTS public.service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services ON DELETE CASCADE,
  sub_service_id UUID REFERENCES public.sub_services ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('quantity', 'square_meter', 'linear_meter', 'max_square_meter', 'max_linear_meter')),
  reference_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service_items"
  ON public.service_items FOR SELECT
  USING (true);

-- Create provider_settings table
CREATE TABLE IF NOT EXISTS public.provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_radius_km NUMERIC DEFAULT 50,
  accepts_new_clients BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

ALTER TABLE public.provider_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own settings"
  ON public.provider_settings FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can update their own settings"
  ON public.provider_settings FOR UPDATE
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can insert their own settings"
  ON public.provider_settings FOR INSERT
  WITH CHECK (provider_id = auth.uid());

-- Create provider_services table
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services ON DELETE CASCADE,
  sub_service_id UUID REFERENCES public.sub_services ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their own services"
  ON public.provider_services FOR ALL
  USING (provider_id = auth.uid());

CREATE POLICY "Anyone can view provider services"
  ON public.provider_services FOR SELECT
  USING (true);

-- Create provider_item_prices table
CREATE TABLE IF NOT EXISTS public.provider_item_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_item_id UUID NOT NULL REFERENCES public.service_items(id) ON DELETE CASCADE,
  price_per_unit NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, service_item_id)
);

ALTER TABLE public.provider_item_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their own item prices"
  ON public.provider_item_prices FOR ALL
  USING (provider_id = auth.uid());

CREATE POLICY "Anyone can view provider item prices"
  ON public.provider_item_prices FOR SELECT
  USING (true);

-- Create provider_portfolio table
CREATE TABLE IF NOT EXISTS public.provider_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their own portfolio"
  ON public.provider_portfolio FOR ALL
  USING (provider_id = auth.uid());

CREATE POLICY "Anyone can view provider portfolios"
  ON public.provider_portfolio FOR SELECT
  USING (true);

-- Create provider_ratings table
CREATE TABLE IF NOT EXISTS public.provider_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(quote_id)
);

ALTER TABLE public.provider_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create ratings for their quotes"
  ON public.provider_ratings FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Anyone can view ratings"
  ON public.provider_ratings FOR SELECT
  USING (true);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Create feature_limits table
CREATE TABLE IF NOT EXISTS public.feature_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  feature_name TEXT NOT NULL,
  limit_value INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subscription_tier, feature_name)
);

ALTER TABLE public.feature_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature_limits"
  ON public.feature_limits FOR SELECT
  USING (true);

-- Insert default feature limits
INSERT INTO public.feature_limits (subscription_tier, feature_name, limit_value) VALUES
  ('free', 'portfolio_image_limit', 3),
  ('basic', 'portfolio_image_limit', 10),
  ('premium', 'portfolio_image_limit', NULL),
  ('free', 'provider_services_limit', 1),
  ('basic', 'provider_services_limit', 3),
  ('premium', 'provider_services_limit', NULL),
  ('free', 'visible_providers_limit', 3),
  ('basic', 'visible_providers_limit', 10),
  ('premium', 'visible_providers_limit', NULL)
ON CONFLICT (subscription_tier, feature_name) DO NOTHING;

-- Create RPC function to get feature limits (fixed column name)
CREATE OR REPLACE FUNCTION public.get_feature_limit(p_user_id UUID, p_feature_name TEXT)
RETURNS TABLE(limit_val INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT fl.limit_value
  FROM public.profiles p
  JOIN public.feature_limits fl ON fl.subscription_tier = p.subscription_tier
  WHERE p.id = p_user_id AND fl.feature_name = p_feature_name;
END;
$$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_settings_updated_at
  BEFORE UPDATE ON public.provider_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_item_prices_updated_at
  BEFORE UPDATE ON public.provider_item_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();