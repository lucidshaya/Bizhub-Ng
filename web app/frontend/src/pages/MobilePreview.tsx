import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Plus,
  MessageSquare,
  UserPlus,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileDashboard } from '../components/mobile/MobileDashboard';
import { MobileStaff } from '../components/mobile/MobileStaff';
import { MobileTransactions } from '../components/mobile/MobileTransactions';
import { MobileCCTV } from '../components/mobile/MobileCCTV';
import { MobileMore } from '../components/mobile/MobileMore';
import { MobileAddStaff } from '../components/mobile/MobileAddStaff';
import { MobileGenerateInvoice } from '../components/mobile/MobileGenerateInvoice';
import { MobileChat } from '../components/mobile/MobileChat';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Camera,
  MoreHorizontal,
} from 'lucide-react';

export type MobileTab =
  'home' |
  'staff' |
  'transactions' |
  'cctv' |
  'more' |
  'addStaff' |
  'generateInvoice' |
  'chat';

const tabs: {
  id: MobileTab;
  label: string;
  icon: React.ElementType;
}[] = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'transactions', label: 'Pay', icon: CreditCard },
    { id: 'cctv', label: 'CCTV', icon: Camera },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

export function MobilePreview() {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [showFabMenu, setShowFabMenu] = useState(false);
  const navigate = useNavigate();

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <MobileDashboard onNavigate={setActiveTab} />;
      case 'staff':
        return <MobileStaff onNavigate={setActiveTab} />;
      case 'transactions':
        return <MobileTransactions onNavigate={setActiveTab} />;
      case 'cctv':
        return <MobileCCTV />;
      case 'more':
        return <MobileMore onGoToWebApp={() => navigate('/dashboard')} onNavigate={setActiveTab} />;
      case 'addStaff':
        return <MobileAddStaff onBack={() => setActiveTab('staff')} />;
      case 'generateInvoice':
        return <MobileGenerateInvoice onBack={() => setActiveTab('transactions')} />;
      case 'chat':
        return <MobileChat onBack={() => setActiveTab('more')} />;
      default:
        return <MobileDashboard onNavigate={setActiveTab} />;
    }
  };

  const isSubPage =
    activeTab === 'addStaff' ||
    activeTab === 'generateInvoice' ||
    activeTab === 'chat';

  return (
    <div
      className="min-h-screen bg-[#0A0E1A] flex flex-col items-center justify-center py-8 px-4"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-[#F1F5F9] text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Landing Page
        </button>
        <div className="w-px h-4 bg-[#1E2535]" />
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] text-sm font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Monitor size={14} /> Switch to Web App
        </button>
      </div>

      {/* Phone Frame */}
      <div
        className="relative bg-[#161B27] rounded-[44px] shadow-2xl overflow-hidden flex flex-col"
        style={{
          width: 390,
          height: 844,
          border: '8px solid #1E2535',
          boxShadow: '0 0 0 1px #2A3548, 0 40px 80px rgba(0,0,0,0.8), inset 0 0 0 1px #0F1117',
        }}
      >
        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 flex-shrink-0 bg-[#0F1117]">
          <span className="text-[#F1F5F9] text-xs font-semibold">9:41</span>
          <div className="w-24 h-5 bg-[#0F1117] rounded-full absolute left-1/2 -translate-x-1/2 top-0" />
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5 items-end">
              {[3, 4, 5, 6].map((h) => (
                <div key={h} className="w-1 bg-[#F1F5F9] rounded-sm" style={{ height: h }} />
              ))}
            </div>
            <div className="w-5 h-2.5 border border-[#F1F5F9] rounded-sm relative ml-1">
              <div className="absolute inset-0.5 right-1 bg-[#00D084] rounded-sm" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0.5 h-1.5 bg-[#F1F5F9] rounded-r-sm" />
            </div>
          </div>
        </div>

        {/* App Content */}
        <div className="flex-1 overflow-hidden bg-[#0F1117] relative flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto app-scroll flex-1"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>

          {/* FAB */}
          {!isSubPage && (
            <div className="absolute bottom-20 right-4 z-20">
              <AnimatePresence>
                {showFabMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute bottom-14 right-0 flex flex-col gap-2 items-end"
                  >
                    {[
                      { label: 'New Message', icon: MessageSquare, color: '#8B5CF6', action: () => { } },
                      { label: 'Add Staff', icon: UserPlus, color: '#3B82F6', action: () => setActiveTab('addStaff') },
                      { label: 'Generate Invoice', icon: FileText, color: '#F59E0B', action: () => setActiveTab('generateInvoice') },
                    ].map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          onClick={() => { action.action(); setShowFabMenu(false); }}
                          className="flex items-center gap-2"
                        >
                          <span className="bg-[#161B27] text-[#F1F5F9] text-xs px-3 py-1.5 rounded-xl border border-[#1E2535] whitespace-nowrap">
                            {action.label}
                          </span>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: action.color }}>
                            <Icon size={16} className="text-white" />
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setShowFabMenu(!showFabMenu)}
                className="w-14 h-14 rounded-full bg-[#00D084] shadow-lg flex items-center justify-center transition-transform active:scale-95"
                style={{ boxShadow: '0 4px 20px rgba(0,208,132,0.4)' }}
              >
                <motion.div animate={{ rotate: showFabMenu ? 45 : 0 }} transition={{ duration: 0.2 }}>
                  <Plus size={24} className="text-[#0F1117]" strokeWidth={2.5} />
                </motion.div>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Tab Bar */}
        {!isSubPage && (
          <div className="flex-shrink-0 bg-[#161B27] border-t border-[#1E2535] px-2 pt-2 pb-4">
            <div className="flex items-center justify-around">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setShowFabMenu(false); }}
                    className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
                  >
                    <Icon size={20} className={isActive ? 'text-[#00D084]' : 'text-[#475569]'} />
                    <span className={`text-xs font-medium ${isActive ? 'text-[#00D084]' : 'text-[#475569]'}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Home Indicator */}
        <div className="flex-shrink-0 bg-[#161B27] pb-2 flex justify-center">
          <div className="w-32 h-1 bg-[#2A3548] rounded-full" />
        </div>
      </div>

      <p className="text-[#475569] text-xs mt-4">
        Click tabs to navigate • FAB for quick actions
      </p>
    </div>
  );
}