-- Create the admin user if it doesn't exist and ensure proper setup
-- We need to create the admin@admin.com user in the auth system

-- First, let's ensure the admin user exists in auth.users
-- Note: We cannot directly insert into auth.users, but we can create a function to handle admin setup

-- Create a function to verify admin user setup
CREATE OR REPLACE FUNCTION setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Run the setup function
SELECT setup_admin_user();