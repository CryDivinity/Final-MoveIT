import { Button } from '@/components/ui/button';
import { Download, Info, Smartphone, Navigation2, Shield, Zap } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useNavigate } from 'react-router-dom';
const HeroSection = () => {
  const {
    t
  } = useLanguage();
  const navigate = useNavigate();
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Clean Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted/80" />
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
      backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, hsl(var(--accent)) 0%, transparent 50%)`
    }} />

      {/* Content Layout */}
      <div className="relative z-10 responsive-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">
          
          {/* Left Content */}
          <div className="space-y-8 text-left lg:text-left">
            {/* Main Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-background/50 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 text-sm mb-6 border border-border/20">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-muted-foreground">{t('hero.badge')}</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-foreground">
                {t('hero.title.part1')}{' '}
                <span className="text-primary-gradient font-medium">{t('hero.title.part2')}</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl">
                {t('hero.subtitle')}
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex justify-start">
              <Button size="lg" variant="outline" className="border-border bg-background/50 hover:bg-background/80 text-foreground px-8 py-4 text-lg font-medium rounded-2xl border-2 hover:border-primary/50 transition-all" onClick={() => document.getElementById('features')?.scrollIntoView({
              behavior: 'smooth'
            })}>
                <Info className="mr-2 w-5 h-5" />
                {t('hero.exploreFeaturesBtn')}
              </Button>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full" />
                {t('hero.feature1')}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-accent rounded-full" />
                {t('hero.feature2')}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full" />
                {t('hero.feature3')}
              </div>
            </div>
          </div>

          {/* Right Content - Responsive Animation */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Mobile View */}
              <div className="w-80 h-[600px] bg-card rounded-[3rem] p-4 shadow-floating border border-border/20 backdrop-blur-sm animate-[float_3s_ease-in-out_infinite]">
                <div className="w-full h-full bg-gradient-subtle rounded-[2.5rem] p-6 flex flex-col">
                  {/* Status Bar */}
                  <div className="flex justify-between items-center mb-8">
                    <div className="text-xs font-medium text-foreground">9:41</div>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-foreground rounded-full" />
                      <div className="w-1 h-1 bg-foreground rounded-full" />
                      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                    </div>
                  </div>
                  
                  {/* App Content */}
                  <div className="flex-1 space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center">
                        <Smartphone className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">DAP Platform</h3>
                      <p className="text-sm text-muted-foreground">Your driving companion</p>
                    </div>
                    
                    {/* Feature Cards */}
                    <div className="space-y-3">
                      <div className="bg-background/50 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Navigation2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-sm text-foreground font-medium">Smart Navigation</div>
                      </div>
                      
                      <div className="bg-background/50 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-accent" />
                        </div>
                        <div className="text-sm text-foreground font-medium">Emergency Support</div>
                      </div>
                      
                      <div className="bg-background/50 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-sm text-foreground font-medium">Quick Reports</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Desktop View - Floating */}
              <div className="absolute -top-16 -right-20 w-48 h-32 bg-card rounded-2xl p-3 shadow-floating border border-border/20 backdrop-blur-sm animate-[float_3s_ease-in-out_infinite_1s]">
                <div className="w-full h-full bg-gradient-subtle rounded-xl p-3 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                  </div>
                  <div className="text-xs text-foreground font-medium mb-2">DAP Desktop</div>
                  <div className="flex-1 bg-background/30 rounded p-2">
                    <div className="grid grid-cols-3 gap-1">
                      <div className="w-full h-2 bg-primary/20 rounded" />
                      <div className="w-full h-2 bg-accent/20 rounded" />
                      <div className="w-full h-2 bg-primary/20 rounded" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tablet View - Floating */}
              <div className="absolute -bottom-12 -left-16 w-32 h-48 bg-card rounded-2xl p-2 shadow-floating border border-border/20 backdrop-blur-sm animate-[float_3s_ease-in-out_infinite_2s]">
                <div className="w-full h-full bg-gradient-subtle rounded-xl p-2 flex flex-col">
                  <div className="text-xs text-foreground font-medium mb-2 text-center">Tablet</div>
                  <div className="flex-1 space-y-1">
                    <div className="w-full h-1.5 bg-primary/20 rounded" />
                    <div className="w-full h-1.5 bg-accent/20 rounded" />
                    <div className="w-3/4 h-1.5 bg-primary/20 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;