import React from 'react';
import { Smartphone, Download } from 'lucide-react';
export function MobileApp() {
  return (
    <section className="py-24 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
          {/* Background Circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="text-white">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                Business on the go. <br />
                <span className="text-gold">Literally.</span>
              </h2>
              <p className="text-lg text-green-100 mb-8 max-w-md">
                Download the Oga Dashboard mobile app. Send invoices, check
                inventory, and approve payments from Lagos traffic or your
                village.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-900 transition-colors border border-gray-800">
                  <div className="text-3xl"></div>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Download on the</div>
                    <div className="text-sm font-bold">App Store</div>
                  </div>
                </button>
                <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-900 transition-colors border border-gray-800">
                  <div className="text-3xl">▶</div>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">GET IT ON</div>
                    <div className="text-sm font-bold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-64 h-[500px] bg-gray-900 rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20"></div>

                {/* App Screen Mockup */}
                <div className="w-full h-full bg-cream pt-12 px-4 pb-4 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-xs text-gray-500">Good Morning,</p>
                      <h4 className="font-bold text-gray-900">Oluwaseun</h4>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                      OA
                    </div>
                  </div>

                  <div className="bg-primary text-white p-4 rounded-xl mb-6 shadow-lg">
                    <p className="text-xs text-green-200 mb-1">Total Balance</p>
                    <h3 className="text-2xl font-bold">₦2,450,000</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                      <div className="w-8 h-8 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                        <Download size={16} />
                      </div>
                      <p className="text-xs font-bold">In</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                      <div className="w-8 h-8 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                        <Download size={16} className="rotate-180" />
                      </div>
                      <p className="text-xs font-bold">Out</p>
                    </div>
                  </div>

                  <div className="flex-1 bg-white rounded-t-2xl p-4 shadow-inner">
                    <p className="text-xs font-bold text-gray-500 mb-3 uppercase">
                      Recent Activity
                    </p>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) =>
                      <div
                        key={i}
                        className="flex justify-between items-center">

                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                            <div className="w-20 h-2 bg-gray-100 rounded"></div>
                          </div>
                          <div className="w-12 h-2 bg-gray-100 rounded"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element */}
              <div className="absolute bottom-20 -left-10 bg-white p-4 rounded-xl shadow-xl animate-bounce hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">New Order</p>
                    <p className="text-sm font-bold">₦12,500</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}