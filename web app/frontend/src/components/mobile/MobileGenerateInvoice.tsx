import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  FileText,
  Calendar,
  DollarSign,
  Plus,
  Trash2 } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface MobileGenerateInvoiceProps {
  onBack: () => void;
}
interface InvoiceItem {
  id: string;
  description: string;
  amount: string;
}
export function MobileGenerateInvoice({ onBack }: MobileGenerateInvoiceProps) {
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
  {
    id: '1',
    description: '',
    amount: ''
  }]
  );
  const addItem = () => {
    setItems([
    ...items,
    {
      id: Math.random().toString(),
      description: '',
      amount: ''
    }]
    );
  };
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };
  const updateItem = (id: string, field: keyof InvoiceItem, value: string) => {
    setItems(
      items.map((item) =>
      item.id === id ?
      {
        ...item,
        [field]: value
      } :
      item
      )
    );
  };
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBack();
  };
  return (
    <div className="h-full flex flex-col bg-[#0F1117]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-[#1E2535]">
        <button
          onClick={onBack}
          className="w-8 h-8 -ml-2 flex items-center justify-center rounded-full active:bg-[#1E2535] text-[#94A3B8]">

          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[#F1F5F9] font-bold text-lg">New Invoice</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Details */}
          <div className="space-y-4">
            <h3 className="text-[#F1F5F9] text-sm font-semibold border-b border-[#1E2535] pb-2">
              Client Details
            </h3>

            <div className="space-y-1.5">
              <label className="text-[#94A3B8] text-xs font-medium ml-1">
                Client Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />

                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Dangote Refinery"
                  className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors" />

              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#94A3B8] text-xs font-medium ml-1">
                Due Date
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors [color-scheme:dark]" />

              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2535] pb-2">
              <h3 className="text-[#F1F5F9] text-sm font-semibold">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-[#00D084] text-xs font-bold flex items-center gap-1 hover:text-[#00b872]">

                <Plus size={12} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item, index) =>
                <motion.div
                  key={item.id}
                  initial={{
                    opacity: 0,
                    y: 10
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    height: 0
                  }}
                  className="bg-[#161B27] border border-[#1E2535] rounded-xl p-3 space-y-3">

                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[#475569] text-[10px] font-medium uppercase tracking-wider">
                          Description
                        </label>
                        <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                        updateItem(item.id, 'description', e.target.value)
                        }
                        placeholder="Item description"
                        className="w-full bg-[#0F1117] border border-[#1E2535] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084]" />

                      </div>
                      {items.length > 1 &&
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="mt-6 p-2 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors">

                          <Trash2 size={16} />
                        </button>
                    }
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#475569] text-[10px] font-medium uppercase tracking-wider">
                        Amount (₦)
                      </label>
                      <input
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                      updateItem(item.id, 'amount', e.target.value)
                      }
                      placeholder="0.00"
                      className="w-full bg-[#0F1117] border border-[#1E2535] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084]" />

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Total */}
          <div className="bg-[#161B27] border border-[#1E2535] rounded-xl p-4 flex justify-between items-center">
            <span className="text-[#94A3B8] text-sm">Total Amount</span>
            <span className="text-[#F59E0B] font-bold text-xl">
              ₦{calculateTotal().toLocaleString()}
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-[#00D084]/20 flex items-center justify-center gap-2">

              <FileText size={18} />
              Generate Invoice
            </button>
          </div>
        </form>
      </div>
    </div>);

}