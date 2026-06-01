import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Package, AlertTriangle, DollarSign, Loader2 } from 'lucide-react';
import { retailAnalyticsApi } from '../../services/api';
import { useToast } from '../web/Toast';

const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export function RetailAnalyticsScreen() {
    const toast = useToast();
    const [summary, setSummary] = useState<any>(null);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
    const [lowStock, setLowStock] = useState<any[]>([]);
    const [days, setDays] = useState(30);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const [s, top, daily, ls] = await Promise.all([
                    retailAnalyticsApi.getSummary(),
                    retailAnalyticsApi.getTopProducts(10),
                    retailAnalyticsApi.getDailyRevenue(days),
                    retailAnalyticsApi.getLowStock(),
                ]);
                setSummary(s.data);
                setTopProducts(top.data);
                setDailyRevenue(daily.data);
                setLowStock(ls.data);
            } catch { toast.error('Failed to load analytics'); }
            finally { setIsLoading(false); }
        };
        load();
    }, [days]);

    if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 size={32} className="text-[#00D084] animate-spin" /></div>;

    const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);
    const maxTopQty = topProducts[0]?.totalQty || 1;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#F1F5F9]">Analytics</h1>
                <div className="flex gap-2">
                    {[7, 30, 90].map(d => (
                        <button key={d} onClick={() => setDays(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${days === d ? 'bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30' : 'bg-[#161B27] border border-[#1E2535] text-[#64748B]'}`}>
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Gross Profit', value: fmt(summary?.grossProfit ?? 0), sub: `${summary?.grossMargin ?? 0}% margin`, color: '#00D084', icon: <TrendingUp size={18} /> },
                    { label: 'Stock Value', value: fmt(summary?.stockValue ?? 0), sub: `${summary?.totalProducts ?? 0} products`, color: '#3B82F6', icon: <Package size={18} /> },
                    { label: 'Total Revenue', value: fmt(summary?.totalRevenue ?? 0), sub: 'All time', color: '#8B5CF6', icon: <DollarSign size={18} /> },
                    { label: 'Low Stock', value: String(summary?.lowStockCount ?? 0), sub: 'items need restock', color: '#F59E0B', icon: <AlertTriangle size={18} /> },
                ].map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${kpi.color}20`, color: kpi.color }}>{kpi.icon}</div>
                        <div>
                            <p className="text-[#64748B] text-xs">{kpi.label}</p>
                            <p className="text-[#F1F5F9] font-bold">{kpi.value}</p>
                            <p className="text-[#475569] text-xs">{kpi.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Revenue Chart */}
            {dailyRevenue.length > 0 && (
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5">
                    <h2 className="text-[#F1F5F9] font-bold mb-4">Revenue — Last {days} Days</h2>
                    <div className="flex items-end gap-1 h-32">
                        {dailyRevenue.map((d, i) => (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0 group relative">
                                <div className="absolute bottom-full mb-1 bg-[#0F1117] border border-[#1E2535] text-[#F1F5F9] text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                    {d.date}: {fmt(d.revenue)}
                                </div>
                                <div
                                    className="w-full rounded-t-sm transition-all"
                                    style={{
                                        height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%`,
                                        background: `linear-gradient(to top, #00D084, #3B82F6)`,
                                        opacity: 0.7 + 0.3 * (d.revenue / maxRevenue),
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Products */}
                {topProducts.length > 0 && (
                    <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5">
                        <h2 className="text-[#F1F5F9] font-bold mb-4">🏆 Top Products</h2>
                        <div className="space-y-3">
                            {topProducts.map((p, i) => (
                                <div key={p.productId} className="flex items-center gap-3">
                                    <span className="text-[#475569] text-xs font-bold w-4">#{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-[#F1F5F9] text-xs font-medium truncate">{p.name}</span>
                                            <span className="text-[#64748B] text-xs ml-2 flex-shrink-0">{p.totalQty} sold</span>
                                        </div>
                                        <div className="h-1.5 bg-[#1E2535] rounded-full">
                                            <div className="h-1.5 rounded-full" style={{ width: `${(p.totalQty / maxTopQty) * 100}%`, background: ['#00D084', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][i % 5] }} />
                                        </div>
                                    </div>
                                    <span className="text-[#00D084] text-xs font-bold w-20 text-right">{fmt(p.totalRevenueNaira)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Low Stock Alerts */}
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5">
                    <h2 className="text-[#F1F5F9] font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-[#F59E0B]" /> Low Stock Alerts
                    </h2>
                    {lowStock.length === 0 ? (
                        <p className="text-[#475569] text-sm text-center py-6">✅ All products are well stocked</p>
                    ) : (
                        <div className="space-y-2">
                            {lowStock.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-[#0F1117] border border-[#F59E0B]/20 rounded-xl px-3 py-2">
                                    <div>
                                        <p className="text-[#F1F5F9] text-xs font-medium">{p.name}</p>
                                        {p.category && <p className="text-[#475569] text-xs">{p.category}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[#F59E0B] font-bold text-sm">{p.quantity} left</p>
                                        <p className="text-[#475569] text-xs">min: {p.lowStockThreshold}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
