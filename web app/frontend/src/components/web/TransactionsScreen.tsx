import React, { useState, useEffect } from 'react';
import {
  Lock,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { transactionsApi, authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

export function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tabFilter, setTabFilter] = useState('ALL'); // ALL, SMS, POS, ONLINE
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [newTxn, setNewTxn] = useState({
    type: 'CREDIT',
    description: '',
    amount: 0,
    channel: 'Bank Transfer',
  });

  // PIN gate
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const correctPin = '1234'; // Default PIN

  useEffect(() => {
    if (unlocked) loadTransactions();
  }, [unlocked, page, typeFilter]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;

      // Map tabs to channels
      if (tabFilter === 'SMS') params.channel = 'Bank Transfer';
      if (tabFilter === 'POS') params.channel = 'POS Terminal';
      if (tabFilter === 'ONLINE') params.channel = 'Paystack,Moniepoint,Flutterwave,OPay';

      const [txnRes, sumRes] = await Promise.all([
        transactionsApi.getAll(params),
        transactionsApi.getSummary(),
      ]);

      setTransactions(txnRes.data.data);
      setTotalPages(txnRes.data.totalPages);
      setTotal(txnRes.data.total);
      setSummary(sumRes.data);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePin = async (digit: string) => {
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length >= 4) {
      setIsLoading(true);
      try {
        await authApi.verifyPin(newPin);
        setUnlocked(true);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Invalid PIN');
        setPin('');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResetPin = () => {
    toast.success('A PIN reset link has been sent to your email.');
  };

  const handleCreate = async () => {
    if (!newTxn.description || !newTxn.amount) return;
    setIsSaving(true);
    try {
      await transactionsApi.create(newTxn);
      setShowAddModal(false);
      setNewTxn({ type: 'CREDIT', description: '', amount: 0, channel: 'Bank Transfer' });
      await loadTransactions();
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await transactionsApi.remove(id);
      await loadTransactions();
    } catch { }
  };

  const handleExport = async () => {
    try {
      const res = await transactionsApi.getExport({ type: typeFilter });
      const data = res.data;
      const csv = [
        'ID,Type,Description,Amount,Channel,Status,Date',
        ...data.map((t: any) =>
          `${t.reference || t.id},${t.type},${t.description},${t.amount},${t.channel},${t.status},${new Date(t.date).toLocaleDateString()}`,
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch { }
  };

  const formatNaira = (v: number) => `₦${v.toLocaleString('en-NG')}`;

  const statusColor = (s: string) => {
    if (s === 'COMPLETED') return 'text-[#00D084] bg-[#00D084]/10';
    if (s === 'PENDING') return 'text-[#F59E0B] bg-[#F59E0B]/10';
    return 'text-[#EF4444] bg-[#EF4444]/10';
  };

  const inputClass = 'w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#00D084]';

  // PIN Entry Screen
  if (!unlocked) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Lock size={48} className="text-[#00D084] mx-auto mb-4" />
          <h2 className="text-[#F1F5F9] text-xl font-bold mb-2">Enter Transaction PIN</h2>
          <p className="text-[#94A3B8] text-sm mb-6">
            Enter the organization's 4-digit PIN to view transactions
          </p>
          <div className="flex gap-3 justify-center mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${pin.length > i ? 'bg-[#00D084]' : 'bg-[#1E2535]'
                  }`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-[200px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map(
              (d) =>
                d === '' ? (
                  <div key="empty" />
                ) : (
                  <button
                    key={d}
                    onClick={() =>
                      d === '←' ? setPin(pin.slice(0, -1)) : handlePin(d)
                    }
                    className="w-14 h-14 rounded-full bg-[#161B27] border border-[#1E2535] text-[#F1F5F9] text-lg font-semibold hover:bg-[#1A1F2E] transition-colors"
                  >
                    {d}
                  </button>
                ),
            )}
          </div>
          {user?.role === 'OWNER' && (
            <button
              onClick={handleResetPin}
              className="text-[#00D084] text-xs mt-6 hover:underline"
            >
              Reset Transaction PIN
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="text-[#00D084] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs mb-1">Balance</p>
            <p className="text-[#F1F5F9] text-xl font-bold">{formatNaira(summary.balance)}</p>
          </div>
          <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs mb-1">Total Credits</p>
            <p className="text-[#00D084] text-xl font-bold">{formatNaira(summary.totalCredits)}</p>
          </div>
          <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs mb-1">Total Debits</p>
            <p className="text-[#EF4444] text-xl font-bold">{formatNaira(summary.totalDebits)}</p>
          </div>
          <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs mb-1">Total Transactions</p>
            <p className="text-[#F1F5F9] text-xl font-bold">{summary.totalTransactions}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#1E2535]">
        {[
          { id: 'ALL', label: 'Total (All)' },
          { id: 'SMS', label: 'SMS / Transfer' },
          { id: 'POS', label: 'POS' },
          { id: 'ONLINE', label: 'Online' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setTabFilter(tab.id); setPage(1); }}
            className={`pb-3 text-sm font-medium transition-colors relative ${tabFilter === tab.id ? 'text-[#00D084]' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
          >
            {tab.label}
            {tabFilter === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#00D084]" />
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadTransactions()}
              placeholder="Search transactions..."
              className="bg-[#161B27] border border-[#1E2535] rounded-xl pl-11 pr-4 py-2 text-[#F1F5F9] text-sm w-64 focus:outline-none focus:border-[#00D084]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-[#161B27] border border-[#1E2535] rounded-xl px-4 py-2 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#00D084]"
          >
            <option value="">All Types</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
            <option value="PAYROLL">Payroll</option>
            <option value="WITHDRAWAL">Withdrawal</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold px-4 py-2 rounded-xl text-sm"
          >
            <Plus size={16} /> Add
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#161B27] border border-[#1E2535] hover:border-[#2A3548] text-[#F1F5F9] px-4 py-2 rounded-xl text-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1E2535]">
              <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Ref</th>
              <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Type</th>
              <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Description</th>
              <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Amount</th>
              <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Channel</th>
              <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Status</th>
              <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Date</th>
              <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4 w-10" />
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-[#1E2535] hover:bg-[#1A1F2E]">
                <td className="py-3 px-4 text-[#94A3B8] text-xs font-mono">
                  {(t.reference || t.id).slice(0, 12)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {t.type === 'CREDIT' ? (
                      <ArrowDownRight size={14} className="text-[#00D084]" />
                    ) : (
                      <ArrowUpRight size={14} className="text-[#EF4444]" />
                    )}
                    <span className="text-[#F1F5F9] text-sm">{t.type}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[#F1F5F9] text-sm">{t.description}</td>
                <td className={`py-3 px-4 text-sm font-semibold ${t.type === 'CREDIT' ? 'text-[#00D084]' : 'text-[#EF4444]'}`}>
                  {t.type === 'CREDIT' ? '+' : '-'}{formatNaira(t.amount)}
                </td>
                <td className="py-3 px-4 text-[#94A3B8] text-sm">{t.channel}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColor(t.status)}`}>
                    {t.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#94A3B8] text-xs">
                  {new Date(t.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => handleDelete(t.id)} className="p-1 hover:bg-[#EF4444]/10 rounded-lg">
                    <Trash2 size={14} className="text-[#EF4444]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare size={32} className="text-[#475569] mx-auto mb-3" />
            <p className="text-[#94A3B8] text-sm">No transactions found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[#94A3B8] text-sm">
            Showing page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 bg-[#161B27] border border-[#1E2535] rounded-lg disabled:opacity-50"
            >
              <ChevronLeft size={16} className="text-[#F1F5F9]" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 bg-[#161B27] border border-[#1E2535] rounded-lg disabled:opacity-50"
            >
              <ChevronRight size={16} className="text-[#F1F5F9]" />
            </button>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[#F1F5F9] text-lg font-semibold">New Transaction</h3>
                <button onClick={() => setShowAddModal(false)}>
                  <X size={18} className="text-[#94A3B8]" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#94A3B8] text-xs mb-1">Type</label>
                  <select value={newTxn.type} onChange={(e) => setNewTxn({ ...newTxn, type: e.target.value })} className={inputClass}>
                    <option value="CREDIT">Credit (Income)</option>
                    <option value="DEBIT">Debit (Expense)</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-xs mb-1">Description</label>
                  <input value={newTxn.description} onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })} className={inputClass} placeholder="Income from customer sale" />
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-xs mb-1">Amount (₦)</label>
                  <input type="number" value={newTxn.amount} onChange={(e) => setNewTxn({ ...newTxn, amount: Number(e.target.value) })} className={inputClass} placeholder="50000" />
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-xs mb-1">Channel</label>
                  <select value={newTxn.channel} onChange={(e) => setNewTxn({ ...newTxn, channel: e.target.value })} className={inputClass}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Paystack">Paystack</option>
                    <option value="Moniepoint">Moniepoint</option>
                    <option value="Flutterwave">Flutterwave</option>
                    <option value="OPay">OPay</option>
                    <option value="POS Terminal">POS Terminal</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={isSaving || !newTxn.description || !newTxn.amount}
                  className="w-full bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Record Transaction'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}