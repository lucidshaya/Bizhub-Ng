import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Package, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { retailAnalyticsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../web/Toast';
import type { RetailScreen } from '../../pages/RetailApp';

interface Props {
    onNavigate: (screen: RetailScreen) => void;
}

interface Summary {
    todayRevenue: number;
    todaySalesCount: number;
    monthRevenue: number;
    grossProfit: number;
    grossMargin: number;
    stockValue: number;
    totalProducts: number;
    lowStockCount: number;
}

const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function RetailDashboardScreen({ onNavigate }: Props) {
    const { user } = useAuth();
    const toast = useToast();
    const [summary, setSummary] = useState<Summary | null>(null);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [sumRes, topRes] = await Promise.all([
                    retailAnalyticsApi.getSummary(),
                    retailAnalyticsApi.getTopProducts(5),
                ]);
                setSummary(sumRes.data);
                setTopProducts(topRes.data);
            } catch {
                toast.error('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const statCards = [
        {
            label: "Today's Revenue",
            value: fmt(summary?.todayRevenue ?? 0),
            sub: `${summary?.todaySalesCount ?? 0} sales today`,
            icon: <TrendingUp size={20} />, color: '#00D084', bg: 'from-[#00D084]/20 to-transparent'
        },
        {
            label: 'Monthly Revenue',
            value: fmt(summary?.monthRevenue ?? 0),
            sub: 'This calendar month',
            icon: <TrendingUp size={20} />, color: '#3B82F6', bg: 'from-[#3B82F6]/20 to-transparent'
        },
        {
            label: 'Gross Profit',
            value: fmt(summary?.grossProfit ?? 0),
            sub: `${summary?.grossMargin ?? 0}% margin`,
            icon: <TrendingUp size={20} />, color: '#8B5CF6', bg: 'from-[#8B5CF6]/20 to-transparent'
        },
        {
            label: 'Stock Value',
            value: fmt(summary?.stockValue ?? 0),
            sub: `${summary?.totalProducts ?? 0} total products`,
            icon: <Package size={20} />, color: '#F59E0B', bg: 'from-[#F59E0B]/20 to-transparent'
        },
    ];

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 size={32} className="text-[#00D084] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#F1F5F9]">Good {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋</h1>
                    <p className="text-[#64748B] text-sm mt-0.5">Here's what's happening at your store today</p>
                </div>
                {(summary?.lowStockCount ?? 0) > 0 && (
                    <button
                        onClick={() => onNavigate('inventory')}
                        className="flex items-center gap-2 bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#F59E0B]/25 transition-colors"
                    >
                        <AlertTriangle size={15} />
                        {summary?.lowStockCount} low stock items
                    </button>
                )}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5 relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${card.bg} rounded-bl-full`} />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">{card.label}</span>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}20`, color: card.color }}>
                                {card.icon}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-[#F1F5F9]">{card.value}</p>
                        <p className="text-[#64748B] text-xs mt-1">{card.sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Open POS / Cashier', desc: 'Process a new sale', screen: 'pos' as RetailScreen, color: '#3B82F6', icon: <ShoppingCart size={22} /> },
                    { label: 'Manage Inventory', desc: 'Add or update products', screen: 'inventory' as RetailScreen, color: '#F59E0B', icon: <Package size={22} /> },
                    { label: 'View Sales History', desc: 'Browse past transactions', screen: 'sales' as RetailScreen, color: '#8B5CF6', icon: <TrendingUp size={22} /> },
                ].map(action => (
                    <button
                        key={action.label}
                        onClick={() => onNavigate(action.screen)}
                        className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5 text-left hover:border-opacity-60 transition-all group flex items-center justify-between"
                        style={{ '--hover-color': action.color } as any}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${action.color}20`, color: action.color }}>
                                {action.icon}
                            </div>
                            <div>
                                <p className="text-[#F1F5F9] font-bold text-sm">{action.label}</p>
                                <p className="text-[#64748B] text-xs">{action.desc}</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-[#475569] group-hover:text-[#94A3B8] transition-colors" />
                    </button>
                ))}
            </div>

            {/* Top products */}
            {topProducts.length > 0 && (
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                    <h2 className="text-[#F1F5F9] font-bold text-base mb-4">🏆 Top Selling Products</h2>
                    <div className="space-y-3">
                        {topProducts.map((p, i) => {
                            const maxQty = topProducts[0]?.totalQty || 1;
                            const pct = Math.round((p.totalQty / maxQty) * 100);
                            return (
                                <div key={p.productId} className="flex items-center gap-4">
                                    <span className="text-[#475569] text-sm font-bold w-5">#{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-[#F1F5F9] text-sm font-medium">{p.name}</span>
                                            <span className="text-[#64748B] text-xs">{p.totalQty} units · {fmt(p.totalRevenueNaira)}</span>
                                        </div>
                                        <div className="h-1.5 bg-[#1E2535] rounded-full">
                                            <div
                                                className="h-1.5 rounded-full"
                                                style={{ width: `${pct}%`, background: i === 0 ? '#00D084' : i === 1 ? '#3B82F6' : '#8B5CF6' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}
