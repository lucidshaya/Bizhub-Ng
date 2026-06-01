import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Camera,
  MessageSquare,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  AlertTriangle,
  Loader2,
  RefreshCw,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socketService } from '../../services/socket';
import type { WebScreen } from '../../pages/WebApp';
import { dashboardApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const formatNaira = (v: number) => `₦${v?.toLocaleString('en-NG') || '0'}`;

interface DashboardScreenProps {
  onNavigate: (screen: WebScreen) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { user } = useAuth();

  const { data: summary, isLoading: sumLoading, error: sumError, refetch: refetchSum } = useQuery({
    queryKey: ['dashboard_summary'],
    queryFn: () => dashboardApi.getSummary().then(res => res.data),
    staleTime: 1000 * 60, // 1 minute
  });

  const { data: activity, isLoading: actLoading, error: actError } = useQuery({
    queryKey: ['dashboard_activity'],
    queryFn: () => dashboardApi.getActivity().then(res => res.data),
    staleTime: 1000 * 60, // 1 minute
  });

  const queryClient = useQueryClient();
  const [revenueMonth, setRevenueMonth] = useState<string>('All Time');
  const [showExpensesHistory, setShowExpensesHistory] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();
    socket?.on('transaction:new', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_activity'] });
    });
    return () => {
      socket?.off('transaction:new');
    };
  }, [queryClient]);

  const isLoading = sumLoading || actLoading;
  const error = sumError || actError;

  if (isLoading && !summary) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 size={40} className="text-[var(--accent)] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
          </div>
        </div>
        <p className="text-[var(--text-dim)] text-sm animate-pulse">Synchronizing your dashboard...</p>
      </div>
    );
  }

  const monthlyRevenueKeys = Object.keys(summary?.monthlyRevenue || {});
  const displayRevenue = revenueMonth === 'All Time' ? (summary?.totalRevenue || 0) : (summary?.monthlyRevenue?.[revenueMonth] || 0);

  const stats = [
    {
      label: 'Wallet Balance',
      value: formatNaira(summary?.walletBalance || 0),
      change: 'Available',
      up: true,
      icon: Zap,
      color: '#00D084',
    },
    {
      label: 'Revenue',
      value: formatNaira(displayRevenue),
      change: '+8.2%',
      up: true,
      icon: TrendingUp,
      color: '#3B82F6',
      isRevenue: true,
    },
    {
      label: 'Expenses',
      value: formatNaira(summary?.totalExpenses || 0),
      change: '-3.1%',
      up: false,
      icon: TrendingDown,
      color: '#EF4444',
      isExpenses: true,
    },
    {
      label: 'Active Staff',
      value: `${summary?.activeStaff || 0}/${summary?.staffCount || 0}`,
      change: 'All Active',
      up: true,
      icon: Users,
      color: '#8B5CF6',
    },
  ];

  const quickActions = [
    { label: 'Staff Management', icon: Users, color: '#3B82F6', screen: 'staff' as WebScreen },
    { label: 'Financial Records', icon: CreditCard, color: '#00D084', screen: 'transactions' as WebScreen },
    { label: 'Surveillance', icon: Camera, color: '#F59E0B', screen: 'cctv' as WebScreen },
    { label: 'Business Chat', icon: MessageSquare, color: '#8B5CF6', screen: 'comms' as WebScreen },
  ];

  const recentTxns = summary?.recentTransactions || [];
  const teamMembers = summary?.staffList || [];
  const recentMsgs = summary?.recentMessages || [];
  const activityLog = activity || [];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border border-[var(--border-main)] rounded-2xl p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button 
              onClick={() => { refetchSum(); queryClient.invalidateQueries({ queryKey: ['dashboard_activity'] }); }} 
              className="flex items-center gap-2 bg-[var(--bg-primary)]/50 backdrop-blur border border-[var(--border-main)] hover:border-[var(--accent)] text-[var(--text-dim)] hover:text-[var(--accent)] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
              disabled={isLoading}
            >
                <RefreshCw size={14} className={isLoading ? "animate-spin text-[var(--accent)]" : ""} /> Refresh Data
            </button>
        </div>
        <div className="relative z-10">
          <h1 className="text-[var(--text-main)] text-2xl font-bold mb-1 flex items-center gap-2">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Boss'} 👋
          </h1>
          <p className="text-[var(--text-dim)] text-sm">
            {user?.businessName ? `${user.businessName} — ` : ''}Your business is performing well today.
          </p>

          {/* Virtual Account Info */}
          {(summary?.virtualAccountNumber) && (
            <div className="mt-6 flex items-center gap-4 bg-[var(--bg-primary)]/50 backdrop-blur-md border border-[var(--border-main)] rounded-xl px-5 py-3 w-max group hover:border-[var(--accent)]/50 transition-all cursor-default">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-[var(--text-dim)] text-[10px] uppercase font-bold tracking-widest">Wallet Funding Details</p>
                <p className="text-[var(--text-main)] text-sm font-bold tracking-wide mt-0.5">
                  {summary.virtualAccountNumber} <span className="text-[var(--text-dim)] font-normal mx-1">•</span> {summary.virtualAccountBank || 'OPay Bank'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Connection issue: Data might be outdated.</span>
          </div>
          <button onClick={() => refetchSum()} className="flex items-center gap-1 hover:underline">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-5 hover:border-[var(--accent)]/30 transition-all shadow-sm hover:shadow-lg group"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon size={22} style={{ color: stat.color }} />
                </div>
                <div
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.up
                    ? 'bg-[#00D084]/10 text-[#00D084]'
                    : 'bg-[#EF4444]/10 text-[#EF4444]'
                    }`}
                >
                  {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {stat.change}
                </div>
              </div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[var(--text-dim)] text-xs font-medium">{stat.label}</p>
                {stat.isRevenue && monthlyRevenueKeys.length > 0 && (
                  <select 
                    value={revenueMonth} 
                    onChange={(e) => setRevenueMonth(e.target.value)}
                    className="bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-md text-[10px] text-[var(--text-main)] font-semibold px-2 py-0.5 outline-none cursor-pointer transition-colors"
                  >
                    <option value="All Time">All Time</option>
                    {monthlyRevenueKeys.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                )}
                {stat.isExpenses && (
                  <button 
                    onClick={() => setShowExpensesHistory(!showExpensesHistory)} 
                    className={`p-1 rounded-md transition-colors ${showExpensesHistory ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[var(--bg-tertiary)] text-[var(--text-dim)] hover:text-[#EF4444] border border-transparent'}`}
                    title="View historical expenses"
                  >
                    <History size={12} />
                  </button>
                )}
              </div>
              <p className="text-[var(--text-main)] text-2xl font-black tracking-tight">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showExpensesHistory && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-5 shadow-inner">
              <h4 className="text-[var(--text-main)] text-xs font-bold mb-3 flex items-center gap-2"><History size={14} className="text-[#EF4444]" /> Historical Expenses (Since Account Creation)</h4>
              <div className="flex gap-3 overflow-x-auto app-scroll pb-2">
                {Object.keys(summary?.monthlyExpenses || {}).length === 0 ? (
                  <p className="text-[var(--text-dim)] text-xs">No historical expenses recorded yet.</p>
                ) : (
                  Object.keys(summary.monthlyExpenses).sort().map(month => (
                    <div key={month} className="bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-xl px-4 py-3 min-w-[140px] flex-shrink-0">
                      <p className="text-[var(--text-dim)] text-[10px] uppercase font-bold mb-1">{month}</p>
                      <p className="text-[#EF4444] text-sm font-black">{formatNaira(summary.monthlyExpenses[month])}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onNavigate(action.screen)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-4 hover:border-[var(--accent)] transition-all group shadow-sm hover:shadow-md active:scale-95"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform shadow-inner"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Icon size={18} style={{ color: action.color }} />
              </div>
              <p className="text-[var(--text-main)] text-xs font-bold text-left">{action.label}</p>
              <p className="text-[var(--text-dim)] text-[10px] text-left mt-0.5 group-hover:text-[var(--accent)] transition-colors">Access shortcut →</p>
            </button>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[var(--text-main)] text-base font-bold">
                Recent Transactions
              </h3>
              <p className="text-[var(--text-dim)] text-[10px]">Latest financial movements</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="px-3 py-1.5 bg-[var(--bg-tertiary)] text-[var(--text-main)] text-[10px] font-bold rounded-lg hover:bg-[var(--accent)] hover:text-[var(--bg-primary)] transition-all"
            >
              View Full History
            </button>
          </div>

          {recentTxns.length === 0 ? (
            <div className="text-center py-12 bg-[var(--bg-primary)]/30 rounded-2xl border border-dashed border-[var(--border-main)]">
              <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard size={20} className="text-[var(--text-dim)]" />
              </div>
              <p className="text-[var(--text-main)] text-sm font-medium">No transactions found</p>
              <p className="text-[var(--text-dim)] text-xs mt-1 max-w-[200px] mx-auto">
                Transactions will appear here once you start taking payments or funding.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTxns.slice(0, 5).map((txn: any) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-1 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${txn.type === 'CREDIT'
                        ? 'bg-[#00D084]/10'
                        : 'bg-[#EF4444]/10'
                        }`}
                    >
                      {txn.type === 'CREDIT' ? (
                        <ArrowDownRight size={16} className="text-[#00D084]" />
                      ) : (
                        <ArrowUpRight size={16} className="text-[#EF4444]" />
                      )}
                    </div>
                    <div>
                      <p className="text-[var(--text-main)] text-sm font-bold group-hover:text-[var(--accent)] transition-colors">
                        {txn.description}
                      </p>
                      <p className="text-[var(--text-dim)] text-[10px] font-medium tracking-wide">
                        {new Date(txn.date).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${txn.type === 'CREDIT' ? 'text-[#00D084]' : 'text-[#EF4444]'}`}>
                      {txn.type === 'CREDIT' ? '+' : '-'}
                      {formatNaira(txn.amount)}
                    </p>
                    <p className="text-[var(--text-dim)] text-[8px] uppercase font-black opacity-50">COMPLETED</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity & Chat Feed */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[var(--text-main)] text-base font-bold">
                Communication & Activity
              </h3>
              <p className="text-[var(--text-dim)] text-[10px]">Real-time business updates</p>
            </div>
            <button
              onClick={() => onNavigate('comms')}
              className="px-3 py-1.5 bg-[var(--bg-tertiary)] text-[var(--text-main)] text-[10px] font-bold rounded-lg hover:bg-[var(--accent)] hover:text-[var(--bg-primary)] transition-all"
            >
              Open Messaging
            </button>
          </div>

          {(activityLog.length === 0 && recentMsgs.length === 0) ? (
            <div className="text-center py-12 bg-[var(--bg-primary)]/30 rounded-2xl border border-dashed border-[var(--border-main)]">
              <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={20} className="text-[var(--text-dim)]" />
              </div>
              <p className="text-[var(--text-main)] text-sm font-medium">Clear for now</p>
              <p className="text-[var(--text-dim)] text-xs mt-1">Activities and team messages will show up here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {recentMsgs.map((msg: any) => (
                <div key={msg.id} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    {msg.sender?.substring(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className="flex-1 bg-[var(--bg-primary)]/40 rounded-2xl rounded-tl-none px-4 py-3 border border-[var(--border-main)] group-hover:border-[var(--accent)]/30 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[var(--text-main)] text-xs font-black">{msg.sender}</p>
                      <p className="text-[var(--text-dim)] text-[9px] font-medium">
                        {new Date(msg.time).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-[var(--text-muted)] text-xs line-clamp-2 leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {activityLog.slice(0, 3).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3 border-t border-[var(--border-main)]/50 mt-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-[var(--accent)] shadow-inner">
                    <Zap size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--text-main)] text-xs font-bold">{item.text}</p>
                    <p className="text-[var(--text-dim)] text-[10px] font-medium mt-1">
                      {new Date(item.time).toLocaleString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[var(--text-main)] text-base font-bold">Workspace Personnel</h3>
            <p className="text-[var(--text-dim)] text-[10px]">Your active team members</p>
          </div>
          <button
            onClick={() => onNavigate('staff')}
            className="text-[var(--accent)] text-xs font-bold hover:underline"
          >
            Manage All Staff →
          </button>
        </div>

        {teamMembers.length === 0 ? (
          <div className="text-center py-10 bg-[var(--bg-primary)]/30 rounded-2xl border border-dashed border-[var(--border-main)]">
            <Users size={28} className="text-[var(--text-dim)] mx-auto mb-3" />
            <p className="text-[var(--text-main)] text-sm font-medium">The team is quiet for now</p>
            <p className="text-[var(--text-dim)] text-xs mt-1">No staff members have been added to your business.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMembers.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 bg-[var(--bg-primary)]/50 border border-[var(--border-main)] rounded-2xl px-4 py-3 group hover:border-[var(--accent)] transition-all cursor-default">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center text-white text-xs font-black shadow-md shadow-black/20 group-hover:scale-110 transition-transform">
                  {member.fullName?.substring(0, 2).toUpperCase() || '??'}
                </div>
                <div>
                  <p className="text-[var(--text-main)] text-xs font-black truncate max-w-[120px]">{member.fullName}</p>
                  <p className="text-[var(--text-dim)] text-[9px] font-medium uppercase tracking-tighter mt-0.5">{member.role || 'Personnel'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Status Bar */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-6 shadow-xl">
        <h3 className="text-[var(--text-main)] text-base font-bold mb-5 flex items-center gap-2">
          Infrastructure Status <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-[var(--bg-primary)]/40 p-3 rounded-xl border border-[var(--border-main)]">
            <p className="text-[var(--text-dim)] text-[9px] uppercase font-black mb-2 opacity-50">Surveillance</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00D084] live-dot" />
              <span className="text-[var(--text-main)] text-[11px] font-bold">
                {summary?.camerasOnline || 0}/{summary?.totalCameras || 0} Online
              </span>
            </div>
          </div>
          <div className="bg-[var(--bg-primary)]/40 p-3 rounded-xl border border-[var(--border-main)]">
            <p className="text-[var(--text-dim)] text-[9px] uppercase font-black mb-2 opacity-50">Team Sync</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              <span className="text-[var(--text-main)] text-[11px] font-bold">
                {summary?.activeStaff || 0} Registered
              </span>
            </div>
          </div>
          <div className="bg-[var(--bg-primary)]/40 p-3 rounded-xl border border-[var(--border-main)]">
            <p className="text-[var(--text-dim)] text-[9px] uppercase font-black mb-2 opacity-50">Communications</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6] badge-pulse" />
              <span className="text-[var(--text-main)] text-[11px] font-bold">
                {summary?.unreadMessages || 0} New Chats
              </span>
            </div>
          </div>
          <div className="bg-[var(--bg-primary)]/40 p-3 rounded-xl border border-[var(--border-main)]">
            <p className="text-[var(--text-dim)] text-[9px] uppercase font-black mb-2 opacity-50">Core Engine</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00D084]" />
              <span className="text-[var(--text-main)] text-[11px] font-bold">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}