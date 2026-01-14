-- Add allow_contact column to quote_providers table
ALTER TABLE quote_providers 
ADD COLUMN allow_contact BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN quote_providers.allow_contact IS 'Indicates if the user has consented to share their contact details with the provider';
