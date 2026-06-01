import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, Paperclip, ImageIcon } from 'lucide-react';
import { Sidebar } from '../components/web/Sidebar';
import { TopBar } from '../components/web/TopBar';
import { DashboardScreen } from '../components/web/DashboardScreen';
import { CorporateWorkerDashboard } from '../components/web/CorporateWorkerDashboard';
import { StaffPayrollScreen } from '../components/web/StaffPayrollScreen';
import { TransactionsScreen } from '../components/web/TransactionsScreen';
import { CCTVScreen } from '../components/web/CCTVScreen';
import { CommunicationsScreen } from '../components/web/CommunicationsScreen';
import { SettingsScreen } from '../components/web/SettingsScreen';
import { PinSetupModal } from '../components/web/PinSetupModal';
import { OrganizationSettingsScreen } from '../components/web/OrganizationSettingsScreen';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/web/Toast';
import { settingsApi } from '../services/api';
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
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [showSupport, setShowSupport] = useState(false);
  const [supportData, setSupportData] = useState({ subject: '', message: '' });
  const [supportImage, setSupportImage] = useState<File | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // Redirect retail store users to the Retail App
  useEffect(() => {
    if (user?.storeMode === 'RETAIL_STORE') {
      navigate('/retail', { replace: true });
    }
  }, [user?.storeMode, navigate]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show PIN setup for new users without PIN — ONLY after they have a real plan
  useEffect(() => {
    const hasActivePlan = user?.businessPlan && user.businessPlan !== 'BASIC';
    
    if (user && user.hasPin === false && user.role === 'OWNER' && hasActivePlan) {
      // Short delay so user sees dashboard first
      const timer = setTimeout(() => {
        toast.info('Set up your transaction PIN to get started');
        setShowPinSetup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, toast]);

  // Adjust default screen for Retail workers
  useEffect(() => {
    if (user?.role === 'WORKER' && user?.businessType !== 'Corporate/Workplace' && activeScreen === 'dashboard') {
        setActiveScreen('transactions');
    }
  }, [user, activeScreen]);

  // Route Guard: enforce onboarding for corporate users without a plan
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const payment = searchParams.get('payment');
    const ref = searchParams.get('ref');

    // If currently verifying payment, don't redirect yet
    if (payment === 'success' && ref) {
      settingsApi.verifyPlanUpgradePaystack(ref).then(async (res) => {
        toast.success(`Successfully upgraded to ${res.data.plan} plan!`);
        await refreshProfile();
        // Remove query params
        navigate('/dashboard', { replace: true });
      }).catch(() => {
        toast.error('Failed to verify payment. Please contact support.');
        // Remove query params but perhaps allow retry or something
        navigate('/dashboard', { replace: true });
      });
      return; 
    }

    // If the user has no plan OR is still on the default 'BASIC' plan, force them to choose one
    // Workers are under a business already — they never need to select a plan
    if (user && user.role === 'OWNER' && (!user.businessPlan || user.businessPlan === 'BASIC')) {
        navigate('/onboarding');
    }
  }, [user, navigate, location.search, refreshProfile, toast]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        if (user?.role === 'WORKER' && user?.businessType === 'Corporate/Workplace') {
            return <CorporateWorkerDashboard onNavigate={setActiveScreen} />;
        }
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
        onReport={() => setShowSupport(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <TopBar
          title={screenTitles[activeScreen]}
          onGoToLanding={() => navigate('/')}
          onNavigate={(screen) => setActiveScreen(screen as WebScreen)}
          onReport={() => setShowSupport(true)}
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
            onClick={(e) => e.target === e.currentTarget && setShowSupport(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0F1117] border border-[#1E2535] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-[#1E2535] flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-[#00D084]/10 flex items-center justify-center">
                      <MessageCircle size={18} className="text-[#00D084]" />
                    </div>
                    <h2 className="text-lg font-bold text-[#F1F5F9]">Submit a Report</h2>
                  </div>
                  <p className="text-sm text-[#64748B] ml-12">Describe the issue and attach a screenshot if needed</p>
                </div>
                <button
                  onClick={() => setShowSupport(false)}
                  className="p-2 hover:bg-[#1E2535] rounded-lg transition-colors text-[#64748B] mt-0.5"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wide">Subject</label>
                  <input
                    type="text"
                    value={supportData.subject}
                    onChange={e => setSupportData({ ...supportData, subject: e.target.value })}
                    placeholder="e.g. Login issues, Payment delay..."
                    className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl px-4 py-3 text-[#F1F5F9] text-sm focus:border-[#00D084] focus:outline-none transition-colors placeholder-[#475569]"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wide">Describe the issue</label>
                  <textarea
                    value={supportData.message}
                    onChange={e => setSupportData({ ...supportData, message: e.target.value })}
                    placeholder="Describe exactly what happened, what you expected, and any steps to reproduce..."
                    rows={4}
                    className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl px-4 py-3 text-[#F1F5F9] text-sm focus:border-[#00D084] focus:outline-none transition-colors resize-none placeholder-[#475569]"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase tracking-wide">Screenshot (optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setSupportImage(e.target.files?.[0] || null)}
                  />
                  {supportImage ? (
                    <div className="flex items-center gap-3 p-3 bg-[#161B27] border border-[#00D084]/30 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-[#00D084]/10 flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={14} className="text-[#00D084]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#F1F5F9] text-xs font-medium truncate">{supportImage.name}</p>
                        <p className="text-[#64748B] text-[10px]">{(supportImage.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={() => setSupportImage(null)}
                        className="text-[#64748B] hover:text-[#EF4444] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-[#161B27] border border-dashed border-[#1E2535] rounded-xl text-[#64748B] hover:border-[#00D084]/50 hover:text-[#94A3B8] transition-all text-sm"
                    >
                      <Paperclip size={14} />
                      Attach a screenshot
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button
                  onClick={() => { setShowSupport(false); setSupportData({ subject: '', message: '' }); setSupportImage(null); }}
                  className="px-5 py-2.5 text-sm font-medium text-[#64748B] hover:text-[#94A3B8] transition-colors rounded-xl hover:bg-[#161B27]"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingSupport || !supportData.subject || !supportData.message}
                  onClick={async () => {
                    setIsSubmittingSupport(true);
                    try {
                      const formData = new FormData();
                      formData.append('userEmail', user?.email || 'unknown@user.com');
                      formData.append('subject', supportData.subject);
                      formData.append('message', supportData.message);
                      if (supportImage) formData.append('image', supportImage);

                      const token = localStorage.getItem('bizhub_token');
                      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3333/api';
                      const res = await fetch(`${apiUrl}/support/tickets`, {
                        method: 'POST',
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        body: formData,
                      });
                      if (res.ok) {
                        toast.success('Your report has been submitted. We\'ll get back to you soon!');
                        setShowSupport(false);
                        setSupportData({ subject: '', message: '' });
                        setSupportImage(null);
                      } else {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.message || 'Failed to submit');
                      }
                    } catch (e: any) {
                      toast.error(e.message || 'Failed to submit report. Please try again.');
                    } finally {
                      setIsSubmittingSupport(false);
                    }
                  }}
                  className="bg-[#00D084] text-[#0F1117] px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#00D084]/20 hover:bg-[#00b872] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmittingSupport ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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