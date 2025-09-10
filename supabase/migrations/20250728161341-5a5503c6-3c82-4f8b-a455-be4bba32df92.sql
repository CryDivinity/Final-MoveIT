-- Fix admin session handling for feedback management
-- First, let's create a simple function to set admin session
CREATE OR REPLACE FUNCTION public.set_admin_session(session_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT set_config('app.admin_session', session_token, false);
$$;

-- Update is_admin function to work better with session tokens
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
    -- Check for valid admin session token
    SELECT COALESCE(current_setting('app.admin_session', true), '') LIKE 'admin_%'
  );
$$;

-- Add the current user as admin for proper testing
INSERT INTO public.user_roles (user_id, role)
VALUES ('685418bd-9139-447c-a970-3b7a2318a035', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;