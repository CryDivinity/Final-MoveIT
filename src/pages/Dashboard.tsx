import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, AlertTriangle, Phone, User as UserIcon, 
  LogOut, Home, QrCode, Wrench, Shield 
} from 'lucide-react';
import type { User, Session } from '@supabase/supabase-js';
import ReportModal from '@/components/ReportModal';
import QRCodeModal from '@/components/QRCodeModal';
import EmergencyModal from '@/components/EmergencyModal';
import NavigationModal from '@/components/NavigationModal';
import ServiceModal from '@/components/ServiceModal';
import NotificationCenter from '@/components/NotificationCenter';
import CommunityCard from '@/components/CommunityCard';
import FriendsTab from '@/components/FriendsTab';
import PenaltyModal from '@/components/PenaltyModal';
import ProfileModal from '@/components/ProfileModal';
import UserStatusManager from '@/components/UserStatusManager';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/components/language-provider';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import DashboardCard from '@/components/DashboardCard'; // new reusable card

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { isFeatureVisible } = usePlatformSettings();

  useEffect(() => {
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user && !isLoading) navigate('/auth');
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      } else {
        fetchProfile(session.user.id);
        fetchUserRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, isLoading]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      setProfile(data);
      if (data && !data.is_profile_complete) navigate('/profile');
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      setUserRole(data?.role || 'user');
    } catch (error) {
      setUserRole('user');
    }
  };

  const isAdmin = userRole === 'admin';

  const handleSignOut = async () => {
    try {
      const { robustSignOut } = await import('@/lib/auth-utils');
      await robustSignOut(supabase);
    } catch (error) {
      const { cleanupAuthState } = await import('@/lib/auth-utils');
      cleanupAuthState();
      window.location.href = '/auth';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass border-b border-border/20 sticky top-0 z-40">
        <div className="responsive-container py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground text-center sm:text-left w-full sm:w-auto">
              {t('dashboard.title')}
            </h1>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              {isAdmin && (
                <Button variant="ghost" onClick={() => navigate('/admin')} className="glass-button text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  {t('nav.admin')}
                </Button>
              )}
              <div className="hidden lg:block">
                <Button variant="ghost" onClick={() => setShowProfileModal(true)} className="glass-button text-sm">
                  <UserIcon className="h-4 w-4 mr-2" />
                  {t('nav.profile')}
                </Button>
              </div>
              <div className="hidden lg:block">
                <Button variant="ghost" onClick={handleSignOut} className="glass-button text-sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.signOut')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="responsive-container py-4 sm:py-6 md:py-10">
        {/* User Status */}
        <div className="mb-6 sm:mb-8">
          <UserStatusManager user={user} profile={profile} />
        </div>

        {/* Welcome */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-2xl font-bold mb-2 text-foreground">
            {t('dashboard.welcome')}, {profile?.first_name || user.email?.split('@')[0]}
          </h2>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {isFeatureVisible('reports') && (
            <DashboardCard
              icon={<AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange" />}
              title={t('cards.reportProblem.title')}
              description={t('cards.reportProblem.description')}
              colorClass="orange"
              onClick={() => setShowReportModal(true)}
            />
          )}
          {isFeatureVisible('emergency') && (
            <DashboardCard
              icon={<Phone className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />}
              title={t('cards.emergency.title')}
              description={t('cards.emergency.description')}
              colorClass="destructive"
              onClick={() => setShowEmergencyModal(true)}
            />
          )}
          {isFeatureVisible('navigation') && (
            <DashboardCard
              icon={<MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />}
              title={t('cards.navigation.title')}
              description={t('cards.navigation.description')}
              colorClass="foreground"
              onClick={() => setShowNavigationModal(true)}
            />
          )}
          <DashboardCard
            icon={<Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-orange" />}
            title={t('cards.service.title')}
            description={t('cards.service.description')}
            colorClass="orange"
            onClick={() => setShowServiceModal(true)}
          />
          {isFeatureVisible('penalties') && (
            <DashboardCard
              icon={<AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />}
              title={t('cards.penalties.title')}
              description={t('cards.penalties.description')}
              colorClass="destructive"
              onClick={() => setShowPenaltyModal(true)}
            />
          )}
          {isFeatureVisible('community') && user && <CommunityCard user={user} />}
          {isFeatureVisible('friends') && user && <FriendsTab user={user} />}
          {isFeatureVisible('qr_system') && (
            <DashboardCard
              icon={<QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title={t('cards.qrCode.title')}
              description={t('cards.qrCode.description')}
              colorClass="primary"
              onClick={() => setShowQRCodeModal(true)}
            />
          )}
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden mt-8 grid grid-cols-2 gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="glass-button justify-start h-auto py-4">
            <Home className="h-5 w-5 mr-3" />
            {t('nav.home')}
          </Button>
          <Button variant="ghost" onClick={() => setShowProfileModal(true)} className="glass-button justify-start h-auto py-4">
            <UserIcon className="h-5 w-5 mr-3" />
            {t('mobile.myProfile')}
          </Button>
          <Button variant="ghost" onClick={() => setShowReportModal(true)} className="glass-button justify-start h-auto py-4">
            <AlertTriangle className="h-5 w-5 mr-3" />
            {t('mobile.quickReport')}
          </Button>
          {isAdmin && (
            <Button variant="ghost" onClick={() => navigate('/admin')} className="glass-button justify-start h-auto py-4">
              <Shield className="h-5 w-5 mr-3" />
              {t('nav.admin')}
            </Button>
          )}
        </div>

        {/* Notifications */}
        <div className="mt-10 sm:mt-12">
          {user && <NotificationCenter userId={user.id} />}
        </div>
      </div>

      {/* Modals */}
      <ReportModal open={showReportModal} onOpenChange={setShowReportModal} />
      {user && <QRCodeModal open={showQRCodeModal} onOpenChange={setShowQRCodeModal} user={user} />}
      {user && <EmergencyModal open={showEmergencyModal} onOpenChange={setShowEmergencyModal} user={user} />}
      <NavigationModal open={showNavigationModal} onOpenChange={setShowNavigationModal} />
      {user && <ServiceModal open={showServiceModal} onOpenChange={setShowServiceModal} user={user} />}
      {user && <PenaltyModal open={showPenaltyModal} onOpenChange={setShowPenaltyModal} user={user} />}
      {user && <ProfileModal open={showProfileModal} onOpenChange={setShowProfileModal} user={user} setShowQRCodeModal={setShowQRCodeModal} />}
    </div>
  );
};

export default Dashboard;
