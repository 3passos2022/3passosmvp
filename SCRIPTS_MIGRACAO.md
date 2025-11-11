# Scripts de Migração de Dados - Supabase para Lovable Cloud

## 📋 PASSO 1: Exportar Dados do Projeto Supabase Antigo

Execute os seguintes scripts SQL no **SQL Editor** do seu projeto Supabase antigo. Cada query vai gerar um resultado que você deve copiar.

### 1.1 - Exportar Profiles
```sql
SELECT 
  'INSERT INTO public.profiles (id, email, name, role, avatar_url, address, phone, bio, city, neighborhood, subscribed, subscription_tier, subscription_end) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || COALESCE(REPLACE(email, '''', ''''''), '') || ''', ' ||
    CASE WHEN name IS NULL THEN 'NULL' ELSE '''' || REPLACE(name, '''', '''''') || '''' END || ', ' ||
    '''' || COALESCE(role, 'client') || ''', ' ||
    CASE WHEN avatar_url IS NULL THEN 'NULL' ELSE '''' || REPLACE(avatar_url, '''', '''''') || '''' END || ', ' ||
    CASE WHEN address IS NULL THEN 'NULL' ELSE '''' || REPLACE(address, '''', '''''') || '''' END || ', ' ||
    CASE WHEN phone IS NULL THEN 'NULL' ELSE '''' || REPLACE(phone, '''', '''''') || '''' END || ', ' ||
    CASE WHEN bio IS NULL THEN 'NULL' ELSE '''' || REPLACE(bio, '''', '''''') || '''' END || ', ' ||
    CASE WHEN city IS NULL THEN 'NULL' ELSE '''' || REPLACE(city, '''', '''''') || '''' END || ', ' ||
    CASE WHEN neighborhood IS NULL THEN 'NULL' ELSE '''' || REPLACE(neighborhood, '''', '''''') || '''' END || ', ' ||
    COALESCE(subscribed::text, 'false') || ', ' ||
    '''' || COALESCE(subscription_tier, 'free') || ''', ' ||
    CASE WHEN subscription_end IS NULL THEN 'NULL' ELSE '''' || subscription_end || '''::timestamptz' END ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;'
FROM public.profiles;
```

### 1.2 - Exportar Services
```sql
SELECT 
  'INSERT INTO public.services (id, name, description, image_url) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    CASE WHEN description IS NULL THEN 'NULL' ELSE '''' || REPLACE(description, '''', '''''') || '''' END || ', ' ||
    CASE WHEN image_url IS NULL THEN 'NULL' ELSE '''' || REPLACE(image_url, '''', '''''') || '''' END ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.services;
```

### 1.3 - Exportar Sub Services
```sql
SELECT 
  'INSERT INTO public.sub_services (id, service_id, name, description) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || service_id || '''::uuid, ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    CASE WHEN description IS NULL THEN 'NULL' ELSE '''' || REPLACE(description, '''', '''''') || '''' END ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.sub_services;
```

### 1.4 - Exportar Specialties
```sql
SELECT 
  'INSERT INTO public.specialties (id, sub_service_id, name, description) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || sub_service_id || '''::uuid, ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    CASE WHEN description IS NULL THEN 'NULL' ELSE '''' || REPLACE(description, '''', '''''') || '''' END ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.specialties;
```

### 1.5 - Exportar Service Questions
```sql
SELECT 
  'INSERT INTO public.service_questions (id, service_id, sub_service_id, specialty_id, question) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    CASE WHEN service_id IS NULL THEN 'NULL' ELSE '''' || service_id || '''::uuid' END || ', ' ||
    CASE WHEN sub_service_id IS NULL THEN 'NULL' ELSE '''' || sub_service_id || '''::uuid' END || ', ' ||
    CASE WHEN specialty_id IS NULL THEN 'NULL' ELSE '''' || specialty_id || '''::uuid' END || ', ' ||
    '''' || REPLACE(question, '''', '''''') || '''' ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.service_questions;
```

### 1.6 - Exportar Question Options
```sql
SELECT 
  'INSERT INTO public.question_options (id, question_id, option_text) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || question_id || '''::uuid, ' ||
    '''' || REPLACE(option_text, '''', '''''') || '''' ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.question_options;
```

### 1.7 - Exportar Service Items
```sql
SELECT 
  'INSERT INTO public.service_items (id, service_id, sub_service_id, specialty_id, name, description, type, reference_value) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    CASE WHEN service_id IS NULL THEN 'NULL' ELSE '''' || service_id || '''::uuid' END || ', ' ||
    CASE WHEN sub_service_id IS NULL THEN 'NULL' ELSE '''' || sub_service_id || '''::uuid' END || ', ' ||
    CASE WHEN specialty_id IS NULL THEN 'NULL' ELSE '''' || specialty_id || '''::uuid' END || ', ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    CASE WHEN description IS NULL THEN 'NULL' ELSE '''' || REPLACE(description, '''', '''''') || '''' END || ', ' ||
    '''' || type || ''', ' ||
    COALESCE(reference_value::text, 'NULL') ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.service_items;
```

### 1.8 - Exportar Provider Settings
```sql
SELECT 
  'INSERT INTO public.provider_settings (id, provider_id, service_radius_km, accepts_new_clients) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || provider_id || '''::uuid, ' ||
    COALESCE(service_radius_km::text, '50') || ', ' ||
    COALESCE(accepts_new_clients::text, 'true') ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (provider_id) DO UPDATE SET service_radius_km = EXCLUDED.service_radius_km;'
FROM public.provider_settings;
```

### 1.9 - Exportar Provider Services
```sql
SELECT 
  'INSERT INTO public.provider_services (id, provider_id, service_id, sub_service_id, specialty_id) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || provider_id || '''::uuid, ' ||
    CASE WHEN service_id IS NULL THEN 'NULL' ELSE '''' || service_id || '''::uuid' END || ', ' ||
    CASE WHEN sub_service_id IS NULL THEN 'NULL' ELSE '''' || sub_service_id || '''::uuid' END || ', ' ||
    CASE WHEN specialty_id IS NULL THEN 'NULL' ELSE '''' || specialty_id || '''::uuid' END ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.provider_services;
```

### 1.10 - Exportar Provider Item Prices
```sql
SELECT 
  'INSERT INTO public.provider_item_prices (id, provider_id, service_item_id, price_per_unit) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || provider_id || '''::uuid, ' ||
    '''' || service_item_id || '''::uuid, ' ||
    price_per_unit::text ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (provider_id, service_item_id) DO UPDATE SET price_per_unit = EXCLUDED.price_per_unit;'
FROM public.provider_item_prices;
```

### 1.11 - Exportar Provider Portfolio
```sql
SELECT 
  'INSERT INTO public.provider_portfolio (id, provider_id, image_url, description) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || provider_id || '''::uuid, ' ||
    '''' || REPLACE(image_url, '''', '''''') || ''', ' ||
    CASE WHEN description IS NULL THEN 'NULL' ELSE '''' || REPLACE(description, '''', '''''') || '''' END ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.provider_portfolio;
```

### 1.12 - Exportar Provider Ratings (se existir)
```sql
SELECT 
  'INSERT INTO public.provider_ratings (id, provider_id, quote_id, client_id, rating, comment) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || provider_id || '''::uuid, ' ||
    '''' || quote_id || '''::uuid, ' ||
    '''' || client_id || '''::uuid, ' ||
    rating::text || ', ' ||
    CASE WHEN comment IS NULL THEN 'NULL' ELSE '''' || REPLACE(comment, '''', '''''') || '''' END ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (quote_id) DO NOTHING;'
FROM public.provider_ratings
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_ratings');
```

### 1.13 - Exportar Quotes (dados existentes)
```sql
SELECT 
  'INSERT INTO public.quotes (id, user_id, service_id, sub_service_id, specialty_id, service_name, sub_service_name, specialty_name, items, measurements, address, description, status, service_date, service_end_date, service_time_preference) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || user_id || '''::uuid, ' ||
    '''' || service_id || '''::uuid, ' ||
    CASE WHEN sub_service_id IS NULL THEN 'NULL' ELSE '''' || sub_service_id || '''::uuid' END || ', ' ||
    CASE WHEN specialty_id IS NULL THEN 'NULL' ELSE '''' || specialty_id || '''::uuid' END || ', ' ||
    '''' || REPLACE(service_name, '''', '''''') || ''', ' ||
    CASE WHEN sub_service_name IS NULL THEN 'NULL' ELSE '''' || REPLACE(sub_service_name, '''', '''''') || '''' END || ', ' ||
    CASE WHEN specialty_name IS NULL THEN 'NULL' ELSE '''' || REPLACE(specialty_name, '''', '''''') || '''' END || ', ' ||
    CASE WHEN items IS NULL THEN 'NULL' ELSE '''' || REPLACE(items::text, '''', '''''') || '''::jsonb' END || ', ' ||
    CASE WHEN measurements IS NULL THEN 'NULL' ELSE '''' || REPLACE(measurements::text, '''', '''''') || '''::jsonb' END || ', ' ||
    '''' || REPLACE(address::text, '''', '''''') || '''::jsonb, ' ||
    CASE WHEN description IS NULL THEN 'NULL' ELSE '''' || REPLACE(description, '''', '''''') || '''' END || ', ' ||
    '''' || status || ''', ' ||
    CASE WHEN service_date IS NULL THEN 'NULL' ELSE '''' || service_date || '''::timestamptz' END || ', ' ||
    CASE WHEN service_end_date IS NULL THEN 'NULL' ELSE '''' || service_end_date || '''::timestamptz' END || ', ' ||
    CASE WHEN service_time_preference IS NULL THEN 'NULL' ELSE '''' || REPLACE(service_time_preference, '''', '''''') || '''' END ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.quotes;
```

### 1.14 - Exportar Quote Providers
```sql
SELECT 
  'INSERT INTO public.quote_providers (id, quote_id, provider_id, status, total_price) VALUES ' ||
  string_agg(
    '(''' || id || '''::uuid, ' ||
    '''' || quote_id || '''::uuid, ' ||
    '''' || provider_id || '''::uuid, ' ||
    '''' || status || ''', ' ||
    COALESCE(total_price::text, 'NULL') ||
    ')',
    E',\n'
  ) || ' ON CONFLICT (id) DO NOTHING;'
FROM public.quote_providers;
```

---

## 📥 PASSO 2: Importar Dados no Lovable Cloud

1. **Copie cada resultado** dos scripts acima
2. **Abra o Lovable Cloud** → Database
3. **Execute cada INSERT** na ordem apresentada
4. **Verifique os dados** após cada importação

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Ordem de Importação**: Execute os scripts na ordem apresentada para respeitar as foreign keys
2. **auth.users**: Os perfis de usuário precisam existir em `auth.users` antes de importar profiles. Se necessário, os usuários devem fazer login novamente para criar os registros em auth.users
3. **Conflitos**: Os scripts usam `ON CONFLICT DO NOTHING` ou `DO UPDATE` para evitar duplicatas
4. **Validação**: Após importar, execute queries de validação:

```sql
-- Contar registros importados
SELECT 'profiles' as tabela, COUNT(*) as total FROM public.profiles
UNION ALL
SELECT 'services', COUNT(*) FROM public.services
UNION ALL
SELECT 'sub_services', COUNT(*) FROM public.sub_services
UNION ALL
SELECT 'specialties', COUNT(*) FROM public.specialties
UNION ALL
SELECT 'service_items', COUNT(*) FROM public.service_items
UNION ALL
SELECT 'provider_settings', COUNT(*) FROM public.provider_settings
UNION ALL
SELECT 'provider_services', COUNT(*) FROM public.provider_services
UNION ALL
SELECT 'provider_item_prices', COUNT(*) FROM public.provider_item_prices
UNION ALL
SELECT 'provider_portfolio', COUNT(*) FROM public.provider_portfolio
UNION ALL
SELECT 'quotes', COUNT(*) FROM public.quotes
UNION ALL
SELECT 'quote_providers', COUNT(*) FROM public.quote_providers;
```

---

## 🔍 TROUBLESHOOTING

### Erro de Foreign Key
Se encontrar erros de foreign key, verifique:
1. A ordem de execução dos scripts
2. Se os IDs referenciados existem nas tabelas pai

### Aspas no Texto
Se algum texto contém aspas simples e causa erro:
- Os scripts já tratam aspas simples duplicando-as (`'`)
- Se persistir, edite o INSERT manualmente

### Profiles sem auth.users
```sql
-- Verificar profiles sem usuário em auth
SELECT p.id, p.email 
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);
```

---

## 📊 Próximos Passos

Após importar todos os dados:
1. ✅ Testar login com usuários existentes
2. ✅ Verificar se serviços aparecem corretamente
3. ✅ Testar criação de novos quotes
4. ✅ Verificar perfis de provedores com portfólio
