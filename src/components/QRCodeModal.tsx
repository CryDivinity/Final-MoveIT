import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Download, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

interface UserData {
  profile: any;
  cars: any[];
}

interface DataSelection {
  firstName: boolean;
  lastName: boolean;
  phone: boolean;
  email: boolean;
  cars: { [key: string]: boolean };
}

const QRCodeModal = ({ open, onOpenChange, user }: QRCodeModalProps) => {
  const [userData, setUserData] = useState<UserData>({ profile: null, cars: [] });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [dataSelection, setDataSelection] = useState<DataSelection>({
    firstName: false,
    lastName: false,
    phone: false,
    email: false,
    cars: {}
  });
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (open && user) {
      fetchUserData();
    }
  }, [open, user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Fetch cars data
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', user.id);

      if (carsError) {
        console.error('Error fetching cars:', carsError);
      }

      setUserData({ profile, cars: cars || [] });
      
      // Initialize car selection state
      const carsSelection: { [key: string]: boolean } = {};
      (cars || []).forEach(car => {
        carsSelection[car.id] = false;
      });
      setDataSelection(prev => ({ ...prev, cars: carsSelection }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataToggle = (field: keyof Omit<DataSelection, 'cars'>, value: boolean) => {
    setDataSelection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCarToggle = (carId: string, value: boolean) => {
    setDataSelection(prev => ({
      ...prev,
      cars: {
        ...prev.cars,
        [carId]: value
      }
    }));
  };

  const generateQRCode = async () => {
    setGenerating(true);
    try {
      // Build the data object based on selection
      const selectedData: any = {};

      if (dataSelection.firstName && userData.profile?.first_name) {
        selectedData.firstName = userData.profile.first_name;
      }

      if (dataSelection.lastName && userData.profile?.last_name) {
        selectedData.lastName = userData.profile.last_name;
      }

      if (dataSelection.phone && userData.profile?.phone_number) {
        selectedData.phone = userData.profile.phone_number;
      }

      if (dataSelection.email && user.email) {
        selectedData.email = user.email;
      }

      // Add selected cars
      const selectedCars = userData.cars.filter(car => dataSelection.cars[car.id]);
      if (selectedCars.length > 0) {
        selectedData.cars = selectedCars.map(car => ({
          id: car.id,
          name: car.name,
          model: car.model,
          plateNumber: car.plate_number,
          ...(car.phone_number && { phone: car.phone_number })
        }));
      }

      if (Object.keys(selectedData).length === 0) {
        toast({
          title: "No data selected",
          description: "Please select at least one piece of data to include in the QR code",
          variant: "destructive",
        });
        return;
      }

      // Generate QR code
      const qrDataString = JSON.stringify(selectedData);
      const dataURL = await QRCode.toDataURL(qrDataString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataURL(dataURL);
      
      toast({
        title: "QR Code Generated",
        description: "Your QR code has been successfully generated",
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return;

    const link = document.createElement('a');
    link.download = 'my-qr-code.png';
    link.href = qrCodeDataURL;
    link.click();
  };

  const saveQRCodeToProfile = async () => {
    if (!qrCodeDataURL) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ qr_code_data: qrCodeDataURL })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "QR code saved to your profile",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save QR code",
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setQrCodeDataURL('');
    setDataSelection({
      firstName: false,
      lastName: false,
      phone: false,
      email: false,
      cars: {}
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) {
        resetModal();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
           Titlu
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {!qrCodeDataURL ? (
              <>
                {/* Profile Data Selection */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4"> Profile Info</h3>
                    <div className="space-y-3">
                      {userData.profile?.first_name && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="firstName"
                            checked={dataSelection.firstName}
                            onCheckedChange={(checked) => handleDataToggle('firstName', !!checked)}
                          />
                          <label htmlFor="firstName" className="text-sm">
                            First Name: {userData.profile.first_name}
                          </label>
                        </div>
                      )}

                      {userData.profile?.last_name && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="lastName"
                            checked={dataSelection.lastName}
                            onCheckedChange={(checked) => handleDataToggle('lastName', !!checked)}
                          />
                          <label htmlFor="lastName" className="text-sm">
                            Last Name: {userData.profile.last_name}
                          </label>
                        </div>
                      )}

                      {userData.profile?.phone_number && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="phone"
                            checked={dataSelection.phone}
                            onCheckedChange={(checked) => handleDataToggle('phone', !!checked)}
                          />
                          <label htmlFor="phone" className="text-sm">
                            Phone: {userData.profile.phone_number}
                          </label>
                        </div>
                      )}

                      {user.email && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="email"
                            checked={dataSelection.email}
                            onCheckedChange={(checked) => handleDataToggle('email', !!checked)}
                          />
                          <label htmlFor="email" className="text-sm">
                            Email: {user.email}
                          </label>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Cars Data Selection */}
                {userData.cars.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-4">Car Information</h3>
                      <div className="space-y-4">
                        {userData.cars.map((car) => (
                          <div key={car.id} className="border rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox
                                id={`car-${car.id}`}
                                checked={dataSelection.cars[car.id] || false}
                                onCheckedChange={(checked) => handleCarToggle(car.id, !!checked)}
                              />
                              <label htmlFor={`car-${car.id}`} className="font-medium">
                                {car.name}
                              </label>
                            </div>
                            <div className="text-sm text-muted-foreground ml-6">
                              <p>Model: {car.model}</p>
                              <p>Plate: {car.plate_number}</p>
                              {car.phone_number && <p>Phone: {car.phone_number}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Generate Button */}
                <div className="flex justify-end">
                  <Button onClick={generateQRCode} disabled={generating}>
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              /* Generated QR Code Display */
              <div className="text-center space-y-4">
                <h3 className="font-semibold">Your QR Code</h3>
                <div className="flex justify-center">
                  <img src={qrCodeDataURL} alt="Generated QR Code" className="border rounded-lg" />
                </div>
                <div className="flex justify-center gap-2">
                  <Button onClick={downloadQRCode} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={saveQRCodeToProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    Save to Profile
                  </Button>
                  <Button onClick={() => setQrCodeDataURL('')} variant="outline">
                    Generate New
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;