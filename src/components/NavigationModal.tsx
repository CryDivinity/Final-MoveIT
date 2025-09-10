import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Route, Navigation as NavigationIcon } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
// Removed GoogleMapSecure import - component no longer available

interface NavigationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NavigationModal: React.FC<NavigationModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(location);
  };

  const startNavigation = () => {
    if (selectedLocation) {
      // Open Google Maps with directions
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  const resetForm = () => {
    setSelectedLocation(null);
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <NavigationIcon className="h-6 w-6 text-primary" />
            {t('navigation.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                {t('navigation.getDirections')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('navigation.clickOnMap')}
              </p>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardContent className="p-6">
              <div className="h-[400px] w-full bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">{t('navigation.mapUnavailable')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Selected Location */}
          {selectedLocation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  {t('navigation.selectedDestination')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{t('navigation.address')}:</p>
                  <p className="text-muted-foreground">{selectedLocation.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">{t('navigation.latitude')}:</p>
                    <p className="text-muted-foreground">{selectedLocation.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="font-medium">{t('navigation.longitude')}:</p>
                    <p className="text-muted-foreground">{selectedLocation.lng.toFixed(6)}</p>
                  </div>
                </div>
                <Button onClick={startNavigation} className="w-full">
                  <NavigationIcon className="h-4 w-4 mr-2" />
                  {t('navigation.startNavigation')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-medium transition-shadow">
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">{t('navigation.findPlaces')}</h3>
                <p className="text-sm text-muted-foreground">{t('navigation.nearbyLocations')}</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-medium transition-shadow">
              <CardContent className="p-4 text-center">
                <Route className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">{t('navigation.trafficInfo')}</h3>
                <p className="text-sm text-muted-foreground">{t('navigation.currentTraffic')}</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-medium transition-shadow">
              <CardContent className="p-4 text-center">
                <NavigationIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">{t('navigation.savedRoutes')}</h3>
                <p className="text-sm text-muted-foreground">{t('navigation.frequentDestinations')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NavigationModal;