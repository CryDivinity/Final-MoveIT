import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Car, Camera, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import CameraCapture from './CameraCapture';

interface CarEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: any;
  onCarUpdated: () => void;
}

interface CarFormData {
  name: string;
  model: string;
  plate_number: string;
  phone_number: string;
}

const CarEditModal = ({ open, onOpenChange, car, onCarUpdated }: CarEditModalProps) => {
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const form = useForm<CarFormData>({
    defaultValues: {
      name: '',
      model: '',
      plate_number: '',
      phone_number: ''
    }
  });

  useEffect(() => {
    if (car && open) {
      form.setValue('name', car.name || '');
      form.setValue('model', car.model || '');
      form.setValue('plate_number', car.plate_number || '');
      form.setValue('phone_number', car.phone_number || '');
    }
  }, [car, open, form]);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${car.id}-${Date.now()}.${fileExt}`;
      const path = `cars/${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const updateCarImage = async (file: File) => {
    const imageUrl = await uploadImage(file);
    if (!imageUrl) return;

    try {
      const { error } = await supabase
        .from('cars')
        .update({ image_url: imageUrl })
        .eq('id', car.id);

      if (error) throw error;

      toast({
        title: "Image Updated",
        description: "Car image has been updated successfully.",
      });
      
      onCarUpdated();
    } catch (error) {
      console.error('Error updating car image:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update car image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: CarFormData) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('cars')
        .update({
          name: data.name,
          model: data.model,
          plate_number: data.plate_number,
          phone_number: data.phone_number || null,
        })
        .eq('id', car.id);

      if (error) throw error;

      toast({
        title: "Car Updated",
        description: "Car information has been updated successfully.",
      });
      
      onCarUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating car:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update car information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Car Title
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Car Image */}
          <div className="space-y-3">
            <Label>Car Image</Label>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {car?.image_url ? (
                <img src={car.image_url} alt={car.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Car className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">{t('car.noImage')}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <CameraCapture
                onCapture={updateCarImage}
                title="Take Photo"
                trigger={
                  <Button variant="outline" size="sm" disabled={uploading} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Camera'}
                  </Button>
                }
              />
              
              <CameraCapture
                onCapture={updateCarImage}
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

          {/* Car Information Form */}
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Car Name</Label>
              <Input
                id="name"
                placeholder="e.g., My BMW"
                {...form.register('name', { required: 'Car name is required' })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="e.g., BMW X5 2020"
                {...form.register('model', { required: 'Model is required' })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plate_number">Plate Number</Label>
              <Input
                id="plate_number"
                placeholder="e.g., ABC-123"
                {...form.register('plate_number', { required: 'Plate number is required' })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number (Optional)</Label>
              <Input
                id="phone_number"
                placeholder="Contact number for this car"
                {...form.register('phone_number')}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating} className="flex-1">
                {updating ? 'Updating...' : 'Update Car'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarEditModal;