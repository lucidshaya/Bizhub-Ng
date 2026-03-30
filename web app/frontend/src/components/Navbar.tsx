import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-cream/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="text-2xl font-extrabold tracking-tight">
              <span className="text-gold">Biz</span>
              <span className="text-primary">Hub NG</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-800 hover:text-primary font-semibold transition-colors">

              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-800 hover:text-primary font-semibold transition-colors">

              Pricing
            </a>
            <a
              href="#about"
              className="text-gray-800 hover:text-primary font-semibold transition-colors">

              About
            </a>
            <a
              href="#blog"
              className="text-gray-800 hover:text-primary font-semibold transition-colors">

              Blog
            </a>
            <Link to="/login" className="text-gray-800 hover:text-primary font-semibold transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="bg-primary hover:bg-darkGreen text-gold font-bold py-2.5 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Start Free Trial
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary p-2 focus:outline-none"
              aria-label="Toggle menu">

              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen &&
          <motion.div
            initial={{
              opacity: 0,
              height: 0
            }}
            animate={{
              opacity: 1,
              height: 'auto'
            }}
            exit={{
              opacity: 0,
              height: 0
            }}
            className="md:hidden bg-cream border-t border-gray-200 overflow-hidden">

            <div className="px-4 pt-2 pb-6 space-y-2">
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded-md">

                Features
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded-md">

                Pricing
              </a>
              <a
                href="#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded-md">

                About
              </a>
              <a
                href="#blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded-md">

                Blog
              </a>
              <div className="pt-4 space-y-2">
                <Link to="/login" className="block w-full text-center bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/signup" className="block w-full text-center bg-primary text-gold font-bold py-3 px-6 rounded-lg shadow-md" onClick={() => setIsMobileMenuOpen(false)}>
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </nav>);

}