import { useState } from 'react';
import {
  Download, Search, ChevronLeft, ChevronRight, MessageSquare, Loader2,
  ArrowUpRight, ArrowDownRight, X, Plus, Trash2, RefreshCw, CreditCard, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

export function TransactionsScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tabFilter, setTabFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [newTxn, setNewTxn] = useState({
    type: 'CREDIT',
    description: '',
    amount: 0,
    channel: 'Bank Transfer',
  });

  // Queries
  const { data: txnData, isLoading: txnLoading } = useQuery({
    queryKey: ['transactions', page, typeFilter, tabFilter, search],
    queryFn: () => {
      const params: any = { page, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;
      if (tabFilter === 'SMS') params.channel = 'Bank Transfer';
      if (tabFilter === 'POS') params.channel = 'POS Terminal';
      if (tabFilter === 'ONLINE') params.channel = 'Paystack,Moniepoint,Flutterwave,OPay';
      return transactionsApi.getAll(params).then(res => res.data);
    },
    enabled: unlocked,
  });

  const { data: summaryData } = useQuery({
    queryKey: ['transactions_summary'],
    queryFn: () => transactionsApi.getSummary().then(res => res.data),
    enabled: unlocked,
  });

  // Mutations
  const createTxn = useMutation({
    mutationFn: (data: any) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions_summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setShowAddModal(false);
      setNewTxn({ type: 'CREDIT', description: '', amount: 0, channel: 'Bank Transfer' });
      toast.success('Transaction recorded');
    }
  });

  const deleteTxn = useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions_summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      toast.success('Transaction deleted');
    }
  });

  const syncMutation = useMutation({
    mutationFn: () => transactionsApi.sync(),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions_summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      toast.success(data.message || 'Sync successful');
    },
    onError: () => toast.error('Sync failed')
  });

  const handlePin = async (digit: string) => {
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length >= 4) {
      setIsVerifying(true);
      try {
        await authApi.verifyPin(newPin);
        setUnlocked(true);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Invalid PIN');
        setPin('');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleResetPin = async () => {
    try {
      await authApi.requestPinReset();
      toast.success('PIN reset link sent to your email.');
    } catch {
      toast.error('Failed to request reset');
    }
  };

  const handleCreateTxn = async () => {
    if (!newTxn.description || !newTxn.amount) return;
    createTxn.mutate(newTxn);
  };

  const handleDeleteTxn = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    deleteTxn.mutate(id);
  };

  const handleExport = async () => {
    try {
      const res = await transactionsApi.getExport({ type: typeFilter });
      const csv = [
        'ID,Type,Description,Amount,Channel,Status,Date',
        ...res.data.map((t: any) =>
          `${t.reference || t.id},${t.type},${t.description},${t.amount},${t.channel},${t.status},${new Date(t.date).toLocaleDateString()}`,
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch {
      toast.error('Export failed');
    }
  };

  const formatNaira = (v: number) => `₦${v?.toLocaleString('en-NG') || '0'}`;

  const statusColor = (s: string) => {
    if (s === 'COMPLETED') return 'text-[#00D084] bg-[#00D084]/10';
    if (s === 'PENDING') return 'text-[#F59E0B] bg-[#F59E0B]/10';
    return 'text-[#EF4444] bg-[#EF4444]/10';
  };

  const inputClass = 'w-full bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all';

  if (!unlocked) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-[var(--accent)]" />
          </div>
          <h2 className="text-[var(--text-main)] text-2xl font-black mb-2">Vault Locked</h2>
          <p className="text-[var(--text-dim)] text-sm mb-8 leading-relaxed">
            Please enter your organization's 4-digit security PIN to access financial records.
          </p>
          
          <div className="flex gap-4 justify-center mb-10">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={pin.length > i ? { scale: [1, 1.2, 1], backgroundColor: 'var(--accent)' } : {}}
                className={`w-4 h-4 rounded-full border-2 border-[var(--border-main)] ${pin.length > i ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-transparent'}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((d, idx) => (
              d === '' ? <div key={`empty-${idx}`} /> : (
                <button
                  key={d}
                  onClick={() => d === '←' ? setPin(pin.slice(0, -1)) : handlePin(d)}
                  className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-main)] text-[var(--text-main)] text-xl font-bold hover:bg-[var(--bg-tertiary)] active:scale-90 transition-all shadow-sm"
                >
                  {d}
                </button>
              )
            ))}
          </div>

          {user?.role === 'OWNER' && (
            <button onClick={handleResetPin} className="text-[var(--accent)] text-xs font-bold mt-10 hover:underline tracking-tight">
              FORGOT TRANSACTION PIN?
            </button>
          )}
        </div>
        
        <AnimatePresence>
          {isVerifying && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <Loader2 size={40} className="text-[var(--accent)] animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const transactions = txnData?.data || [];
  const totalPages = txnData?.totalPages || 0;
  const total = txnData?.total || 0;
  const summary = summaryData;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Net Balance', value: summary?.balance || 0, color: 'text-[var(--text-main)]' },
          { label: 'Total Credits', value: summary?.totalCredits || 0, color: 'text-[#00D084]' },
          { label: 'Total Debits', value: summary?.totalDebits || 0, color: 'text-[#EF4444]' },
          { label: 'Transactions', value: summary?.totalTransactions || 0, color: 'text-[var(--text-main)]', isCount: true }
        ].map((item, i) => (
          <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-5 shadow-sm">
            <p className="text-[var(--text-dim)] text-[10px] uppercase font-bold tracking-wider mb-2">{item.label}</p>
            <p className={`${item.color} text-xl font-black`}>
              {item.isCount ? item.value : formatNaira(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs & Utilities */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[var(--border-main)] pb-2">
        <div className="flex items-center gap-8">
          {[
            { id: 'ALL', label: 'History' },
            { id: 'SMS', label: 'Bank Sync' },
            { id: 'POS', label: 'Terminals' },
            { id: 'ONLINE', label: 'Gateways' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setTabFilter(tab.id); setPage(1); }}
              className={`pb-3 text-sm font-bold transition-all relative ${tabFilter === tab.id ? 'text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
            >
              {tab.label}
              {tabFilter === tab.id && (
                <motion.div layoutId="txnTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl pl-11 pr-4 py-2 text-[var(--text-main)] text-sm w-full md:w-64 focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[var(--accent)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
          >
            <Plus size={16} /> Record
          </button>

          <button
            onClick={handleExport}
            className="p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all"
          >
            <Download size={18} />
          </button>
          
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })}
            className="p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl text-[var(--text-dim)] hover:text-[var(--accent)] transition-all"
          >
            <RefreshCw size={18} className={txnLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-[var(--bg-tertiary)]/30">
                <th className="py-4 px-6 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Transaction</th>
                <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Description</th>
                <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Amount</th>
                <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Channel</th>
                <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Status</th>
                <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Date</th>
                <th className="py-4 px-6 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-[var(--bg-tertiary)]/20 transition-colors group">
                  <td className="py-4 px-6 border-l-4 border-transparent hover:border-[var(--accent)] transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'CREDIT' ? 'bg-[#00D084]/10 text-[#00D084]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                        {t.type === 'CREDIT' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="text-[var(--text-main)] text-sm font-bold">{t.type}</p>
                        <p className="text-[var(--text-dim)] text-[10px] font-mono uppercase">REF: {t.reference?.slice(-8) || t.id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[var(--text-main)] text-sm font-medium">{t.description}</td>
                  <td className={`py-4 px-4 text-sm font-black ${t.type === 'CREDIT' ? 'text-[#00D084]' : 'text-[#EF4444]'}`}>
                    {t.type === 'CREDIT' ? '+' : '-'}{formatNaira(t.amount)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-[var(--bg-tertiary)] text-[var(--text-dim)] text-[10px] font-bold px-2 py-1 rounded-md uppercase border border-[var(--border-main)]">
                      {t.channel}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${statusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[var(--text-dim)] text-[10px] font-bold">
                    {new Date(t.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => handleDeleteTxn(t.id)} className="p-2 text-[var(--text-dim)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-20 bg-[var(--bg-tertiary)]/5">
            <MessageSquare size={48} className="text-[var(--text-dim)] mx-auto mb-4 opacity-20" />
            <h3 className="text-[var(--text-main)] text-lg font-bold">No records found</h3>
            <p className="text-[var(--text-dim)] text-sm mb-6">
              {tabFilter === 'SMS' ? "Connect your bank account to sync real-time transactions." : "Either you're all caught up or need a bank sync."}
            </p>
            {tabFilter === 'SMS' && (
              <button 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="bg-[var(--accent)] text-[var(--bg-primary)] font-black px-6 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 mx-auto hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--accent)]/20"
              >
                {syncMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} 
                Start Real-time Sync
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-tertiary)]/10">
            <p className="text-[var(--text-dim)] text-[10px] font-bold uppercase tracking-wider">
              PAGE {page} OF {totalPages} ({total} TOTAL)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl disabled:opacity-30 text-[var(--text-main)] shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl disabled:opacity-30 text-[var(--text-main)] shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[var(--text-main)] text-xl font-bold">Manual Entry</h3>
                  <p className="text-[var(--text-dim)] text-xs">Record an off-platform transaction.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-dim)] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Type</label>
                  <div className="grid grid-cols-2 gap-2 bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-main)]">
                    {['CREDIT', 'DEBIT'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewTxn({ ...newTxn, type: t })}
                        className={`py-2 rounded-lg text-xs font-black transition-all ${newTxn.type === t ? (t === 'CREDIT' ? 'bg-[#00D084] text-white shadow-lg shadow-[#00D084]/20' : 'bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/20') : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Description</label>
                  <input value={newTxn.description} onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })} className={inputClass} placeholder="Sale of Goods..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Amount (₦)</label>
                    <input type="number" value={newTxn.amount || ''} onChange={(e) => setNewTxn({ ...newTxn, amount: Number(e.target.value) })} className={inputClass} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Channel</label>
                    <select value={newTxn.channel} onChange={(e) => setNewTxn({ ...newTxn, channel: e.target.value })} className={inputClass}>
                      <option value="Bank Transfer">Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="POS Terminal">POS</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateTxn}
                disabled={createTxn.isPending || !newTxn.description || !newTxn.amount}
                className="w-full bg-[var(--accent)] text-[var(--bg-primary)] font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-3 shadow-xl shadow-[var(--accent)]/20 hover:opacity-90 active:scale-95 transition-all"
              >
                {createTxn.isPending ? <Loader2 size={18} className="animate-spin" /> : <><CreditCard size={18} /> Log Transaction</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}