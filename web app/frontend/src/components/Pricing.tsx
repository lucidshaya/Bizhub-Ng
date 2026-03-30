import React from 'react';
import { Check } from 'lucide-react';
export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-darkGreen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Simple Pricing in Naira
          </h2>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            No dollar wahala. Pay with your local card or bank transfer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-colors">
            <h3 className="text-2xl font-bold mb-2">Starter</h3>
            <p className="text-green-200 mb-6">
              For side hustles & solopreneurs
            </p>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-extrabold">₦5,000</span>
              <span className="text-green-200 ml-2">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {[
                '1 User',
                'Dashboard Access',
                'Staff & Payroll',
                'Transactions',
                'No Communications',
                'No CCTV Live'].
                map((feature) =>
                  <li key={feature} className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-1">
                      <Check size={14} />
                    </div>
                    <span>{feature}</span>
                  </li>
                )}
            </ul>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-colors">
              Start Starter Plan
            </button>
          </div>

          {/* Growth Plan - Highlighted */}
          <div className="bg-cream text-gray-900 rounded-3xl p-8 border-4 border-gold transform md:-translate-y-4 shadow-2xl relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gold text-gray-900 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Growth</h3>
            <p className="text-gray-600 mb-6">For growing small businesses</p>
            <div className="flex items-baseline mb-8">
              <span className="text-5xl font-extrabold">₦15,000</span>
              <span className="text-gray-500 ml-2">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {[
                'Up to 50 Staff members',
                'Full Platform Access',
                'Communications',
                'CCTV Live',
                'Priority Support'].
                map((feature) =>
                  <li
                    key={feature}
                    className="flex items-center gap-3 font-medium">

                    <div className="bg-primary rounded-full p-1">
                      <Check size={14} className="text-white" />
                    </div>
                    <span>{feature}</span>
                  </li>
                )}
            </ul>
            <button className="w-full bg-primary hover:bg-darkGreen text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-colors">
              Start Free Trial
            </button>
          </div>

          {/* Scale Plan */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-colors">
            <h3 className="text-2xl font-bold mb-2">Scale</h3>
            <p className="text-green-200 mb-6">For established companies</p>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-extrabold">₦50,000</span>
              <span className="text-green-200 ml-2">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {[
                'Unlimited Users',
                'Advanced Analytics',
                'Multi-branch Support',
                'Dedicated Account Manager',
                'API Access'].
                map((feature) =>
                  <li key={feature} className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-1">
                      <Check size={14} />
                    </div>
                    <span>{feature}</span>
                  </li>
                )}
            </ul>
            <a href="mailto:sales@bizhub.ng" className="block text-center w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </section>);

}