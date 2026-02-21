import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { user } = useAuth();
  const toast = useToast();

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
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={screenTitles[activeScreen]}
          onGoToLanding={() => navigate('/')}
        />

        <main className="flex-1 overflow-y-auto app-scroll bg-[#0F1117]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* PIN Setup Modal for new users */}
      <PinSetupModal
        isOpen={showPinSetup}
        onComplete={() => setShowPinSetup(false)}
        onClose={() => setShowPinSetup(false)}
      />
    </div>
  );
}