-- Drop ALL existing tables to start fresh
DROP TABLE IF EXISTS public.user_notifications CASCADE;
DROP TABLE IF EXISTS public.user_features CASCADE;
DROP TABLE IF EXISTS public.subscription_features CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.quote_answers CASCADE;
DROP TABLE IF EXISTS public.quote_measurements CASCADE;
DROP TABLE IF EXISTS public.quote_items CASCADE;
DROP TABLE IF EXISTS public.quote_providers CASCADE;
DROP TABLE IF EXISTS public.provider_ratings CASCADE;
DROP TABLE IF EXISTS public.provider_portfolio CASCADE;
DROP TABLE IF EXISTS public.provider_item_prices CASCADE;
DROP TABLE IF EXISTS public.provider_services CASCADE;
DROP TABLE IF EXISTS public.provider_settings CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.service_items CASCADE;
DROP TABLE IF EXISTS public.question_options CASCADE;
DROP TABLE IF EXISTS public.service_questions CASCADE;
DROP TABLE IF EXISTS public.specialties CASCADE;
DROP TABLE IF EXISTS public.sub_services CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.feature_flags CASCADE;
DROP TABLE IF EXISTS public.bd_active CASCADE;
DROP TABLE IF EXISTS public.feature_limits CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Now recreate everything with exact schema
CREATE TABLE public.bd_active (
  num integer
);

CREATE TABLE public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  enabled_globally boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feature_flags_pkey PRIMARY KEY (id)
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feature_flags" ON public.feature_flags FOR SELECT USING (true);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  phone text,
  role text NOT NULL DEFAULT 'client'::text CHECK (role = ANY (ARRAY['client'::text, 'provider'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  avatar_url text,
  cpf text,
  cnpj text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  tags text[],
  icon_url text,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);

CREATE TABLE public.sub_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  CONSTRAINT sub_services_pkey PRIMARY KEY (id),
  CONSTRAINT sub_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE
);

ALTER TABLE public.sub_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sub_services" ON public.sub_services FOR SELECT USING (true);

CREATE TABLE public.specialties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sub_service_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT specialties_pkey PRIMARY KEY (id),
  CONSTRAINT specialties_sub_service_id_fkey FOREIGN KEY (sub_service_id) REFERENCES public.sub_services(id) ON DELETE CASCADE
);

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view specialties" ON public.specialties FOR SELECT USING (true);

CREATE TABLE public.service_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question text NOT NULL,
  service_id uuid,
  sub_service_id uuid,
  specialty_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT service_questions_pkey PRIMARY KEY (id),
  CONSTRAINT service_questions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
  CONSTRAINT service_questions_sub_service_id_fkey FOREIGN KEY (sub_service_id) REFERENCES public.sub_services(id) ON DELETE CASCADE,
  CONSTRAINT service_questions_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE
);

ALTER TABLE public.service_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view service_questions" ON public.service_questions FOR SELECT USING (true);

CREATE TABLE public.question_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  option_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT question_options_pkey PRIMARY KEY (id),
  CONSTRAINT question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.service_questions(id) ON DELETE CASCADE
);

ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view question_options" ON public.question_options FOR SELECT USING (true);

CREATE TABLE public.service_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['quantity'::text, 'square_meter'::text, 'linear_meter'::text, 'max_square_meter'::text, 'max_linear_meter'::text])),
  service_id uuid,
  sub_service_id uuid,
  specialty_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  reference_value numeric,
  CONSTRAINT service_items_pkey PRIMARY KEY (id),
  CONSTRAINT service_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
  CONSTRAINT service_items_sub_service_id_fkey FOREIGN KEY (sub_service_id) REFERENCES public.sub_services(id) ON DELETE CASCADE,
  CONSTRAINT service_items_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE
);

ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view service_items" ON public.service_items FOR SELECT USING (true);

CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid,
  service_id uuid NOT NULL,
  sub_service_id uuid,
  specialty_id uuid,
  description text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'accepted'::text, 'rejected'::text, 'completed'::text])),
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone DEFAULT now(),
  is_anonymous boolean DEFAULT false,
  full_name text,
  service_date timestamp with time zone,
  service_end_date timestamp with time zone,
  service_time_preference text,
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT quotes_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
  CONSTRAINT quotes_sub_service_id_fkey FOREIGN KEY (sub_service_id) REFERENCES public.sub_services(id) ON DELETE CASCADE,
  CONSTRAINT quotes_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quotes" ON public.quotes FOR SELECT USING (auth.uid() = client_id OR is_anonymous = true);
CREATE POLICY "Users can insert their own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = client_id OR is_anonymous = true);
CREATE POLICY "Users can update their own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = client_id);

CREATE TABLE public.provider_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL UNIQUE,
  service_radius_km integer,
  bio text,
  latitude numeric DEFAULT NULL::numeric,
  longitude numeric DEFAULT NULL::numeric,
  created_at timestamp with time zone DEFAULT now(),
  city text DEFAULT ''::text,
  neighborhood text DEFAULT ''::text,
  street text DEFAULT ''::text,
  number text DEFAULT ''::text,
  complement text DEFAULT ''::text,
  zip_code text DEFAULT ''::text,
  state text DEFAULT ''::text,
  CONSTRAINT provider_settings_pkey PRIMARY KEY (id),
  CONSTRAINT provider_settings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.provider_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers can manage own settings" ON public.provider_settings FOR ALL USING (provider_id = auth.uid());
CREATE POLICY "Anyone can view provider settings" ON public.provider_settings FOR SELECT USING (true);

CREATE TABLE public.provider_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  specialty_id uuid,
  base_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  sub_service_id uuid,
  CONSTRAINT provider_services_pkey PRIMARY KEY (id),
  CONSTRAINT provider_services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT provider_services_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE,
  CONSTRAINT provider_services_sub_service_id_fkey FOREIGN KEY (sub_service_id) REFERENCES public.sub_services(id) ON DELETE CASCADE
);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers manage own services" ON public.provider_services FOR ALL USING (provider_id = auth.uid());
CREATE POLICY "Anyone can view provider services" ON public.provider_services FOR SELECT USING (true);

CREATE TABLE public.provider_item_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  item_id uuid NOT NULL,
  price_per_unit numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT provider_item_prices_pkey PRIMARY KEY (id),
  CONSTRAINT provider_item_prices_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT provider_item_prices_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.service_items(id) ON DELETE CASCADE
);

ALTER TABLE public.provider_item_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers manage item prices" ON public.provider_item_prices FOR ALL USING (provider_id = auth.uid());
CREATE POLICY "Anyone view item prices" ON public.provider_item_prices FOR SELECT USING (true);

CREATE TABLE public.provider_portfolio (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  image_url text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT provider_portfolio_pkey PRIMARY KEY (id),
  CONSTRAINT provider_portfolio_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.provider_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers manage portfolio" ON public.provider_portfolio FOR ALL USING (provider_id = auth.uid());
CREATE POLICY "Anyone view portfolios" ON public.provider_portfolio FOR SELECT USING (true);

CREATE TABLE public.provider_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  quote_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT provider_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT fk_provider_ratings_provider FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_provider_ratings_quote FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE
);

ALTER TABLE public.provider_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view ratings" ON public.provider_ratings FOR SELECT USING (true);
CREATE POLICY "Clients create ratings" ON public.provider_ratings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid()));

CREATE TABLE public.quote_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'completed'::text])),
  total_price numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quote_providers_pkey PRIMARY KEY (id),
  CONSTRAINT quote_providers_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE,
  CONSTRAINT quote_providers_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.quote_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own quote_providers" ON public.quote_providers FOR SELECT USING ((EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid())) OR (provider_id = auth.uid()));
CREATE POLICY "Insert quote_providers" ON public.quote_providers FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid())));
CREATE POLICY "Update quote_providers" ON public.quote_providers FOR UPDATE USING ((EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid())) OR (provider_id = auth.uid()));

CREATE TABLE public.quote_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  item_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quote_items_pkey PRIMARY KEY (id),
  CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE,
  CONSTRAINT quote_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.service_items(id) ON DELETE CASCADE
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View quote items" ON public.quote_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid()));
CREATE POLICY "Insert quote items" ON public.quote_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid()));

CREATE TABLE public.quote_measurements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  room_name text,
  width numeric NOT NULL,
  height numeric,
  length numeric NOT NULL,
  area numeric GENERATED ALWAYS AS (width * length) STORED,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quote_measurements_pkey PRIMARY KEY (id),
  CONSTRAINT quote_measurements_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE
);

ALTER TABLE public.quote_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View measurements" ON public.quote_measurements FOR SELECT USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid()));
CREATE POLICY "Insert measurements" ON public.quote_measurements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid()));

CREATE TABLE public.quote_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  question_id uuid NOT NULL,
  option_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quote_answers_pkey PRIMARY KEY (id),
  CONSTRAINT quote_answers_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE,
  CONSTRAINT quote_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.service_questions(id) ON DELETE CASCADE,
  CONSTRAINT quote_answers_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.question_options(id) ON DELETE CASCADE
);

ALTER TABLE public.quote_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View answers" ON public.quote_answers FOR SELECT USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid()));
CREATE POLICY "Insert answers" ON public.quote_answers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.client_id = auth.uid()));

CREATE TABLE public.subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL UNIQUE,
  stripe_customer_id text,
  subscribed boolean NOT NULL DEFAULT false,
  subscription_tier text DEFAULT 'free'::text,
  subscription_end timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  stripe_subscription_id text,
  subscription_status text DEFAULT 'free'::text,
  trial_end timestamp with time zone,
  is_trial_used boolean DEFAULT false,
  last_invoice_url text,
  next_invoice_amount numeric,
  CONSTRAINT subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT subscribers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own subscription" ON public.subscribers FOR SELECT USING (user_id = auth.uid());

CREATE TABLE public.subscription_features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  feature_id uuid,
  subscription_tier text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscription_features_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_features_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.feature_flags(id) ON DELETE CASCADE
);

ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View subscription_features" ON public.subscription_features FOR SELECT USING (true);

CREATE TABLE public.user_features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  feature_id uuid,
  enabled boolean NOT NULL DEFAULT true,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_features_pkey PRIMARY KEY (id),
  CONSTRAINT user_features_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_features_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.feature_flags(id) ON DELETE CASCADE
);

ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own features" ON public.user_features FOR SELECT USING (user_id = auth.uid());

CREATE TABLE public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own notifications" ON public.user_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Update own notifications" ON public.user_notifications FOR UPDATE USING (user_id = auth.uid());