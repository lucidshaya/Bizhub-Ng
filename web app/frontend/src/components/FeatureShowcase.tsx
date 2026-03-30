import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Package,
  FileText,
  Users,
  PieChart,
  BarChart3
} from
  'lucide-react';
const features = [
  {
    id: 1,
    title: 'Payroll',
    description:
      'Pay staff on time, every time. Auto-calculate taxes and pension.',
    color: 'bg-darkGreen',
    icon: <Wallet className="w-8 h-8 text-white" />
  },
  {
    id: 2,
    title: 'Inventory',
    description:
      'Track every item. Never run out of stock again. Low stock alerts.',
    color: 'bg-gold',
    textColor: 'text-gray-900',
    icon: <Package className="w-8 h-8 text-gray-900" />
  },
  {
    id: 3,
    title: 'Invoicing',
    description:
      'Send professional invoices in seconds. Get paid faster via transfer.',
    color: 'bg-coral',
    icon: <FileText className="w-8 h-8 text-white" />
  },
  {
    id: 4,
    title: 'HR & Staff',
    description:
      'Manage your team like a pro. Leave requests, loans, and performance.',
    color: 'bg-purple',
    icon: <Users className="w-8 h-8 text-white" />
  },
  {
    id: 5,
    title: 'Accounting',
    description:
      'Know your numbers. Grow your profit. Expense tracking made simple.',
    color: 'bg-blue',
    icon: <PieChart className="w-8 h-8 text-white" />
  },
  {
    id: 6,
    title: 'Reports',
    description:
      'Real-time insights. Make better decisions with clear data visualization.',
    color: 'bg-teal',
    icon: <BarChart3 className="w-8 h-8 text-white" />
  }];

export function FeatureShowcase() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollTo({
        left:
          direction === 'left' ?
            currentScroll - scrollAmount :
            currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  return (
    <section id="features" className="py-20 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Everything Your <br />
            Business Needs
          </h2>
          <p className="text-lg text-gray-600 max-w-xl">
            Stop juggling 5 different apps. BizHub NG brings everything together
            in one place.
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
            aria-label="Scroll left">

            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
            aria-label="Scroll right">

            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-6 pb-12 px-4 sm:px-6 lg:px-8 scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollPaddingLeft: '1.5rem',
          scrollPaddingRight: '1.5rem'
        }}>

        {features.map((feature) =>
          <motion.div
            key={feature.id}
            whileHover={{
              y: -10
            }}
            className={`min-w-[300px] md:min-w-[350px] h-[450px] ${feature.color} rounded-3xl p-8 flex flex-col justify-between snap-center shadow-xl flex-shrink-0`}>

            <div>
              <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
                {feature.icon}
              </div>
              <h3
                className={`text-3xl font-bold mb-4 ${feature.textColor || 'text-white'}`}>

                {feature.title}
              </h3>
              <p
                className={`text-lg font-medium leading-relaxed ${feature.textColor ? 'text-gray-800' : 'text-white/90'}`}>

                {feature.description}
              </p>
            </div>

            <a
              href="/signup"
              className={`inline-flex items-center gap-2 font-bold text-lg group ${feature.textColor || 'text-white'}`}>

              Learn More
              <ArrowRight
                size={20}
                className="transform group-hover:translate-x-1 transition-transform" />

            </a>
          </motion.div>
        )}
      </div>
    </section>);

}