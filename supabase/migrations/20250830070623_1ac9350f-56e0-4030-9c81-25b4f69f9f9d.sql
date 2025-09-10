-- Create admin user in auth.users if it doesn't exist
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@admin.com';
    
    -- If admin user doesn't exist, insert it
    IF admin_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            '685418bd-9139-447c-a970-3b7a2318a035'::uuid,
            'authenticated',
            'authenticated',
            'admin@admin.com',
            '$2b$10$rQ/3j.7vXzNhDVYZF8B1WuH4o8Z7yDj6Tm4Xj9Z8Kq1Rv5X3Wz2Ym', -- admin123456
            NOW(),
            NOW(),
            '',
            NOW(),
            '',
            NOW(),
            '',
            '',
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Admin","last_name":"User"}',
            false,
            NOW(),
            NOW(),
            null,
            null,
            '',
            '',
            NOW(),
            '',
            0,
            null,
            '',
            NOW()
        );
        
        admin_user_id := '685418bd-9139-447c-a970-3b7a2318a035'::uuid;
    END IF;
    
    -- Ensure admin profile exists
    INSERT INTO public.profiles (user_id, first_name, last_name, is_profile_complete)
    VALUES (admin_user_id, 'Admin', 'User', true)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Ensure admin role exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;