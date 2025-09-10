import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X, AlertTriangle, Car, ArrowLeft, Wrench, Shield, Zap, TreePine, QrCode, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import CameraCapture from './CameraCapture';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUserId?: string;
}

const reportTypes = [
  { 
    value: 'wrong_park', 
    labelKey: 'report.wrongParking',
    icon: Car, 
    color: 'secondary',
    descriptionKey: 'report.wrongParkingDesc'
  },
  { 
    value: 'car_problem', 
    labelKey: 'report.carProblem',
    icon: Wrench, 
    color: 'muted',
    descriptionKey: 'report.carProblemDesc'
  },
  { 
    value: 'forgotten_lights', 
    labelKey: 'report.forgottenLights',
    icon: Zap, 
    color: 'accent',
    descriptionKey: 'report.forgottenLightsDesc'
  },
  { 
    value: 'natural_weather', 
    labelKey: 'report.weatherIssue',
    icon: TreePine, 
    color: 'secondary',
    descriptionKey: 'report.weatherIssueDesc'
  },
  { 
    value: 'suspect_person', 
    labelKey: 'report.suspiciousActivity',
    icon: AlertTriangle, 
    color: 'destructive',
    descriptionKey: 'report.suspiciousActivityDesc'
  },
  { 
    value: 'evacuation_report', 
    labelKey: 'report.emergencyEvacuation',
    icon: Shield, 
    color: 'primary',
    descriptionKey: 'report.emergencyEvacuationDesc'
  }
];

const ReportModal: React.FC<ReportModalProps> = ({ open, onOpenChange, defaultUserId }) => {
  const [step, setStep] = useState<'method' | 'select' | 'details'>('method');
  const [plateNumber, setPlateNumber] = useState('');
  const [reportType, setReportType] = useState('');
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plateExists, setPlateExists] = useState<boolean | null>(null);
  const [isCheckingPlate, setIsCheckingPlate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const checkPlateNumber = async (plate: string) => {
    if (!plate.trim()) {
      setPlateExists(null);
      return;
    }

    setIsCheckingPlate(true);
    try {
      const { data, error } = await supabase.rpc('find_user_by_plate_number', {
        plate_number: plate.trim()
      });

      if (error) {
        console.error('Error checking plate:', error);
        setPlateExists(false);
      } else {
        setPlateExists(!!data);
      }
    } catch (error) {
      console.error('Error checking plate:', error);
      setPlateExists(false);
    } finally {
      setIsCheckingPlate(false);
    }
  };

  const handlePlateChange = (value: string) => {
    setPlateNumber(value);
    if (value.length >= 3) {
      checkPlateNumber(value);
    } else {
      setPlateExists(null);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const selectProblemType = (problemType: string) => {
    setReportType(problemType);
    setStep('details');
  };

  const goBackToSelection = () => {
    setStep('select');
    setReportType('');
  };

  const goBackToMethod = () => {
    setStep('method');
    setReportType('');
    setPlateNumber('');
    setPlateExists(null);
  };

  const selectMethod = (method: 'qr' | 'plate') => {
    if (method === 'qr') {
      // For now, we'll just show a toast and go to select step
      // In the future, this could integrate with QR scanning
      toast({
        title: "QR Code Scanning",
        description: "QR Code scanning feature will be available soon. Please use plate number for now.",
        variant: "default"
      });
      setStep('select');
    } else {
      setStep('select');
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('reports')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!defaultUserId && !plateNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in plate number.",
        variant: "destructive"
      });
      return;
    }

    if (!reportType) {
      toast({
        title: "Missing Information",
        description: "Please select a report type.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error", 
          description: "You must be logged in to submit a report.",
          variant: "destructive"
        });
        return;
      }

      // Upload image if provided
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      // Get reported user ID if plate exists or use default user
      let reportedUserId = defaultUserId || null;
      if (!defaultUserId && plateExists) {
        const { data } = await supabase.rpc('find_user_by_plate_number', {
          plate_number: plateNumber.trim()
        });
        reportedUserId = data;
      }

      // Submit report
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reported_plate_number: plateNumber.trim() || 'N/A',
          report_type: reportType as any,
          comment: comment.trim() || null,
          image_url: imageUrl
        });

      if (error) {
        console.error('Error submitting report:', error);
        toast({
          title: "Error",
          description: "Failed to submit report. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Report Submitted",
        description: "Your report has been submitted successfully.",
      });

      // Reset form
      setStep('method');
      setPlateNumber('');
      setReportType('');
      setComment('');
      setImage(null);
      setImagePreview(null);
      setPlateExists(null);
      onOpenChange(false);

    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedReportType = reportTypes.find(type => type.value === reportType);

  const resetForm = () => {
    setStep('method');
    setPlateNumber('');
    setReportType('');
    setComment('');
    setImage(null);
    setImagePreview(null);
    setPlateExists(null);
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {(step === 'select' || step === 'details') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={step === 'details' ? goBackToSelection : goBackToMethod}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-xl">
              {step === 'method' ? t('report.title') : 
               step === 'select' ? t('report.selectProblem') : 
               `${t('report.title')}: ${selectedReportType ? t(selectedReportType.labelKey) : ''}`}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 'method' ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">{t('report.chooseMethod')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                onClick={() => selectMethod('qr')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <QrCode className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t('report.scanQRCode')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm">
                    {t('report.scanQRCodeDesc')}
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                onClick={() => selectMethod('plate')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-3 rounded-lg bg-secondary/20">
                      <Hash className="h-6 w-6 text-foreground" />
                    </div>
                    <CardTitle className="text-lg">{t('report.insertPlateNumber')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm">
                    {t('report.insertPlateNumberDesc')}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : step === 'select' ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">{t('report.whatProblem')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card 
                    key={type.value}
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                    onClick={() => selectProblemType(type.value)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-muted/20 dark:bg-foreground/10">
                          <Icon className="h-5 w-5 text-foreground" />
                        </div>
                        <CardTitle className="text-base">{t(type.labelKey)}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm">
                        {t(type.descriptionKey)}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Problem Type Display */}
            {selectedReportType && (
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
                <selectedReportType.icon className="h-6 w-6 text-foreground" />
                <div>
                  <h3 className="font-medium">{t(selectedReportType.labelKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(selectedReportType.descriptionKey)}</p>
                </div>
              </div>
            )}

            {/* Plate Number - hide if reporting specific user */}
            {!defaultUserId && (
              <div className="space-y-2">
                <Label htmlFor="plate">{t('report.vehiclePlateNumber')}</Label>
                <div className="relative">
                <Input
                  id="plate"
                  placeholder={t('report.plateNumberPlaceholder')}
                  value={plateNumber}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  className="pr-20"
                />
                {isCheckingPlate && (
                  <div className="absolute right-3 top-3">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
                {plateExists !== null && (
                  <div className="flex items-center gap-2">
                    <Badge variant={plateExists ? "default" : "secondary"}>
                      {plateExists ? t('report.registeredUser') : t('report.unregisteredVehicle')}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">{t('report.additionalDetails')}</Label>
              <Textarea
                id="comment"
                placeholder={t('report.descriptionPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>{t('report.photoEvidence')}</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Report evidence"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="flex justify-center space-x-2">
                      <CameraCapture
                        onCapture={handleCameraCapture}
                        title={t('report.takePhoto')}
                        trigger={
                          <Button type="button" variant="outline">
                            <Camera className="h-4 w-4 mr-2" />
                            {t('report.takePhoto')}
                          </Button>
                        }
                      />
                      
                      <CameraCapture
                        onCapture={handleCameraCapture}
                        title={t('report.uploadPhoto')}
                        acceptCamera={false}
                        acceptUpload={true}
                        trigger={
                          <Button type="button" variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            {t('report.uploadPhoto')}
                          </Button>
                        }
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('report.photoHelp')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={goBackToSelection}
                disabled={isSubmitting}
              >
                {t('report.back')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting || (!defaultUserId && !plateNumber.trim()) || !reportType}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    {t('report.submitting')}
                  </>
                ) : (
                  t('report.submitReport')
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;