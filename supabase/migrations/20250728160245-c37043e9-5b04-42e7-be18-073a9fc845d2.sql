-- Add admin role check function for feedback management
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) OR (
    -- Also check for admin session in case of simple admin auth
    SELECT COALESCE(current_setting('app.admin_session', true), '') <> ''
  );
$$;

-- Update feedback RLS policies to allow admin access
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.feedback;

CREATE POLICY "Admins can manage all feedback" 
ON public.feedback 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add a quick test feedback entry for demonstration
INSERT INTO public.feedback (
  name, 
  email, 
  subject, 
  message, 
  rating, 
  status, 
  is_visible
) VALUES (
  'Test User',
  'test@example.com',
  'Great Platform!',
  'DAP has been incredibly helpful for our community. The features are amazing and easy to use.',
  5,
  'approved',
  true
) ON CONFLICT DO NOTHING;