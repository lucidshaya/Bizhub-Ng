import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  DollarSign,
  Briefcase } from
'lucide-react';
import { motion } from 'framer-motion';
interface MobileAddStaffProps {
  onBack: () => void;
}
export function MobileAddStaff({ onBack }: MobileAddStaffProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    salary: ''
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit data
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
        <h2 className="text-[#F1F5F9] font-bold text-lg">Add New Staff</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-[#161B27] border-2 border-dashed border-[#2A3548] flex items-center justify-center mb-3 relative group active:scale-95 transition-transform">
              <Camera size={24} className="text-[#475569]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#00D084] rounded-full flex items-center justify-center border-2 border-[#0F1117]">
                <User size={14} className="text-[#0F1117]" />
              </div>
            </div>
            <p className="text-[#94A3B8] text-xs">Tap to upload photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[#94A3B8] text-xs font-medium ml-1">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />

                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value
                  })
                  }
                  placeholder="e.g. Emeka Okafor"
                  className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors" />

              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#94A3B8] text-xs font-medium ml-1">
                Role / Position
              </label>
              <div className="relative">
                <Briefcase
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />

                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value
                  })
                  }
                  placeholder="e.g. Store Manager"
                  className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors" />

              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#94A3B8] text-xs font-medium ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />

                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value
                  })
                  }
                  placeholder="e.g. emeka@example.com"
                  className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors" />

              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#94A3B8] text-xs font-medium ml-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />

                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value
                  })
                  }
                  placeholder="e.g. 0801 234 5678"
                  className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors" />

              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#94A3B8] text-xs font-medium ml-1">
                Monthly Salary (₦)
              </label>
              <div className="relative">
                <DollarSign
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />

                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    salary: e.target.value
                  })
                  }
                  placeholder="e.g. 120000"
                  className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors" />

              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-[#00D084]/20">

              Add Staff Member
            </button>
          </div>
        </form>
      </div>
    </div>);

}