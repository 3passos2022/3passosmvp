
-- Garantir que a RLS está habilitada (idempotente)
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- 1) Permitir INSERT para o próprio prestador
DROP POLICY IF EXISTS "Providers can insert their own services" ON public.provider_services;

CREATE POLICY "Providers can insert their own services"
  ON public.provider_services
  FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- 2) Opcional: Administradores podem gerenciar tudo
DROP POLICY IF EXISTS "Admins can manage all provider services" ON public.provider_services;

CREATE POLICY "Admins can manage all provider services"
  ON public.provider_services
  FOR ALL
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
