import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  DollarSign,
  Edit2,
  CheckCircle,
  XCircle,
  Loader2
} from
  'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileTab } from '../../pages/MobilePreview';
import { staffApi } from '../../services/api';

interface MobileStaffProps {
  onNavigate?: (tab: MobileTab) => void;
}

const formatPay = (v: number) => `₦${v.toLocaleString('en-NG')}`;

export function MobileStaff({ onNavigate }: MobileStaffProps) {
  const [search, setSearch] = useState('');
  const [showPayAll, setShowPayAll] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const res = await staffApi.getAll();
      setStaff(res.data);
    } catch (e) {
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeStaff = staff.filter(s => s.status === 'ACTIVE');
  const totalPayroll = activeStaff.reduce((sum, s) => sum + s.monthlySalary, 0);

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePayAll = async () => {
    setIsPaying(true);
    try {
      await staffApi.payAll(undefined, 'Monthly salary');
      setTimeout(() => {
        setIsPaying(false);
        setShowPayAll(false);
        // show success UI mock
      }, 1000);
    } catch {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 size={32} className="text-[#00D084] animate-spin" />
      </div>
    );
  }
  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <p className="text-[#F1F5F9] font-bold text-lg">Staff & Payroll</p>
        <button
          onClick={() => onNavigate?.('addStaff')}
          className="w-8 h-8 bg-[#00D084] rounded-xl flex items-center justify-center hover:bg-[#00b872] transition-colors">

          <Plus size={16} className="text-[#0F1117]" />
        </button>
      </div>

      {/* Pay All Button */}
      <div className="mx-4 mb-4">
        <button
          onClick={() => setShowPayAll(true)}
          disabled={activeStaff.length === 0}
          className="w-full py-4 rounded-2xl font-bold text-[#0F1117] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #F59E0B, #d97706)'
          }}>

          <DollarSign size={18} />
          Pay All Workers — {formatPay(totalPayroll)}
        </button>
      </div>

      {/* Search */}
      <div className="mx-4 mb-4 relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff..."
          className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none" />

      </div>

      {/* Staff List */}
      {filtered.length === 0 ? (
        <div className="text-center py-6 px-4">
          <p className="text-[#94A3B8] text-sm">No staff members found.</p>
        </div>
      ) : (
        <div className="px-4 space-y-2 mb-5">
          {filtered.map((s) =>
            <div
              key={s.id}
              className="flex items-center gap-3 bg-[#161B27] border border-[#1E2535] rounded-xl p-3">

              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{
                  backgroundColor: s.avatarColor || '#3B82F6'
                }}>
                {s.avatarInitials || s.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F1F5F9] text-sm font-medium truncate">
                  {s.name}
                </p>
                <p className="text-[#475569] text-xs">{s.role}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#F1F5F9] text-xs font-semibold">{formatPay(s.monthlySalary)}</p>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${s.status === 'ACTIVE' ? 'text-[#00D084] bg-[#00D084]/10' : s.status === 'ON_LEAVE' ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
                  {s.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-1">
                <button className="w-7 h-7 bg-[#1E2535] rounded-lg flex items-center justify-center text-[#94A3B8]">
                  <Edit2 size={11} />
                </button>
                <button className="w-7 h-7 bg-[#00D084]/10 rounded-lg flex items-center justify-center text-[#00D084]">
                  <DollarSign size={11} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* Pay All Modal */}
      <AnimatePresence>
        {showPayAll &&
          <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end"
            onClick={() => setShowPayAll(false)}>

            <motion.div
              initial={{
                y: '100%'
              }}
              animate={{
                y: 0
              }}
              exit={{
                y: '100%'
              }}
              transition={{
                type: 'spring',
                damping: 25
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#161B27] rounded-t-3xl p-6 border-t border-[#1E2535]">

              <div className="w-10 h-1 bg-[#2A3548] rounded-full mx-auto mb-5" />
              <h3 className="text-[#F1F5F9] font-bold text-lg mb-4">
                Confirm Bulk Payroll
              </h3>
              <div className="bg-[#0F1117] rounded-2xl p-4 mb-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8] text-sm">Workers</span>
                  <span className="text-[#F1F5F9] font-medium">{activeStaff.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8] text-sm">Total Amount</span>
                  <span className="text-[#F59E0B] font-bold text-lg">
                    {formatPay(totalPayroll)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8] text-sm">Via</span>
                  <span className="text-[#F1F5F9] text-sm">Wallet Balance</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  disabled={isPaying}
                  onClick={() => setShowPayAll(false)}
                  className="flex-1 bg-[#1E2535] text-[#F1F5F9] py-3.5 rounded-2xl text-sm font-medium">
                  Cancel
                </button>
                <button
                  disabled={isPaying}
                  onClick={handlePayAll}
                  className="flex-1 bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
                  {isPaying ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Pay'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}