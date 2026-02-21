import React from 'react';
import {
  Bell,
  TrendingUp,
  Users,
  Camera,
  MessageSquare,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Zap } from
'lucide-react';
import { motion } from 'framer-motion';
import { MobileTab } from '../../pages/MobilePreview';
interface MobileDashboardProps {
  onNavigate: (tab: MobileTab) => void;
}
const recentTx = [
{
  desc: 'Payroll — Feb 2025',
  amount: '-₦1,840,000',
  type: 'debit',
  time: 'Today'
},
{
  desc: 'Client Payment',
  amount: '+₦750,000',
  type: 'credit',
  time: 'Today'
},
{
  desc: 'Withdrawal',
  amount: '-₦200,000',
  type: 'debit',
  time: 'Yesterday'
},
{
  desc: 'POS Sales',
  amount: '+₦430,000',
  type: 'credit',
  time: 'Feb 17'
}];

export function MobileDashboard({ onNavigate }: MobileDashboardProps) {
  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <p className="text-[#94A3B8] text-xs">Good morning 👋</p>
          <p className="text-[#F1F5F9] font-bold text-base">Emeka Okafor</p>
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
          Total Balance
        </p>
        <p className="text-white text-3xl font-bold mb-4 relative z-10">
          ₦4,250,000
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
          value: '24',
          color: '#3B82F6',
          icon: Users
        },
        {
          label: 'Payroll',
          value: '₦1.84M',
          color: '#F59E0B',
          icon: TrendingUp
        },
        {
          label: 'Cameras',
          value: '6 Live',
          color: '#00D084',
          icon: Camera
        },
        {
          label: 'Messages',
          value: '12 New',
          color: '#8B5CF6',
          icon: MessageSquare
        }].
        map((s) => {
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
                <p className="text-[#F1F5F9] font-bold text-sm">{s.value}</p>
                <p className="text-[#475569] text-xs">{s.label}</p>
              </div>
            </div>);

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
          }].
          map((s) => {
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
              </button>);

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
        <div className="space-y-2">
          {recentTx.map((tx, i) =>
          <div
            key={i}
            className="flex items-center gap-3 bg-[#161B27] border border-[#1E2535] rounded-xl p-3">

              <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-[#00D084]/10' : 'bg-[#EF4444]/10'}`}>

                {tx.type === 'credit' ?
              <ArrowUpRight size={14} className="text-[#00D084]" /> :

              <ArrowDownRight size={14} className="text-[#EF4444]" />
              }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F1F5F9] text-xs font-medium truncate">
                  {tx.desc}
                </p>
                <p className="text-[#475569] text-xs">{tx.time}</p>
              </div>
              <span
              className={`text-xs font-bold ${tx.type === 'credit' ? 'text-[#00D084]' : 'text-[#EF4444]'}`}>

                {tx.amount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>);

}