-- Add client_deleted column to quotes table for soft delete
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS client_deleted boolean DEFAULT false;

-- Index for performance (optional but good)
CREATE INDEX IF NOT EXISTS idx_quotes_client_deleted ON quotes(client_deleted);
