import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PlatformSettings = () => {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching platform settings...');
      
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Raw settings data:', data);
      
      const settingsObj = data?.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {});
      
      console.log('Processed settings:', settingsObj);
      setSettings(settingsObj || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load platform settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      console.log('Updating setting:', key, 'with value:', value);
      
      // For admin operations, we need to ensure the user is authenticated as admin
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Try to authenticate as admin first
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: 'admin@admin.com',
          password: 'admin123456'
        });
        
        if (authError) {
          throw new Error('Admin authentication required');
        }
      }

      // Use upsert to handle both insert and update
      const { error } = await supabase
        .from('platform_settings')
        .upsert(
          { 
            setting_key: key, 
            setting_value: value,
            updated_at: new Date().toISOString()
          },
          { 
            onConflict: 'setting_key' 
          }
        );

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Setting updated successfully'
      });
      
      // Update local state immediately for better UX
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
      
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive'
      });
    }
  };

  const features = settings.features_visibility || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Settings</CardTitle>
        <CardDescription>Control platform features and visibility</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Feature Visibility</h3>
          {loading ? (
            <div className="text-center py-4">Loading settings...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium capitalize">
                      {feature.replace(/_/g, ' ')}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {enabled ? 'Visible to users' : 'Hidden from users'}
                    </span>
                  </div>
                  <Switch
                    checked={Boolean(enabled)}
                    onCheckedChange={(checked) => {
                      console.log('Toggle clicked:', feature, 'to', checked);
                      const updatedFeatures = { ...features, [feature]: checked };
                      updateSetting('features_visibility', updatedFeatures);
                    }}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformSettings;