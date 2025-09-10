import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';

const AdminLogin = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { adminLogin } = useAdminAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await adminLogin(username, password);
      
      if (result.success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome to the admin panel',
        });
        navigate('/admin');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Admin Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 via-accent/10 to-background" />
      
      {/* Curved Wave Elements */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-gradient-to-bl from-destructive/30 via-accent/20 to-transparent rounded-full blur-3xl transform rotate-12" />
        <div className="absolute top-1/4 -right-1/3 w-2/3 h-2/3 bg-gradient-to-bl from-accent/40 via-destructive/15 to-transparent rounded-full blur-2xl transform -rotate-12" />
      </div>
      
      {/* Bottom Curved Elements */}
      <div className="absolute bottom-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-gradient-to-tr from-accent/25 via-destructive/15 to-transparent rounded-full blur-3xl transform -rotate-12" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl flex items-center justify-center lg:justify-between gap-12">
          
          {/* Left Side - Admin Welcome Content */}
          <div className="hidden lg:flex flex-col space-y-8 flex-1 max-w-lg">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl xl:text-5xl font-light text-foreground">
                  Admin
                  <span className="block text-primary-gradient font-medium">Control Panel</span>
                </h1>
                <p className="text-lg text-muted-foreground font-light leading-relaxed">
                  Secure access to DAP platform administration
                </p>
              </div>
              
              {/* Floating Admin Feature Cards */}
              <div className="space-y-4">
                <div className="glass-card p-4 animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-destructive" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Secure Access</span>
                  </div>
                </div>
                
                <div className="glass-card p-4 animate-fade-in" style={{animationDelay: '0.4s'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-accent rounded-full" />
                    </div>
                    <span className="text-sm font-medium text-foreground">System Management</span>
                  </div>
                </div>
                
                <div className="glass-card p-4 animate-fade-in" style={{animationDelay: '0.6s'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-primary rounded-full" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Analytics Dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Admin Auth Form */}
          <div className="w-full max-w-md">
            <div className="glass-card border-0 shadow-floating">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-destructive to-accent rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-light text-foreground mb-2">
                  Admin Access
                </h2>
                <p className="text-muted-foreground text-sm">
                  Enter your administrator credentials
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-0 bg-destructive/10">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('admin.username')}
                      className="pl-12 h-12 bg-background/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                      required
                      disabled={loading}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <Shield className="w-3 h-3 text-destructive" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('admin.password')}
                      className="pl-12 pr-12 h-12 bg-background/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                      required
                      disabled={loading}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 bg-accent/10 rounded-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-accent rounded-full" />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-destructive to-accent text-white font-medium rounded-xl border-0 hover:shadow-glow hover:scale-[1.02] transition-all"
                  disabled={loading}
                >
                  {loading ? t('admin.signingIn') : t('admin.accessPanel')}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Authorized personnel only
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;