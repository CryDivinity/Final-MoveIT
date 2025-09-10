-- Create a proper admin user setup function
-- This will help ensure the admin user has the correct credentials

-- Update the admin login process to work with existing admin user
CREATE OR REPLACE FUNCTION authenticate_admin(username_input text, password_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
  result jsonb;
BEGIN
  -- Check for hardcoded admin credentials
  IF username_input = 'admin' AND password_input = 'admin' THEN
    -- Find any user with admin role
    SELECT user_id INTO admin_user_id 
    FROM user_roles 
    WHERE role = 'admin'::app_role 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
      -- Return success with admin user ID
      result := jsonb_build_object(
        'success', true,
        'user_id', admin_user_id,
        'message', 'Admin authentication successful'
      );
    ELSE
      result := jsonb_build_object(
        'success', false,
        'message', 'No admin user found'
      );
    END IF;
  ELSE
    result := jsonb_build_object(
      'success', false,
      'message', 'Invalid admin credentials'
    );
  END IF;
  
  RETURN result;
END;
$$;