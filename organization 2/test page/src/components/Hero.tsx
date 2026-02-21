import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Hero() {
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.43, 0.13, 0.23, 0.96] as any
      }
    }
  };
  return (
    <section className="relative w-full min-h-screen pt-24 pb-16 md:pt-32 md:pb-24 bg-primary overflow-hidden flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(#FFD700 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-left">

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">

              <span className="block text-white">Run Your Business.</span>
              <span className="block text-gold">Own Your Data.</span>
              <span className="block text-white">Pay Your People.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-green-100 mb-8 max-w-lg font-medium leading-relaxed">

              The all-in-one business platform built for Nigerian entrepreneurs.
              No jargon. No wahala. Just results.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4">

              <Link to="/waitlist" className="bg-gold hover:bg-yellow-400 text-gray-900 font-bold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                Join Waitlist <ArrowRight size={20} />
              </Link>
              <button className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold text-lg py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2">
                <Play size={20} fill="currentColor" /> Watch Demo
              </button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-10 flex items-center gap-4 text-green-100 text-sm font-medium">

              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) =>
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gray-300 border-2 border-primary flex items-center justify-center text-xs text-gray-600 font-bold overflow-hidden">

                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`}
                      alt="User" />

                  </div>
                )}
              </div>
              <p>Trusted by 5,000+ Nigerian businesses</p>
            </motion.div>
          </motion.div>

          {/* Visual Content - Abstract Dashboard */}
          <motion.div
            initial={{
              opacity: 0,
              x: 50
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            transition={{
              duration: 0.8,
              delay: 0.5
            }}
            className="relative hidden lg:block">

            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main Dashboard Card */}
              <div className="absolute inset-0 bg-cream rounded-2xl shadow-2xl overflow-hidden border-4 border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-gray-400 text-xs font-mono">
                    dashboard.bizhub.ng
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">
                        Total Revenue
                      </p>
                      <h3 className="text-4xl font-bold text-gray-900 mt-1">
                        ₦4,250,000
                      </h3>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <TrendingUp size={16} /> +12.5%
                    </div>
                  </div>

                  {/* Mock Chart */}
                  <div className="h-32 flex items-end justify-between gap-2">
                    {[40, 65, 45, 80, 55, 90, 75].map((h, i) =>
                      <div
                        key={i}
                        className="w-full bg-primary/10 rounded-t-sm relative group">

                        <motion.div
                          initial={{
                            height: 0
                          }}
                          animate={{
                            height: `${h}%`
                          }}
                          transition={{
                            duration: 1,
                            delay: 1 + i * 0.1
                          }}
                          className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm group-hover:bg-gold transition-colors">
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* Recent Transactions */}
                  <div className="space-y-3 pt-2">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      Recent Transactions
                    </p>
                    {[1, 2, 3].map((i) =>
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm">

                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 1 ? 'bg-blue-100 text-blue-600' : i === 2 ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>

                            {i === 1 ?
                              <DollarSign size={16} /> :
                              i === 2 ?
                                <Users size={16} /> :

                                <TrendingUp size={16} />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {i === 1 ?
                                'Payment from Client' :
                                i === 2 ?
                                  'Payroll: March' :
                                  'Inventory Restock'}
                            </p>
                            <p className="text-xs text-gray-500">Just now</p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-bold ${i === 2 || i === 3 ? 'text-red-500' : 'text-green-600'}`}>

                          {i === 2 || i === 3 ? '-' : '+'}₦
                          {i === 1 ? '150,000' : i === 2 ? '450,000' : '85,000'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                animate={{
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute -right-8 top-20 bg-white p-4 rounded-xl shadow-xl border-l-4 border-gold w-48 z-20">

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-primary">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">New Staff</p>
                    <p className="text-lg font-bold text-gray-900">12 Active</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 10, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1
                }}
                className="absolute -left-8 bottom-32 bg-darkGreen text-white p-4 rounded-xl shadow-xl w-56 z-20">

                <p className="text-xs text-green-200 font-bold mb-1">
                  Cash Flow
                </p>
                <p className="text-2xl font-bold text-gold">₦12.5M</p>
                <p className="text-xs text-green-200 mt-1">
                  ↑ 24% vs last month
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>);

}