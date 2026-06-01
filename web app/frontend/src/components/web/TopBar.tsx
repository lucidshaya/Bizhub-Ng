import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Sun, Moon, RefreshCw, LifeBuoy, LogOut, Settings, ArrowUpRight, ArrowDownLeft, Info, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { transactionsApi } from '../../services/api';
import { socketService } from '../../services/socket';

interface TopBarProps {
  title: string;
  onGoToLanding: () => void;
  onNavigate?: (screen: string) => void;
  onReport?: () => void;
}

export function TopBar({ title, onNavigate, onReport }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [chatNotifs, setChatNotifs] = useState<any[]>([]);

  useEffect(() => {
    const socket = socketService.connect();
    if (!socket) return;
    
    const handleNewMessage = (data: any) => {
        if (data.message && data.message.senderId !== user?.id) {
            setChatNotifs(prev => {
                const notif = {
                    id: data.message.id,
                    text: `New msg from ${data.message.senderName}`,
                    amount: null,
                    type: 'chat',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                return [notif, ...prev].slice(0, 5);
            });
        }
    };
    
    socket.on('new_message', handleNewMessage);
    return () => {
        socket.off('new_message', handleNewMessage);
    };
  }, [user?.id]);

  // Real notifications from recent transactions
  const { data: txnData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => transactionsApi.getAll({ limit: 5, page: 1 }),
    staleTime: 1000 * 60 * 2,
  });

  const recentTxns = txnData?.data?.transactions || txnData?.data || [];
  const notifications = Array.isArray(recentTxns)
    ? recentTxns.slice(0, 5).map((tx: any) => ({
        id: tx.id,
        text: tx.description || (tx.type === 'CREDIT' ? 'Credit received' : 'Debit made'),
        amount: tx.amount,
        type: tx.type === 'CREDIT' ? 'success' : 'warning',
        time: tx.createdAt
          ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
      }))
    : [];
    
  const allNotifications = [...chatNotifs, ...notifications].slice(0, 5);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
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
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowDropdown(false); }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Bell size={18} />
            {allNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full badge-pulse" />
            )}
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
                <div className="px-4 py-3 border-b border-[var(--border-main)] flex items-center justify-between">
                  <p className="text-[var(--text-main)] font-semibold text-sm">Recent Activity</p>
                  <span className="text-[10px] text-[var(--text-dim)]">Latest transactions</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Info size={28} className="text-[var(--text-dim)] mx-auto mb-2" />
                    <p className="text-[var(--text-dim)] text-xs">No recent activity</p>
                  </div>
                ) : (
                  allNotifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer border-b border-[var(--border-main)]/50 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'success' ? 'bg-[#00D084]/15 text-[#00D084]' : n.type === 'chat' ? 'bg-[#3B82F6]/15 text-[#3B82F6]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'}`}>
                          {n.type === 'success' ? <ArrowDownLeft size={13} /> : n.type === 'chat' ? <MessageSquare size={13} /> : <ArrowUpRight size={13} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--text-main)] text-xs truncate">{n.text}</p>
                          <p className="text-[var(--text-dim)] text-[10px] mt-0.5">{n.time}</p>
                        </div>
                        {n.amount && (
                          <p className={`text-xs font-bold flex-shrink-0 ${n.type === 'success' ? 'text-[#00D084]' : 'text-[#F59E0B]'}`}>
                            {n.type === 'success' ? '+' : '-'}₦{Number(n.amount).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-[var(--border-main)] mx-1" />

        {/* Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => { setShowDropdown(!showDropdown); setShowNotifs(false); }}
            className="flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D084] to-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-black/20">
              {user?.fullName?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-[var(--text-main)] text-[10px] font-bold leading-none">{user?.fullName || 'Admin User'}</p>
              <p className="text-[var(--text-dim)] text-[8px] mt-1 uppercase tracking-wider">{user?.role || 'Owner'}</p>
            </div>
            <ChevronDown size={14} className={`text-[var(--text-dim)] group-hover:text-[var(--text-main)] transition-colors ${showDropdown ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-60 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-[var(--border-main)] bg-[var(--bg-tertiary)]/50">
                  <p className="text-[var(--text-main)] font-semibold text-sm truncate">{user?.fullName || 'Admin User'}</p>
                  <p className="text-[var(--text-dim)] text-xs truncate">{user?.email || 'admin@bizhub.ng'}</p>
                </div>

                {/* Links */}
                <div className="py-2">
                  <button
                    onClick={() => { setShowDropdown(false); onNavigate?.('settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left group"
                  >
                    <Settings size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
                    <span className="text-xs text-[var(--text-main)] font-medium">Account Settings</span>
                  </button>
                  <button
                    onClick={() => { setShowDropdown(false); onReport?.(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-tertiary)] transition-colors text-left group"
                  >
                    <LifeBuoy size={14} className="text-[var(--text-muted)] group-hover:text-[#F59E0B]" />
                    <span className="text-xs text-[var(--text-main)] font-medium">Help & Support</span>
                  </button>
                </div>

                {/* Log Out */}
                <div className="border-t border-[var(--border-main)] p-2">
                  <button
                    onClick={() => { setShowDropdown(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#EF4444]/10 rounded-xl transition-colors text-left group"
                  >
                    <LogOut size={14} className="text-[var(--text-muted)] group-hover:text-[#EF4444]" />
                    <span className="text-xs text-[var(--text-main)] font-medium group-hover:text-[#EF4444]">Log out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}