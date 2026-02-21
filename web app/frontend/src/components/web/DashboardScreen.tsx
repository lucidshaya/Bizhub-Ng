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
  Eye,
  Send,
  FileText,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { WebScreen } from '../../pages/WebApp';
import { dashboardApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const formatNaira = (v: number) => `₦${v.toLocaleString('en-NG')}`;

interface DashboardScreenProps {
  onNavigate: (screen: WebScreen) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [sumRes, actRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getActivity(),
      ]);
      setSummary(sumRes.data);
      setActivity(actRes.data);
    } catch (err: any) {
      setError('Failed to load dashboard data');
      // Fallback to sample data if API is not connected
      setSummary({
        balance: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        staffCount: 0,
        activeStaff: 0,
        camerasOnline: 0,
        totalCameras: 0,
        unreadMessages: 0,
        recentTransactions: [],
        staffList: [],
        recentMessages: [],
      });
      setActivity([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="text-[#00D084] animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Balance',
      value: formatNaira(summary?.balance || 0),
      change: '+12.5%',
      up: true,
      icon: Zap,
      color: '#00D084',
    },
    {
      label: 'Revenue',
      value: formatNaira(summary?.totalRevenue || 0),
      change: '+8.2%',
      up: true,
      icon: TrendingUp,
      color: '#3B82F6',
    },
    {
      label: 'Expenses',
      value: formatNaira(summary?.totalExpenses || 0),
      change: '-3.1%',
      up: false,
      icon: TrendingDown,
      color: '#EF4444',
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
    { label: 'Staff', icon: Users, color: '#3B82F6', screen: 'staff' as WebScreen },
    { label: 'Transactions', icon: CreditCard, color: '#00D084', screen: 'transactions' as WebScreen },
    { label: 'CCTV', icon: Camera, color: '#F59E0B', screen: 'cctv' as WebScreen },
    { label: 'Messages', icon: MessageSquare, color: '#8B5CF6', screen: 'comms' as WebScreen },
  ];

  const recentTxns = summary?.recentTransactions || [];
  const teamMembers = summary?.staffList || [];
  const recentMsgs = summary?.recentMessages || [];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#00D084]/10 to-[#3B82F6]/10 border border-[#1E2535] rounded-2xl p-6">
        <h1 className="text-[#F1F5F9] text-2xl font-bold mb-1">
          Welcome back, {user?.fullName?.split(' ')[0] || 'Boss'} 👋
        </h1>
        <p className="text-[#94A3B8] text-sm">
          {user?.businessName ? `${user.businessName} — ` : ''}Here's your business overview for today
        </p>
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-400 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}. Showing placeholder data. Check API connection.
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
              className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5 hover:border-[#2A3548] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-lg ${stat.up
                    ? 'bg-[#00D084]/10 text-[#00D084]'
                    : 'bg-[#EF4444]/10 text-[#EF4444]'
                    }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-[#94A3B8] text-xs mb-1">{stat.label}</p>
              <p className="text-[#F1F5F9] text-xl font-bold">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => onNavigate(action.screen)}
              className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-4 hover:border-[#2A3548] transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Icon size={18} style={{ color: action.color }} />
              </div>
              <p className="text-[#F1F5F9] text-sm font-medium">{action.label}</p>
            </button>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#F1F5F9] text-base font-semibold">
              Recent Transactions
            </h3>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-[#00D084] text-xs font-medium hover:underline"
            >
              View All
            </button>
          </div>

          {recentTxns.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard size={32} className="text-[#475569] mx-auto mb-3" />
              <p className="text-[#94A3B8] text-sm">No transactions yet</p>
              <p className="text-[#475569] text-xs mt-1">
                Your recent transactions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTxns.slice(0, 5).map((txn: any) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-2 border-b border-[#1E2535] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${txn.type === 'CREDIT'
                        ? 'bg-[#00D084]/10'
                        : 'bg-[#EF4444]/10'
                        }`}
                    >
                      {txn.type === 'CREDIT' ? (
                        <ArrowDownRight size={14} className="text-[#00D084]" />
                      ) : (
                        <ArrowUpRight size={14} className="text-[#EF4444]" />
                      )}
                    </div>
                    <div>
                      <p className="text-[#F1F5F9] text-sm font-medium">
                        {txn.description}
                      </p>
                      <p className="text-[#475569] text-xs">
                        {new Date(txn.date).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${txn.type === 'CREDIT' ? 'text-[#00D084]' : 'text-[#EF4444]'
                      }`}
                  >
                    {txn.type === 'CREDIT' ? '+' : '-'}
                    {formatNaira(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#F1F5F9] text-base font-semibold">
              Recent Messages & Activity
            </h3>
            <button
              onClick={() => onNavigate('comms')}
              className="text-[#00D084] text-xs font-medium hover:underline"
            >
              Go to Chat
            </button>
          </div>

          {(activity.length === 0 && recentMsgs.length === 0) ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="text-[#475569] mx-auto mb-3" />
              <p className="text-[#94A3B8] text-sm">No recent messages</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMsgs.map((msg: any) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {msg.sender?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className="flex-1 bg-[#0F1117] rounded-xl rounded-tl-none px-4 py-2 border border-[#1E2535]">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[#F1F5F9] text-xs font-bold">{msg.sender}</p>
                      <p className="text-[#475569] text-[10px]">
                        {new Date(msg.time).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-[#94A3B8] text-sm line-clamp-2">{msg.text}</p>
                  </div>
                </div>
              ))}
              {activity.slice(0, 3).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-2 border-t border-[#1E2535] mt-2 pt-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#00D084]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap size={14} className="text-[#00D084]" />
                  </div>
                  <div>
                    <p className="text-[#F1F5F9] text-sm">{item.text}</p>
                    <p className="text-[#475569] text-xs mt-1">
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
      <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#F1F5F9] text-base font-semibold">Team Members</h3>
          <button
            onClick={() => onNavigate('staff')}
            className="text-[#00D084] text-xs font-medium hover:underline"
          >
            Manage Staff
          </button>
        </div>

        {teamMembers.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#2A3548] rounded-xl bg-[#0F1117]">
            <Users size={24} className="text-[#475569] mx-auto mb-2" />
            <p className="text-[#94A3B8] text-sm">No team members added yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {teamMembers.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-3 min-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] text-sm font-bold border border-[#8B5CF6]/30">
                  {member.fullName?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div>
                  <p className="text-[#F1F5F9] text-sm font-medium">{member.fullName}</p>
                  <p className="text-[#475569] text-xs">{member.role || 'Staff'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Status Bar */}
      <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5">
        <h3 className="text-[#F1F5F9] text-base font-semibold mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00D084]" />
            <span className="text-[#94A3B8] text-sm">
              CCTV: {summary?.camerasOnline || 0}/{summary?.totalCameras || 0} Online
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="text-[#94A3B8] text-sm">
              Staff: {summary?.activeStaff || 0} Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span className="text-[#94A3B8] text-sm">
              Messages: {summary?.unreadMessages || 0} Unread
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00D084]" />
            <span className="text-[#94A3B8] text-sm">API: Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}