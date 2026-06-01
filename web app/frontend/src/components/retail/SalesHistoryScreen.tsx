import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Printer, X, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { salesApi } from '../../services/api';
import { useToast } from '../web/Toast';

const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function SalesHistoryScreen() {
    const toast = useToast();
    const [sales, setSales] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [filter, setFilter] = useState<'cash' | 'card' | 'transfer' | ''>('');
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const LIMIT = 20;

    const load = async () => {
        setIsLoading(true);
        try {
            const res = await salesApi.getSales({ paymentMethod: filter || undefined, page, limit: LIMIT });
            setSales(res.data.data);
            setTotal(res.data.total);
            setPageCount(res.data.pageCount);
        } catch { toast.error('Failed to load sales history'); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { load(); }, [page, filter]);

    const viewReceipt = async (saleId: string) => {
        try {
            const res = await salesApi.getSale(saleId);
            setSelectedSale(res.data);
        } catch { toast.error('Failed to load receipt'); }
    };

    const methodBadge = (m: string) => {
        const map: Record<string, string> = { cash: 'bg-[#00D084]/20 text-[#00D084]', card: 'bg-[#3B82F6]/20 text-[#3B82F6]', transfer: 'bg-[#8B5CF6]/20 text-[#8B5CF6]' };
        return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${map[m] || 'bg-[#1E2535] text-[#94A3B8]'}`}>{m}</span>;
    };

    return (
        <div className="p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#F1F5F9]">Sales History</h1>
                    <p className="text-[#64748B] text-sm">{total} total sales</p>
                </div>
                <div className="flex gap-2">
                    {['', 'cash', 'card', 'transfer'].map(m => (
                        <button key={m} onClick={() => { setFilter(m as any); setPage(1); }}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filter === m ? 'bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30' : 'bg-[#161B27] border border-[#1E2535] text-[#64748B] hover:border-[#00D084]/20'}`}>
                            {m || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#1E2535]">
                            {['Date & Time', 'Items', 'Payment', 'Total', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-12"><Loader2 className="inline animate-spin text-[#00D084]" size={24} /></td></tr>
                        ) : sales.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-[#475569]">
                                <History size={36} className="mx-auto mb-3 opacity-30" />
                                <p>No sales recorded yet</p>
                            </td></tr>
                        ) : sales.map(s => (
                            <tr key={s.id} className="border-b border-[#1E2535] hover:bg-[#0F1117] transition-colors">
                                <td className="px-4 py-3 text-[#94A3B8] text-xs">{fmtDate(s.createdAt)}</td>
                                <td className="px-4 py-3 text-[#F1F5F9]">{s.items?.length || 0} item(s)</td>
                                <td className="px-4 py-3">{methodBadge(s.paymentMethod)}</td>
                                <td className="px-4 py-3 text-[#00D084] font-bold">{fmt(s.totalNaira)}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => viewReceipt(s.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2535] text-[#94A3B8] hover:text-[#F1F5F9] text-xs font-medium transition-colors">
                                        <Printer size={12} /> Reprint
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-2 rounded-lg bg-[#161B27] border border-[#1E2535] text-[#64748B] disabled:opacity-40 hover:border-[#00D084]/30 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-[#94A3B8] text-sm">Page {page} of {pageCount}</span>
                    <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}
                        className="p-2 rounded-lg bg-[#161B27] border border-[#1E2535] text-[#64748B] disabled:opacity-40 hover:border-[#00D084]/30 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Receipt re-view */}
            <AnimatePresence>
                {selectedSale && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={e => e.target === e.currentTarget && setSelectedSale(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-white text-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                            <div className="bg-[#0F1117] px-4 py-3 flex items-center justify-between">
                                <span className="text-[#F1F5F9] font-bold text-sm">Reprint Receipt</span>
                                <div className="flex gap-2">
                                    <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-[#00D084] text-[#0F1117] px-3 py-1.5 rounded-lg text-xs font-bold">
                                        <Printer size={12} /> Print
                                    </button>
                                    <button onClick={() => setSelectedSale(null)} className="text-[#475569] hover:text-white"><X size={16} /></button>
                                </div>
                            </div>
                            <div className="p-5 font-mono text-xs">
                                <div className="text-center border-b border-dashed pb-3 mb-3">
                                    <h2 className="font-bold text-base">Receipt</h2>
                                    <p className="text-gray-400 text-[10px]">{fmtDate(selectedSale.createdAt)}</p>
                                </div>
                                <div className="space-y-1 mb-3">
                                    {selectedSale.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between">
                                            <span className="flex-1 truncate">{item.name} x{item.quantity}</span>
                                            <span className="ml-2">₦{item.subtotalNaira?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-dashed pt-3 space-y-1">
                                    <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{fmt(selectedSale.totalNaira)}</span></div>
                                    <div className="flex justify-between text-gray-500 capitalize"><span>Payment</span><span>{selectedSale.paymentMethod}</span></div>
                                </div>
                                <div className="text-center mt-4 pt-3 border-t border-dashed text-gray-400 text-[10px]">
                                    <p className="font-bold">Thank you! Please come again 🙏</p>
                                    <p className="mt-1 opacity-60">Powered by BizhubNg</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
