import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Calendar, DollarSign, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import type { User } from '@supabase/supabase-js';

interface ServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

interface Service {
  id: string;
  title: string;
  service_type: string;
  description: string;
  price: number;
  purchase_date: string;
  expiry_date: string;
  status: string;
  car_id: string;
}

interface Car {
  id: string;
  name: string;
  model: string;
  plate_number: string;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ open, onOpenChange, user }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    service_type: '',
    description: '',
    price: '',
    purchase_date: '',
    expiry_date: '',
    car_id: ''
  });

  const serviceTypes = [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'repair', label: 'Repair' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'registration', label: 'Registration' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (open && user) {
      fetchServices();
      fetchCars();
    }
  }, [open, user]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, name, model, plate_number')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching cars:', error);
        return;
      }

      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.service_type) {
      toast({
        title: "Missing Information",
        description: "Please fill in required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const serviceData = {
        title: formData.title,
        service_type: formData.service_type,
        description: formData.description || null,
        price: formData.price ? parseFloat(formData.price) : null,
        purchase_date: formData.purchase_date || null,
        expiry_date: formData.expiry_date || null,
        car_id: formData.car_id || null,
        user_id: user.id,
        status: 'active'
      };

      let error;
      if (editingService) {
        ({ error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id));
      } else {
        ({ error } = await supabase
          .from('services')
          .insert(serviceData));
      }

      if (error) {
        console.error('Error saving service:', error);
        toast({
          title: "Error",
          description: "Failed to save service. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: editingService ? "Service updated successfully" : "Service added successfully"
      });

      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      service_type: service.service_type,
      description: service.description || '',
      price: service.price ? service.price.toString() : '',
      purchase_date: service.purchase_date || '',
      expiry_date: service.expiry_date || '',
      car_id: service.car_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('Error deleting service:', error);
        toast({
          title: "Error",
          description: "Failed to delete service.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Service deleted successfully"
      });

      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      service_type: '',
      description: '',
      price: '',
      purchase_date: '',
      expiry_date: '',
      car_id: ''
    });
    setShowForm(false);
    setEditingService(null);
  };

  const getStatusColor = (expiryDate: string | null) => {
    if (!expiryDate) return 'default';
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'destructive';
    if (daysUntilExpiry <= 30) return 'secondary';
    return 'default';
  };

  const resetModal = () => {
    resetForm();
    setServices([]);
  };

  // Reset modal when it closes
  React.useEffect(() => {
    if (!open) {
      resetModal();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            {t('service.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showForm ? (
            // Services List View
            <>
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  {t('service.description')}
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('service.addService')}
                </Button>
              </div>

              {services.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No service records found.</p>
                    <Button onClick={() => setShowForm(true)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Service
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <Card key={service.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{service.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{service.service_type}</Badge>
                              {service.expiry_date && (
                                <Badge variant={getStatusColor(service.expiry_date)}>
                                  Expires: {new Date(service.expiry_date).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {service.description && (
                            <div className="col-span-2">
                              <p className="font-medium">Description:</p>
                              <p className="text-muted-foreground">{service.description}</p>
                            </div>
                          )}
                          {service.price && (
                            <div>
                              <p className="font-medium">Price:</p>
                              <p className="text-muted-foreground">${service.price}</p>
                            </div>
                          )}
                          {service.purchase_date && (
                            <div>
                              <p className="font-medium">Purchase Date:</p>
                              <p className="text-muted-foreground">
                                {new Date(service.purchase_date).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Service Form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h3>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Service Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Oil Change, Annual Inspection"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_type">Service Type *</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="car_id">Vehicle</Label>
                  <Select
                    value={formData.car_id}
                    onValueChange={(value) => setFormData({ ...formData, car_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {cars.map((car) => (
                        <SelectItem key={car.id} value={car.id}>
                          {car.name} - {car.plate_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about the service..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    editingService ? 'Update Service' : 'Add Service'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceModal;