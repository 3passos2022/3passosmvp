
-- Create a function to add provider ratings
CREATE OR REPLACE FUNCTION public.add_provider_rating(p_provider_id UUID, p_quote_id UUID, p_rating INTEGER, p_comment TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rating_id UUID;
BEGIN
  -- Check rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Insert rating
  INSERT INTO public.provider_ratings (
    provider_id,
    quote_id,
    rating,
    comment
  )
  VALUES (
    p_provider_id,
    p_quote_id,
    p_rating,
    p_comment
  )
  RETURNING id INTO v_rating_id;
  
  RETURN v_rating_id;
END;
$$;
