import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Ambulance, Shield, Flame, Camera, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import type { User } from '@supabase/supabase-js';

interface EmergencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

interface EmergencyService {
  id: string;
  name: string;
  number: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const EmergencyModal = ({ open, onOpenChange, user }: EmergencyModalProps) => {
  const [selectedService, setSelectedService] = useState<EmergencyService | null>(null);
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const emergencyServices: EmergencyService[] = [
    {
      id: 'ambulance',
      name: t('emergency.services.ambulance'),
      number: '112',
      icon: <Ambulance className="h-8 w-8" />,
      color: 'text-red-600',
      description: t('emergency.services.ambulanceDesc')
    },
    {
      id: 'police',
      name: t('emergency.services.police'),
      number: '110',
      icon: <Shield className="h-8 w-8" />,
      color: 'text-blue-600',
      description: t('emergency.services.policeDesc')
    },
    {
      id: 'fire',
      name: t('emergency.services.fire'),
      number: '118',
      icon: <Flame className="h-8 w-8" />,
      color: 'text-orange-600',
      description: t('emergency.services.fireDesc')
    }
  ];

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `emergency-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleEmergencyCall = async (service: EmergencyService) => {
    setIsLoading(true);
    
    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          toast({
            title: "Image Upload Failed",
            description: "Failed to upload image, but proceeding with emergency call.",
            variant: "destructive",
          });
        }
      }

      // Save emergency call record
      const { error } = await supabase
        .from('emergency_calls')
        .insert({
          user_id: user.id,
          service_type: service.name,
          comment: comment.trim() || null,
          image_url: imageUrl,
        });

      if (error) {
        toast({
          title: "Failed to Save Record",
          description: "Emergency call record could not be saved.",
          variant: "destructive",
        });
      }

      // Make the phone call
      window.location.href = `tel:${service.number}`;
      
      toast({
        title: "Emergency Call Initiated",
        description: `Calling ${service.name} at ${service.number}`,
      });

      // Reset form and close modal
      setSelectedService(null);
      setComment('');
      removeImage();
      onOpenChange(false);
      
    } catch (error) {
      toast({
        title: "Emergency Call Failed",
        description: "An unexpected error occurred. Please try calling directly.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (service: EmergencyService) => {
    setSelectedService(service);
    setComment('');
    removeImage();
  };

  const resetForm = () => {
    setSelectedService(null);
    setComment('');
    removeImage();
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-red-600 flex items-center gap-2">
            <Phone className="h-6 w-6" />
            {t('emergency.title')}
          </DialogTitle>
        </DialogHeader>

        {!selectedService ? (
          // Emergency Services Selection
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                {t('emergency.selectService')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emergencyServices.map((service) => (
                <Card 
                  key={service.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardHeader className="text-center">
                    <div className={`w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center ${service.color}`}>
                      {service.icon}
                    </div>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                    <div className="text-2xl font-bold text-primary">{service.number}</div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground text-sm">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-yellow-800 text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-yellow-800">{t('emergency.importantNotice')}</h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      {t('emergency.onlyGenuineEmergencies')}
                    </p>
                  </div>
                </div>
              </div>
          </div>
        ) : (
          // Emergency Call Form
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center ${selectedService.color}`}>
                      {selectedService.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{selectedService.name}</CardTitle>
                      <p className="text-2xl font-bold text-primary">{selectedService.number}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedService(null)}
                    className="flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>{t('emergency.changeService')}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="comment">{t('emergency.additionalInfo')}</Label>
                  <Textarea
                    id="comment"
                    placeholder={t('emergency.additionalInfoPlaceholder')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>{t('emergency.attachImage')}</Label>
                  <div className="mt-2">
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          {t('emergency.uploadImage')}
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <Label
                          htmlFor="image-upload"
                          className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90"
                        >
                          {t('emergency.chooseImage')}
                        </Label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Emergency situation"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedService(null)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {t('emergency.back')}
                  </Button>
                  <Button
                    onClick={() => handleEmergencyCall(selectedService)}
                    disabled={isLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {isLoading ? t('emergency.processing') : `${t('emergency.call')} ${selectedService.name}`}
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {t('emergency.dialerNote')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyModal;