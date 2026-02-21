import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { FeatureShowcase } from '../components/FeatureShowcase';
import { KillExcel } from '../components/KillExcel';
import { Testimonials } from '../components/Testimonials';
import { Pricing } from '../components/Pricing';
import { MobileApp } from '../components/MobileApp';
import { Footer } from '../components/Footer';
export function LandingPage() {
  return (
    <div className="min-h-screen bg-cream font-sans text-gray-900">
      <Navbar />
      <main>
        <Hero />
        <FeatureShowcase />
        <KillExcel />
        <Testimonials />
        <Pricing />
        <MobileApp />
      </main>
      <Footer />
    </div>);

}