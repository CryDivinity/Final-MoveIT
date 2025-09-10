-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user exists in profiles
  SELECT user_id INTO admin_user_id FROM profiles WHERE 
    first_name = 'Admin' AND last_name = 'User' LIMIT 1;
  
  -- If admin user doesn't exist in profiles, we need manual setup
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Admin user needs to be created manually in Supabase Auth with email: admin@admin.com and password: admin123456';
  ELSE
    -- Ensure admin has admin role
    INSERT INTO user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin user setup verified for user_id: %', admin_user_id;
  END IF;
END;
$$;