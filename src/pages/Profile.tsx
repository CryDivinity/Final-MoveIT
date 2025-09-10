import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, User as UserIcon, Car, Upload, FileText, Shield, CreditCard, Settings, Camera, Edit, Key, Mail, UserX, AlertTriangle, QrCode, Download } from 'lucide-react';
import type { User, Session } from '@supabase/supabase-js';
import CameraCapture from '@/components/CameraCapture';
import CarEditModal from '@/components/CarEditModal';

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

interface EmailChangeFormData {
  newEmail: string;
  confirmEmail: string;
}

interface PasswordChangeFormData {
  newPassword: string;
  confirmPassword: string;
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showAddCar, setShowAddCar] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingCar, setEditingCar] = useState<any>(null);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormData>();
  const carForm = useForm<CarFormData>();
  const serviceForm = useForm<ServiceFormData>();
  const emailForm = useForm<EmailChangeFormData>();
  const passwordForm = useForm<PasswordChangeFormData>();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      } else {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

      if (!data) {
        setIsFirstTime(true);
      } else {
        setProfile(data);
        profileForm.setValue('first_name', data.first_name || '');
        profileForm.setValue('last_name', data.last_name || '');
        profileForm.setValue('phone_number', data.phone_number || '');
        
        if (!data.is_profile_complete) {
          setIsFirstTime(true);
        }
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

      // Create profile if it doesn't exist
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
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateCarImage = async (file: File, carId: string) => {
    if (!user) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${carId}-${Date.now()}.${fileExt}`;
      const path = `cars/${user.id}/${fileName}`;
      
      const imageUrl = await uploadImage(file, 'avatars', path);

      const { error } = await supabase
        .from('cars')
        .update({ image_url: imageUrl })
        .eq('id', carId);

      if (error) throw error;

      setCars(cars.map(car => 
        car.id === carId ? { ...car, image_url: imageUrl } : car
      ));
      
      toast({
        title: "Car Image Updated",
        description: "Car image has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating car image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to update car image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (data: ProfileFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const profileData = {
        user_id: user.id,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        is_profile_complete: true,
      };

      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Insert new profile
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
          title: "Profile Saved",
          description: "Your profile has been updated successfully.",
        });
        setProfile(profileData);
        setIsFirstTime(false);
      }
    } catch (error) {
      console.error('Profile save error:', error);
      toast({
        title: "Profile Save Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          title: "Car Added",
          description: "Your car has been added successfully.",
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

  const deleteCar = async (carId: string) => {
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) {
        toast({
          title: "Car Delete Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Car Deleted",
          description: "Your car has been removed successfully.",
        });
        setCars(cars.filter(car => car.id !== carId));
      }
    } catch (error) {
      toast({
        title: "Car Delete Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addService = async (data: ServiceFormData) => {
    if (!user) return;

    try {
      const serviceData = {
        user_id: user.id,
        service_type: data.service_type,
        title: data.title,
        description: data.description,
        car_id: data.car_id || null,
        price: data.price,
        expiry_date: data.expiry_date || null,
        status: 'pending'
      };

      const { error } = await supabase
        .from('services')
        .insert(serviceData);

      if (error) {
        toast({
          title: "Service Add Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Service Added",
          description: "Service has been added successfully.",
        });
        serviceForm.reset();
        setShowAddService(false);
        fetchServices(user.id);
      }
    } catch (error) {
      toast({
        title: "Service Add Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        toast({
          title: "Service Delete Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Service Deleted",
          description: "Service has been removed successfully.",
        });
        setServices(services.filter(service => service.id !== serviceId));
      }
    } catch (error) {
      toast({
        title: "Service Delete Failed",
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

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'insurance': return 'Insurance';
      case 'maintenance': return 'Maintenance';
      case 'driver_id': return 'Driver ID';
      case 'car_id': return 'Car ID';
      default: return 'Service';
    }
  };

  const changeEmail = async (data: EmailChangeFormData) => {
    if (data.newEmail !== data.confirmEmail) {
      toast({
        title: "Email Mismatch",
        description: "Email addresses do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: data.newEmail
      });

      if (error) {
        toast({
          title: "Email Change Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Change Initiated",
          description: "Please check both your old and new email addresses to confirm the change.",
        });
        setShowChangeEmail(false);
        emailForm.reset();
      }
    } catch (error) {
      toast({
        title: "Email Change Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const changePassword = async (data: PasswordChangeFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (data.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        toast({
          title: "Password Change Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });
        setShowChangePassword(false);
        passwordForm.reset();
      }
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);
    try {
      // First delete user data from public tables
      await supabase.rpc('cleanup_incomplete_user', { target_user_id: user.id });

      // Sign out user
      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been deleted.",
      });

      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Account Deletion Failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            {!isFirstTime && (
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            )}
            <h1 className="text-2xl font-bold">
              {isFirstTime ? 'Complete Your Profile' : 'My Profile'}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="cars">Cars</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Avatar */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <CameraCapture
                          onCapture={updateProfileAvatar}
                          title="Take Photo"
                          trigger={
                            <Button variant="outline" size="sm" disabled={uploading}>
                              <Camera className="h-4 w-4 mr-2" />
                              {uploading ? 'Uploading...' : 'Camera'}
                            </Button>
                          }
                        />
                        
                        <CameraCapture
                          onCapture={updateProfileAvatar}
                          title="Upload Photo"
                          acceptCamera={false}
                          acceptUpload={true}
                          trigger={
                            <Button variant="outline" size="sm" disabled={uploading}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          placeholder="Enter your first name"
                          {...profileForm.register('first_name', { required: 'First name is required' })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          placeholder="Enter your last name"
                          {...profileForm.register('last_name', { required: 'Last name is required' })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        placeholder="Enter your phone number"
                        {...profileForm.register('phone_number', { required: 'Phone number is required' })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={user.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* QR Code Section */}
              {profile?.qr_code_data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <QrCode className="h-5 w-5" />
                      <span>My QR Code</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <img 
                          src={profile.qr_code_data} 
                          alt="My QR Code" 
                          className="border rounded-lg max-w-[300px] w-full"
                        />
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = 'my-qr-code.png';
                            link.href = profile.qr_code_data;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download QR Code
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Cars Tab */}
            <TabsContent value="cars" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Car className="h-5 w-5" />
                      <span>My Cars</span>
                    </CardTitle>
                    <Button
                      onClick={() => setShowAddCar(true)}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Car</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {cars.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No cars added yet. Click "Add Car" to get started.
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {cars.map((car) => (
                        <div key={car.id} className="p-4 border rounded-lg space-y-4">
                          {/* Car Image */}
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                            {car.image_url ? (
                              <img src={car.image_url} alt={car.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center">
                                <Car className="h-12 w-12 mx-auto text-muted-foreground" />
                                <p className="text-sm text-muted-foreground mt-2">No image</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{car.name}</h3>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingCar(car)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteCar(car.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {car.model} • {car.plate_number}
                            </p>
                            {car.phone_number && (
                              <p className="text-sm text-muted-foreground">{car.phone_number}</p>
                            )}
                            
                            {/* Upload Car Image */}
                            <div className="flex gap-2">
                              <CameraCapture
                                onCapture={(file) => updateCarImage(file, car.id)}
                                title="Take Photo"
                                trigger={
                                  <Button variant="outline" size="sm" disabled={uploading} className="flex-1">
                                    <Camera className="h-4 w-4 mr-2" />
                                    {uploading ? 'Uploading...' : 'Camera'}
                                  </Button>
                                }
                              />
                              
                              <CameraCapture
                                onCapture={(file) => updateCarImage(file, car.id)}
                                title="Upload Photo"
                                acceptCamera={false}
                                acceptUpload={true}
                                trigger={
                                  <Button variant="outline" size="sm" disabled={uploading} className="flex-1">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Car Form */}
                  {showAddCar && (
                    <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                      <form onSubmit={carForm.handleSubmit(addCar)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="car_name">Car Name</Label>
                            <Input
                              id="car_name"
                              placeholder="e.g., My BMW"
                              {...carForm.register('name', { required: 'Car name is required' })}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="car_model">Model</Label>
                            <Input
                              id="car_model"
                              placeholder="e.g., BMW X5 2020"
                              {...carForm.register('model', { required: 'Model is required' })}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="plate_number">Plate Number</Label>
                            <Input
                              id="plate_number"
                              placeholder="e.g., ABC-123"
                              {...carForm.register('plate_number', { required: 'Plate number is required' })}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="car_phone">Phone Number (Optional)</Label>
                            <Input
                              id="car_phone"
                              placeholder="Contact number for this car"
                              {...carForm.register('phone_number')}
                            />
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button type="submit">Add Car</Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowAddCar(false);
                              carForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Services & Documents</span>
                    </CardTitle>
                    <Button
                      onClick={() => setShowAddService(true)}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Service</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No services added yet. Click "Add Service" to get started.
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {services.map((service) => (
                        <div key={service.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getServiceTypeIcon(service.service_type)}
                              <span className="font-medium">{service.title}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteService(service.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Type:</strong> {getServiceTypeLabel(service.service_type)}</p>
                            {service.description && (
                              <p><strong>Description:</strong> {service.description}</p>
                            )}
                            {service.cars && (
                              <p><strong>Car:</strong> {service.cars.name} ({service.cars.plate_number})</p>
                            )}
                            {service.price && (
                              <p><strong>Price:</strong> ${service.price}</p>
                            )}
                            <p><strong>Status:</strong> <span className="capitalize">{service.status}</span></p>
                            {service.expiry_date && (
                              <p><strong>Expires:</strong> {new Date(service.expiry_date).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Service Form */}
                  {showAddService && (
                    <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                      <form onSubmit={serviceForm.handleSubmit(addService)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="service_type">Service Type</Label>
                            <Select onValueChange={(value) => serviceForm.setValue('service_type', value as any)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="insurance">Car Insurance</SelectItem>
                                <SelectItem value="maintenance">Service Maintenance</SelectItem>
                                <SelectItem value="driver_id">Personal Driver ID</SelectItem>
                                <SelectItem value="car_id">Car ID Document</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="service_car">Car (Optional)</Label>
                            <Select onValueChange={(value) => serviceForm.setValue('car_id', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select car" />
                              </SelectTrigger>
                              <SelectContent>
                                {cars.map((car) => (
                                  <SelectItem key={car.id} value={car.id}>
                                    {car.name} ({car.plate_number})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="service_title">Title</Label>
                          <Input
                            id="service_title"
                            placeholder="e.g., Car Insurance Policy"
                            {...serviceForm.register('title', { required: 'Title is required' })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="service_description">Description (Optional)</Label>
                          <Textarea
                            id="service_description"
                            placeholder="Additional details about this service"
                            {...serviceForm.register('description')}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="service_price">Price (Optional)</Label>
                            <Input
                              id="service_price"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...serviceForm.register('price', { valueAsNumber: true })}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="service_expiry">Expiry Date (Optional)</Label>
                            <Input
                              id="service_expiry"
                              type="date"
                              {...serviceForm.register('expiry_date')}
                            />
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button type="submit">Add Service</Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowAddService(false);
                              serviceForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              {/* Email Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Email Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Current Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowChangeEmail(true)}
                    >
                      Change Email
                    </Button>
                  </div>

                  {showChangeEmail && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <form onSubmit={emailForm.handleSubmit(changeEmail)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newEmail">New Email</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            placeholder="Enter new email address"
                            {...emailForm.register('newEmail', { 
                              required: 'Email is required',
                              pattern: {
                                value: /^\S+@\S+$/i,
                                message: 'Invalid email address'
                              }
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmEmail">Confirm New Email</Label>
                          <Input
                            id="confirmEmail"
                            type="email"
                            placeholder="Confirm new email address"
                            {...emailForm.register('confirmEmail', { required: 'Email confirmation is required' })}
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button type="submit" disabled={isChangingEmail}>
                            {isChangingEmail ? (
                              <>
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                Updating...
                              </>
                            ) : (
                              'Update Email'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowChangeEmail(false);
                              emailForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Password Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>Password Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Last updated: Hidden for security</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowChangePassword(true)}
                    >
                      Change Password
                    </Button>
                  </div>

                  {showChangePassword && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Enter new password"
                            {...passwordForm.register('newPassword', { 
                              required: 'Password is required',
                              minLength: { value: 6, message: 'Password must be at least 6 characters' }
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            {...passwordForm.register('confirmPassword', { required: 'Password confirmation is required' })}
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword ? (
                              <>
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowChangePassword(false);
                              passwordForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Deletion */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-destructive">
                    <UserX className="h-5 w-5" />
                    <span>Danger Zone</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-destructive">Delete Account</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <div className="mt-4">
                          <Button
                            variant="destructive"
                            onClick={() => setShowDeleteAccount(true)}
                            className="flex items-center space-x-2"
                          >
                            <UserX className="h-4 w-4" />
                            <span>Delete Account</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {showDeleteAccount && (
                    <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                          <div>
                            <h4 className="font-medium text-destructive">Are you absolutely sure?</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              This will permanently delete your account, profile, cars, services, and all associated data. 
                              This action cannot be undone.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="destructive"
                            onClick={deleteAccount}
                            disabled={isDeletingAccount}
                            className="flex items-center space-x-2"
                          >
                            {isDeletingAccount ? (
                              <>
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4" />
                                Yes, Delete My Account
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteAccount(false)}
                            disabled={isDeletingAccount}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Complete Profile Button for First Time */}
          {isFirstTime && profile && (
            <div className="text-center mt-8">
              <Button
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="px-8"
              >
                Continue to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Car Edit Modal */}
      {editingCar && (
        <CarEditModal
          open={!!editingCar}
          onOpenChange={(open) => !open && setEditingCar(null)}
          car={editingCar}
          onCarUpdated={() => {
            fetchCars(user.id);
            setEditingCar(null);
          }}
        />
      )}
    </div>
  );
};

export default Profile;