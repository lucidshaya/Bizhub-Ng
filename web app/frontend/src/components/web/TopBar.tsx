import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBarProps {
  title: string;
  onGoToLanding: () => void;
}

export function TopBar({ title, onGoToLanding }: TopBarProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const notifications = [
    { id: 1, text: 'Payroll approved: ₦1,840,000', time: '2m ago', type: 'success' },
    { id: 2, text: 'Camera 3 went offline', time: '15m ago', type: 'warning' },
    { id: 3, text: 'New staff request: Amaka Eze', time: '1h ago', type: 'info' },
  ];

  return (
    <header className="h-16 bg-[#161B27] border-b border-[#1E2535] flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-[#F1F5F9] font-semibold text-lg min-w-0 flex-shrink-0">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl pl-9 pr-4 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084]/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 bg-[#1E2535] hover:bg-[#252f45] rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full badge-pulse" />
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 bg-[#161B27] border border-[#1E2535] rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#1E2535]">
                  <p className="text-[#F1F5F9] font-semibold text-sm">Notifications</p>
                </div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-3 hover:bg-[#1E2535] transition-colors cursor-pointer border-b border-[#1E2535]/50"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'success' ? 'bg-[#00D084]' : n.type === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'}`}
                      />
                      <div>
                        <p className="text-[#F1F5F9] text-xs">{n.text}</p>
                        <p className="text-[#475569] text-xs mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D084] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold">
            EO
          </div>
          <ChevronDown size={14} className="text-[#475569]" />
        </div>
      </div>
    </header>
  );
}