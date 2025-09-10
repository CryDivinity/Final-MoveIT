import { Car, GalleryVerticalEnd, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-glass-border bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 mb-12">
          {/* Brand Section */}
          <div className="text-center lg:text-left space-y-6 max-w-md">
            <div className="flex items-center justify-center lg:justify-start space-x-3">
              <div className="glass rounded-xl p-2 animate-glow">
                <GalleryVerticalEnd className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{t('footer.brand')}</h3>
                <p className="text-sm text-muted-foreground">{t('footer.subtitle')}</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t('footer.description')}
            </p>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground text-center lg:text-left">{t('footer.contact')}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-center lg:justify-start space-x-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-secondary" />
                <span>victormaritoi@gmail.com</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-secondary" />
                <span>+373 68 879165</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-glass-border text-center">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright')}
            <span className="mx-2">•</span>
            {t('footer.tagline')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;