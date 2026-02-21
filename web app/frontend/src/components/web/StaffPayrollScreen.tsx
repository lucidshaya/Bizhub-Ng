import React, { useState, useEffect } from 'react';
import {
  Search, Plus, DollarSign, Edit2, CheckSquare, Square,
  X, UserX, Loader2, Trash2, Save, Mail, Check, CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staffApi, authApi, settingsApi } from '../../services/api';
import { useToast } from './Toast';

export function StaffPayrollScreen() {
  const toast = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [payReason, setPayReason] = useState('Monthly salary');
  const [paidStaffIds, setPaidStaffIds] = useState<Set<string>>(new Set());
  const [departments, setDepartments] = useState<string[]>([]);
  const walletBalance = 15000000; // Mock balance to match mobile app behavior

  // formatted salary input state
  const [salaryInput, setSalaryInput] = useState('');

  const [newStaff, setNewStaff] = useState({
    name: '', email: '', phone: '', role: '', department: '',
    bankName: '', accountNumber: '', monthlySalary: 0,
  });

  useEffect(() => {
    loadStaff();
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const res = await settingsApi.getProfile();
      setDepartments(res.data.business?.departments || []);
    } catch (e) { }
  };

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const res = await staffApi.getAll();
      setStaff(res.data);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── CREATE STAFF + SEND INVITE ────────────────────────
  const handleCreate = async () => {
    if (!newStaff.name || !newStaff.role) {
      toast.warning('Name and role are required');
      return;
    }
    setIsSaving(true);
    try {
      await staffApi.create(newStaff);

      // Send invitation email if email provided
      if (newStaff.email) {
        try {
          await authApi.inviteWorker({
            name: newStaff.name,
            email: newStaff.email,
            role: newStaff.role,
            phone: newStaff.phone || undefined,
          });
          toast.success(`Staff added & invitation sent to ${newStaff.email}`);
        } catch {
          toast.info(`Staff added, but invitation email could not be sent to ${newStaff.email}`);
        }
      } else {
        toast.success(`${newStaff.name} added to staff`);
      }

      setShowAddModal(false);
      setNewStaff({ name: '', email: '', phone: '', role: '', department: '', bankName: '', accountNumber: '', monthlySalary: 0 });
      setSalaryInput('');
      await loadStaff();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add staff');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── UPDATE STAFF ──────────────────────────────────────
  const handleUpdate = async () => {
    if (!editingStaff) return;
    setIsSaving(true);
    try {
      await staffApi.update(editingStaff.id, editingStaff);
      toast.success(`${editingStaff.name} updated`);
      setShowEditModal(false);
      setEditingStaff(null);
      await loadStaff();
    } catch {
      toast.error('Failed to update staff');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── DELETE STAFF ──────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await staffApi.remove(id);
      toast.success('Staff member removed');
      await loadStaff();
    } catch {
      toast.error('Failed to remove staff');
    }
  };

  // ─── PAY INDIVIDUAL ────────────────────────────────────
  const handlePayIndividual = async (s: any) => {
    if (!confirm(`Pay ${s.name} ${formatPay(s.monthlySalary)}?`)) return;
    try {
      await staffApi.pay(s.id, s.monthlySalary, 'Monthly salary');
      setPaidStaffIds((prev) => new Set([...prev, s.id]));
      toast.success(`✅ Paid ${s.name} — ${formatPay(s.monthlySalary)}`);
    } catch {
      toast.error(`Payment to ${s.name} failed`);
    }
  };

  // ─── BULK PAY ALL ──────────────────────────────────────
  const handlePayAll = async () => {
    setIsSaving(true);
    try {
      const result = await staffApi.payAll(
        selected.length > 0 ? selected : undefined,
        payReason,
      );
      const paidIds = staff
        .filter((s) => selected.length === 0 || selected.includes(s.id))
        .filter((s) => s.status === 'ACTIVE')
        .map((s) => s.id);
      setPaidStaffIds((prev) => new Set([...prev, ...paidIds]));
      toast.success(`✅ Payroll complete! Paid ${result.data.staffCount} staff — ${formatPay(result.data.totalAmount)}`);
      setSelected([]);
      setShowPayModal(false);
    } catch {
      toast.error('Bulk payment failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const formatPay = (v: number) => `₦${v.toLocaleString('en-NG')}`;

  const statusColor = (s: string) => {
    if (s === 'ACTIVE') return 'text-[#00D084] bg-[#00D084]/10';
    if (s === 'ON_LEAVE') return 'text-[#F59E0B] bg-[#F59E0B]/10';
    return 'text-[#EF4444] bg-[#EF4444]/10';
  };

  const inviteColor = (s: string) => {
    if (s === 'ACCEPTED') return 'text-[#00D084] bg-[#00D084]/10';
    if (s === 'PENDING') return 'text-[#F59E0B] bg-[#F59E0B]/10';
    return 'text-[#475569] bg-[#475569]/10';
  };

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="text-[#00D084] animate-spin" />
      </div>
    );
  }

  const handleSalaryChange = (val: string, isEdit: boolean) => {
    // Remove non-digit characters
    const numericStr = val.replace(/\D/g, '');
    if (!numericStr) {
      if (isEdit) {
        setEditingStaff({ ...editingStaff, monthlySalary: 0 });
      } else {
        setNewStaff({ ...newStaff, monthlySalary: 0 });
        setSalaryInput('');
      }
      return;
    }
    const numericVal = parseInt(numericStr, 10);
    const formatted = numericVal.toLocaleString('en-US'); // Add commas

    if (isEdit) {
      setEditingStaff({ ...editingStaff, monthlySalary: numericVal });
    } else {
      setNewStaff({ ...newStaff, monthlySalary: numericVal });
      setSalaryInput(formatted);
    }
  };

  const handlePhoneChange = (val: string, isEdit: boolean) => {
    const numericStr = val.replace(/[^\d+]/g, ''); // Allow digits and +
    if (isEdit) {
      setEditingStaff({ ...editingStaff, phone: numericStr });
    } else {
      setNewStaff({ ...newStaff, phone: numericStr });
    }
  };

  const inputClass = 'w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#00D084] transition-colors';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#F1F5F9] text-xl font-bold">Staff & Payroll</h2>
          <p className="text-[#94A3B8] text-sm">{staff.length} total staff members</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Wallet Balance UI matching mobile */}
          <div className="bg-[#161B27] border border-[#1E2535] rounded-xl px-4 py-2 mr-2">
            <p className="text-[#94A3B8] text-xs">Wallet Balance</p>
            <p className="text-[#00D084] text-lg font-bold">{formatPay(walletBalance)}</p>
          </div>

          {selected.length > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="flex items-center gap-2 bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              <DollarSign size={16} />
              Pay Selected ({selected.length})
            </button>
          )}
          <button
            onClick={() => setShowPayModal(true)}
            className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <DollarSign size={16} />
            Pay All
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus size={16} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff by name, role, department..."
          className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-11 pr-4 py-2.5 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#00D084]"
        />
      </div>

      {/* Staff Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-12 text-center">
          <UserX size={48} className="text-[#475569] mx-auto mb-4" />
          <h3 className="text-[#F1F5F9] text-lg font-semibold mb-2">No Staff Members</h3>
          <p className="text-[#94A3B8] text-sm mb-4">Add your first staff member to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold px-6 py-2.5 rounded-xl text-sm"
          >
            <Plus size={16} className="inline mr-2" /> Add Staff
          </button>
        </div>
      ) : (
        <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2535]">
                <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4 w-8" />
                <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Name</th>
                <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Role</th>
                <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Dept</th>
                <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Pay</th>
                <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Status</th>
                <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Invite</th>
                <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Paid</th>
                <th className="text-left text-[#94A3B8] text-xs font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#1E2535] hover:bg-[#1A1F2E] transition-colors">
                  <td className="py-3 px-4">
                    <button onClick={() => toggleSelect(s.id)}>
                      {selected.includes(s.id) ? (
                        <CheckSquare size={16} className="text-[#00D084]" />
                      ) : (
                        <Square size={16} className="text-[#475569]" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: s.avatarColor || '#3B82F6' }}
                      >
                        {s.avatarInitials || s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[#F1F5F9] text-sm font-medium">{s.name}</p>
                        <p className="text-[#475569] text-xs">{s.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#F1F5F9] text-sm">{s.role}</td>
                  <td className="py-3 px-4 text-[#94A3B8] text-sm">{s.department || '—'}</td>
                  <td className="py-3 px-4 text-[#F1F5F9] text-sm font-medium">{formatPay(s.monthlySalary)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColor(s.status)}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${inviteColor(s.inviteStatus || 'NONE')}`}>
                      {s.inviteStatus === 'PENDING' && <><Mail size={10} className="inline mr-1" />Pending</>}
                      {s.inviteStatus === 'ACCEPTED' && <><Check size={10} className="inline mr-1" />Accepted</>}
                      {(!s.inviteStatus || s.inviteStatus === 'NONE') && '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {paidStaffIds.has(s.id) ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-lg text-[#00D084] bg-[#00D084]/10 flex items-center gap-1 w-fit">
                        <Check size={12} /> PAID
                      </span>
                    ) : (
                      <span className="text-[#475569] text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePayIndividual(s)}
                        title="Pay"
                        className="p-1.5 hover:bg-[#00D084]/10 rounded-lg transition-colors"
                      >
                        <DollarSign size={14} className="text-[#00D084]" />
                      </button>
                      <button
                        onClick={() => { setEditingStaff({ ...s }); setShowEditModal(true); }}
                        title="Edit"
                        className="p-1.5 hover:bg-[#3B82F6]/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} className="text-[#3B82F6]" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        title="Remove"
                        className="p-1.5 hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} className="text-[#EF4444]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[#F1F5F9] text-lg font-semibold">Add New Staff</h3>
                <button onClick={() => setShowAddModal(false)}><X size={18} className="text-[#94A3B8]" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Full Name *</label>
                    <input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className={inputClass} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Job Role *</label>
                    <input value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })} className={inputClass} placeholder="Cashier" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Email (for invitation)</label>
                    <input value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className={inputClass} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Phone</label>
                    <input value={newStaff.phone} onChange={(e) => handlePhoneChange(e.target.value, false)} className={inputClass} placeholder="+234..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Department</label>
                    <select value={newStaff.department} onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} className={inputClass}>
                      <option value="">No Department</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Monthly Salary (₦)</label>
                    <input type="text" value={salaryInput} onChange={(e) => handleSalaryChange(e.target.value, false)} className={inputClass} placeholder="50,000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Bank Name</label>
                    <input value={newStaff.bankName} onChange={(e) => setNewStaff({ ...newStaff, bankName: e.target.value })} className={inputClass} placeholder="GTBank" />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Account Number</label>
                    <input value={newStaff.accountNumber} onChange={(e) => setNewStaff({ ...newStaff, accountNumber: e.target.value })} className={inputClass} placeholder="0123456789" />
                  </div>
                </div>
                {newStaff.email && (
                  <div className="bg-[#00D084]/5 border border-[#00D084]/20 rounded-xl px-4 py-3 flex items-center gap-3">
                    <Mail size={16} className="text-[#00D084] flex-shrink-0" />
                    <p className="text-[#94A3B8] text-xs">
                      An invitation email will be sent to <span className="text-[#F1F5F9] font-medium">{newStaff.email}</span> to join as staff
                    </p>
                  </div>
                )}
                <button
                  onClick={handleCreate}
                  disabled={isSaving || !newStaff.name || !newStaff.role}
                  className="w-full bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Add Staff & Send Invite</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Staff Modal */}
      <AnimatePresence>
        {showEditModal && editingStaff && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => { setShowEditModal(false); setEditingStaff(null); }}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[#F1F5F9] text-lg font-semibold">Edit Staff</h3>
                <button onClick={() => { setShowEditModal(false); setEditingStaff(null); }}>
                  <X size={18} className="text-[#94A3B8]" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Full Name</label>
                    <input value={editingStaff.name} onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Job Role</label>
                    <input value={editingStaff.role} onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Department</label>
                    <select value={editingStaff.department || ''} onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })} className={inputClass}>
                      <option value="">No Department</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-xs mb-1">Monthly Salary (₦)</label>
                    <input type="text" value={editingStaff.monthlySalary ? editingStaff.monthlySalary.toLocaleString('en-US') : ''} onChange={(e) => handleSalaryChange(e.target.value, true)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-xs mb-1">Status</label>
                  <select value={editingStaff.status} onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })} className={inputClass}>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pay All Modal */}
      <AnimatePresence>
        {showPayModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[#F1F5F9] text-lg font-semibold">
                  {selected.length > 0 ? `Pay ${selected.length} Selected` : 'Pay All Staff'}
                </h3>
                <button onClick={() => setShowPayModal(false)}>
                  <X size={18} className="text-[#94A3B8]" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-[#0F1117] rounded-xl p-4 border border-[#1E2535]">
                  <p className="text-[#94A3B8] text-xs mb-1">Total Amount</p>
                  <p className="text-[#F1F5F9] text-2xl font-bold">
                    {formatPay(
                      staff
                        .filter((s) => selected.length === 0 || selected.includes(s.id))
                        .filter((s) => s.status === 'ACTIVE')
                        .reduce((sum: number, s: any) => sum + s.monthlySalary, 0),
                    )}
                  </p>
                  <p className="text-[#475569] text-xs mt-1">
                    {staff.filter((s) => selected.length === 0 || selected.includes(s.id)).filter((s) => s.status === 'ACTIVE').length} active staff
                  </p>
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-xs mb-1">Reason</label>
                  <input value={payReason} onChange={(e) => setPayReason(e.target.value)} className={inputClass} placeholder="Monthly salary" />
                </div>
                <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <CreditCard size={16} className="text-[#8B5CF6] flex-shrink-0" />
                  <p className="text-[#94A3B8] text-xs">
                    Payment processed via <span className="text-[#F1F5F9] font-medium">Paystack</span>
                  </p>
                </div>
                <button
                  onClick={handlePayAll}
                  disabled={isSaving}
                  className="w-full bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><DollarSign size={16} /> Process Payroll</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}