import { CreditCard, FileText, Car, Languages, Moon, Bell } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';

const AdvancedFeaturesSection = () => {
  const { t } = useLanguage();
  const { isFeatureVisible, loading } = usePlatformSettings();

  const allFeatures = [
    {
      key: 'advanced_payment',
      icon: CreditCard,
      title: t('advanced.payment.title'),
      description: t('advanced.payment.description'),
      stats: t('advanced.payment.stats'),
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      key: 'advanced_penalties',
      icon: FileText,
      title: t('advanced.penalty.title'),
      description: t('advanced.penalty.description'),
      stats: t('advanced.penalty.stats'),
      color: 'text-orange',
      bgColor: 'bg-orange/10'
    },
    {
      key: 'advanced_vehicles',
      icon: Car,
      title: t('advanced.vehicle.title'),
      description: t('advanced.vehicle.description'),
      stats: t('advanced.vehicle.stats'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      key: 'advanced_languages',
      icon: Languages,
      title: t('advanced.language.title'),
      description: t('advanced.language.description'),
      stats: t('advanced.language.stats'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      key: 'advanced_interface',
      icon: Moon,
      title: t('advanced.interface.title'),
      description: t('advanced.interface.description'),
      stats: t('advanced.interface.stats'),
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      key: 'advanced_notifications',
      icon: Bell,
      title: t('advanced.notifications.title'),
      description: t('advanced.notifications.description'),
      stats: t('advanced.notifications.stats'),
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    }
  ];

  // Show all features while loading or if platform settings are not configured yet
  const features = loading ? allFeatures : allFeatures.filter(feature => isFeatureVisible(feature.key));

  // Always render the section - don't hide due to loading state
  if (!loading && features.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 sm:py-20 lg:py-24">
      {/* Clean Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
      
      <div className="relative z-10 responsive-container">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 bg-background/50 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 text-sm mb-6 border border-border/20">
            <div className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-muted-foreground">{t('advanced.badge')}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-foreground mb-4 sm:mb-6">
            <span className="text-foreground">
              {t('advanced.title.part1')}
            </span>
            <br />
            <span className="text-primary-gradient font-medium">{t('advanced.title.part2')}</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed max-w-3xl mx-auto">
            {t('advanced.subtitle')}
          </p>
        </div>

        {/* Features Grid with Staggered Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className="group"
            >
              <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-medium hover:shadow-floating border border-border/20 backdrop-blur-sm transition-all duration-300 h-full">
                {/* Header with Icon and Stats */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded-full border border-border/20">
                    {feature.stats}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-3 text-foreground group-hover:text-accent transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Clean underline */}
                <div className="mt-4 h-0.5 bg-accent/0 group-hover:bg-accent transition-all duration-300 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvancedFeaturesSection;