import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';

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

const reportTypeLabels: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  wrong_park: { label: 'Wrong Parking', color: 'orange', icon: AlertTriangle },
  car_problem: { label: 'Car Problem', color: 'blue', icon: Bell },
  forgotten_lights: { label: 'Forgotten Lights', color: 'yellow', icon: Bell },
  natural_weather: { label: 'Weather Issue', color: 'sky', icon: Bell },
  suspect_person: { label: 'Suspicious Activity', color: 'red', icon: AlertTriangle },
  evacuation_report: { label: 'Emergency Evacuation', color: 'primary', icon: AlertTriangle },
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

      if (!error) setReports(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports', filter: `reported_user_id=eq.${userId}` },
        () => {
          fetchReports();
          toast({
            title: t('notifications.newReport'),
            description: t('notifications.newReportDesc'),
          });
        },
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
        variant: 'destructive',
      });
      return;
    }

    setIsResolving(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          is_resolved: true,
          rating,
          comment: resolveComment.trim() || null,
        })
        .eq('id', selectedReport.id);

      if (!error) {
        toast({
          title: t('notifications.reportResolvedTitle'),
          description: t('notifications.reportResolvedDesc'),
        });
        setSelectedReport(null);
        setResolveComment('');
        setRating(0);
        fetchReports();
      }
    } finally {
      setIsResolving(false);
    }
  };

  const unreadReports = reports.filter((r) => !r.is_resolved);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-8"> {/* adds space below Dashboard */}
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5" />
        {t('notifications.title')}
        {unreadReports.length > 0 && (
          <Badge variant="destructive">{unreadReports.length}</Badge>
        )}
      </h2>

      {reports.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('notifications.noReports')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => {
            const info =
              reportTypeLabels[report.report_type] || {
                label: report.report_type,
                color: 'gray',
                icon: Bell,
              };
            const Icon = info.icon;
            return (
              <div
                key={report.id}
                className={cn(
                  'interactive-card p-5 rounded-xl border cursor-pointer transition-all',
                  'hover:scale-[1.01] hover:shadow-md',
                )}
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-center gap-4">
                  {/* icon bubble */}
                  <div
                    className={cn(
                      'w-12 h-12 flex items-center justify-center rounded-full',
                      `bg-${info.color}-100`,
                    )}
                  >
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  {/* content */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {info.label} – {report.reported_plate_number}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {report.comment || t('notifications.noComment')}
                    </p>
                  </div>

                  {/* status + date */}
                  <div className="text-right space-y-1">
                    <Badge
                      variant={report.is_resolved ? 'outline' : 'destructive'}
                    >
                      {report.is_resolved
                        ? t('notifications.resolved')
                        : t('notifications.pending')}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>{t('notifications.reportDetails')}</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="details" className="mt-2">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="details">{t('notifications.details')}</TabsTrigger>
                  {!selectedReport.is_resolved && (
                    <TabsTrigger value="actions">{t('notifications.actions')}</TabsTrigger>
                  )}
                </TabsList>

                {/* details */}
                <TabsContent value="details" className="space-y-4">
                  <p>
                    <strong>{t('notifications.vehicle')}:</strong>{' '}
                    {selectedReport.reported_plate_number}
                  </p>
                  <p>
                    <strong>{t('notifications.date')}:</strong>{' '}
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                  {selectedReport.comment && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-muted-foreground">{selectedReport.comment}</p>
                    </div>
                  )}
                  {selectedReport.image_url && (
                    <img
                      src={selectedReport.image_url}
                      alt="Evidence"
                      className="w-full h-56 object-cover rounded-md border"
                    />
                  )}
                  {selectedReport.is_resolved && (
                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {t('notifications.reportResolved')}{' '}
                        {new Date(selectedReport.updated_at).toLocaleDateString()}
                      </p>
                      {selectedReport.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                'h-4 w-4',
                                star <= selectedReport.rating
                                  ? 'fill-accent text-accent'
                                  : 'text-muted-foreground',
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* actions */}
                {!selectedReport.is_resolved && (
                  <TabsContent value="actions" className="space-y-4">
                    <div>
                      <p className="font-medium">{t('notifications.rateReport')}:</p>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            variant="ghost"
                            size="sm"
                            onClick={() => setRating(star)}
                            className="p-1"
                          >
                            <Star
                              className={cn(
                                'h-6 w-6',
                                star <= rating
                                  ? 'fill-accent text-accent'
                                  : 'text-muted-foreground',
                              )}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Textarea
                      placeholder={t('notifications.responsePlaceholder')}
                      value={resolveComment}
                      onChange={(e) => setResolveComment(e.target.value)}
                      rows={3}
                    />
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
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationCenter;
