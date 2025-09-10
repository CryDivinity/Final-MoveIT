import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CalendarIcon, 
  Search,
  AlertTriangle,
  FileText
} from 'lucide-react';

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

interface UserPenaltyManagementProps {
  user: {
    id: string;
    email?: string;
  };
}

const UserPenaltyManagement = ({ user }: UserPenaltyManagementProps) => {
  const { t } = useLanguage();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
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

  const { toast } = useToast();

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
    fetchPenalties();
  }, [user.id]);

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
        description: 'Failed to load your penalties',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
  };

  const handleAddPenalty = async () => {
    try {
      if (!formData.penalty_type || !formData.start_date) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      const penaltyData = {
        user_id: user.id,
        penalty_type: formData.penalty_type,
        points: formData.points,
        fine_amount: formData.fine_amount ? parseFloat(formData.fine_amount) : null,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date?.toISOString() || null,
        penalty_date: formData.start_date.toISOString(),
        due_date: formData.due_date?.toISOString() || null,
        description: formData.description || null,
        plate_number: formData.plate_number || null,
        violation_location: formData.violation_location || null,
        payment_status: formData.payment_status,
        is_active: true
      };

      const { error } = await supabase
        .from('penalties')
        .insert(penaltyData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Penalty added successfully'
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchPenalties();
    } catch (error) {
      console.error('Error adding penalty:', error);
      toast({
        title: 'Error',
        description: 'Failed to add penalty',
        variant: 'destructive'
      });
    }
  };

  const handleEditPenalty = async () => {
    try {
      if (!selectedPenalty || !formData.penalty_type || !formData.start_date) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      const penaltyData = {
        penalty_type: formData.penalty_type,
        points: formData.points,
        fine_amount: formData.fine_amount ? parseFloat(formData.fine_amount) : null,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date?.toISOString() || null,
        penalty_date: formData.start_date.toISOString(),
        due_date: formData.due_date?.toISOString() || null,
        description: formData.description || null,
        plate_number: formData.plate_number || null,
        violation_location: formData.violation_location || null,
        payment_status: formData.payment_status,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('penalties')
        .update(penaltyData)
        .eq('id', selectedPenalty.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Penalty updated successfully'
      });

      setIsEditDialogOpen(false);
      setSelectedPenalty(null);
      resetForm();
      fetchPenalties();
    } catch (error) {
      console.error('Error updating penalty:', error);
      toast({
        title: 'Error',
        description: 'Failed to update penalty',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePenalty = async () => {
    try {
      if (!selectedPenalty) return;

      const { error } = await supabase
        .from('penalties')
        .delete()
        .eq('id', selectedPenalty.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Penalty deleted successfully'
      });

      setIsDeleteDialogOpen(false);
      setSelectedPenalty(null);
      fetchPenalties();
    } catch (error) {
      console.error('Error deleting penalty:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete penalty',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (penalty: Penalty) => {
    setSelectedPenalty(penalty);
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
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (penalty: Penalty) => {
    setSelectedPenalty(penalty);
    setIsDeleteDialogOpen(true);
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
  const inactivePenalties = filteredPenalties.filter(p => !p.is_active);
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

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t('penalties.myPenalties')}
              </CardTitle>
              <CardDescription>
                {t('penalties.manageDescription')}
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('penalties.addPenalty')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('penalties.addNewPenalty')}</DialogTitle>
                  <DialogDescription>
                    {t('penalties.addNewDescription')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="penalty_type">{t('penalties.penaltyType')} *</Label>
                      <Select value={formData.penalty_type} onValueChange={(value) => setFormData({...formData, penalty_type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('penalties.selectPenaltyType')} />
                        </SelectTrigger>
                        <SelectContent>
                          {penaltyTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="points">{t('penalties.points')}</Label>
                      <Input
                        id="points"
                        type="number"
                        min="0"
                        value={formData.points}
                        onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fine_amount">{t('penalties.fineAmount')}</Label>
                      <Input
                        id="fine_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.fine_amount}
                        onChange={(e) => setFormData({...formData, fine_amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="payment_status">{t('penalties.paymentStatus')}</Label>
                      <Select value={formData.payment_status} onValueChange={(value) => setFormData({...formData, payment_status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>{t('penalties.startDate')} *</Label>
                      <DatePicker
                        date={formData.start_date}
                        onDateChange={(date) => setFormData({...formData, start_date: date})}
                        placeholder={t('penalties.pickStartDate')}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>{t('penalties.endDate')}</Label>
                      <DatePicker
                        date={formData.end_date}
                        onDateChange={(date) => setFormData({...formData, end_date: date})}
                        placeholder={t('penalties.pickEndDate')}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>{t('penalties.dueDate')}</Label>
                      <DatePicker
                        date={formData.due_date}
                        onDateChange={(date) => setFormData({...formData, due_date: date})}
                        placeholder={t('penalties.pickDueDate')}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="plate_number">{t('penalties.plateNumber')}</Label>
                      <Input
                        id="plate_number"
                        value={formData.plate_number}
                        onChange={(e) => setFormData({...formData, plate_number: e.target.value})}
                        placeholder={t('penalties.platePlaceholder')}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="violation_location">{t('penalties.violationLocation')}</Label>
                      <Input
                        id="violation_location"
                        value={formData.violation_location}
                        onChange={(e) => setFormData({...formData, violation_location: e.target.value})}
                        placeholder={t('penalties.locationPlaceholder')}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">{t('penalties.description')}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder={t('penalties.descriptionPlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    {t('penalties.cancel')}
                  </Button>
                  <Button onClick={handleAddPenalty}>{t('penalties.addPenalty')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('penalties.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">{t('penalties.loadingPenalties')}</p>
            </div>
          ) : filteredPenalties.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">{t('penalties.noPenalties')}</p>
              <p className="text-muted-foreground">
                {searchTerm ? t('penalties.noSearchResults') : t('penalties.noPenaltiesRecorded')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePenalties.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('penalties.activePenalties')}</h3>
                  <div className="space-y-3">
                    {activePenalties.map((penalty) => (
                      <Card key={penalty.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{penalty.penalty_type}</h4>
                                <Badge variant={getStatusBadgeVariant(penalty.payment_status)}>
                                  {penalty.payment_status}
                                </Badge>
                                {penalty.points > 0 && (
                                  <Badge variant="outline">{penalty.points} points</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                {penalty.fine_amount && (
                                  <div>
                                     <span className="font-medium">{t('penalties.fine')}:</span> ${penalty.fine_amount}
                                  </div>
                                )}
                                {penalty.plate_number && (
                                  <div>
                                     <span className="font-medium">{t('penalties.plate')}:</span> {penalty.plate_number}
                                  </div>
                                )}
                                <div>
                                   <span className="font-medium">{t('penalties.date')}:</span> {new Date(penalty.start_date || penalty.penalty_date).toLocaleDateString()}
                                </div>
                              </div>
                              
                              {penalty.description && (
                                <p className="text-sm text-muted-foreground mt-2">{penalty.description}</p>
                              )}
                              
                              {penalty.violation_location && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  <span className="font-medium">{t('penalties.location')}:</span> {penalty.violation_location}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(penalty)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeleteDialog(penalty)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {inactivePenalties.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('penalties.inactivePenalties')}</h3>
                  <div className="space-y-3">
                    {inactivePenalties.map((penalty) => (
                      <Card key={penalty.id} className="hover:shadow-md transition-shadow opacity-75">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{penalty.penalty_type}</h4>
                                <Badge variant="outline">{t('penalties.inactive')}</Badge>
                                {penalty.points > 0 && (
                                  <Badge variant="outline">{penalty.points} points</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                {penalty.fine_amount && (
                                  <div>
                                    <span className="font-medium">{t('penalties.fine')}:</span> ${penalty.fine_amount}
                                  </div>
                                )}
                                {penalty.plate_number && (
                                  <div>
                                    <span className="font-medium">{t('penalties.plate')}:</span> {penalty.plate_number}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">{t('penalties.date')}:</span> {new Date(penalty.start_date || penalty.penalty_date).toLocaleDateString()}
                                </div>
                              </div>
                              
                              {penalty.description && (
                                <p className="text-sm text-muted-foreground mt-2">{penalty.description}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(penalty)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeleteDialog(penalty)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('penalties.editPenalty')}</DialogTitle>
            <DialogDescription>
              {t('penalties.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_penalty_type">{t('penalties.penaltyType')} *</Label>
                <Select value={formData.penalty_type} onValueChange={(value) => setFormData({...formData, penalty_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('penalties.selectPenaltyType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {penaltyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit_points">{t('penalties.points')}</Label>
                <Input
                  id="edit_points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_fine_amount">{t('penalties.fineAmount')}</Label>
                <Input
                  id="edit_fine_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fine_amount}
                  onChange={(e) => setFormData({...formData, fine_amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit_payment_status">{t('penalties.paymentStatus')}</Label>
                <Select value={formData.payment_status} onValueChange={(value) => setFormData({...formData, payment_status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>{t('penalties.startDate')} *</Label>
                <DatePicker
                  date={formData.start_date}
                  onDateChange={(date) => setFormData({...formData, start_date: date})}
                  placeholder={t('penalties.pickStartDate')}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>{t('penalties.endDate')}</Label>
                <DatePicker
                  date={formData.end_date}
                  onDateChange={(date) => setFormData({...formData, end_date: date})}
                  placeholder={t('penalties.pickEndDate')}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>{t('penalties.dueDate')}</Label>
                <DatePicker
                  date={formData.due_date}
                  onDateChange={(date) => setFormData({...formData, due_date: date})}
                  placeholder={t('penalties.pickDueDate')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_plate_number">{t('penalties.plateNumber')}</Label>
                <Input
                  id="edit_plate_number"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({...formData, plate_number: e.target.value})}
                  placeholder={t('penalties.platePlaceholder')}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit_violation_location">{t('penalties.violationLocation')}</Label>
                <Input
                  id="edit_violation_location"
                  value={formData.violation_location}
                  onChange={(e) => setFormData({...formData, violation_location: e.target.value})}
                  placeholder={t('penalties.locationPlaceholder')}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit_description">{t('penalties.description')}</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder={t('penalties.descriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('penalties.cancel')}
            </Button>
            <Button onClick={handleEditPenalty}>{t('penalties.updatePenalty')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('penalties.deletePenalty')}</DialogTitle>
            <DialogDescription>
              {t('penalties.deleteConfirmation')}
            </DialogDescription>
          </DialogHeader>
          {selectedPenalty && (
            <div className="py-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{selectedPenalty.penalty_type}</p>
                <p className="text-sm text-muted-foreground">
                  {t('penalties.date')}: {new Date(selectedPenalty.start_date || selectedPenalty.penalty_date).toLocaleDateString()}
                </p>
                {selectedPenalty.fine_amount && (
                  <p className="text-sm text-muted-foreground">
                    {t('penalties.fine')}: ${selectedPenalty.fine_amount}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('penalties.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeletePenalty}>
              {t('penalties.deletePenalty')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPenaltyManagement;