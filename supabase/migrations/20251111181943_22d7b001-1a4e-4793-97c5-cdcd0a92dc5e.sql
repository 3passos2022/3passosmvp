-- Enable RLS on bd_active table
ALTER TABLE public.bd_active ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view bd_active (if it stores public info)
CREATE POLICY "Anyone can view bd_active"
  ON public.bd_active
  FOR SELECT
  USING (true);