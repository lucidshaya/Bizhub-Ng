import React, { useState } from 'react';
import {
  Search, Plus, DollarSign, Edit2, CheckSquare, Square,
  X, UserX, Loader2, Trash2, Save, Check, CreditCard, RefreshCw, Mail, SendHorizonal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePaystackPayment } from 'react-paystack';
import { staffApi, authApi, settingsApi, dashboardApi, paymentsApi } from '../../services/api';
import { useToast } from './Toast';

export function StaffPayrollScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [payReason, setPayReason] = useState('Monthly salary');
  const [paidStaffIds, setPaidStaffIds] = useState<Set<string>>(new Set());
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmPay, setConfirmPay] = useState<any | null>(null);

  const [newStaff, setNewStaff] = useState({
    name: '', email: '', phone: '', role: '', department: '',
    bankName: '', accountNumber: '', monthlySalary: 0,
  });

  // Queries
  const { data: staffData = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff_list'],
    queryFn: () => staffApi.getAll().then(res => res.data),
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => settingsApi.getProfile().then(res => res.data),
  });

  const departments = profileData?.business?.departments || [];
  const plan = profileData?.business?.plan || 'STARTER';
  const walletBalance = profileData?.business?.walletBalance || 0;
  const userEmail = profileData?.email || '';
  const { data: banks = [] } = useQuery({
    queryKey: ['banks'],
    queryFn: () => paymentsApi.getBanks().then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });

  // Mutations
  const createStaff = useMutation({
    mutationFn: (data: any) => staffApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    }
  });

  const updateStaff = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => staffApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    }
  });

  const deleteStaff = useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    }
  });

  const payStaff = useMutation({
    mutationFn: (id: string) => staffApi.pay(id, staffData.find((s: any) => s.id === id).monthlySalary, 'Monthly salary'),
    onSuccess: (res, variables) => {
      setPaidStaffIds(prev => new Set([...prev, variables]));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    }
  });

  const payAllMutation = useMutation({
    mutationFn: (data: any) => staffApi.payAll(data.ids, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['staff_list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    }
  });

  const resendInviteMutation = useMutation({
    mutationFn: (staffId: string) => staffApi.resendInvite(staffId),
    onSuccess: (_res, staffId) => {
      const staffMember = staffData.find((s: any) => s.id === staffId);
      toast.success(`Invite resent to ${staffMember?.email || 'staff member'}`);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Failed to resend invite');
    }
  });

  const handleCreate = async () => {
    if (!newStaff.name || !newStaff.role) {
      toast.warning('Name and role are required');
      return;
    }
    if (plan === 'GROWTH' && staffData.length >= 50) {
      toast.error('Limit reached. Upgrade to Scale.');
      return;
    }

    createStaff.mutate(newStaff, {
      onSuccess: async () => {
        setShowAddModal(false);
        const staffName = newStaff.name;
        const staffEmail = newStaff.email;
        const staffRole = newStaff.role;
        const staffPhone = newStaff.phone;

        setNewStaff({ name: '', email: '', phone: '', role: '', department: '', bankName: '', accountNumber: '', monthlySalary: 0 });
        setSalaryInput('');

        if (staffEmail) {
          try {
            await authApi.inviteWorker({
              name: staffName,
              email: staffEmail,
              role: staffRole,
              phone: staffPhone || undefined,
            });
            toast.success(`Staff added & invitation sent to ${staffEmail}`);
          } catch {
            toast.info(`Staff added, invite failed.`);
          }
        } else {
          toast.success(`${staffName} added successfully`);
        }
      },
      onError: (e: any) => {
        toast.error(e?.response?.data?.message || 'Failed to add staff member');
      }
    });
  };

  const handleUpdate = async () => {
    if (!editingStaff) return;
    // Only send fields that exist in UpdateStaffDto — forbidNonWhitelisted is enabled on the backend
    const payload = {
      name: editingStaff.name,
      email: editingStaff.email || undefined,
      phone: editingStaff.phone || undefined,
      role: editingStaff.role,
      department: editingStaff.department || undefined,
      bankName: editingStaff.bankName || undefined,
      accountNumber: editingStaff.accountNumber || undefined,
      monthlySalary: editingStaff.monthlySalary,
      status: editingStaff.status,
    };
    updateStaff.mutate({ id: editingStaff.id, data: payload }, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingStaff(null);
        toast.success('Staff profile updated successfully');
      },
      onError: (e: any) => {
        toast.error(e?.response?.data?.message || 'Update failed');
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    setConfirmDelete({ id, name });
  };

  const confirmDoDelete = () => {
    if (!confirmDelete) return;
    deleteStaff.mutate(confirmDelete.id, {
      onSuccess: () => {
        toast.success(`${confirmDelete.name} has been removed from the team`);
        setConfirmDelete(null);
      },
      onError: () => {
        toast.error('Failed to remove staff member. Please try again.');
        setConfirmDelete(null);
      }
    });
  };

  const handlePayIndividual = async (s: any) => {
    setConfirmPay(s);
  };

  const confirmDoPay = () => {
    if (!confirmPay) return;
    payStaff.mutate(confirmPay.id, {
      onSuccess: () => {
        toast.success(`₦${confirmPay.monthlySalary?.toLocaleString('en-NG')} paid to ${confirmPay.name}`);
        setConfirmPay(null);
      },
      onError: () => {
        toast.error('Payment failed. Please check your wallet balance.');
        setConfirmPay(null);
      }
    });
  };

  const handlePayAll = async () => {
    payAllMutation.mutate({
      ids: selected.length > 0 ? selected : undefined,
      reason: payReason,
    }, {
      onSuccess: (result: any) => {
        const paidIds = staffData
          .filter((s: any) => selected.length === 0 || selected.includes(s.id))
          .filter((s: any) => s.status === 'ACTIVE')
          .map((s: any) => s.id);
        setPaidStaffIds(prev => new Set([...prev, ...paidIds]));
        toast.success(`Payroll complete! Paid ${result.data.staffCount}`);
        setSelected([]);
        setShowPayModal(false);
      },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Bulk payment failed')
    });
  };

  // Paystack Funding
  const config = {
    reference: (new Date()).getTime().toString(),
    email: userEmail || 'user@bizhub.ng',
    amount: parseInt(fundAmount.replace(/\D/g, '')) * 100, // in kobo
    publicKey: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d2d6c6a6e5b4c1a2f3e4d5c6b7a8',
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any) => {
    setIsFunding(true);
    try {
      await dashboardApi.verifyFunding(reference.reference);
      toast.success("Funding successful!");
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Verification failed");
    } finally {
      setIsFunding(false);
      setShowFundModal(false);
      setFundAmount('');
    }
  };

  const onClose = () => {
    toast.info("Transaction cancelled");
    setIsFunding(false);
  };

  const handleFund = () => {
    if (!fundAmount) return;
    setIsFunding(true);
    initializePayment({ onSuccess, onClose });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const selectedStaffNames = selected.length === 1
    ? staffData.find((s: any) => s.id === selected[0])?.name || 'User'
    : '';

  const formatPay = (v: number) => `₦${v?.toLocaleString('en-NG') || '0'}`;

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

  const filtered = staffData.filter(
    (s: any) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      (s.department || '').toLowerCase().includes(search.toLowerCase()),
  );

  if (staffLoading && staffData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  const inputClass = 'w-full bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[var(--text-main)] text-xl font-bold">Personnel & Payroll</h2>
          <p className="text-[var(--text-dim)] text-sm">{staffData.length} team members registered</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl px-4 py-2 shadow-sm">
            <p className="text-[var(--text-dim)] text-[10px] uppercase font-bold tracking-wider">Business Wallet</p>
            <p className="text-[var(--accent)] text-lg font-black">{formatPay(walletBalance)}</p>
          </div>

          <div className="flex items-center gap-2">
            {selected.length > 0 ? (
              <button
                onClick={() => setShowPayModal(true)}
                className="flex items-center gap-2 bg-[var(--accent)] hover:opacity-90 text-[var(--bg-primary)] font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[var(--accent)]/20"
              >
                <DollarSign size={16} />
                Pay {selected.length === 1 ? 'Selected' : `(${selected.length})`}
              </button>
            ) : (
              <button
                onClick={() => setShowPayModal(true)}
                className="flex items-center gap-2 bg-[var(--bg-tertiary)] text-[var(--text-main)] hover:bg-[var(--border-main)] font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
              >
                <DollarSign size={16} />
                Run Payroll
              </button>
            )}
            
            <button
              onClick={() => setShowFundModal(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus size={16} />
              Fund
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[var(--accent)] text-[var(--bg-primary)] font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[var(--accent)]/20"
            >
              <Plus size={16} />
              Add Staff
            </button>
          </div>
        </div>
      </div>

      {/* Search & Utility */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role or department..."
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl pl-11 pr-4 py-2.5 text-[var(--text-main)] text-sm placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] transition-all"
          />
        </div>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['staff_list'] })}
          className="p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl text-[var(--text-dim)] hover:text-[var(--accent)] transition-all"
        >
          <RefreshCw size={18} className={staffLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Staff Table */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-12 text-center shadow-sm">
          <UserX size={48} className="text-[var(--text-dim)] mx-auto mb-4 opacity-20" />
          <h3 className="text-[var(--text-main)] text-lg font-bold mb-1">No results found</h3>
          <p className="text-[var(--text-dim)] text-sm mb-6">Try adjusting your search or add a new staff member.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--accent)] text-[var(--bg-primary)] font-bold px-6 py-2.5 rounded-xl text-sm hover:scale-105 transition-transform"
          >
            <Plus size={16} className="inline mr-2" /> Register Staff
          </button>
        </div>
      ) : (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-tertiary)]/50">
                  <th className="py-4 px-6 w-8">
                    <button onClick={() => {
                      if (selected.length === filtered.length) setSelected([]);
                      else setSelected(filtered.map((s: any) => s.id));
                    }}>
                      {selected.length === filtered.length && filtered.length > 0 ? (
                        <CheckSquare size={18} className="text-[var(--accent)]" />
                      ) : (
                        <Square size={18} className="text-[var(--text-dim)]" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Personnel</th>
                  <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Role & Dept</th>
                  <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Compensation</th>
                  <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Status</th>
                  <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Invite</th>
                  <th className="py-4 px-4 text-[var(--text-dim)] text-[10px] uppercase font-black tracking-widest">Activity</th>
                  <th className="py-4 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-tertiary)]/30 transition-colors group">
                    <td className="py-4 px-6">
                      <button onClick={() => toggleSelect(s.id)}>
                        {selected.includes(s.id) ? (
                          <CheckSquare size={18} className="text-[var(--accent)]" />
                        ) : (
                          <Square size={18} className="text-[var(--text-dim)] group-hover:text-[var(--accent)]/50 transition-colors" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg">
                          {s.avatarInitials || s.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[var(--text-main)] text-sm font-bold">{s.name}</p>
                          <p className="text-[var(--text-dim)] text-[10px]">{s.email || 'No email provided'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-[var(--text-main)] text-sm font-medium">{s.role}</p>
                      <p className="text-[var(--text-dim)] text-[10px] font-bold uppercase tracking-tighter mt-0.5">{s.department || 'General'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-[var(--text-main)] text-sm font-black">{formatPay(s.monthlySalary)}</p>
                      <p className="text-[var(--text-dim)] text-[8px] uppercase font-medium">Per Month</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${statusColor(s.status)}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {s.email ? (
                        s.inviteStatus === 'ACCEPTED' ? (
                          <div className="flex items-center gap-1.5 text-[#00D084] font-black text-[10px] bg-[#00D084]/10 px-2 py-1 rounded-lg w-fit">
                            <Check size={10} strokeWidth={3} /> Accepted
                          </div>
                        ) : s.inviteStatus === 'PENDING' ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-[#F59E0B] font-black text-[10px] bg-[#F59E0B]/10 px-2 py-1 rounded-lg w-fit">
                              <Mail size={10} /> Pending
                            </div>
                            <button
                              onClick={() => resendInviteMutation.mutate(s.id)}
                              disabled={resendInviteMutation.isPending && resendInviteMutation.variables === s.id}
                              className="flex items-center gap-1 text-[9px] font-black text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md transition-all w-fit disabled:opacity-50"
                            >
                              {resendInviteMutation.isPending && resendInviteMutation.variables === s.id
                                ? <Loader2 size={9} className="animate-spin" />
                                : <SendHorizonal size={9} />}
                              Resend Invite
                            </button>
                          </div>
                        ) : (
                          // No invite sent yet — show a quick send button
                          s.email ? (
                            <button
                              onClick={() => resendInviteMutation.mutate(s.id)}
                              disabled={resendInviteMutation.isPending && resendInviteMutation.variables === s.id}
                              className="flex items-center gap-1 text-[9px] font-black text-[var(--text-dim)] hover:text-amber-400 bg-[var(--bg-tertiary)] hover:bg-amber-500/10 px-2 py-1 rounded-lg transition-all w-fit disabled:opacity-50 border border-[var(--border-main)] hover:border-amber-500/30"
                            >
                              {resendInviteMutation.isPending && resendInviteMutation.variables === s.id
                                ? <Loader2 size={9} className="animate-spin" />
                                : <SendHorizonal size={9} />}
                              Send Invite
                            </button>
                          ) : <span className="text-[var(--text-dim)] text-[10px] opacity-40">—</span>
                        )
                      ) : (
                        <span className="text-[var(--text-dim)] text-[10px] opacity-40">No email</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {paidStaffIds.has(s.id) ? (
                        <div className="flex items-center gap-1.5 text-[#00D084] font-black text-[10px] bg-[#00D084]/10 px-2 py-1 rounded-lg w-fit">
                          <Check size={12} strokeWidth={3} /> SETTLED
                        </div>
                      ) : (
                        <span className="text-[var(--text-dim)] text-[10px] font-medium italic opacity-50">Awaiting payment</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePayIndividual(s)}
                          className="p-2 hover:bg-[#00D084]/10 rounded-xl text-[#00D084] transition-all"
                          title="Pay Salary"
                        >
                          <DollarSign size={16} />
                        </button>
                        <button
                          onClick={() => { setEditingStaff({ ...s }); setShowEditModal(true); }}
                          className="p-2 hover:bg-blue-500/10 rounded-xl text-blue-500 transition-all"
                          title="Edit Profile"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-2 hover:bg-red-500/10 rounded-xl text-red-500 transition-all"
                          title="Remove from Team"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[var(--text-main)] text-xl font-bold">New Staff Enrollment</h3>
                  <p className="text-[var(--text-dim)] text-xs">Fill in the details to add a new member to your team.</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full text-[var(--text-dim)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Full Name</label>
                    <input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className={inputClass} placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Work Email</label>
                    <input value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className={inputClass} placeholder="jane@company.com" />
                  </div>
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Job Role</label>
                    <input value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })} className={inputClass} placeholder="Operations Lead" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Phone Number</label>
                    <input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value.replace(/[^\d+]/g, '') })} className={inputClass} placeholder="+234..." />
                  </div>
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Department</label>
                    <select value={newStaff.department} onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} className={inputClass}>
                      <option value="">Select Dept</option>
                      {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Monthly Salary (₦)</label>
                    <input value={newStaff.monthlySalary?.toLocaleString('en-US') || ''} onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNewStaff({ ...newStaff, monthlySalary: parseInt(val) || 0 });
                    }} className={inputClass} placeholder="150,000" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Bank Name</label>
                  <select 
                    value={newStaff.bankName} 
                    onChange={(e) => setNewStaff({ ...newStaff, bankName: e.target.value })} 
                    className={inputClass}
                  >
                    <option value="">Select Bank</option>
                    {banks.map((b: any) => (
                      <option key={`${b.code}-${b.name}`} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Account Number</label>
                  <input value={newStaff.accountNumber} onChange={(e) => setNewStaff({ ...newStaff, accountNumber: e.target.value })} className={inputClass} placeholder="0123456789" />
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={createStaff.isPending}
                className="w-full bg-[var(--accent)] text-[var(--bg-primary)] font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-[var(--accent)]/20"
              >
                {createStaff.isPending ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Confirm Registration</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Staff Modal */}
      <AnimatePresence>
        {showEditModal && editingStaff && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowEditModal(false); setEditingStaff(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-3xl p-8 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[var(--text-main)] text-xl font-bold">Update Profile</h3>
                <button onClick={() => { setShowEditModal(false); setEditingStaff(null); }}>
                  <X size={20} className="text-[var(--text-dim)]" />
                </button>
              </div>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Full Name</label>
                  <input value={editingStaff.name} onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Role</label>
                    <input value={editingStaff.role} onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Monthly Pay (₦)</label>
                    <input 
                      value={editingStaff.monthlySalary?.toLocaleString('en-US') || ''} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setEditingStaff({ ...editingStaff, monthlySalary: parseInt(val) || 0 });
                      }} 
                      className={inputClass} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Employment Status</label>
                  <select value={editingStaff.status} onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })} className={inputClass}>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Bank Name</label>
                    <select 
                      value={editingStaff.bankName || ''} 
                      onChange={(e) => setEditingStaff({ ...editingStaff, bankName: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="">Select Bank</option>
                      {banks.map((b: any) => (
                        <option key={`${b.code}-${b.name}`} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Account Number</label>
                    <input 
                      value={editingStaff.accountNumber || ''} 
                      onChange={(e) => setEditingStaff({ ...editingStaff, accountNumber: e.target.value })} 
                      className={inputClass}
                      placeholder="0123456789"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdate}
                disabled={updateStaff.isPending}
                className="w-full bg-blue-500 text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
              >
                {updateStaff.isPending ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Update Details</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pay All/Selected Modal */}
      <AnimatePresence>
        {showPayModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[var(--text-main)] text-xl font-bold">Process Payroll</h3>
                <button onClick={() => setShowPayModal(false)}>
                  <X size={20} className="text-[var(--text-dim)]" />
                </button>
              </div>

              <div className="bg-[var(--bg-tertiary)]/50 rounded-2xl p-6 border border-[var(--border-main)] mb-6 text-center">
                <p className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-wider mb-2">Total Estimated Payout</p>
                <p className="text-[var(--text-main)] text-3xl font-black">
                  {formatPay(
                    staffData
                      .filter((s: any) => selected.length === 0 || selected.includes(s.id))
                      .filter((s: any) => s.status === 'ACTIVE')
                      .reduce((sum: number, s: any) => sum + s.monthlySalary, 0)
                  )}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  <p className="text-[var(--text-dim)] text-[10px] font-bold">
                    {staffData.filter((s: any) => (selected.length === 0 || selected.includes(s.id)) && s.status === 'ACTIVE').length} RECIPIENTS
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Purpose of Payment</label>
                <input value={payReason} onChange={(e) => setPayReason(e.target.value)} className={inputClass} placeholder="Monthly Salary Cycle" />
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <CreditCard size={20} />
                </div>
                <p className="text-[var(--text-dim)] text-xs leading-relaxed">
                  Funds will be deducted from your <span className="text-[var(--text-main)] font-bold">Bizhub Wallet</span> immediately.
                </p>
              </div>

              <button
                onClick={handlePayAll}
                disabled={payAllMutation.isPending}
                className="w-full bg-[var(--accent)] text-[var(--bg-primary)] font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-[var(--accent)]/20"
              >
                {payAllMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <><DollarSign size={18} /> Execute Payout</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fund Modal */}
      <AnimatePresence>
        {showFundModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFundModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-3xl p-8 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[var(--text-main)] text-xl font-bold">Wallet Top-up</h3>
                <button onClick={() => setShowFundModal(false)}>
                  <X size={20} className="text-[var(--text-dim)]" />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5 ml-1">Amount to Add (₦)</label>
                  <input
                    type="text"
                    value={fundAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFundAmount(val ? parseInt(val).toLocaleString('en-US') : '');
                    }}
                    className={inputClass}
                    placeholder="e.g. 100,000"
                  />
                </div>
                
                <div className="p-4 bg-[var(--bg-tertiary)]/50 rounded-2xl border border-[var(--border-main)] flex items-center gap-3">
                  <div className="text-[20px]">💳</div>
                  <p className="text-[var(--text-dim)] text-[10px] leading-tight">Secure checkout provided by <span className="text-[var(--text-main)] font-black">Paystack</span>. Supports Cards, Transfer, and USSD.</p>
                </div>
              </div>

              <button
                disabled={isFunding || !fundAmount}
                onClick={handleFund}
                className="w-full bg-[var(--accent)] text-[var(--bg-primary)] font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-3 shadow-xl shadow-[var(--accent)]/20 hover:opacity-90 active:scale-95 transition-all"
              >
                {isFunding ? <Loader2 size={18} className="animate-spin" /> : <span>Initialize Payment</span>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-[#0D1117] border border-[#EF4444]/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl shadow-black/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mb-5">
                  <Trash2 size={28} className="text-[#EF4444]" />
                </div>
                <h3 className="text-[var(--text-main)] text-lg font-black mb-2">Remove Team Member</h3>
                <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                  You are about to permanently remove <span className="text-[var(--text-main)] font-bold">{confirmDelete.name}</span> from your team. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3.5 rounded-2xl border border-[var(--border-main)] text-[var(--text-dim)] font-bold text-sm hover:bg-[var(--bg-tertiary)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDoDelete}
                  disabled={deleteStaff.isPending}
                  className="flex-1 py-3.5 rounded-2xl bg-[#EF4444] text-white font-black text-sm hover:bg-[#DC2626] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#EF4444]/20"
                >
                  {deleteStaff.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Remove</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pay Individual Confirmation Modal */}
      <AnimatePresence>
        {confirmPay && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="bg-[#0D1117] border border-[#00D084]/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl shadow-black/50"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#00D084]/10 border border-[#00D084]/20 flex items-center justify-center mb-5">
                  <DollarSign size={28} className="text-[#00D084]" />
                </div>
                <h3 className="text-[var(--text-main)] text-lg font-black mb-2">Confirm Salary Payment</h3>
                <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                  Pay monthly salary of <span className="text-[#00D084] font-black text-base">₦{confirmPay.monthlySalary?.toLocaleString('en-NG')}</span> to <span className="text-[var(--text-main)] font-bold">{confirmPay.name}</span>?
                </p>
                <p className="text-[var(--text-dim)] text-xs mt-2 opacity-60">Funds will be deducted from your Bizhub Wallet</p>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setConfirmPay(null)}
                  className="flex-1 py-3.5 rounded-2xl border border-[var(--border-main)] text-[var(--text-dim)] font-bold text-sm hover:bg-[var(--bg-tertiary)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDoPay}
                  disabled={payStaff.isPending}
                  className="flex-1 py-3.5 rounded-2xl bg-[#00D084] text-[#0A0E1A] font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00D084]/20"
                >
                  {payStaff.isPending ? <Loader2 size={16} className="animate-spin" /> : <><DollarSign size={16} /> Pay Now</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}