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
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { WebScreen } from '../../pages/WebApp';
import { useAuth } from '../../context/AuthContext';
interface SidebarProps {
  activeScreen: WebScreen;
  setActiveScreen: (screen: WebScreen) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onGoToLanding: () => void;
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
}: SidebarProps) {
  const { user, logout } = useAuth();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (user?.role === 'WORKER') {
      // Workers never see transactions, staff, or organization settings
      if (item.id === 'transactions') return false;
      if (item.id === 'organization') return false;
      if (item.id === 'staff') return false;

      // Handle business type restrictions
      if (user?.businessType === 'Corporate/Workplace') {
        // Only see Communications and Settings
        if (item.id !== 'comms' && item.id !== 'settings') return false;
      } else {
        // Retail/Storefront - see Dashboard, CCTV, Comms, Settings
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
      className="relative flex flex-col bg-[#161B27] border-r border-[#1E2535] h-full flex-shrink-0 z-20">

      {/* Logo */}
      <div className="relative flex items-center justify-between px-4 h-16 border-b border-[#1E2535] flex-shrink-0">
        {!collapsed &&
          <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            className="flex items-center gap-2">

            <div className="w-8 h-8 rounded-lg bg-[#00D084] flex items-center justify-center">
              <span className="text-[#0F1117] font-black text-sm">B</span>
            </div>
            <span className="text-[#F1F5F9] font-bold text-lg tracking-tight">
              Biz<span className="text-[#00D084]">Hub NG</span>
            </span>
          </motion.div>
        }
        {collapsed &&
          <div className="w-8 h-8 rounded-lg bg-[#00D084] flex items-center justify-center mx-auto">
            <span className="text-[#0F1117] font-black text-sm">B</span>
          </div>
        }
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#1E2535] border border-[#2A3548] rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#00D084] transition-colors z-10">

          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto app-scroll">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isActive ? 'bg-[#00D084]/10 text-[#00D084] border-l-2 border-[#00D084]' : 'text-[#94A3B8] hover:bg-[#1E2535] hover:text-[#F1F5F9]'}`}>

              <Icon size={18} className="flex-shrink-0" />
              {!collapsed &&
                <span className="text-sm font-medium flex-1 text-left">
                  {item.label}
                </span>
              }
              {!collapsed && item.badge &&
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${item.badge === 'LIVE' ? 'bg-[#00D084]/20 text-[#00D084]' : 'bg-[#475569]/30 text-[#94A3B8]'}`}>

                  {item.badge === 'PIN' ? <Lock size={10} /> : item.badge}
                </span>
              }
              {collapsed && item.badge === 'LIVE' &&
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00D084] live-dot" />
              }
            </button>);

        })}
      </nav>

      {/* Bottom: User */}
      <div className="border-t border-[#1E2535] p-3 space-y-2">
        <div
          className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D084] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.fullName?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          {!collapsed &&
            <div className="flex-1 min-w-0">
              <p className="text-[#F1F5F9] text-xs font-semibold truncate capitalize">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[#94A3B8] text-xs truncate capitalize">{user?.role === 'OWNER' ? 'Admin' : user?.role?.toLowerCase() || 'Admin'}</p>
            </div>
          }
          {!collapsed &&
            <button onClick={logout} className="text-[#475569] hover:text-[#EF4444] transition-colors">
              <LogOut size={14} />
            </button>
          }
        </div>
      </div>
    </motion.aside>);

}