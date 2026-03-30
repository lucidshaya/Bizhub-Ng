import React, { useState, useEffect } from 'react';
import {
  Delete,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Fingerprint,
  FileText,
  Loader2
} from
  'lucide-react';
import { motion } from 'framer-motion';
import { MobileTab } from '../../pages/MobilePreview';
import { transactionsApi, authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../web/Toast';

interface MobileTransactionsProps {
  onNavigate?: (tab: MobileTab) => void;
}

const formatNaira = (v: number) => `₦${v.toLocaleString('en-NG')}`;

export function MobileTransactions({ onNavigate }: MobileTransactionsProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (unlocked) loadData();
  }, [unlocked, activeFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 20 };
      if (activeFilter !== 'ALL') params.type = activeFilter;

      const [txRes, sumRes] = await Promise.all([
        transactionsApi.getAll(params),
        transactionsApi.getSummary()
      ]);

      setTransactions(txRes.data.data || []);
      setSummary(sumRes.data);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePin = async (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setIsLoading(true);
        try {
          await authApi.verifyPin(newPin);
          setTimeout(() => {
            setUnlocked(true);
            setPin('');
            setIsLoading(false);
          }, 300);
        } catch (err: any) {
          setIsLoading(false);
          setPinError(true);
          toast.error(err.response?.data?.message || 'Invalid PIN');
          setTimeout(() => {
            setPin('');
            setPinError(false);
          }, 800);
        }
      }
    }
  };

  const handleResetPin = async () => {
    try {
      await authApi.requestPinReset();
      toast.success('A PIN reset link has been sent to your email.');
    } catch {
      toast.error('Failed to request PIN reset. Try again.');
    }
  };

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[600px] px-6">
        <div className="w-16 h-16 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center mb-4">
          <Fingerprint size={32} className="text-[#3B82F6]" />
        </div>
        <h2 className="text-[#F1F5F9] font-bold text-xl mb-1">Transactions</h2>
        <p className="text-[#94A3B8] text-sm mb-8 text-center">
          Enter your PIN to access
        </p>

        <div className="flex justify-center gap-5 mb-8">
          {[0, 1, 2, 3].map((i) =>
            <div
              key={i}
              className={`w-5 h-5 rounded-full transition-all duration-200 ${pin.length > i ? pinError ? 'bg-[#EF4444] scale-110' : 'bg-[#00D084] scale-110' : 'bg-[#1E2535] border-2 border-[#2A3548]'}`} />

          )}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-xs relative">
          {isLoading && (
            <div className="absolute inset-0 bg-[#0F1117] bg-opacity-80 flex items-center justify-center z-10 rounded-2xl">
              <Loader2 size={24} className="text-[#00D084] animate-spin" />
            </div>
          )}
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(
            (k, i) =>
              <button
                key={i}
                onClick={() =>
                  k === '⌫' ?
                    setPin((p) => p.slice(0, -1)) :
                    k ?
                      handlePin(k) :
                      undefined
                }
                disabled={!k || isLoading}
                className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${!k ? 'invisible' : k === '⌫' ? 'bg-[#161B27] text-[#94A3B8]' : 'bg-[#161B27] text-[#F1F5F9] border border-[#1E2535]'}`}>

                {k === '⌫' ? <Delete size={20} className="mx-auto" /> : k}
              </button>

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
      </div>);

  }
  const filters = [
    { id: 'ALL', label: 'All' },
    { id: 'CREDIT', label: 'Credits' },
    { id: 'DEBIT', label: 'Debits' },
    { id: 'PAYROLL', label: 'Payroll' }
  ];

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <p className="text-[#F1F5F9] font-bold text-lg">Transactions</p>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate?.('generateInvoice')}
            className="h-8 px-3 bg-[#161B27] border border-[#1E2535] rounded-xl flex items-center gap-2 text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#2A3548] transition-colors">

            <FileText size={14} />
            <span className="text-xs font-medium">Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mx-4 mb-4">
        <div className="bg-[#161B27] border border-[#1E2535] rounded-xl p-3">
          <p className="text-[#94A3B8] text-xs mb-1">Total In</p>
          <p className="text-[#00D084] font-bold">{formatNaira(summary?.totalCredits || 0)}</p>
        </div>
        <div className="bg-[#161B27] border border-[#1E2535] rounded-xl p-3">
          <p className="text-[#94A3B8] text-xs mb-1">Total Out</p>
          <p className="text-[#EF4444] font-bold">{formatNaira(summary?.totalDebits || 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {filters.map((f) =>
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeFilter === f.id ? 'bg-[#00D084] text-[#0F1117]' : 'bg-[#161B27] text-[#94A3B8] border border-[#1E2535]'}`}>

            {f.label}
          </button>
        )}
      </div>

      {/* List */}
      <div className="px-4 space-y-2">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 size={24} className="text-[#00D084] animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-[#94A3B8] text-sm">No transactions found.</p>
          </div>
        ) : (
          transactions.map((tx, i) =>
            <div
              key={tx.id || i}
              className="flex items-center gap-3 bg-[#161B27] border border-[#1E2535] rounded-xl p-3">

              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'CREDIT' ? 'bg-[#00D084]/10' : 'bg-[#EF4444]/10'}`}>

                {tx.type === 'CREDIT' ?
                  <ArrowDownRight size={16} className="text-[#00D084]" /> :

                  <ArrowUpRight size={16} className="text-[#EF4444]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F1F5F9] text-xs font-medium truncate">
                  {tx.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[#475569] text-xs">
                    {new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span
                    className={`text-xs ${tx.status === 'COMPLETED' ? 'text-[#00D084]' : 'text-[#F59E0B]'}`}>

                    • {tx.status}
                  </span>
                </div>
              </div>
              <span
                className={`text-sm font-bold flex-shrink-0 ${tx.type === 'CREDIT' ? 'text-[#00D084]' : 'text-[#EF4444]'}`}>

                {tx.type === 'CREDIT' ? '+' : '-'}{formatNaira(tx.amount)}
              </span>
            </div>
          )
        )}
      </div>
    </div>);

}