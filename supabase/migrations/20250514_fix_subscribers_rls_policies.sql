
-- First, check if subscribers table exists
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE IF EXISTS public.subscribers ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies to avoid errors when recreating
    DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
    DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
    DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
    DROP POLICY IF EXISTS "manage_own_subscription" ON public.subscribers;
    DROP POLICY IF EXISTS "admin_manage_all_subscriptions" ON public.subscribers;
    
    -- Create comprehensive policies
    CREATE POLICY "select_own_subscription" ON public.subscribers
      FOR SELECT 
      USING (auth.uid() = user_id OR auth.email() = email);
      
    CREATE POLICY "update_own_subscription" ON public.subscribers
      FOR UPDATE 
      USING (auth.uid() = user_id OR auth.email() = email);
    
    CREATE POLICY "insert_subscription" ON public.subscribers
      FOR INSERT 
      WITH CHECK (
        -- Allow insert for authenticated users for their own data
        (auth.role() = 'authenticated' AND (auth.uid() = user_id OR auth.email() = email))
        -- Or allow Supabase functions (using service role)
        OR (auth.role() = 'service_role')
      );
    
    CREATE POLICY "admin_manage_all_subscriptions" ON public.subscribers
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );

END
$$;

-- Create an index on email and user_id for better performance
CREATE INDEX IF NOT EXISTS subscribers_user_id_idx ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS subscribers_email_idx ON public.subscribers(email);

-- Make sure we have a default index
INSERT INTO public.subscribers (email, user_id, subscribed, subscription_tier)
SELECT auth.email(), auth.uid(), false, 'free'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscribers WHERE user_id = auth.users.id
)
ON CONFLICT (email) DO NOTHING;
