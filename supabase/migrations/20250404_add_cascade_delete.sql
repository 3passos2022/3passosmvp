-- Add ON DELETE CASCADE to foreign keys referencing quotes table
-- This allows a quote to be deleted along with all its related data

-- quote_items
ALTER TABLE quote_items DROP CONSTRAINT IF EXISTS quote_items_quote_id_fkey;
ALTER TABLE quote_items 
  ADD CONSTRAINT quote_items_quote_id_fkey 
  FOREIGN KEY (quote_id) 
  REFERENCES quotes(id) 
  ON DELETE CASCADE;

-- quote_measurements
ALTER TABLE quote_measurements DROP CONSTRAINT IF EXISTS quote_measurements_quote_id_fkey;
ALTER TABLE quote_measurements 
  ADD CONSTRAINT quote_measurements_quote_id_fkey 
  FOREIGN KEY (quote_id) 
  REFERENCES quotes(id) 
  ON DELETE CASCADE;

-- quote_answers
ALTER TABLE quote_answers DROP CONSTRAINT IF EXISTS quote_answers_quote_id_fkey;
ALTER TABLE quote_answers 
  ADD CONSTRAINT quote_answers_quote_id_fkey 
  FOREIGN KEY (quote_id) 
  REFERENCES quotes(id) 
  ON DELETE CASCADE;

-- quote_providers
ALTER TABLE quote_providers DROP CONSTRAINT IF EXISTS quote_providers_quote_id_fkey;
ALTER TABLE quote_providers 
  ADD CONSTRAINT quote_providers_quote_id_fkey 
  FOREIGN KEY (quote_id) 
  REFERENCES quotes(id) 
  ON DELETE CASCADE;

-- provider_ratings
ALTER TABLE provider_ratings DROP CONSTRAINT IF EXISTS fk_provider_ratings_quote;
ALTER TABLE provider_ratings 
  ADD CONSTRAINT fk_provider_ratings_quote 
  FOREIGN KEY (quote_id) 
  REFERENCES quotes(id) 
  ON DELETE CASCADE;
