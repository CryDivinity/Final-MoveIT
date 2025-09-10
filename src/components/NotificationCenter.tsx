import React, { useState, useEffect } from 'react';
import { Bell, Check, X, AlertTriangle, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';

interface Report {
  id: string;
  reporter_id: string;
  reported_plate_number: string;
  report_type: string;
  comment: string | null;
  image_url: string | null;
  is_resolved: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface NotificationCenterProps {
  userId: string;
}

const reportTypeLabels: Record<string, { label: string; color: string }> = {
  wrong_park: { label: 'Wrong Parking', color: 'secondary' },
  car_problem: { label: 'Car Problem', color: 'muted' },
  forgotten_lights: { label: 'Forgotten Lights', color: 'accent' },
  natural_weather: { label: 'Weather Issue', color: 'secondary' },
  suspect_person: { label: 'Suspicious Activity', color: 'destructive' },
  evacuation_report: { label: 'Emergency Evacuation', color: 'primary' }
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolveComment, setResolveComment] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [isResolving, setIsResolving] = useState(false);
  
  const { toast } = useToast();
  const { t } = useLanguage();

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reported_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    // Set up real-time subscription for new reports
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
          filter: `reported_user_id=eq.${userId}`
        },
        () => {
          fetchReports();
          toast({
            title: t('notifications.newReport'),
            description: t('notifications.newReportDesc'),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  const handleResolveReport = async () => {
    if (!selectedReport || rating === 0) {
      toast({
        title: t('notifications.ratingRequired'),
        description: t('notifications.ratingRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsResolving(true);

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          is_resolved: true,
          rating: rating,
          comment: resolveComment.trim() || null
        })
        .eq('id', selectedReport.id);

      if (error) {
        console.error('Error resolving report:', error);
        toast({
          title: t('common.error'),
          description: t('notifications.resolveError'),
          variant: "destructive"
        });
        return;
      }

      toast({
        title: t('notifications.reportResolvedTitle'),
        description: t('notifications.reportResolvedDesc'),
      });

      setSelectedReport(null);
      setResolveComment('');
      setRating(0);
      fetchReports();

    } catch (error) {
      console.error('Error resolving report:', error);
      toast({
        title: t('common.error'),
        description: t('common.unexpectedError'),
        variant: "destructive"
      });
    } finally {
      setIsResolving(false);
    }
  };

  const unreadReports = reports.filter(report => !report.is_resolved);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notifications.title')}
            {unreadReports.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadReports.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('notifications.noReports')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const reportInfo = reportTypeLabels[report.report_type] || { 
                  label: report.report_type, 
                  color: 'secondary' 
                };

                return (
                  <Card 
                    key={report.id} 
                    className={`cursor-pointer transition-colors ${!report.is_resolved ? 'border-primary' : ''}`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={reportInfo.color as any}>
                              {reportInfo.label}
                            </Badge>
                            {report.is_resolved ? (
                              <Badge variant="outline">
                                <Check className="h-3 w-3 mr-1" />
                                {t('notifications.resolved')}
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <Clock className="h-3 w-3 mr-1" />
                                {t('notifications.pending')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">
                            {t('notifications.vehicle')}: {report.reported_plate_number}
                          </p>
                          {report.comment && (
                            <p className="text-sm text-muted-foreground">
                              {report.comment}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString()} at{' '}
                            {new Date(report.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        {!report.is_resolved && (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>{t('notifications.reportDetails')}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={reportTypeLabels[selectedReport.report_type]?.color as any}>
                      {reportTypeLabels[selectedReport.report_type]?.label || selectedReport.report_type}
                    </Badge>
                    {selectedReport.is_resolved && (
                      <Badge variant="outline">
                        <Check className="h-3 w-3 mr-1" />
                        {t('notifications.resolved')}
                      </Badge>
                    )}
                  </div>
                  <p><strong>{t('notifications.vehicle')}:</strong> {selectedReport.reported_plate_number}</p>
                  <p><strong>{t('notifications.date')}:</strong> {new Date(selectedReport.created_at).toLocaleDateString()} at {new Date(selectedReport.created_at).toLocaleTimeString()}</p>
                </div>

                {selectedReport.comment && (
                  <div>
                    <p className="font-medium mb-1">{t('report.additionalDetails')}:</p>
                    <p className="text-muted-foreground bg-muted p-3 rounded-md">
                      {selectedReport.comment}
                    </p>
                  </div>
                )}

                {selectedReport.image_url && (
                  <div>
                    <p className="font-medium mb-2">{t('notifications.evidencePhoto')}:</p>
                    <img 
                      src={selectedReport.image_url} 
                      alt="Report evidence"
                      className="w-full h-48 object-cover rounded-md border"
                    />
                  </div>
                )}

                {!selectedReport.is_resolved && (
                  <>
                    <div className="space-y-2">
                      <p className="font-medium">{t('notifications.rateReport')}:</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            variant="ghost"
                            size="sm"
                            onClick={() => setRating(star)}
                            className="p-1"
                          >
                            <Star 
                              className={`h-6 w-6 ${star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium">{t('notifications.yourResponse')}:</p>
                      <Textarea
                        placeholder={t('notifications.responsePlaceholder')}
                        value={resolveComment}
                        onChange={(e) => setResolveComment(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedReport(null)}
                        disabled={isResolving}
                      >
                        {t('notifications.close')}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleResolveReport}
                        disabled={isResolving || rating === 0}
                      >
                        {isResolving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                            {t('notifications.resolving')}
                          </>
                        ) : (
                          t('notifications.markResolved')
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {selectedReport.is_resolved && (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      {t('notifications.reportResolved')} {new Date(selectedReport.updated_at).toLocaleDateString()}
                    </p>
                    {selectedReport.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-sm">{t('notifications.rating')}: </span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`h-4 w-4 ${star <= selectedReport.rating! ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationCenter;