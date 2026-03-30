import React, { useState, useEffect } from 'react';
import {
  Bell,
  TrendingUp,
  Users,
  Camera,
  MessageSquare,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MobileTab } from '../../pages/MobilePreview';
import { dashboardApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface MobileDashboardProps {
  onNavigate: (tab: MobileTab) => void;
}

const formatNaira = (v: number) => `₦${v.toLocaleString('en-NG')}`;

export function MobileDashboard({ onNavigate }: MobileDashboardProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardApi.getSummary();
      setSummary(res.data);
    } catch (err: any) {
      setSummary({
        walletBalance: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        staffCount: 0,
        activeStaff: 0,
        camerasOnline: 0,
        totalCameras: 0,
        unreadMessages: 0,
        recentTransactions: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 size={32} className="text-[#00D084] animate-spin" />
      </div>
    );
  }

  const recentTx = summary?.recentTransactions || [];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <p className="text-[#94A3B8] text-xs">Good morning 👋</p>
          <p className="text-[#F1F5F9] font-bold text-base">{user?.fullName?.split(' ')[0] || 'Boss'}</p>
        </div>
        <div className="relative">
          <button className="w-9 h-9 bg-[#161B27] rounded-xl flex items-center justify-center border border-[#1E2535]">
            <Bell size={16} className="text-[#94A3B8]" />
          </button>
          <div className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full badge-pulse" />
        </div>
      </div>

      {/* Balance Card */}
      <div
        className="mx-4 mb-4 rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #006B3C 0%, #00D084 100%)'
        }}>

        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-black/10 translate-y-8 -translate-x-8" />
        <p className="text-green-100 text-xs font-medium mb-1 relative z-10">
          Wallet Balance
        </p>
        <p className="text-white text-3xl font-bold mb-4 relative z-10">
          {formatNaira(summary?.walletBalance || 0)}
        </p>
        <div className="flex gap-3 relative z-10">
          <button className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
            Fund Account
          </button>
          <button className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 rounded-xl transition-colors">
            Withdraw
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mx-4 mb-4">
        {[
          {
            label: 'Staff',
            value: `${summary?.activeStaff || 0}/${summary?.staffCount || 0}`,
            color: '#3B82F6',
            icon: Users
          },
          {
            label: 'Expenses',
            value: formatNaira(summary?.totalExpenses || 0),
            color: '#EF4444',
            icon: TrendingUp
          },
          {
            label: 'Cameras',
            value: `${summary?.camerasOnline || 0} Live`,
            color: '#00D084',
            icon: Camera
          },
          {
            label: 'Messages',
            value: `${summary?.unreadMessages || 0} New`,
            color: '#8B5CF6',
            icon: MessageSquare
          }
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-[#161B27] border border-[#1E2535] rounded-xl p-3 flex items-center gap-3">

              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: s.color + '20'
                }}>

                <Icon
                  size={14}
                  style={{
                    color: s.color
                  }} />

              </div>
              <div>
                <p className="text-[#F1F5F9] font-bold text-sm truncate">{s.value}</p>
                <p className="text-[#475569] text-xs">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shortcuts */}
      <div className="px-4 mb-4">
        <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-3">
          Quick Actions
        </p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[
            {
              label: 'Pay Workers',
              color: '#00D084',
              icon: Users,
              tab: 'staff' as MobileTab
            },
            {
              label: 'CCTV',
              color: '#3B82F6',
              icon: Camera,
              tab: 'cctv' as MobileTab
            },
            {
              label: 'Chat',
              color: '#8B5CF6',
              icon: MessageSquare,
              tab: 'more' as MobileTab
            },
            {
              label: 'Reports',
              color: '#F59E0B',
              icon: FileText,
              tab: 'more' as MobileTab
            }
          ].map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                onClick={() => onNavigate(s.tab)}
                className="flex flex-col items-center gap-2 flex-shrink-0">

                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: s.color + '20',
                    border: `1px solid ${s.color}30`
                  }}>

                  <Icon
                    size={20}
                    style={{
                      color: s.color
                    }} />

                </div>
                <span className="text-[#94A3B8] text-xs whitespace-nowrap">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">
            Recent Transactions
          </p>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-[#00D084] text-xs">
            View All
          </button>
        </div>

        {recentTx.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#2A3548] rounded-xl bg-[#0F1117]">
            <p className="text-[#94A3B8] text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.slice(0, 4).map((tx: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-[#161B27] border border-[#1E2535] rounded-xl p-3">

                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'CREDIT' ? 'bg-[#00D084]/10' : 'bg-[#EF4444]/10'}`}>
                  {tx.type === 'CREDIT' ?
                    <ArrowDownRight size={14} className="text-[#00D084]" /> :
                    <ArrowUpRight size={14} className="text-[#EF4444]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F1F5F9] text-xs font-medium truncate">
                    {tx.description}
                  </p>
                  <p className="text-[#475569] text-xs">
                    {new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold ${tx.type === 'CREDIT' ? 'text-[#00D084]' : 'text-[#EF4444]'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatNaira(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}