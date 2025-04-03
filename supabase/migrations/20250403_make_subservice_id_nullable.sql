
ALTER TABLE public.quotes 
ALTER COLUMN sub_service_id DROP NOT NULL,
ALTER COLUMN specialty_id DROP NOT NULL;

-- Update the submit_quote function to handle null values
CREATE OR REPLACE FUNCTION public.submit_quote(
  p_service_id UUID,
  p_sub_service_id UUID DEFAULT NULL,
  p_specialty_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_street TEXT DEFAULT '',
  p_number TEXT DEFAULT '',
  p_complement TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT '',
  p_city TEXT DEFAULT '',
  p_state TEXT DEFAULT '',
  p_zip_code TEXT DEFAULT '',
  p_is_anonymous BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
  v_client_id UUID;
BEGIN
  -- Obter ID do cliente se autenticado
  v_client_id := CASE WHEN p_is_anonymous THEN NULL ELSE auth.uid() END;
  
  -- Inserir a nova cotação
  INSERT INTO public.quotes (
    client_id,
    service_id,
    sub_service_id,
    specialty_id,
    description,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zip_code,
    is_anonymous,
    status
  )
  VALUES (
    v_client_id,
    p_service_id,
    p_sub_service_id,
    p_specialty_id,
    p_description,
    p_street,
    p_number,
    p_complement,
    p_neighborhood,
    p_city,
    p_state,
    p_zip_code,
    p_is_anonymous,
    'pending'
  )
  RETURNING id INTO v_quote_id;
  
  -- Retornar o ID da cotação criada
  RETURN v_quote_id;
END;
$$;
