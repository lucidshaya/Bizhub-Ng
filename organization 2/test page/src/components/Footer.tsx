import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';
export function Footer() {
  return (
    <footer className="bg-white pt-16 pb-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <a
              href="#"
              className="text-2xl font-extrabold tracking-tight mb-4 block">

              <span className="text-gold">Biz</span>
              <span className="text-primary">Hub NG</span>
            </a>
            <p className="text-gray-500 mb-6">
              Empowering Nigerian businesses with tools to grow, manage, and
              succeed.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors">

                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors">

                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors">

                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors">

                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a href="#" className="hover:text-primary">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Mobile App
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a href="#" className="hover:text-primary">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a href="#" className="hover:text-primary">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} BizHub NG. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Made with <Heart size={14} className="text-red-500 fill-current" />{' '}
            in Lagos
          </p>
        </div>
      </div>
    </footer>);

}