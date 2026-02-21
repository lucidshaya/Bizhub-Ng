import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, FileSpreadsheet, LayoutDashboard } from 'lucide-react';
export function KillExcel() {
  return (
    <section className="py-24 bg-cream relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Kill Excel Forever <span className="text-red-500">🔥</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We know you have 47 tabs open right now. Let us fix that for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* The Old Way - Excel Hell */}
          <motion.div
            initial={{
              opacity: 0,
              x: -50
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              duration: 0.6
            }}
            className="bg-red-50 rounded-3xl p-8 border-2 border-red-100 shadow-lg relative overflow-hidden">

            <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-xl font-bold text-sm">
              THE OLD WAY
            </div>

            <div className="mb-8 mt-4">
              <h3 className="text-2xl font-bold text-red-900 mb-2 flex items-center gap-2">
                <FileSpreadsheet className="text-red-500" /> Spreadsheet Chaos
              </h3>
              <p className="text-red-700">
                Manual, messy, and prone to errors.
              </p>
            </div>

            {/* Excel Mockup */}
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden mb-8 text-xs font-mono">
              <div className="bg-green-700 text-white px-2 py-1 flex gap-4">
                <span>File</span>
                <span>Edit</span>
                <span>View</span>
                <span>Insert</span>
              </div>
              <div className="grid grid-cols-4 border-b border-gray-200 bg-gray-50">
                <div className="p-2 border-r border-gray-200 text-center font-bold text-gray-500">
                  A
                </div>
                <div className="p-2 border-r border-gray-200 text-center font-bold text-gray-500">
                  B
                </div>
                <div className="p-2 border-r border-gray-200 text-center font-bold text-gray-500">
                  C
                </div>
                <div className="p-2 text-center font-bold text-gray-500">D</div>
              </div>
              {[1, 2, 3, 4, 5].map((row) =>
              <div
                key={row}
                className="grid grid-cols-4 border-b border-gray-100">

                  <div className="p-2 border-r border-gray-100 truncate">
                    {row === 1 ? 'DATE' : row === 3 ? 'ERROR' : '2023-10-01'}
                  </div>
                  <div className="p-2 border-r border-gray-100 truncate">
                    {row === 1 ? 'ITEM' : row === 3 ? '#REF!' : 'Product X'}
                  </div>
                  <div className="p-2 border-r border-gray-100 truncate bg-red-50 text-red-600">
                    {row === 1 ? 'COST' : row === 3 ? '#VALUE!' : '₦5,000'}
                  </div>
                  <div className="p-2 truncate">
                    {row === 1 ? 'TOTAL' : '...'}
                  </div>
                </div>
              )}
              <div className="bg-gray-100 p-1 flex gap-1 border-t border-gray-300">
                <div className="bg-white px-3 py-0.5 rounded-t border border-gray-300 border-b-0 text-gray-800">
                  Sheet1
                </div>
                <div className="px-3 py-0.5 text-gray-500">Sheet2</div>
                <div className="px-3 py-0.5 text-gray-500">final_v3</div>
              </div>
            </div>

            <ul className="space-y-4">
              {[
              'Formula errors at 2am',
              'Version confusion (final_FINAL_v3.xlsx)',
              'Shared via WhatsApp (Security risk)',
              'Crashes when you need it most'].
              map((item, i) =>
              <li
                key={i}
                className="flex items-start gap-3 text-red-900 font-medium">

                  <X className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  {item}
                </li>
              )}
            </ul>
          </motion.div>

          {/* The Oga Way - Clean Dashboard */}
          <motion.div
            initial={{
              opacity: 0,
              x: 50
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              duration: 0.6,
              delay: 0.2
            }}
            className="bg-green-50 rounded-3xl p-8 border-2 border-green-100 shadow-xl relative overflow-hidden transform md:scale-105 z-10">

            <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-xl font-bold text-sm">
              THE OGA WAY
            </div>

            <div className="mb-8 mt-4">
              <h3 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
                <LayoutDashboard className="text-primary" /> Clean Dashboard
              </h3>
              <p className="text-green-800">
                Automated, secure, and beautiful.
              </p>
            </div>

            {/* Oga Mockup */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-md overflow-hidden mb-8 p-4">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-600 font-bold uppercase">
                    Revenue
                  </div>
                  <div className="text-lg font-bold text-gray-900">₦2.4M</div>
                </div>
                <div className="flex-1 bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600 font-bold uppercase">
                    Profit
                  </div>
                  <div className="text-lg font-bold text-gray-900">₦850k</div>
                </div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) =>
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                        ⚡
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Transaction #{1000 + i}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      +₦25,000
                    </span>
                  </div>
                )}
              </div>
            </div>

            <ul className="space-y-4">
              {[
              'Real-time data, always accurate',
              'Access anywhere, any device',
              'Automatic backups & Bank-grade security',
              'Your team, always in sync'].
              map((item, i) =>
              <li
                key={i}
                className="flex items-start gap-3 text-green-900 font-medium">

                  <div className="bg-primary rounded-full p-0.5 mt-0.5">
                    <Check className="text-white" size={14} />
                  </div>
                  {item}
                </li>
              )}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>);

}