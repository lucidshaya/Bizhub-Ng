import React, { useState } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from '../components/web/Toast';
import { RetailSidebar } from '../components/retail/RetailSidebar';
import { RetailDashboardScreen } from '../components/retail/RetailDashboardScreen';
import { InventoryScreen } from '../components/retail/InventoryScreen';
import { POSScreen } from '../components/retail/POSScreen';
import { SalesHistoryScreen } from '../components/retail/SalesHistoryScreen';
import { RetailAnalyticsScreen } from '../components/retail/RetailAnalyticsScreen';

export type RetailScreen = 'dashboard' | 'inventory' | 'pos' | 'sales' | 'analytics';

export function RetailApp() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [activeScreen, setActiveScreen] = useState<RetailScreen>('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    if (isLoading) {
        return (
            <div className="h-screen bg-[#0A0E1A] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#1E2535] border-t-[#00D084] rounded-full animate-spin" />
            </div>
        );
    }

    // Mode gate — workspace users go back to /dashboard
    if (user && user.storeMode !== 'RETAIL_STORE') {
        navigate('/dashboard', { replace: true });
        return null;
    }

    const renderScreen = () => {
        switch (activeScreen) {
            case 'dashboard': return <RetailDashboardScreen onNavigate={setActiveScreen} />;
            case 'inventory': return <InventoryScreen />;
            case 'pos': return <POSScreen />;
            case 'sales': return <SalesHistoryScreen />;
            case 'analytics': return <RetailAnalyticsScreen />;
            default: return <RetailDashboardScreen onNavigate={setActiveScreen} />;
        }
    };

    return (
        <div className="flex h-screen bg-[#0A0E1A] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            <RetailSidebar
                activeScreen={activeScreen}
                onNavigate={setActiveScreen}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(c => !c)}
                businessName={user?.businessName || 'My Store'}
            />
            <main className="flex-1 overflow-y-auto">
                {renderScreen()}
            </main>
        </div>
    );
}
