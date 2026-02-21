import React, { useState } from 'react';
import {
  Delete,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Fingerprint,
  FileText } from
'lucide-react';
import { motion } from 'framer-motion';
import { MobileTab } from '../../pages/MobilePreview';
interface MobileTransactionsProps {
  onNavigate?: (tab: MobileTab) => void;
}
const transactions = [
{
  desc: 'Client Payment — Dangote',
  amount: '+₦750,000',
  type: 'credit',
  date: 'Today 09:14',
  status: 'Completed'
},
{
  desc: 'Payroll — Feb 2025',
  amount: '-₦1,840,000',
  type: 'debit',
  date: 'Today 08:00',
  status: 'Completed'
},
{
  desc: 'Withdrawal to GTBank',
  amount: '-₦200,000',
  type: 'debit',
  date: 'Yesterday',
  status: 'Pending'
},
{
  desc: 'Invoice #INV-0042',
  amount: '+₦320,000',
  type: 'credit',
  date: 'Feb 18',
  status: 'Completed'
},
{
  desc: 'Generator Fuel',
  amount: '-₦85,000',
  type: 'debit',
  date: 'Feb 17',
  status: 'Completed'
},
{
  desc: 'POS Sales',
  amount: '+₦430,000',
  type: 'credit',
  date: 'Feb 17',
  status: 'Completed'
}];

export function MobileTransactions({ onNavigate }: MobileTransactionsProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const handlePin = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === '1234') {
          setTimeout(() => {
            setUnlocked(true);
            setPin('');
          }, 300);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPin('');
            setPinError(false);
          }, 800);
        }
      }
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

        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
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
              disabled={!k}
              className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${!k ? 'invisible' : k === '⌫' ? 'bg-[#161B27] text-[#94A3B8]' : 'bg-[#161B27] text-[#F1F5F9] border border-[#1E2535]'}`}>

                {k === '⌫' ? <Delete size={20} className="mx-auto" /> : k}
              </button>

          )}
        </div>
        <p className="text-[#475569] text-xs mt-4">Hint: 1234</p>
      </div>);

  }
  const filters = ['All', 'Credits', 'Debits', 'Payroll'];
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
          <button className="w-8 h-8 bg-[#161B27] border border-[#1E2535] rounded-xl flex items-center justify-center">
            <Download size={14} className="text-[#94A3B8]" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mx-4 mb-4">
        <div className="bg-[#161B27] border border-[#1E2535] rounded-xl p-3">
          <p className="text-[#94A3B8] text-xs mb-1">Total In</p>
          <p className="text-[#00D084] font-bold">₦6,200,000</p>
        </div>
        <div className="bg-[#161B27] border border-[#1E2535] rounded-xl p-3">
          <p className="text-[#94A3B8] text-xs mb-1">Total Out</p>
          <p className="text-[#EF4444] font-bold">₦4,100,000</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
        {filters.map((f) =>
        <button
          key={f}
          onClick={() => setActiveFilter(f)}
          className={`px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeFilter === f ? 'bg-[#00D084] text-[#0F1117]' : 'bg-[#161B27] text-[#94A3B8] border border-[#1E2535]'}`}>

            {f}
          </button>
        )}
      </div>

      {/* List */}
      <div className="px-4 space-y-2">
        {transactions.map((tx, i) =>
        <div
          key={i}
          className="flex items-center gap-3 bg-[#161B27] border border-[#1E2535] rounded-xl p-3">

            <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-[#00D084]/10' : 'bg-[#EF4444]/10'}`}>

              {tx.type === 'credit' ?
            <ArrowUpRight size={16} className="text-[#00D084]" /> :

            <ArrowDownRight size={16} className="text-[#EF4444]" />
            }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#F1F5F9] text-xs font-medium truncate">
                {tx.desc}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[#475569] text-xs">{tx.date}</p>
                <span
                className={`text-xs ${tx.status === 'Completed' ? 'text-[#00D084]' : 'text-[#F59E0B]'}`}>

                  • {tx.status}
                </span>
              </div>
            </div>
            <span
            className={`text-sm font-bold flex-shrink-0 ${tx.type === 'credit' ? 'text-[#00D084]' : 'text-[#EF4444]'}`}>

              {tx.amount}
            </span>
          </div>
        )}
      </div>
    </div>);

}