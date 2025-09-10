import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Phone, Ambulance, Shield, Flame, Camera, X } from 'lucide-react';
import type { User, Session } from '@supabase/supabase-js';

interface EmergencyService {
  id: string;
  name: string;
  number: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const Emergency = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedService, setSelectedService] = useState<EmergencyService | null>(null);
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const emergencyServices: EmergencyService[] = [
    {
      id: 'ambulance',
      name: 'Ambulance',
      number: '112',
      icon: <Ambulance className="h-8 w-8" />,
      color: 'text-red-600',
      description: 'Medical emergencies and health-related incidents'
    },
    {
      id: 'police',
      name: 'Police',
      number: '110',
      icon: <Shield className="h-8 w-8" />,
      color: 'text-blue-600',
      description: 'Criminal activities, accidents, and security issues'
    },
    {
      id: 'fire',
      name: 'Fire Department',
      number: '118',
      icon: <Flame className="h-8 w-8" />,
      color: 'text-orange-600',
      description: 'Fires, gas leaks, and rescue operations'
    }
  ];

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
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
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
    if (!user) return;

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

      // Reset form
      setSelectedService(null);
      setComment('');
      removeImage();
      
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <h1 className="text-2xl font-bold text-red-600">Emergency Services</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!selectedService ? (
          // Emergency Services Selection
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Emergency Services</h2>
              <p className="text-muted-foreground">
                Select an emergency service below. You can add additional information before making the call.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-yellow-800 text-sm font-bold">!</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800">Important Notice</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    These are emergency contact numbers. Please only use them for genuine emergencies. 
                    For non-urgent matters, contact the appropriate non-emergency services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Emergency Call Form
          <div className="max-w-2xl mx-auto">
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
                    <span>Change Service</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="comment">Additional Information (Optional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Describe the emergency situation, location details, or any other relevant information..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Attach Image (Optional)</Label>
                  <div className="mt-2">
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Upload an image to help emergency services understand the situation
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
                          Choose Image
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

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handleEmergencyCall(selectedService)}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-3"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    {isLoading ? 'Processing...' : `Call ${selectedService.name} - ${selectedService.number}`}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    This will save your emergency call details and open your phone's dialer
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Emergency;