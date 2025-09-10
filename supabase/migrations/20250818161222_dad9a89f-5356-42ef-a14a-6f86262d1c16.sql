-- Insert default platform settings if they don't exist
INSERT INTO public.platform_settings (setting_key, setting_value, description)
SELECT 
  'features_visibility',
  '{"qr_system": true, "reports": true, "emergency": true, "navigation": true, "security": true, "community": true, "advanced_payment": true, "advanced_penalties": true, "advanced_vehicles": true, "advanced_languages": true, "advanced_interface": true, "advanced_notifications": true}'::jsonb,
  'Controls which platform features are visible to users'
WHERE NOT EXISTS (
  SELECT 1 FROM public.platform_settings WHERE setting_key = 'features_visibility'
);