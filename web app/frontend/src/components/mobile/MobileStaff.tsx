import React, { useState } from 'react';
import {
  Search,
  Plus,
  DollarSign,
  Edit2,
  CheckCircle,
  XCircle } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileTab } from '../../pages/MobilePreview';
interface MobileStaffProps {
  onNavigate?: (tab: MobileTab) => void;
}
const staff = [
{
  id: 1,
  name: 'Emeka Okafor',
  role: 'Store Manager',
  pay: '₦120,000',
  status: 'Active',
  initials: 'EO',
  color: '#00D084'
},
{
  id: 2,
  name: 'Amaka Eze',
  role: 'Cashier',
  pay: '₦65,000',
  status: 'Active',
  initials: 'AE',
  color: '#3B82F6'
},
{
  id: 3,
  name: 'Chidi Nwosu',
  role: 'Security',
  pay: '₦55,000',
  status: 'Active',
  initials: 'CN',
  color: '#8B5CF6'
},
{
  id: 4,
  name: 'Fatima Bello',
  role: 'Accountant',
  pay: '₦95,000',
  status: 'On Leave',
  initials: 'FB',
  color: '#F59E0B'
},
{
  id: 5,
  name: 'Bola Adeyemi',
  role: 'Driver',
  pay: '₦50,000',
  status: 'Active',
  initials: 'BA',
  color: '#EF4444'
},
{
  id: 6,
  name: 'Tunde Fashola',
  role: 'IT Support',
  pay: '₦85,000',
  status: 'Active',
  initials: 'TF',
  color: '#06B6D4'
},
{
  id: 7,
  name: 'Ngozi Obi',
  role: 'HR Officer',
  pay: '₦90,000',
  status: 'Active',
  initials: 'NO',
  color: '#EC4899'
},
{
  id: 8,
  name: 'Seun Adesanya',
  role: 'Sales Rep',
  pay: '₦70,000',
  status: 'Suspended',
  initials: 'SA',
  color: '#F97316'
}];

const payoutRequests = [
{
  id: 1,
  name: 'Chidi Nwosu',
  amount: '₦55,000',
  initials: 'CN',
  color: '#8B5CF6'
},
{
  id: 2,
  name: 'Bola Adeyemi',
  amount: '₦50,000',
  initials: 'BA',
  color: '#EF4444'
}];

export function MobileStaff({ onNavigate }: MobileStaffProps) {
  const [search, setSearch] = useState('');
  const [showPayAll, setShowPayAll] = useState(false);
  const filtered = staff.filter((s) =>
  s.name.toLowerCase().includes(search.toLowerCase())
  );
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
          className="w-full py-4 rounded-2xl font-bold text-[#0F1117] flex items-center justify-center gap-2 text-sm"
          style={{
            background: 'linear-gradient(135deg, #F59E0B, #d97706)'
          }}>

          <DollarSign size={18} />
          Pay All Workers — ₦1,840,000
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
      <div className="px-4 space-y-2 mb-5">
        {filtered.map((s) =>
        <div
          key={s.id}
          className="flex items-center gap-3 bg-[#161B27] border border-[#1E2535] rounded-xl p-3">

            <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              backgroundColor: s.color + '30',
              color: s.color
            }}>

              {s.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#F1F5F9] text-sm font-medium truncate">
                {s.name}
              </p>
              <p className="text-[#475569] text-xs">{s.role}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[#F1F5F9] text-xs font-semibold">{s.pay}</p>
              <span
              className={`text-xs ${s.status === 'Active' ? 'text-[#00D084]' : s.status === 'On Leave' ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>

                {s.status}
              </span>
            </div>
            <div className="flex gap-1 flex-shrink-0">
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

      {/* Pending Payouts */}
      <div className="px-4">
        <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider mb-3">
          Pending Payouts ({payoutRequests.length})
        </p>
        <div className="space-y-2">
          {payoutRequests.map((req) =>
          <div
            key={req.id}
            className="bg-[#161B27] border border-[#1E2535] rounded-xl p-3 flex items-center gap-3">

              <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: req.color + '30',
                color: req.color
              }}>

                {req.initials}
              </div>
              <div className="flex-1">
                <p className="text-[#F1F5F9] text-xs font-medium">{req.name}</p>
                <p className="text-[#F59E0B] text-sm font-bold">{req.amount}</p>
              </div>
              <div className="flex gap-2">
                <button className="w-8 h-8 bg-[#00D084]/10 rounded-xl flex items-center justify-center">
                  <CheckCircle size={14} className="text-[#00D084]" />
                </button>
                <button className="w-8 h-8 bg-[#EF4444]/10 rounded-xl flex items-center justify-center">
                  <XCircle size={14} className="text-[#EF4444]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
                  <span className="text-[#F1F5F9] font-medium">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8] text-sm">Total Amount</span>
                  <span className="text-[#F59E0B] font-bold text-lg">
                    ₦1,840,000
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8] text-sm">Via</span>
                  <span className="text-[#F1F5F9] text-sm">Paystack Bulk</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                onClick={() => setShowPayAll(false)}
                className="flex-1 bg-[#1E2535] text-[#F1F5F9] py-3.5 rounded-2xl text-sm font-medium">

                  Cancel
                </button>
                <button
                onClick={() => setShowPayAll(false)}
                className="flex-1 bg-[#00D084] text-[#0F1117] py-3.5 rounded-2xl text-sm font-bold">

                  Confirm & Pay
                </button>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}