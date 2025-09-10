import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/components/language-provider';
import type { User, Session } from '@supabase/supabase-js';

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

const Auth = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const signInForm = useForm<AuthFormData>();
  const signUpForm = useForm<AuthFormData>();

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth page - Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect authenticated users to dashboard
        if (session?.user) {
          console.log('Auth page - User authenticated, redirecting to dashboard');
          navigate('/dashboard');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Auth page - Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Redirect if already authenticated
      if (session?.user) {
        console.log('Auth page - Already authenticated, redirecting to dashboard');
        navigate('/dashboard');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (data: AuthFormData) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: AuthFormData) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // First, clean up any existing auth state to prevent conflicts
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Account Exists",
            description: "This email is already registered. Please sign in instead or contact support if you believe this is an error.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Account Created!",
          description: "Please check your email to confirm your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
      
      {/* Curved Wave Elements */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-gradient-to-bl from-primary/30 via-accent/20 to-transparent rounded-full blur-3xl transform rotate-12" />
        <div className="absolute top-1/4 -right-1/3 w-2/3 h-2/3 bg-gradient-to-bl from-accent/40 via-primary/15 to-transparent rounded-full blur-2xl transform -rotate-12" />
      </div>
      
      {/* Bottom Curved Elements */}
      <div className="absolute bottom-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-gradient-to-tr from-accent/25 via-primary/15 to-transparent rounded-full blur-3xl transform -rotate-12" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl flex items-center justify-center lg:justify-between gap-12">
          
          {/* Left Side - Welcome Content */}
          <div className="hidden lg:flex flex-col space-y-8 flex-1 max-w-lg">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl xl:text-5xl font-light text-foreground">
                  {t('auth.welcomeTo')}
                  <span className="block text-primary-gradient font-medium">{t('auth.platformName')}</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light leading-relaxed">
                  {t('auth.tagline')}
                </p>
              </div>
              
              {/* Floating Feature Cards */}
              <div className="space-y-4">
                <div className="glass-card p-4 animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-primary rounded-full" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{t('auth.smartNavigation')}</span>
                  </div>
                </div>
                
                <div className="glass-card p-4 animate-fade-in" style={{animationDelay: '0.4s'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-accent rounded-full" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{t('auth.emergencySupport')}</span>
                  </div>
                </div>
                
                <div className="glass-card p-4 animate-fade-in" style={{animationDelay: '0.6s'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-primary rounded-full" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{t('auth.communityDriven')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md">
            <div className="glass-card border-0 shadow-floating">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-foreground mb-2">
                  {t('auth.hello')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t('auth.subtitle')}
                </p>
              </div>

              {/* Back Button */}
              <div className="mb-6">
                <Button 
                  variant="link" 
                  onClick={() => navigate('/')}
                 className="text-muted-foreground hover:text-foreground p-0 h-auto"
                >
                   {t('auth.backToHome')}
                </Button>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 glass border-0 p-1 mb-6">
                  <TabsTrigger 
                    value="signin" 
                    className="rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-simple border-0"
                  >
                    {t('auth.signIn')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="rounded-xl data-[state=active]:bg-background/80 data-[state=active]:shadow-simple border-0"
                  >
                    {t('auth.getStarted')}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-6 mt-0">
                  <form onSubmit={signInForm.handleSubmit(signIn)} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder={t('auth.email')}
                          className="pl-12 h-12 bg-background/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                          {...signInForm.register('email', { required: t('auth.emailRequired') })}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-primary rounded-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder={t('auth.password')}
                          className="pl-12 h-12 bg-background/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                          {...signInForm.register('password', { required: t('auth.passwordRequired') })}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-accent/10 rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-accent rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-primary text-white font-medium rounded-xl border-0 hover:shadow-glow hover:scale-[1.02] transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-6 mt-0">
                  <form onSubmit={signUpForm.handleSubmit(signUp)} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder={t('auth.email')}
                          className="pl-12 h-12 bg-background/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                          {...signUpForm.register('email', { required: t('auth.emailRequired') })}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-primary rounded-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder={t('auth.createPassword')}
                          className="pl-12 h-12 bg-background/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                          {...signUpForm.register('password', { 
                            required: t('auth.passwordRequired'),
                            minLength: { value: 6, message: t('auth.passwordMinLength') }
                          })}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-accent/10 rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-accent rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="password"
                          placeholder={t('auth.confirmPassword')}
                          className="pl-12 h-12 bg-background/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                          {...signUpForm.register('confirmPassword', { required: t('auth.confirmPasswordRequired') })}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-accent/10 rounded-lg flex items-center justify-center">
                            <div className="w-3 h-3 bg-accent rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-primary text-white font-medium rounded-xl border-0 hover:shadow-glow hover:scale-[1.02] transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
                    </Button>
                  </form>
                  
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      {t('auth.alreadyHaveAccount')}{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab("signin")}
                        className="text-primary hover:underline"
                      >
                        {t('auth.signIn')}
                      </button>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;