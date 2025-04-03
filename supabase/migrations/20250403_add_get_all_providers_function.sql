
-- Create a function to get all providers without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_all_providers()
RETURNS SETOF json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', id,
    'name', name,
    'phone', phone,
    'role', role
  )
  FROM profiles
  WHERE role = 'provider';
$$;
