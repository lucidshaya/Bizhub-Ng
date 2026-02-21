import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeatureShowcase } from './components/FeatureShowcase';
import { KillExcel } from './components/KillExcel';
import { Testimonials } from './components/Testimonials';
import { Pricing } from './components/Pricing';
import { MobileApp } from './components/MobileApp';
import { Footer } from './components/Footer';
import { WaitlistPage } from './pages/WaitlistPage';

function LandingPage() {
  return (
    <>
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
    </>
  );
}

export function App() {
  return (
    <div className="min-h-screen bg-cream font-sans text-gray-900">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/waitlist" element={<WaitlistPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </div>
  );
}