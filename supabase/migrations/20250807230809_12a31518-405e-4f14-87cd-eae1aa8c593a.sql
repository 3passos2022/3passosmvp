
-- 1) Tornar specialty_id opcional (nullable) e remover default indevido
ALTER TABLE public.provider_services
  ALTER COLUMN specialty_id DROP NOT NULL,
  ALTER COLUMN specialty_id DROP DEFAULT;

-- 2) Garantir que a coluna sub_service_id exista
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'provider_services'
      AND column_name = 'sub_service_id'
  ) THEN
    ALTER TABLE public.provider_services
      ADD COLUMN sub_service_id uuid NULL;
  END IF;
END
$$;

-- 2.1) Adicionar FK para sub_services, caso ainda não exista
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'provider_services_sub_service_id_fkey'
  ) THEN
    ALTER TABLE public.provider_services
      ADD CONSTRAINT provider_services_sub_service_id_fkey
      FOREIGN KEY (sub_service_id)
      REFERENCES public.sub_services(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- 3) Índices únicos parciais para evitar duplicidades
-- Um registro por prestador + subserviço quando não há especialidade
CREATE UNIQUE INDEX IF NOT EXISTS provider_services_uq_provider_subservice_no_specialty
  ON public.provider_services (provider_id, sub_service_id)
  WHERE specialty_id IS NULL;

-- Um registro por prestador + especialidade quando há especialidade
CREATE UNIQUE INDEX IF NOT EXISTS provider_services_uq_provider_specialty
  ON public.provider_services (provider_id, specialty_id)
  WHERE specialty_id IS NOT NULL;

-- Índices auxiliares para performance (FKs e filtros)
CREATE INDEX IF NOT EXISTS provider_services_provider_id_idx
  ON public.provider_services (provider_id);

CREATE INDEX IF NOT EXISTS provider_services_sub_service_id_idx
  ON public.provider_services (sub_service_id);

CREATE INDEX IF NOT EXISTS provider_services_specialty_id_idx
  ON public.provider_services (specialty_id);
