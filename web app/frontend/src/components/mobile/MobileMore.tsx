import React from 'react';
import {
  MessageSquare,
  Video,
  BarChart2,
  CreditCard,
  Settings,
  Shield,
  HelpCircle,
  ChevronRight,
  Crown,
  Smartphone } from
'lucide-react';
import { MobileTab } from '../../pages/MobilePreview';
interface MobileMoreProps {
  onGoToWebApp: () => void;
  onNavigate?: (tab: MobileTab) => void;
}
const menuSections = [
{
  title: 'Communications',
  items: [
  {
    label: 'Chat Inbox',
    icon: MessageSquare,
    color: '#8B5CF6',
    badge: null
  },
  {
    label: 'Video & Voice Calls',
    icon: Video,
    color: '#3B82F6',
    badge: 'Premium'
  }]

},
{
  title: 'Business',
  items: [
  {
    label: 'Reports & Exports',
    icon: BarChart2,
    color: '#F59E0B',
    badge: null
  },
  {
    label: 'Subscription & Billing',
    icon: CreditCard,
    color: '#00D084',
    badge: null
  }]

},
{
  title: 'Account',
  items: [
  {
    label: 'Settings',
    icon: Settings,
    color: '#94A3B8',
    badge: null
  },
  {
    label: 'PIN Management',
    icon: Shield,
    color: '#EF4444',
    badge: null
  }]

},
{
  title: 'Support',
  items: [
  {
    label: 'Help Center',
    icon: HelpCircle,
    color: '#06B6D4',
    badge: null
  }]

}];

export function MobileMore({ onGoToWebApp, onNavigate }: MobileMoreProps) {
  return (
    <div className="pb-4">
      <div className="px-5 pt-4 pb-3">
        <p className="text-[#F1F5F9] font-bold text-lg">More</p>
      </div>

      {/* User Card */}
      <div className="mx-4 mb-5 bg-[#161B27] border border-[#1E2535] rounded-2xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D084] to-[#3B82F6] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          EO
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#F1F5F9] font-bold">Emeka Okafor</p>
          <p className="text-[#94A3B8] text-xs truncate">
            Okafor Enterprises Ltd
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Crown size={10} className="text-[#F59E0B]" />
            <span className="text-[#F59E0B] text-xs font-bold">
              Premium Plan
            </span>
          </div>
        </div>
      </div>

      {/* Web App Link */}
      <div className="mx-4 mb-4">
        <button
          onClick={onGoToWebApp}
          className="w-full flex items-center gap-3 bg-[#00D084]/10 border border-[#00D084]/30 rounded-xl p-3">

          <div className="w-8 h-8 bg-[#00D084] rounded-lg flex items-center justify-center flex-shrink-0">
            <Smartphone size={14} className="text-[#0F1117]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[#00D084] text-sm font-semibold">
              Switch to Web App
            </p>
            <p className="text-[#94A3B8] text-xs">
              Full dashboard with more features
            </p>
          </div>
          <ChevronRight size={14} className="text-[#00D084]" />
        </button>
      </div>

      {/* Menu Sections */}
      <div className="px-4 space-y-4">
        {menuSections.map((section) =>
        <div key={section.title}>
            <p className="text-[#475569] text-xs font-semibold uppercase tracking-wider mb-2">
              {section.title}
            </p>
            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl overflow-hidden divide-y divide-[#1E2535]">
              {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.label === 'Chat Inbox') onNavigate?.('chat');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#1E2535] transition-colors">

                    <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: item.color + '20'
                    }}>

                      <Icon
                      size={15}
                      style={{
                        color: item.color
                      }} />

                    </div>
                    <span className="flex-1 text-left text-[#F1F5F9] text-sm">
                      {item.label}
                    </span>
                    {item.badge &&
                  <span className="flex items-center gap-0.5 bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-bold px-2 py-0.5 rounded-md">
                        <Crown size={9} />
                        {item.badge}
                      </span>
                  }
                    <ChevronRight size={14} className="text-[#475569]" />
                  </button>);

            })}
            </div>
          </div>
        )}
      </div>
    </div>);

}