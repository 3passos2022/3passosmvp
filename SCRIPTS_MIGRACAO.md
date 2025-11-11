# Scripts de Migração - Supabase Antigo → Lovable Cloud

✅ **Estrutura do banco recriada com sucesso!**

Agora execute os scripts abaixo **NO PROJETO SUPABASE ANTIGO** para exportar os dados.

---

## 📤 PASSO 1: Exportar Dados (Execute no Supabase Antigo)

### 1. Profiles
```sql
SELECT string_agg(
  'INSERT INTO public.profiles (id, name, phone, role, avatar_url, cpf, cnpj) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  COALESCE(quote_literal(name), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  quote_literal(role) || ', ' ||
  COALESCE(quote_literal(avatar_url), 'NULL') || ', ' ||
  COALESCE(quote_literal(cpf), 'NULL') || ', ' ||
  COALESCE(quote_literal(cnpj), 'NULL') ||
  ') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone;',
  E'\n'
) FROM public.profiles;
```

### 2. Services
```sql
SELECT string_agg(
  'INSERT INTO public.services (id, name, description, tags, icon_url) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  CASE WHEN tags IS NULL THEN 'NULL' ELSE 'ARRAY[' || (SELECT string_agg(quote_literal(t), ',') FROM unnest(tags) t) || ']::text[]' END || ', ' ||
  COALESCE(quote_literal(icon_url), 'NULL') ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.services;
```

### 3. Sub Services
```sql
SELECT string_agg(
  'INSERT INTO public.sub_services (id, service_id, name, description) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(service_id::text) || '::uuid, ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.sub_services;
```

### 4. Specialties
```sql
SELECT string_agg(
  'INSERT INTO public.specialties (id, sub_service_id, name) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(sub_service_id::text) || '::uuid, ' ||
  quote_literal(name) ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.specialties;
```

### 5. Service Questions
```sql
SELECT string_agg(
  'INSERT INTO public.service_questions (id, question, service_id, sub_service_id, specialty_id) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(question) || ', ' ||
  CASE WHEN service_id IS NULL THEN 'NULL' ELSE quote_literal(service_id::text) || '::uuid' END || ', ' ||
  CASE WHEN sub_service_id IS NULL THEN 'NULL' ELSE quote_literal(sub_service_id::text) || '::uuid' END || ', ' ||
  CASE WHEN specialty_id IS NULL THEN 'NULL' ELSE quote_literal(specialty_id::text) || '::uuid' END ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.service_questions;
```

### 6. Question Options
```sql
SELECT string_agg(
  'INSERT INTO public.question_options (id, question_id, option_text) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(question_id::text) || '::uuid, ' ||
  quote_literal(option_text) ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.question_options;
```

### 7. Service Items
```sql
SELECT string_agg(
  'INSERT INTO public.service_items (id, name, type, service_id, sub_service_id, specialty_id, reference_value) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(name) || ', ' ||
  quote_literal(type) || ', ' ||
  CASE WHEN service_id IS NULL THEN 'NULL' ELSE quote_literal(service_id::text) || '::uuid' END || ', ' ||
  CASE WHEN sub_service_id IS NULL THEN 'NULL' ELSE quote_literal(sub_service_id::text) || '::uuid' END || ', ' ||
  CASE WHEN specialty_id IS NULL THEN 'NULL' ELSE quote_literal(specialty_id::text) || '::uuid' END || ', ' ||
  COALESCE(reference_value::text, 'NULL') ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.service_items;
```

### 8. Provider Settings
```sql
SELECT string_agg(
  'INSERT INTO public.provider_settings (id, provider_id, service_radius_km, bio, latitude, longitude, city, neighborhood, street, number, complement, zip_code, state) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(provider_id::text) || '::uuid, ' ||
  COALESCE(service_radius_km::text, 'NULL') || ', ' ||
  COALESCE(quote_literal(bio), 'NULL') || ', ' ||
  COALESCE(latitude::text, 'NULL') || ', ' ||
  COALESCE(longitude::text, 'NULL') || ', ' ||
  COALESCE(quote_literal(city), 'NULL') || ', ' ||
  COALESCE(quote_literal(neighborhood), 'NULL') || ', ' ||
  COALESCE(quote_literal(street), 'NULL') || ', ' ||
  COALESCE(quote_literal(number), 'NULL') || ', ' ||
  COALESCE(quote_literal(complement), 'NULL') || ', ' ||
  COALESCE(quote_literal(zip_code), 'NULL') || ', ' ||
  COALESCE(quote_literal(state), 'NULL') ||
  ') ON CONFLICT (provider_id) DO UPDATE SET service_radius_km = EXCLUDED.service_radius_km, bio = EXCLUDED.bio;',
  E'\n'
) FROM public.provider_settings;
```

### 9. Provider Services
```sql
SELECT string_agg(
  'INSERT INTO public.provider_services (id, provider_id, specialty_id, sub_service_id, base_price) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(provider_id::text) || '::uuid, ' ||
  CASE WHEN specialty_id IS NULL THEN 'NULL' ELSE quote_literal(specialty_id::text) || '::uuid' END || ', ' ||
  CASE WHEN sub_service_id IS NULL THEN 'NULL' ELSE quote_literal(sub_service_id::text) || '::uuid' END || ', ' ||
  COALESCE(base_price::text, '0') ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.provider_services;
```

### 10. Provider Item Prices
```sql
SELECT string_agg(
  'INSERT INTO public.provider_item_prices (id, provider_id, item_id, price_per_unit) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(provider_id::text) || '::uuid, ' ||
  quote_literal(item_id::text) || '::uuid, ' ||
  price_per_unit::text ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.provider_item_prices;
```

### 11. Provider Portfolio
```sql
SELECT string_agg(
  'INSERT INTO public.provider_portfolio (id, provider_id, image_url, description) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(provider_id::text) || '::uuid, ' ||
  quote_literal(image_url) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.provider_portfolio;
```

### 12. Quotes
```sql
SELECT string_agg(
  'INSERT INTO public.quotes (id, client_id, service_id, sub_service_id, specialty_id, description, status, street, number, complement, neighborhood, city, state, zip_code, latitude, longitude, is_anonymous, full_name, service_date, service_end_date, service_time_preference) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  CASE WHEN client_id IS NULL THEN 'NULL' ELSE quote_literal(client_id::text) || '::uuid' END || ', ' ||
  quote_literal(service_id::text) || '::uuid, ' ||
  CASE WHEN sub_service_id IS NULL THEN 'NULL' ELSE quote_literal(sub_service_id::text) || '::uuid' END || ', ' ||
  CASE WHEN specialty_id IS NULL THEN 'NULL' ELSE quote_literal(specialty_id::text) || '::uuid' END || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(status) || ', ' ||
  quote_literal(street) || ', ' ||
  quote_literal(number) || ', ' ||
  COALESCE(quote_literal(complement), 'NULL') || ', ' ||
  quote_literal(neighborhood) || ', ' ||
  quote_literal(city) || ', ' ||
  quote_literal(state) || ', ' ||
  quote_literal(zip_code) || ', ' ||
  COALESCE(latitude::text, 'NULL') || ', ' ||
  COALESCE(longitude::text, 'NULL') || ', ' ||
  COALESCE(is_anonymous::text, 'false') || ', ' ||
  COALESCE(quote_literal(full_name), 'NULL') || ', ' ||
  CASE WHEN service_date IS NULL THEN 'NULL' ELSE quote_literal(service_date::text) || '::timestamptz' END || ', ' ||
  CASE WHEN service_end_date IS NULL THEN 'NULL' ELSE quote_literal(service_end_date::text) || '::timestamptz' END || ', ' ||
  COALESCE(quote_literal(service_time_preference), 'NULL') ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.quotes;
```

### 13. Quote Items
```sql
SELECT string_agg(
  'INSERT INTO public.quote_items (id, quote_id, item_id, quantity) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(quote_id::text) || '::uuid, ' ||
  quote_literal(item_id::text) || '::uuid, ' ||
  quantity::text ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.quote_items;
```

### 14. Quote Measurements
```sql
SELECT string_agg(
  'INSERT INTO public.quote_measurements (id, quote_id, room_name, width, height, length) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(quote_id::text) || '::uuid, ' ||
  COALESCE(quote_literal(room_name), 'NULL') || ', ' ||
  width::text || ', ' ||
  COALESCE(height::text, 'NULL') || ', ' ||
  length::text ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.quote_measurements;
```

### 15. Quote Answers
```sql
SELECT string_agg(
  'INSERT INTO public.quote_answers (id, quote_id, question_id, option_id) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(quote_id::text) || '::uuid, ' ||
  quote_literal(question_id::text) || '::uuid, ' ||
  quote_literal(option_id::text) || '::uuid' ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.quote_answers;
```

### 16. Quote Providers
```sql
SELECT string_agg(
  'INSERT INTO public.quote_providers (id, quote_id, provider_id, status, total_price) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(quote_id::text) || '::uuid, ' ||
  quote_literal(provider_id::text) || '::uuid, ' ||
  quote_literal(status) || ', ' ||
  COALESCE(total_price::text, 'NULL') ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.quote_providers;
```

### 17. Provider Ratings
```sql
SELECT string_agg(
  'INSERT INTO public.provider_ratings (id, provider_id, quote_id, rating, comment) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(provider_id::text) || '::uuid, ' ||
  quote_literal(quote_id::text) || '::uuid, ' ||
  rating::text || ', ' ||
  COALESCE(quote_literal(comment), 'NULL') ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.provider_ratings;
```

### 18. Subscribers
```sql
SELECT string_agg(
  'INSERT INTO public.subscribers (id, user_id, email, stripe_customer_id, subscribed, subscription_tier, subscription_status, subscription_end, trial_end, is_trial_used, stripe_subscription_id, last_invoice_url, next_invoice_amount) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  CASE WHEN user_id IS NULL THEN 'NULL' ELSE quote_literal(user_id::text) || '::uuid' END || ', ' ||
  quote_literal(email) || ', ' ||
  COALESCE(quote_literal(stripe_customer_id), 'NULL') || ', ' ||
  subscribed::text || ', ' ||
  quote_literal(subscription_tier) || ', ' ||
  quote_literal(subscription_status) || ', ' ||
  CASE WHEN subscription_end IS NULL THEN 'NULL' ELSE quote_literal(subscription_end::text) || '::timestamptz' END || ', ' ||
  CASE WHEN trial_end IS NULL THEN 'NULL' ELSE quote_literal(trial_end::text) || '::timestamptz' END || ', ' ||
  COALESCE(is_trial_used::text, 'false') || ', ' ||
  COALESCE(quote_literal(stripe_subscription_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(last_invoice_url), 'NULL') || ', ' ||
  COALESCE(next_invoice_amount::text, 'NULL') ||
  ') ON CONFLICT (email) DO UPDATE SET subscribed = EXCLUDED.subscribed, subscription_tier = EXCLUDED.subscription_tier;',
  E'\n'
) FROM public.subscribers;
```

### 19. Feature Flags
```sql
SELECT string_agg(
  'INSERT INTO public.feature_flags (id, name, description, enabled_globally) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  enabled_globally::text ||
  ') ON CONFLICT (name) DO UPDATE SET enabled_globally = EXCLUDED.enabled_globally;',
  E'\n'
) FROM public.feature_flags;
```

### 20. Subscription Features
```sql
SELECT string_agg(
  'INSERT INTO public.subscription_features (id, feature_id, subscription_tier, value) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  CASE WHEN feature_id IS NULL THEN 'NULL' ELSE quote_literal(feature_id::text) || '::uuid' END || ', ' ||
  quote_literal(subscription_tier) || ', ' ||
  quote_literal(value::text) || '::jsonb' ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.subscription_features;
```

### 21. User Features
```sql
SELECT string_agg(
  'INSERT INTO public.user_features (id, user_id, feature_id, enabled, value, reason, expires_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  CASE WHEN user_id IS NULL THEN 'NULL' ELSE quote_literal(user_id::text) || '::uuid' END || ', ' ||
  CASE WHEN feature_id IS NULL THEN 'NULL' ELSE quote_literal(feature_id::text) || '::uuid' END || ', ' ||
  enabled::text || ', ' ||
  quote_literal(value::text) || '::jsonb, ' ||
  COALESCE(quote_literal(reason), 'NULL') || ', ' ||
  CASE WHEN expires_at IS NULL THEN 'NULL' ELSE quote_literal(expires_at::text) || '::timestamptz' END ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.user_features;
```

### 22. User Notifications
```sql
SELECT string_agg(
  'INSERT INTO public.user_notifications (id, user_id, type, title, message, read) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  quote_literal(type) || ', ' ||
  quote_literal(title) || ', ' ||
  quote_literal(message) || ', ' ||
  COALESCE(read::text, 'false') ||
  ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) FROM public.user_notifications;
```

---

## 📥 PASSO 2: Importar no Lovable Cloud

1. Execute cada query acima **no SQL Editor do projeto Supabase antigo**
2. Copie o resultado (será um ou mais comandos INSERT)
3. Acesse **Lovable Cloud → Database**
4. Cole e execute os INSERTs na **ordem apresentada**

---

## ✅ PASSO 3: Validação

Após importar, execute esta query no Lovable Cloud para conferir:

```sql
SELECT 
  'profiles' as tabela, COUNT(*) as total FROM public.profiles
UNION ALL SELECT 'services', COUNT(*) FROM public.services
UNION ALL SELECT 'sub_services', COUNT(*) FROM public.sub_services
UNION ALL SELECT 'specialties', COUNT(*) FROM public.specialties
UNION ALL SELECT 'service_questions', COUNT(*) FROM public.service_questions
UNION ALL SELECT 'question_options', COUNT(*) FROM public.question_options
UNION ALL SELECT 'service_items', COUNT(*) FROM public.service_items
UNION ALL SELECT 'quotes', COUNT(*) FROM public.quotes
UNION ALL SELECT 'quote_items', COUNT(*) FROM public.quote_items
UNION ALL SELECT 'quote_measurements', COUNT(*) FROM public.quote_measurements
UNION ALL SELECT 'quote_answers', COUNT(*) FROM public.quote_answers
UNION ALL SELECT 'provider_settings', COUNT(*) FROM public.provider_settings
UNION ALL SELECT 'provider_services', COUNT(*) FROM public.provider_services
UNION ALL SELECT 'provider_item_prices', COUNT(*) FROM public.provider_item_prices
UNION ALL SELECT 'provider_portfolio', COUNT(*) FROM public.provider_portfolio
UNION ALL SELECT 'provider_ratings', COUNT(*) FROM public.provider_ratings
UNION ALL SELECT 'quote_providers', COUNT(*) FROM public.quote_providers
UNION ALL SELECT 'subscribers', COUNT(*) FROM public.subscribers
ORDER BY tabela;
```

---

## ⚠️ OBSERVAÇÕES

- **auth.users**: Usuários precisam fazer login novamente para criar registros em `auth.users` do Lovable Cloud
- **Ordem**: Execute os scripts na ordem para respeitar foreign keys
- **Conflitos**: Scripts usam `ON CONFLICT DO NOTHING` ou `DO UPDATE` para evitar duplicatas
