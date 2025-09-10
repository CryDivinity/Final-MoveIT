import React from "react";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import AboutBody from '@/components/sections/AboutBody';

const About: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
         <AboutBody />
      <Footer />
      <ScrollToTop />
    </div>
  );
};



export default About;
// ...existing code...