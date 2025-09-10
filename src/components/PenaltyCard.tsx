import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import type { User } from '@supabase/supabase-js';

interface Penalty {
  id: string;
  penalty_type: string;
  description: string | null;
  fine_amount: number | null;
  penalty_date: string;
  due_date: string | null;
  payment_status: string;
  payment_date: string | null;
  is_active: boolean;
  violation_location: string | null;
  plate_number: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface PenaltyCardProps {
  user: User;
}

const PenaltyCard = ({ user }: PenaltyCardProps) => {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchPenalties();
  }, [user.id]);

  const fetchPenalties = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('penalties')
        .select('*')
        .eq('user_id', user.id)
        .order('penalty_date', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch penalties",
          variant: "destructive",
        });
        return;
      }

      setPenalties(data || []);
    } catch (error) {
      console.error('Error fetching penalties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPaid = async (penaltyId: string) => {
    try {
      const { error } = await supabase
        .from('penalties')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString(),
        })
        .eq('id', penaltyId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update payment status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });

      fetchPenalties();
    } catch (error) {
      console.error('Error updating penalty:', error);
    }
  };

  const activePenalties = penalties.filter(p => p.is_active);
  const inactivePenalties = penalties.filter(p => !p.is_active);
  const unpaidCount = activePenalties.filter(p => p.payment_status === 'unpaid' || p.payment_status === 'overdue').length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="interactive-card group">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center group-hover:bg-destructive/20 transition-colors relative">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
              {unpaidCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unpaidCount}
                </Badge>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{t('cards.penalty.title')}</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('cards.penalty.description')}
            </p>
            {unpaidCount > 0 && (
              <p className="text-xs text-destructive mt-2 font-medium">
                {unpaidCount} {unpaidCount === 1 ? t('penalty.unpaidPenalty') : t('penalty.unpaidPenalties')}
              </p>
            )}
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('cards.penalty.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Active Penalties */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">{t('penalty.activePenalties')}</h3>
              <Badge variant="destructive">{activePenalties.length}</Badge>
            </div>
            
            {activePenalties.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  {t('penalty.noActivePenalties')}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activePenalties.map((penalty) => (
                  <Card key={penalty.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{penalty.penalty_type}</h4>
                            <Badge 
                              variant={
                                penalty.payment_status === 'paid' ? 'default' :
                                penalty.payment_status === 'overdue' ? 'destructive' : 'secondary'
                              }
                            >
                              {penalty.payment_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{penalty.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">{t('penalty.fineAmount')}:</span> ${penalty.fine_amount}
                            </div>
                            <div>
                              <span className="font-medium">{t('penalty.plate')}:</span> {penalty.plate_number}
                            </div>
                            <div>
                              <span className="font-medium">{t('penalty.date')}:</span> {new Date(penalty.penalty_date).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">{t('penalty.due')}:</span> {new Date(penalty.due_date).toLocaleDateString()}
                            </div>
                            {penalty.violation_location && (
                              <div className="col-span-2">
                                <span className="font-medium">{t('penalty.location')}:</span> {penalty.violation_location}
                              </div>
                            )}
                          </div>
                        </div>
                        {penalty.payment_status !== 'paid' && (
                          <Button 
                            size="sm" 
                            onClick={() => markAsPaid(penalty.id)}
                            className="ml-4"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            {t('penalty.markAsPaid')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Inactive/Paid Penalties */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">{t('penalty.inactivePenalties')}</h3>
              <Badge variant="outline">{inactivePenalties.length}</Badge>
            </div>
            
            {inactivePenalties.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  {t('penalty.noInactivePenalties')}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {inactivePenalties.map((penalty) => (
                  <Card key={penalty.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between opacity-60">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{penalty.penalty_type}</h4>
                            <Badge variant="outline">{t('penalty.inactive')}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{penalty.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">{t('penalty.fineAmount')}:</span> ${penalty.fine_amount}
                            </div>
                            <div>
                              <span className="font-medium">{t('penalty.plate')}:</span> {penalty.plate_number}
                            </div>
                            <div>
                              <span className="font-medium">{t('penalty.date')}:</span> {new Date(penalty.penalty_date).toLocaleDateString()}
                            </div>
                            {penalty.payment_date && (
                              <div>
                                <span className="font-medium">{t('penalty.paid')}:</span> {new Date(penalty.payment_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PenaltyCard;