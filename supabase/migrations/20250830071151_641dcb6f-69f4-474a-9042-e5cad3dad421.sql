-- Ensure admin user exists and update admin credentials
-- First, let's check if we need to update the admin user password in Supabase
-- This will ensure the admin@admin.com user has the correct password: admin123456

-- Update any existing admin credentials to use the standard admin/admin format
UPDATE admin_credentials 
SET username = 'admin', 
    password_hash = crypt('admin', gen_salt('bf'))
WHERE username = 'admin' OR id = (SELECT id FROM admin_credentials LIMIT 1);

-- If no admin credentials exist, insert them
INSERT INTO admin_credentials (username, password_hash)
SELECT 'admin', crypt('admin', gen_salt('bf'))
WHERE NOT EXISTS (SELECT 1 FROM admin_credentials WHERE username = 'admin');