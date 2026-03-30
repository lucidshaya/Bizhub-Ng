import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Camera,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Building2,
  AlertOctagon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { WebScreen } from '../../pages/WebApp';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

interface SidebarProps {
  activeScreen: WebScreen;
  setActiveScreen: (screen: WebScreen) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onGoToLanding: () => void;
  onReport: () => void;
}

const navItems: {
  id: WebScreen;
  label: string;
  icon: React.ElementType;
  badge?: string;
}[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'staff',
      label: 'Staff & Payroll',
      icon: Users
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
      badge: 'PIN'
    },
    {
      id: 'cctv',
      label: 'CCTV Live',
      icon: Camera,
      badge: 'LIVE'
    },
    {
      id: 'comms',
      label: 'Communications',
      icon: MessageSquare
    },
    {
      id: 'organization',
      label: 'Organization Settings',
      icon: Building2
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }];

export function Sidebar({
  activeScreen,
  setActiveScreen,
  collapsed,
  setCollapsed,
  onGoToLanding,
  onReport,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const toast = useToast();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (user?.role === 'WORKER') {
      if (item.id === 'transactions') return false;
      if (item.id === 'organization') return false;
      if (item.id === 'staff') return false;

      if (user?.businessType === 'Corporate/Workplace') {
        if (item.id !== 'comms' && item.id !== 'settings') return false;
      } else {
        if (item.id !== 'dashboard' && item.id !== 'cctv' && item.id !== 'comms' && item.id !== 'settings') return false;
      }
    }
    return true;
  });

  return (
    <motion.aside
      animate={{
        width: collapsed ? 72 : 256
      }}
      transition={{
        duration: 0.25,
        ease: 'easeInOut'
      }}
      className="relative flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-main)] h-full flex-shrink-0 z-20 transition-colors duration-200">

      {/* Logo */}
      <div className="relative flex items-center justify-between px-4 h-16 border-b border-[var(--border-main)] flex-shrink-0">
        {!collapsed &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2">

            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <span className="text-[var(--bg-primary)] font-black text-sm">B</span>
            </div>
            <span className="text-[var(--text-main)] font-bold text-lg tracking-tight">
              Biz<span className="text-[var(--accent)]">Hub NG</span>
            </span>
          </motion.div>
        }
        {collapsed &&
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center mx-auto">
            <span className="text-[var(--bg-primary)] font-black text-sm">B</span>
          </div>
        }
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--bg-tertiary)] border border-[var(--border-muted)] rounded-full flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors z-10 shadow-sm">

          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto app-scroll">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          const finalBadge = item.badge;

          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isActive ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-l-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-main)]'}`}>

              <Icon size={18} className="flex-shrink-0" />
              {!collapsed &&
                <span className="text-sm font-medium flex-1 text-left">
                  {item.label}
                </span>
              }
              {!collapsed && finalBadge &&
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${finalBadge === 'LIVE' ? 'bg-[#00D084]/20 text-[#00D084]' : 'bg-[var(--bg-primary)] text-[var(--text-dim)] border border-[var(--border-main)]'}`}>

                  {finalBadge === 'PIN' ? <Lock size={10} /> : finalBadge}
                </span>
              }
              {collapsed && finalBadge === 'LIVE' &&
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00D084] live-dot" />
              }
            </button>);
        })}
      </nav>

      {/* Report Button */}
      <div className="px-2 mb-2">
        <button
          onClick={onReport}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/10`}
        >
          <AlertOctagon size={18} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium flex-1 text-left">
              Report Issue
            </span>
          )}
        </button>
      </div>

      {/* Bottom: User */}
      <div className="border-t border-[var(--border-main)] p-3 space-y-2 bg-[var(--bg-tertiary)]/30">
        <div
          className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D084] to-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm">
            {user?.fullName?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          {!collapsed &&
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-main)] text-[10px] font-semibold truncate capitalize leading-tight">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[var(--text-dim)] text-[9px] truncate capitalize mt-0.5">{user?.role === 'OWNER' ? 'Admin' : user?.role?.toLowerCase() || 'Admin'}</p>
            </div>
          }
          {!collapsed &&
            <button onClick={logout} className="text-[var(--text-dim)] hover:text-[#EF4444] transition-colors p-1">
              <LogOut size={14} />
            </button>
          }
        </div>
      </div>
    </motion.aside>);
}