import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  CalendarIcon, 
  Search,
  FileText,
  Car
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface PenaltyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

interface Penalty {
  id: string;
  user_id: string;
  penalty_type: string;
  points: number;
  fine_amount: number | null;
  start_date: string;
  end_date: string | null;
  penalty_date: string;
  due_date: string | null;
  payment_date: string | null;
  description: string | null;
  plate_number: string | null;
  violation_location: string | null;
  payment_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Car {
  id: string;
  name: string;
  model: string;
  plate_number: string;
}

const PenaltyModal: React.FC<PenaltyModalProps> = ({ open, onOpenChange, user }) => {
  const { t } = useLanguage();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<Penalty | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    penalty_type: '',
    points: 0,
    fine_amount: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    due_date: undefined as Date | undefined,
    description: '',
    plate_number: '',
    violation_location: '',
    payment_status: 'unpaid'
  });

  const penaltyTypes = [
    { value: 'Speeding', label: t('penalties.types.speeding') },
    { value: 'Parking Violation', label: t('penalties.types.parkingViolation') },
    { value: 'Traffic Light Violation', label: t('penalties.types.trafficLightViolation') },
    { value: 'Improper Lane Change', label: t('penalties.types.improperLaneChange') },
    { value: 'Driving Under Influence', label: t('penalties.types.drivingUnderInfluence') },
    { value: 'Reckless Driving', label: t('penalties.types.recklessDriving') },
    { value: 'Seat Belt Violation', label: t('penalties.types.seatBeltViolation') },
    { value: 'Mobile Phone Usage', label: t('penalties.types.mobilePhoneUsage') },
    { value: 'Insurance Violation', label: t('penalties.types.insuranceViolation') },
    { value: 'Registration Violation', label: t('penalties.types.registrationViolation') },
    { value: 'Other', label: t('penalties.types.other') }
  ];

  const paymentStatuses = [
    { value: 'unpaid', label: t('penalties.status.unpaid') },
    { value: 'paid', label: t('penalties.status.paid') },
    { value: 'overdue', label: t('penalties.status.overdue') },
    { value: 'contested', label: t('penalties.status.contested') }
  ];

  useEffect(() => {
    if (open && user) {
      fetchPenalties();
      fetchCars();
    }
  }, [open, user]);

  const fetchPenalties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('penalties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPenalties(data || []);
    } catch (error) {
      console.error('Error fetching penalties:', error);
      toast({
        title: 'Error',
        description: 'Failed to load penalties',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  // Calculate accumulated points for the last 6 months
  const getAccumulatedPoints = () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentPenalties = penalties.filter(penalty => {
      const penaltyDate = new Date(penalty.start_date);
      return penaltyDate >= sixMonthsAgo && penalty.is_active;
    });

    return recentPenalties.reduce((sum, penalty) => sum + (penalty.points || 0), 0);
  };

  const accumulatedPoints = getAccumulatedPoints();
  const maxPoints = 15;

  // Progress bar with 15 dots
  const renderProgressBar = () => {
    const dots = [];
    for (let i = 1; i <= maxPoints; i++) {
      const isActive = i <= accumulatedPoints;
      dots.push(
        <div
          key={i}
          className={cn(
            "w-3 h-3 rounded-full transition-colors",
            isActive 
              ? "bg-destructive" 
              : "bg-muted border border-border"
          )}
          title={`${i} point${i > 1 ? 's' : ''}`}
        />
      );
    }
    return dots;
  };

  const resetForm = () => {
    setFormData({
      penalty_type: '',
      points: 0,
      fine_amount: '',
      start_date: undefined,
      end_date: undefined,
      due_date: undefined,
      description: '',
      plate_number: '',
      violation_location: '',
      payment_status: 'unpaid'
    });
    setShowForm(false);
    setEditingPenalty(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.penalty_type || !formData.start_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Auto-set end_date to 6 months from start_date for points expiry
      const autoEndDate = new Date(formData.start_date);
      autoEndDate.setMonth(autoEndDate.getMonth() + 6);

      const penaltyData = {
        penalty_type: formData.penalty_type,
        points: formData.points,
        fine_amount: formData.fine_amount ? parseFloat(formData.fine_amount) : null,
        start_date: formData.start_date.toISOString(),
        end_date: autoEndDate.toISOString(), // Auto-expire after 6 months
        penalty_date: formData.start_date.toISOString(),
        due_date: formData.due_date?.toISOString() || null,
        description: formData.description || null,
        plate_number: formData.plate_number || null,
        violation_location: formData.violation_location || null,
        payment_status: formData.payment_status,
        is_active: true,
        user_id: user.id
      };

      let error;
      if (editingPenalty) {
        ({ error } = await supabase
          .from('penalties')
          .update(penaltyData)
          .eq('id', editingPenalty.id));
      } else {
        ({ error } = await supabase
          .from('penalties')
          .insert(penaltyData));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: editingPenalty ? "Penalty updated successfully" : "Penalty added successfully"
      });

      resetForm();
      fetchPenalties();
    } catch (error) {
      console.error('Error saving penalty:', error);
      toast({
        title: "Error",
        description: "Failed to save penalty. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (penalty: Penalty) => {
    setEditingPenalty(penalty);
    setFormData({
      penalty_type: penalty.penalty_type,
      points: penalty.points || 0,
      fine_amount: penalty.fine_amount?.toString() || '',
      start_date: penalty.start_date ? new Date(penalty.start_date) : undefined,
      end_date: penalty.end_date ? new Date(penalty.end_date) : undefined,
      due_date: penalty.due_date ? new Date(penalty.due_date) : undefined,
      description: penalty.description || '',
      plate_number: penalty.plate_number || '',
      violation_location: penalty.violation_location || '',
      payment_status: penalty.payment_status
    });
    setShowForm(true);
  };

  const handleDelete = async (penaltyId: string) => {
    if (!confirm('Are you sure you want to delete this penalty?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('penalties')
        .delete()
        .eq('id', penaltyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Penalty deleted successfully"
      });

      fetchPenalties();
    } catch (error) {
      console.error('Error deleting penalty:', error);
      toast({
        title: "Error",
        description: "Failed to delete penalty.",
        variant: "destructive"
      });
    }
  };

  const filteredPenalties = penalties.filter(penalty => {
    const searchLower = searchTerm.toLowerCase();
    return (
      penalty.penalty_type.toLowerCase().includes(searchLower) ||
      penalty.plate_number?.toLowerCase().includes(searchLower) ||
      penalty.violation_location?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      case 'contested': return 'secondary';
      default: return 'outline';
    }
  };

  const activePenalties = filteredPenalties.filter(p => p.is_active);
  const totalPoints = penalties.reduce((sum, penalty) => sum + (penalty.points || 0), 0);
  const unpaidFines = penalties.filter(p => p.payment_status === 'unpaid' && p.fine_amount).reduce((sum, penalty) => sum + (penalty.fine_amount || 0), 0);

  const DatePicker = ({ 
    date, 
    onDateChange, 
    placeholder 
  }: { 
    date: Date | undefined; 
    onDateChange: (date: Date | undefined) => void; 
    placeholder: string 
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );

  const resetModal = () => {
    resetForm();
    setPenalties([]);
    setSearchTerm('');
  };

  // Reset modal when it closes
  React.useEffect(() => {
    if (!open) {
      resetModal();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            {t('penalties.myPenalties')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Points Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Penalty Points (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {accumulatedPoints} / {maxPoints} points
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Points auto-expire after 6 months
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {renderProgressBar()}
                </div>
                {accumulatedPoints >= maxPoints && (
                  <div className="text-sm text-destructive font-medium">
                    ⚠️ Maximum penalty points reached! Consider defensive driving courses.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange" />
                  <div>
                    <p className="text-sm font-medium">{t('penalties.activePenalties')}</p>
                    <p className="text-2xl font-bold">{activePenalties.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{t('penalties.totalPoints')}</p>
                    <p className="text-2xl font-bold">{totalPoints}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">{t('penalties.unpaidFines')}</p>
                    <p className="text-2xl font-bold">${unpaidFines.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {!showForm ? (
            // Penalties List View
            <>
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search penalties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('penalties.addPenalty')}
                </Button>
              </div>

              {filteredPenalties.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No penalties found.</p>
                    <Button onClick={() => setShowForm(true)} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Penalty
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredPenalties.map((penalty) => (
                    <Card key={penalty.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{penalty.penalty_type}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{penalty.points} points</Badge>
                              <Badge variant={getStatusBadgeVariant(penalty.payment_status)}>
                                {penalty.payment_status}
                              </Badge>
                              {penalty.plate_number && (
                                <Badge variant="secondary">{penalty.plate_number}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(penalty)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(penalty.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {penalty.description && (
                            <div className="col-span-2">
                              <p className="font-medium">Description:</p>
                              <p className="text-muted-foreground">{penalty.description}</p>
                            </div>
                          )}
                          {penalty.fine_amount && (
                            <div>
                              <p className="font-medium">Fine Amount:</p>
                              <p className="text-muted-foreground">${penalty.fine_amount}</p>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">Date:</p>
                            <p className="text-muted-foreground">
                              {new Date(penalty.penalty_date).toLocaleDateString()}
                            </p>
                          </div>
                          {penalty.violation_location && (
                            <div className="col-span-2">
                              <p className="font-medium">Location:</p>
                              <p className="text-muted-foreground">{penalty.violation_location}</p>
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
            // Penalty Form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {editingPenalty ? 'Edit Penalty' : 'Add New Penalty'}
                </h3>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="penalty_type">Penalty Type *</Label>
                  <Select
                    value={formData.penalty_type}
                    onValueChange={(value) => setFormData({ ...formData, penalty_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select penalty type" />
                    </SelectTrigger>
                    <SelectContent>
                      {penaltyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">Penalty Points *</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    max="15"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fine_amount">Fine Amount</Label>
                  <Input
                    id="fine_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fine_amount}
                    onChange={(e) => setFormData({ ...formData, fine_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="car_selection">Select Vehicle</Label>
                  <Select
                    value={formData.plate_number}
                    onValueChange={(value) => {
                      const selectedCar = cars.find(car => car.plate_number === value);
                      setFormData({ ...formData, plate_number: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {cars.map((car) => (
                        <SelectItem key={car.id} value={car.plate_number}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            {car.name} - {car.plate_number}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Penalty Date *</Label>
                  <DatePicker
                    date={formData.start_date}
                    onDateChange={(date) => setFormData({ ...formData, start_date: date })}
                    placeholder="Pick penalty date"
                  />
                  <p className="text-xs text-muted-foreground">Points will auto-expire 6 months from this date</p>
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <DatePicker
                    date={formData.due_date}
                    onDateChange={(date) => setFormData({ ...formData, due_date: date })}
                    placeholder="Pick due date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="violation_location">Violation Location</Label>
                  <Input
                    id="violation_location"
                    value={formData.violation_location}
                    onChange={(e) => setFormData({ ...formData, violation_location: e.target.value })}
                    placeholder="e.g., Main Street intersection"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about the penalty..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    editingPenalty ? 'Update Penalty' : 'Add Penalty'
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

export default PenaltyModal;