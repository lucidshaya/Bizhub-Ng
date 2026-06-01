import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Package, ShoppingCart, BarChart2, History,
    ChevronLeft, ChevronRight, Store, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { RetailScreen } from '../../pages/RetailApp';

interface Props {
    activeScreen: RetailScreen;
    onNavigate: (screen: RetailScreen) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    businessName: string;
}

const navItems: { id: RetailScreen; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, color: '#00D084' },
    { id: 'pos', label: 'POS / Cashier', icon: <ShoppingCart size={20} />, color: '#3B82F6' },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} />, color: '#F59E0B' },
    { id: 'sales', label: 'Sales History', icon: <History size={20} />, color: '#8B5CF6' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} />, color: '#EF4444' },
];

export function RetailSidebar({ activeScreen, onNavigate, collapsed, onToggleCollapse, businessName }: Props) {
    const { logout } = useAuth();

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 240 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="flex-shrink-0 h-full bg-[#0D1220] border-r border-[#1E2535] flex flex-col relative z-10"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1E2535]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D084] to-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#00D084]/20">
                    <Store size={18} className="text-white" />
                </div>
                {!collapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                        <p className="text-[#F1F5F9] font-bold text-sm leading-tight truncate max-w-[145px]">{businessName}</p>
                        <p className="text-[#00D084] text-xs font-semibold">Retail Store</p>
                    </motion.div>
                )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = activeScreen === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            title={collapsed ? item.label : undefined}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative
                                ${isActive
                                    ? 'bg-[#1E2535] shadow-sm'
                                    : 'hover:bg-[#161B27] text-[#64748B] hover:text-[#94A3B8]'
                                }`}
                            style={isActive ? { color: item.color } : {}}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="retailActiveTab"
                                    className="absolute inset-0 rounded-xl"
                                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}
                                    transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                                />
                            )}
                            <span className="relative z-10 flex-shrink-0">{item.icon}</span>
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="relative z-10 text-sm font-semibold truncate"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="px-2 pb-4 space-y-1 border-t border-[#1E2535] pt-3">
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                    title={collapsed ? 'Log out' : undefined}
                >
                    <LogOut size={18} className="flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Log out</span>}
                </button>
                <button
                    onClick={onToggleCollapse}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[#475569] hover:text-[#94A3B8] hover:bg-[#161B27] transition-all text-xs"
                >
                    {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
                </button>
            </div>
        </motion.aside>
    );
}
