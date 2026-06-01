import React, { useState } from 'react';
import { Check } from 'lucide-react';
export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-darkGreen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Simple Pricing in Naira
          </h2>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-8">
            No dollar wahala. Pay with your local card or bank transfer.
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg font-medium ${!isYearly ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-8 w-16 items-center rounded-full bg-gold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-darkGreen"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-9' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className={`text-lg font-medium flex items-center gap-2 ${isYearly ? 'text-white' : 'text-gray-400'}`}>
              Yearly <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded-full">Save ~17%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
          {/* Retail Plan */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-colors flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Retail</h3>
            <p className="text-green-200 mb-6">
              For standalone stores & shops
            </p>
            <div className="flex flex-col mb-8 h-[80px] justify-center">
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold">Free</span>
                <span className="text-green-200 ml-2">Forever</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                '1 User (Owner)',
                'Basic Dashboard',
                'Transactions log',
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
              Get Started Free
            </button>
          </div>

          {/* Growth Plan - Highlighted */}
          <div className="bg-cream text-gray-900 rounded-3xl p-8 border-4 border-gold transform md:-translate-y-4 shadow-2xl relative flex flex-col">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gold text-gray-900 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Growth (Corporate)</h3>
            <p className="text-gray-600 mb-6">For growing small businesses</p>
            <div className="flex flex-col mb-8 h-[80px] justify-center">
              <div className="flex items-baseline">
                <span className="text-5xl font-extrabold">{isYearly ? '₦150k' : '₦15,000'}</span>
                <span className="text-gray-500 ml-2">/{isYearly ? 'year' : 'month'}</span>
              </div>
              {isYearly && <p className="text-sm font-bold text-green-600 mt-1">You save ₦30,000!</p>}
            </div>
            <ul className="space-y-4 mb-8 flex-1">
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
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-colors flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Scale (Corporate)</h3>
            <p className="text-green-200 mb-6">For established companies</p>
            <div className="flex flex-col mb-8 h-[80px] justify-center">
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold">{isYearly ? '₦500k' : '₦50,000'}</span>
                <span className="text-green-200 ml-2">/{isYearly ? 'year' : 'month'}</span>
              </div>
              {isYearly && <p className="text-sm font-bold text-gold mt-1">You save ₦100,000!</p>}
            </div>
            <ul className="space-y-4 mb-8 flex-1">
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