import { QrCode, MessageSquare, Phone, MapPin, Shield, Users } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

const CoreFeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: QrCode,
      title: t('features.qr.title'),
      description: t('features.qr.description'),
      color: 'text-foreground',
      bgColor: 'bg-foreground/10',
      gradient: 'from-foreground/20 to-foreground/5'
    },
    {
      icon: MessageSquare,
      title: t('features.reports.title'),
      description: t('features.reports.description'),
      color: 'text-orange',
      bgColor: 'bg-orange/10',
      gradient: 'from-orange/20 to-orange/5'
    },
    {
      icon: Phone,
      title: t('features.emergency.title'),
      description: t('features.emergency.description'),
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      gradient: 'from-destructive/20 to-destructive/5'
    },
    {
      icon: MapPin,
      title: t('features.navigation.title'),
      description: t('features.navigation.description'),
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      gradient: 'from-green-500/20 to-green-500/5'
    },
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      gradient: 'from-blue-500/20 to-blue-500/5'
    },
    {
      icon: Users,
      title: t('features.community.title'),
      description: t('features.community.description'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      gradient: 'from-purple-500/20 to-purple-500/5'
    }
  ];

  return (
    <section id="features" className="relative py-16 sm:py-20 lg:py-24">
      {/* Clean Background */}
      <div className="absolute inset-0 bg-muted/20" />
      
      <div className="relative z-10 responsive-container">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 bg-background/50 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 text-sm mb-6 border border-border/20">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-muted-foreground">{t('features.badge')}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-foreground mb-4 sm:mb-6">
            <span className="text-foreground">{t('features.title.part1')}</span>
            <br />
            <span className="text-primary-gradient font-medium">{t('features.title.part2')}</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed max-w-3xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className="group"
            >
              {/* Clean Card */}
              <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-medium hover:shadow-floating border border-border/20 backdrop-blur-sm transition-all duration-300 h-full">
                <div className={`w-12 h-12 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Clean underline */}
                <div className="mt-6 h-0.5 bg-primary/0 group-hover:bg-primary transition-all duration-300 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreFeaturesSection;