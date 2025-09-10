import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User as UserIcon, 
  Car, 
  Upload, 
  FileText, 
  Shield, 
  Settings, 
  Edit, 
  Trash2, 
  Plus,
  Camera,
  Mail,
  Key,
  UserX
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import CameraCapture from '@/components/CameraCapture';
import CarEditModal from '@/components/CarEditModal';
import { useLanguage } from '@/components/language-provider';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  setShowQRCodeModal?: (show: boolean) => void;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone_number: string;
}

interface CarFormData {
  name: string;
  model: string;
  plate_number: string;
  phone_number: string;
}

interface ServiceFormData {
  service_type: 'insurance' | 'maintenance' | 'driver_id' | 'car_id';
  title: string;
  description: string;
  car_id?: string;
  price: number;
  expiry_date?: string;
}

const ProfileModal = ({ open, onOpenChange, user, setShowQRCodeModal }: ProfileModalProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showAddCar, setShowAddCar] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingCar, setEditingCar] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const profileForm = useForm<ProfileFormData>();
  const carForm = useForm<CarFormData>();
  const serviceForm = useForm<ServiceFormData>();

  useEffect(() => {
    if (open && user) {
      fetchProfile(user.id);
    }
  }, [open, user]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
      if (data) {
        profileForm.setValue('first_name', data.first_name || '');
        profileForm.setValue('last_name', data.last_name || '');
        profileForm.setValue('phone_number', data.phone_number || '');
      }

      fetchCars(userId);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCars = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching cars:', error);
        return;
      }

      setCars(data || []);
      fetchServices(userId);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const fetchServices = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          cars(name, model, plate_number)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const uploadImage = async (file: File, bucket: string, path: string) => {
    setUploading(true);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const updateProfileAvatar = async (file: File) => {
    if (!user) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const path = `avatars/${user.id}/${fileName}`;
      
      const imageUrl = await uploadImage(file, 'avatars', path);

      if (!profile) {
        const { error } = await supabase
          .from('profiles')
          .insert({ 
            user_id: user.id, 
            avatar_url: imageUrl,
            first_name: '',
            last_name: '',
            phone_number: '',
            is_profile_complete: false
          });
        
        if (error) throw error;
        setProfile({ user_id: user.id, avatar_url: imageUrl });
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: imageUrl })
          .eq('user_id', user.id);

        if (error) throw error;
        setProfile({ ...profile, avatar_url: imageUrl });
      }

      toast({
        title: t('profile.avatarUpdated'),
        description: t('profile.avatarUpdatedDesc'),
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: t('profile.uploadFailed'),
        description: t('profile.uploadFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      const profileData = {
        user_id: user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        is_profile_complete: true,
      };

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);
        error = insertError;
      }

      if (error) {
        console.error('Profile save error:', error);
        toast({
          title: "Profile Save Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('profile.profileSaved'),
          description: t('profile.profileSavedDesc'),
        });
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Profile save error:', error);
      toast({
        title: "Profile Save Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addCar = async (data: CarFormData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cars')
        .insert({
          user_id: user.id,
          name: data.name,
          model: data.model,
          plate_number: data.plate_number,
          phone_number: data.phone_number,
        });

      if (error) {
        toast({
          title: "Car Add Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t('profile.carAdded'),
          description: t('profile.carAddedDesc'),
        });
        carForm.reset();
        setShowAddCar(false);
        fetchCars(user.id);
      }
    } catch (error) {
      toast({
        title: "Car Add Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'insurance': return <Shield className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      case 'driver_id': return <UserIcon className="h-4 w-4" />;
      case 'car_id': return <Car className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold">{t('profile.title')}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm">
              <TabsTrigger value="profile" className="text-xs sm:text-sm">{t('profile.profileTab')}</TabsTrigger>
              <TabsTrigger value="cars" className="text-xs sm:text-sm">{t('profile.carsTab')}</TabsTrigger>
              <TabsTrigger value="services" className="text-xs sm:text-sm">{t('profile.servicesTab')}</TabsTrigger>
              <TabsTrigger value="account" className="text-xs sm:text-sm">{t('profile.accountTab')}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    {t('profile.personalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-base sm:text-lg">
                        {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <CameraCapture
                      onCapture={updateProfileAvatar}
                      trigger={
                        <Button variant="outline" size="sm" disabled={uploading} className="text-xs sm:text-sm">
                          <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">{uploading ? t('profile.uploading') : t('profile.changePhoto')}</span>
                          <span className="sm:hidden">📷</span>
                        </Button>
                      }
                    />
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">{t('profile.firstName')}</Label>
                        <Input
                          id="first_name"
                          {...profileForm.register('first_name', { required: 'First name is required' })}
                          placeholder={t('profile.firstNamePlaceholder')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">{t('profile.lastName')}</Label>
                        <Input
                          id="last_name"
                          {...profileForm.register('last_name', { required: 'Last name is required' })}
                          placeholder={t('profile.lastNamePlaceholder')}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone_number">{t('profile.phoneNumber')}</Label>
                      <Input
                        id="phone_number"
                        {...profileForm.register('phone_number')}
                        placeholder={t('profile.phoneNumberPlaceholder')}
                        type="tel"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {t('profile.saveProfile')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cars" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    {t('profile.myCars')}
                  </CardTitle>
                  <Button onClick={() => setShowAddCar(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('profile.addCar')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {cars.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('profile.noCarsAdded')}
                    </div>
                  ) : (
                     <div className="grid gap-4">
                      {cars.map((car) => (
                        <div key={car.id} className="border rounded-lg p-4 flex items-center gap-4">
                          {/* Car Image */}
                          <div className="flex-shrink-0">
                            {car.image_url ? (
                              <img 
                                src={car.image_url} 
                                alt={`${car.name} ${car.model}`}
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center">
                                <Car className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Car Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{car.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">{car.model}</p>
                            <p className="text-sm font-mono">{car.plate_number}</p>
                            {car.phone_number && (
                              <p className="text-xs text-muted-foreground">{car.phone_number}</p>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingCar(car)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Car Form */}
              {showAddCar && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('profile.addNewCar')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={carForm.handleSubmit(addCar)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="car_name">{t('profile.carName')}</Label>
                          <Input
                            id="car_name"
                            {...carForm.register('name', { required: 'Car name is required' })}
                            placeholder={t('profile.carNamePlaceholder')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="car_model">{t('profile.model')}</Label>
                          <Input
                            id="car_model"
                            {...carForm.register('model', { required: 'Model is required' })}
                            placeholder={t('profile.modelPlaceholder')}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="plate_number">{t('profile.plateNumber')}</Label>
                          <Input
                            id="plate_number"
                            {...carForm.register('plate_number', { required: 'Plate number is required' })}
                            placeholder={t('profile.plateNumberPlaceholder')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="car_phone">{t('profile.carPhoneNumber')}</Label>
                          <Input
                            id="car_phone"
                            {...carForm.register('phone_number')}
                            placeholder={t('profile.carPhonePlaceholder')}
                            type="tel"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">{t('profile.addCar')}</Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setShowAddCar(false)}
                        >
                          {t('profile.cancel')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('profile.myServices')}
                  </CardTitle>
                  <Button onClick={() => setShowAddService(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('profile.addService')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('profile.noServicesAdded')}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {services.map((service) => (
                        <div key={service.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getServiceTypeIcon(service.service_type)}
                              <h4 className="font-semibold">{service.title}</h4>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              service.status === 'active' ? 'bg-green-100 text-green-800' :
                              service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {service.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                          {service.price && (
                            <p className="text-sm font-medium">${service.price}</p>
                          )}
                          {service.expiry_date && (
                            <p className="text-xs text-muted-foreground">
                              Expires: {new Date(service.expiry_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {t('profile.accountSettings')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{t('profile.email')}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('profile.change')}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{t('profile.password')}</p>
                          <p className="text-sm text-muted-foreground">{t('profile.passwordDesc')}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('profile.change')}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                      <div className="flex items-center gap-3">
                        <UserX className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="font-medium text-destructive">{t('profile.deleteAccount')}</p>
                          <p className="text-sm text-muted-foreground">{t('profile.deleteAccountDesc')}</p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm">
                        {t('profile.delete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-7.364l-.707.707M6.343 6.343l-.707-.707m12.02 12.02l-.707-.707M6.343 17.657l-.707.707" />
                    </svg>
                    {t('profile.qrCode')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {profile?.qr_code_data ? (
                    <div className="mx-auto w-48 h-48 border rounded-lg overflow-hidden">
                      <img 
                        src={profile.qr_code_data} 
                        alt="Profile QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mx-auto w-48 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <svg className="h-12 w-12 mx-auto mb-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-7.364l-.707.707M6.343 6.343l-.707-.707m12.02 12.02l-.707-.707M6.343 17.657l-.707.707" />
                        </svg>
                        <p className="text-sm text-muted-foreground">{t('profile.qrCodeDesc')}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => setShowQRCodeModal && setShowQRCodeModal(true)}
                    >
                      {profile?.qr_code_data ? t('profile.updateQR') : t('profile.generateQR')}
                    </Button>
                    {profile?.qr_code_data && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = profile.qr_code_data;
                          link.download = 'my-qr-code.png';
                          link.click();
                        }}
                      >
                        {t('profile.downloadQR')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {editingCar && (
        <CarEditModal
          open={!!editingCar}
          onOpenChange={() => setEditingCar(null)}
          car={editingCar}
          onCarUpdated={() => fetchCars(user.id)}
        />
      )}
    </>
  );
};

export default ProfileModal;