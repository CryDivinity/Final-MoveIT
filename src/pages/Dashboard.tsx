import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, AlertTriangle, Phone, User as UserIcon, LogOut, Home, QrCode, Wrench } from 'lucide-react';
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

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
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
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only redirect to auth if we're sure there's no session and loading is complete
        if (!session?.user && !isLoading) {
          console.log('No session, redirecting to auth');
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        console.log('No initial session, redirecting to auth');
        navigate('/auth');
      } else {
        fetchProfile(session.user.id);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
      
      // If profile exists but is incomplete, redirect to profile completion
      if (data && !data.is_profile_complete) {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      // Use robust sign out to handle corrupted sessions
      const { robustSignOut } = await import('@/lib/auth-utils');
      await robustSignOut(supabase);
    } catch (error) {
      // Fallback: clean up and redirect manually
      console.error('Sign out error:', error);
      try {
        const { cleanupAuthState } = await import('@/lib/auth-utils');
        cleanupAuthState();
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
      // Force redirect as last resort
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass border-b border-border/20 sticky top-0 z-40">
        <div className="responsive-container py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{t('dashboard.title')}</h1>
            
            {/* Center - Language and Theme Toggles */}
            <div className="flex items-center space-x-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            
            {/* Right - Navigation and User Actions */}
            <div className="flex items-center space-x-2">
              {/* Profile Button - Desktop */}
              <div className="hidden lg:block">
                <Button
                  variant="ghost"
                  onClick={() => setShowProfileModal(true)}
                  className="glass-button text-sm"
                >
                  <UserIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{t('nav.profile')}</span>
                </Button>
              </div>
              
              {/* Sign Out Button - Desktop */}
              <div className="hidden lg:block">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="glass-button text-sm"
                >
                  <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{t('nav.signOut')}</span>
                </Button>
              </div>
              
              {/* Navigation Menu */}
              <div className="relative group">
                <Button
                  variant="ghost"
                  className="glass-button text-sm"
                >
                  <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="truncate">{t('nav.menu')}</span>
                </Button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-background/95 backdrop-blur-lg border border-border/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2 space-y-1">
                    {/* Profile and Sign Out for Mobile */}
                    <div className="lg:hidden">
                      <Button
                        variant="ghost"
                        onClick={() => setShowProfileModal(true)}
                        className="w-full justify-start glass-button text-sm"
                      >
                        <UserIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('nav.profile')}</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full justify-start glass-button text-sm"
                      >
                        <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('nav.signOut')}</span>
                      </Button>
                      
                      <div className="h-px bg-border/20 my-2"></div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/')}
                      className="w-full justify-start glass-button text-sm"
                    >
                      <Home className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{t('nav.home')}</span>
                    </Button>
                    
                    {isFeatureVisible('report') && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowReportModal(true)}
                        className="w-full justify-start glass-button text-sm"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('nav.report')}</span>
                      </Button>
                    )}
                    
                    {isFeatureVisible('emergency') && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowEmergencyModal(true)}
                        className="w-full justify-start glass-button text-sm"
                      >
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('nav.emergency')}</span>
                      </Button>
                    )}
                    
                    {isFeatureVisible('navigation') && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowNavigationModal(true)}
                        className="w-full justify-start glass-button text-sm"
                      >
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('nav.navigation')}</span>
                      </Button>
                    )}
                    
                    {isFeatureVisible('qr_code') && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowQRCodeModal(true)}
                        className="w-full justify-start glass-button text-sm"
                      >
                        <QrCode className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t('nav.qrCode')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="responsive-container py-6 sm:py-8">
        {/* User Status Section */}
        <div className="mb-6 sm:mb-8">
          <UserStatusManager 
            user={user}
            profile={profile}
          />
        </div>

        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
            {t('dashboard.welcome')}, {profile?.first_name || user.email?.split('@')[0]}
          </h2>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Action Cards */}
        <div className="responsive-grid max-w-6xl mx-auto">
          {/* Report Problem Card */}
          {isFeatureVisible('reports') && (
            <div 
              className="interactive-card group"
              onClick={() => setShowReportModal(true)}
            >
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-orange/10 rounded-full flex items-center justify-center group-hover:bg-orange/20 transition-colors">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{t('cards.reportProblem.title')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('cards.reportProblem.description')}
                </p>
              </div>
            </div>
          )}

          {/* Emergency Card */}
          {isFeatureVisible('emergency') && (
            <div 
              className="interactive-card group"
              onClick={() => setShowEmergencyModal(true)}
            >
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                  <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{t('cards.emergency.title')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('cards.emergency.description')}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Card */}
          {isFeatureVisible('navigation') && (
            <div 
              className="interactive-card group"
              onClick={() => setShowNavigationModal(true)}
            >
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-foreground/10 rounded-full flex items-center justify-center group-hover:bg-foreground/20 transition-colors">
                  <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{t('cards.navigation.title')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('cards.navigation.description')}
                </p>
              </div>
            </div>
          )}

          {/* Service Card */}
          <div 
            className="interactive-card group"
            onClick={() => setShowServiceModal(true)}
          >
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-orange/10 rounded-full flex items-center justify-center group-hover:bg-orange/20 transition-colors">
                <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-orange" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{t('cards.service.title')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('cards.service.description')}
              </p>
            </div>
          </div>

          {/* Penalties Card */}
          {isFeatureVisible('penalties') && (
            <div 
              className="interactive-card group"
              onClick={() => setShowPenaltyModal(true)}
            >
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{t('cards.penalties.title')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('cards.penalties.description')}
                </p>
              </div>
            </div>
          )}

          {/* Community Card */}
          {isFeatureVisible('community') && user && <CommunityCard user={user} />}

          {/* Friends Tab - only shows if user has accepted friends */}
          {isFeatureVisible('friends') && user && <FriendsTab user={user} />}

          {/* QR Code Card */}
          {isFeatureVisible('qr_system') && (
            <div 
              className="interactive-card group"
              onClick={() => setShowQRCodeModal(true)}
            >
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{t('cards.qrCode.title')}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('cards.qrCode.description')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation Grid */}
        <div className="lg:hidden mt-8 grid grid-cols-2 gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="glass-button justify-start h-auto py-4"
          >
            <Home className="h-5 w-5 mr-3" />
            <span>{t('nav.home')}</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setShowProfileModal(true)}
            className="glass-button justify-start h-auto py-4"
          >
            <UserIcon className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="truncate">{t('mobile.myProfile')}</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setShowReportModal(true)}
            className="glass-button justify-start h-auto py-4"
          >
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="truncate">{t('mobile.quickReport')}</span>
          </Button>
        </div>

        {/* Notifications Section */}
        {user && <NotificationCenter userId={user.id} />}
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