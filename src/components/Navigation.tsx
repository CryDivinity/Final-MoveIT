import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Car,GalleryVerticalEnd, LogOut, Home } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/components/language-provider';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAuthClick = (type: 'signin' | 'signup') => {
    navigate('/auth');
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/20">
      <div className="responsive-container py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Minimalist Design */}
          <button 
            onClick={scrollToTop}
            className="flex items-center space-x-2 sm:space-x-3 hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <GalleryVerticalEnd className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-medium text-foreground">DAP</h1>
              <p className="text-xs text-muted-foreground font-light">
                 {t('nav.title')}
              </p>
             
            </div>
            <div className="sm:hidden">
              <h1 className="text-xl font-medium text-foreground">DAP</h1>
            </div>
          </button>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground hidden lg:block">
                  {t('nav.welcome')} {user.email?.split('@')[0]}
                </span>
                <Button 
                  variant="ghost" 
                  className="glass-button text-sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">{t('nav.signOut')}</span>
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium hover:scale-[1.02] text-sm rounded-2xl px-6 py-2 border-none shadow-medium transition-all"
                  onClick={() => navigate('/dashboard')}
                >
                  {t('nav.dashboard')}
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="glass-button text-sm"
                  onClick={() => handleAuthClick('signin')}
                >
                  {t('auth.signIn')}
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium hover:scale-[1.02] text-sm rounded-2xl px-6 py-2 border-none shadow-medium transition-all"
                  onClick={() => handleAuthClick('signup')}
                >
                  {t('auth.getStarted')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden glass-button p-2"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 animate-fade-in">
            {/* Mobile Controls */}
            <div className="flex items-center justify-center space-x-4 p-3 border-b border-border/20">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <div className="flex flex-col space-y-2 pt-4">
              {user ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground px-3 text-center">
                    Welcome, {user.email?.split('@')[0]}
                  </p>
                  <Button 
                    variant="ghost" 
                    className="glass-button justify-center w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.signOut')}
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground justify-center w-full rounded-2xl py-3 border-none shadow-medium font-medium transition-all"
                    onClick={() => navigate('/dashboard')}
                  >
                    {t('nav.dashboard')}
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="glass-button justify-center w-full"
                    onClick={() => handleAuthClick('signin')}
                  >
                    {t('auth.signIn')}
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground justify-center w-full rounded-2xl py-3 border-none shadow-medium font-medium transition-all"
                    onClick={() => handleAuthClick('signup')}
                  >
                    {t('auth.getStarted')}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;