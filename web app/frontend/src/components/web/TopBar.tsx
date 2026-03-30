import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Sun, Moon, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  title: string;
  onGoToLanding: () => void;
}

export function TopBar({ title }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNotifs, setShowNotifs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const notifications = [
    { id: 1, text: 'Payroll approved: ₦1,840,000', time: '2m ago', type: 'success' },
    { id: 2, text: 'Camera 3 went offline', time: '15m ago', type: 'warning' },
    { id: 3, text: 'New staff request: Amaka Eze', time: '1h ago', type: 'info' },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    // Small delay to show the animation
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-main)] flex items-center px-6 gap-4 flex-shrink-0 transition-colors duration-200">
      <h1 className="text-[var(--text-main)] font-semibold text-lg min-w-0 flex-shrink-0">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-xl pl-9 pr-4 py-2 text-sm text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Refresh Icon */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-tertiary)] transition-all active:scale-95 disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-tertiary)] transition-all active:scale-95"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full badge-pulse" />
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[var(--border-main)]">
                  <p className="text-[var(--text-main)] font-semibold text-sm">Notifications</p>
                </div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer border-b border-[var(--border-main)]/50 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'success' ? 'bg-[#00D084]' : n.type === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'}`}
                      />
                      <div>
                        <p className="text-[var(--text-main)] text-xs">{n.text}</p>
                        <p className="text-[var(--text-dim)] text-[10px] mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-[var(--border-main)] mx-1" />

        {/* Avatar */}
        <div className="flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D084] to-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-black/20">
            {user?.fullName?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-[var(--text-main)] text-[10px] font-bold leading-none">{user?.fullName || 'Admin User'}</p>
            <p className="text-[var(--text-dim)] text-[8px] mt-1 uppercase tracking-wider">{user?.role || 'Owner'}</p>
          </div>
          <ChevronDown size={14} className="text-[var(--text-dim)] group-hover:text-[var(--text-main)] transition-colors" />
        </div>
      </div>
    </header>
  );
}