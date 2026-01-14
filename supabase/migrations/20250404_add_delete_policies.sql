
-- Enable RLS on quote_providers if not already enabled (it likely is)
ALTER TABLE quote_providers ENABLE ROW LEVEL SECURITY;

-- Policy for providers to delete their own quote associations
DROP POLICY IF EXISTS "Providers can delete their own quote applications" ON quote_providers;
CREATE POLICY "Providers can delete their own quote applications"
  ON quote_providers
  FOR DELETE
  USING (auth.uid() = provider_id);

-- Policy for clients to delete their own quotes
DROP POLICY IF EXISTS "Clients can delete their own quotes" ON quotes;
CREATE POLICY "Clients can delete their own quotes"
  ON quotes
  FOR DELETE
  USING (auth.uid() = client_id);
