import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformSettings {
  features_visibility?: {
    [key: string]: boolean;
  };
}

export const usePlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    
    // Set up real-time subscription to platform_settings changes
    const channel = supabase
      .channel('platform_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_settings'
        },
        () => {
          console.log('Platform settings changed, refetching...');
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching platform settings...');
      
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
      
      if (error) {
        console.error('Error in usePlatformSettings:', error);
        throw error;
      }
      
      console.log('Fetched settings data:', data);
      
      const settingsObj = data?.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {} as PlatformSettings);
      
      console.log('Processed settings object:', settingsObj);
      setSettings(settingsObj || {});
    } catch (error) {
      console.error('Error fetching platform settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureVisible = (featureKey: string): boolean => {
    const features = settings.features_visibility || {};
    console.log('Checking feature visibility for:', featureKey, 'in features:', features);
    // Default to true if feature is not explicitly configured
    const isVisible = features[featureKey] !== false;
    console.log(`Feature ${featureKey} visibility:`, isVisible);
    return isVisible;
  };

  return {
    settings,
    loading,
    isFeatureVisible,
    refetch: fetchSettings
  };
};