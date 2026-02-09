
-- Fix 1: Add storage policies for service-assets bucket
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-assets', 'service-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view service icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage service icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update service icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete service icons" ON storage.objects;

-- Allow anyone to view service assets (public icons)
CREATE POLICY "Anyone can view service icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-assets');

-- Only admins can upload service icons
CREATE POLICY "Admins can manage service icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-assets' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can update service icons
CREATE POLICY "Admins can update service icons"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-assets' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Only admins can delete service icons
CREATE POLICY "Admins can delete service icons"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-assets' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Fix 2: Tighten subscribers table - ensure proper RLS
-- Drop existing policy and recreate as PERMISSIVE so it actually works
DROP POLICY IF EXISTS "View own subscription" ON subscribers;
CREATE POLICY "View own subscription"
ON subscribers FOR SELECT
USING (user_id = auth.uid());

-- Fix 3: Fix anonymous quotes data leak
-- Remove the OR is_anonymous = true from SELECT policy so unauthenticated users can't see quote addresses
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
CREATE POLICY "Users can view their own quotes"
ON quotes FOR SELECT
USING (auth.uid() = client_id);

-- Also fix INSERT policy - anonymous quotes should still require auth
DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
CREATE POLICY "Users can insert their own quotes"
ON quotes FOR INSERT
WITH CHECK (auth.uid() = client_id);
