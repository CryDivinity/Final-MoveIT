-- Add Friends and Penalties visibility to platform settings
UPDATE platform_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{friends}',
  'true'::jsonb
)
WHERE setting_key = 'features_visibility';

UPDATE platform_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{penalties}',
  'true'::jsonb
)
WHERE setting_key = 'features_visibility';

-- If no features_visibility setting exists, create it with all features enabled
INSERT INTO platform_settings (setting_key, setting_value, description)
SELECT 
  'features_visibility',
  '{"reports": true, "emergency": true, "navigation": true, "community": true, "qr_system": true, "friends": true, "penalties": true}'::jsonb,
  'Controls visibility of platform features for users'
WHERE NOT EXISTS (
  SELECT 1 FROM platform_settings WHERE setting_key = 'features_visibility'
);