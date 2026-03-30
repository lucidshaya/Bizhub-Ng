import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Sidebar } from '../components/web/Sidebar';
import { TopBar } from '../components/web/TopBar';
import { DashboardScreen } from '../components/web/DashboardScreen';
import { StaffPayrollScreen } from '../components/web/StaffPayrollScreen';
import { TransactionsScreen } from '../components/web/TransactionsScreen';
import { CCTVScreen } from '../components/web/CCTVScreen';
import { CommunicationsScreen } from '../components/web/CommunicationsScreen';
import { SettingsScreen } from '../components/web/SettingsScreen';
import { PinSetupModal } from '../components/web/PinSetupModal';
import { OrganizationSettingsScreen } from '../components/web/OrganizationSettingsScreen';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/web/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export type WebScreen =
  'dashboard' |
  'staff' |
  'transactions' |
  'cctv' |
  'comms' |
  'organization' |
  'settings';

const screenTitles: Record<WebScreen, string> = {
  dashboard: 'Dashboard',
  staff: 'Staff & Payroll',
  transactions: 'Transactions',
  cctv: 'CCTV Live Monitor',
  comms: 'Communications',
  organization: 'Organization Settings',
  settings: 'Settings',
};

export function WebApp() {
  const [activeScreen, setActiveScreen] = useState<WebScreen>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [showSupport, setShowSupport] = useState(false);
  const [supportData, setSupportData] = useState({ subject: '', message: '' });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // Show PIN setup for new users without PIN
  useEffect(() => {
    if (user && user.hasPin === false) {
      // Short delay so user sees dashboard first
      const timer = setTimeout(() => {
        toast.info('Set up your transaction PIN to get started');
        setShowPinSetup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setActiveScreen} />;
      case 'staff':
        return <StaffPayrollScreen />;
      case 'transactions':
        return <TransactionsScreen />;
      case 'cctv':
        return <CCTVScreen />;
      case 'comms':
        return <CommunicationsScreen />;
      case 'organization':
        return <OrganizationSettingsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen onNavigate={setActiveScreen} />;
    }
  };

  return (
    <div
      className="flex h-screen bg-[#0F1117] overflow-hidden app-font"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onGoToLanding={() => navigate('/')}
        onReport={() => setShowSupport(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={screenTitles[activeScreen]}
          onGoToLanding={() => navigate('/')}
        />

        <main className="flex-1 overflow-y-auto app-scroll bg-[#0F1117]">
          <AnimatePresence>
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Support Button */}
      <button
        onClick={() => setShowSupport(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand text-darkPrimary rounded-full shadow-2xl shadow-brand/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
      >
        <MessageCircle size={28} />
      </button>

      {/* Support Ticket Modal */}
      <AnimatePresence>
        {showSupport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-darkCard border border-darkBorder w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-darkBorder flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-textMain">Submit a Report</h2>
                  <p className="text-sm text-textMuted">Describe the issue you're facing</p>
                </div>
                <button
                  onClick={() => setShowSupport(false)}
                  className="p-2 hover:bg-darkBorder rounded-lg transition-colors text-textMuted"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Subject</label>
                  <input
                    type="text"
                    value={supportData.subject}
                    onChange={e => setSupportData({ ...supportData, subject: e.target.value })}
                    placeholder="e.g. Login issues, Payment delay..."
                    className="w-full bg-darkPrimary border border-darkBorder rounded-xl px-4 py-3 text-textMain text-sm focus:border-brand focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Message</label>
                  <textarea
                    value={supportData.message}
                    onChange={e => setSupportData({ ...supportData, message: e.target.value })}
                    placeholder="Describe exactly what happened..."
                    rows={4}
                    className="w-full bg-darkPrimary border border-darkBorder rounded-xl px-4 py-3 text-textMain text-sm focus:border-brand focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-darkBorder bg-darkPrimary/30 flex justify-end gap-3">
                <button
                  onClick={() => setShowSupport(false)}
                  className="px-6 py-2.5 text-sm font-medium text-textMuted hover:text-textMain transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingSupport || !supportData.subject || !supportData.message}
                  onClick={async () => {
                    setIsSubmittingSupport(true);
                    try {
                      const res = await fetch('http://localhost:3333/api/support/tickets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userEmail: user?.email || 'unknown@user.com',
                          ...supportData
                        })
                      });
                      if (res.ok) {
                        toast.success('Your report has been submitted. Our team will review it shortly.');
                        setShowSupport(false);
                        setSupportData({ subject: '', message: '' });
                      } else {
                        throw new Error('Failed to submit');
                      }
                    } catch (e) {
                      toast.error('Failed to submit report. Please try again.');
                    } finally {
                      setIsSubmittingSupport(false);
                    }
                  }}
                  className="bg-brand text-darkPrimary px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmittingSupport ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Submit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Setup Modal for new users */}
      <PinSetupModal
        isOpen={showPinSetup}
        onComplete={async () => {
          setShowPinSetup(false);
          await refreshProfile();
        }}
        onClose={() => setShowPinSetup(false)}
      />
    </div>
  );
}