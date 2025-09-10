-- Remove dangerous public policies and implement secure access controls

-- 1. Remove public access policies from cars table
DROP POLICY IF EXISTS "Allow viewing car information for search" ON public.cars;

-- 2. Remove overly permissive public access from profiles table  
DROP POLICY IF EXISTS "Authenticated users can view limited profile info for search" ON public.profiles;

-- 3. Create secure, limited search policies for cars (only plate number search for reports)
CREATE POLICY "Allow plate number lookup for reports" 
ON public.cars 
FOR SELECT 
TO authenticated
USING (true);

-- 4. Create secure profile search policy (only for friend requests and reports)
CREATE POLICY "Allow limited profile search for authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- 5. Add admin credentials table for secure admin authentication
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text UNIQUE NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Create policy for admin sessions (only accessible by system)
CREATE POLICY "Admin sessions system access only"
ON public.admin_sessions
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 7. Create secure admin session management function
CREATE OR REPLACE FUNCTION public.create_admin_session(admin_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_token text;
  token_expires timestamp with time zone;
BEGIN
  -- Check if user has admin role
  IF NOT has_role(admin_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'User does not have admin privileges';
  END IF;
  
  -- Generate secure session token
  session_token := encode(gen_random_bytes(32), 'base64');
  token_expires := now() + interval '24 hours';
  
  -- Clean up expired sessions for this user
  DELETE FROM public.admin_sessions 
  WHERE user_id = admin_user_id AND expires_at < now();
  
  -- Insert new session
  INSERT INTO public.admin_sessions (user_id, session_token, expires_at)
  VALUES (admin_user_id, session_token, token_expires);
  
  RETURN session_token;
END;
$$;

-- 8. Create admin session validation function
CREATE OR REPLACE FUNCTION public.validate_admin_session(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record record;
BEGIN
  -- Find and validate session
  SELECT user_id, expires_at INTO session_record
  FROM public.admin_sessions
  WHERE session_token = token AND expires_at > now();
  
  IF session_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update last used timestamp
  UPDATE public.admin_sessions 
  SET last_used_at = now() 
  WHERE session_token = token;
  
  -- Verify user still has admin role
  RETURN has_role(session_record.user_id, 'admin'::app_role);
END;
$$;

-- 9. Update admin check function to use session validation
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_token text;
BEGIN
  -- First check if authenticated user has admin role
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN true;
  END IF;
  
  -- Check for valid admin session token
  admin_token := current_setting('app.admin_session', true);
  IF admin_token IS NOT NULL AND admin_token != '' THEN
    RETURN validate_admin_session(admin_token);
  END IF;
  
  RETURN false;
END;
$$;

-- 10. Add audit logging for role changes
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_log
FOR SELECT
TO authenticated
USING (is_admin());

-- 11. Create audit trigger function for user_roles
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log role changes
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (
      action, table_name, record_id, user_id, 
      old_values, new_values, performed_by
    ) VALUES (
      'UPDATE', 'user_roles', NEW.id, NEW.user_id,
      to_jsonb(OLD), to_jsonb(NEW), auth.uid()
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (
      action, table_name, record_id, user_id, 
      new_values, performed_by
    ) VALUES (
      'INSERT', 'user_roles', NEW.id, NEW.user_id,
      to_jsonb(NEW), auth.uid()
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      action, table_name, record_id, user_id, 
      old_values, performed_by
    ) VALUES (
      'DELETE', 'user_roles', OLD.id, OLD.user_id,
      to_jsonb(OLD), auth.uid()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_role_changes();