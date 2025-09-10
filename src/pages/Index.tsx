import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/sections/HeroSection';
import CoreFeaturesSection from '@/components/sections/CoreFeaturesSection';
import AdvancedFeaturesSection from '@/components/sections/AdvancedFeaturesSection';
import QASection from '@/components/sections/QASection';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/components/language-provider';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

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

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    // Scroll animation observer setup
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const setupAnimations = () => {
      // Clear any existing observer
      observer.disconnect();
      
      // Find all scroll-fade elements and ensure they're visible
      const scrollElements = document.querySelectorAll('.scroll-fade');
      scrollElements.forEach((el) => {
        // Make elements visible immediately to prevent disappearing during language changes
        el.classList.add('visible');
        observer.observe(el);
      });
    };

    // Initial setup
    setupAnimations();
    
    // Re-setup after a short delay to catch any elements that might be added after language change
    const timeoutId = setTimeout(setupAnimations, 200);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array - this effect should only run once

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <CoreFeaturesSection />
      <AdvancedFeaturesSection />
      <QASection />
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
