import React, { useState, useEffect } from 'react';
import { Building2, Users, Network, Plus, Trash2, Loader2, Save, Clock, Shield, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { settingsApi } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

export function OrganizationSettingsScreen() {
    const toast = useToast();
    const { user } = useAuth();
    const [departments, setDepartments] = useState<string[]>([]);
    const [newDept, setNewDept] = useState('');
    const [morningShift, setMorningShift] = useState('09:00 - 17:00');
    const [nightShift, setNightShift] = useState('17:00 - 01:00');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [business, setBusiness] = useState<any>(null);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [roleChanges, setRoleChanges] = useState<Record<string, string>>({});
    const [savingRole, setSavingRole] = useState<string | null>(null);

    const ROLE_OPTIONS = [
        { value: 'ADMIN', label: 'Sub Admin', color: '#3B82F6' },
        { value: 'WORKER', label: 'Worker', color: '#F59E0B' },
        { value: 'VIEWER', label: 'Viewer', color: '#8B5CF6' },
    ];
    const roleLabel = (role: string) => ({ OWNER: 'Owner', ADMIN: 'Sub Admin', WORKER: 'Worker', VIEWER: 'Viewer', STAFF: 'Staff' }[role] || role);
    const roleColor = (role: string) => ({ OWNER: '#00D084', ADMIN: '#3B82F6', WORKER: '#F59E0B', VIEWER: '#8B5CF6', STAFF: '#94A3B8' }[role] || '#94A3B8');


    useEffect(() => {
        loadProfile();
        loadTeam();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const res = await settingsApi.getProfile();
            setBusiness(res.data.business);
            setDepartments(res.data.business?.departments || []);
            if (res.data.business?.morningShift) setMorningShift(res.data.business.morningShift);
            if (res.data.business?.nightShift) setNightShift(res.data.business.nightShift);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTeam = async () => {
        try {
            const res = await api.get('/auth/team');
            setTeamMembers(res.data);
        } catch { /* silent */ }
    };

    const saveRole = async (memberId: string) => {
        const newRole = roleChanges[memberId];
        if (!newRole) return;
        setSavingRole(memberId);
        try {
            await api.patch(`/auth/team/${memberId}/role`, { role: newRole });
            toast.success('Role updated — email notification sent');
            setRoleChanges(prev => { const n = { ...prev }; delete n[memberId]; return n; });
            loadTeam();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to update role');
        } finally {
            setSavingRole(null);
        }
    };


    const handleAddDept = async () => {
        if (!newDept.trim() || departments.includes(newDept.trim())) return;
        const updated = [...departments, newDept.trim()];
        setDepartments(updated);
        setNewDept('');

        if (business) {
            setIsSaving(true);
            try {
                await settingsApi.updateBusiness({ departments: updated });
                toast.success('Department added');
            } catch (err) {
                toast.error('Failed to save department');
                setDepartments(departments); // revert
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleRemoveDept = async (dept: string) => {
        const updated = departments.filter((d) => d !== dept);
        setDepartments(updated);

        if (business) {
            setIsSaving(true);
            try {
                await settingsApi.updateBusiness({ departments: updated });
                toast.success('Department removed');
            } catch (err) {
                toast.error('Failed to remove department');
                setDepartments(departments); // revert
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleSave = async () => {
        if (!business) return;
        setIsSaving(true);
        try {
            const payload: any = {
                departments,
                morningShift,
                nightShift,
            };

            // Only add properties that exist and were fetched to avoid validation errors
            if (business.name) payload.name = business.name;
            if (business.type) payload.type = business.type;
            if (business.address) payload.address = business.address;
            if (business.city) payload.city = business.city;
            if (business.state) payload.state = business.state;
            if (business.phone) payload.phone = business.phone;
            if (business.email) payload.email = business.email;
            if (business.logoUrl) payload.logoUrl = business.logoUrl;

            await settingsApi.updateBusiness(payload);
            toast.success('Organization settings saved successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 size={32} className="text-[#00D084] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 pb-24">
            {/* Header Info */}
            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[#F1F5F9] flex items-center gap-2">
                            <Building2 className="text-[#00D084]" /> Organization Settings
                        </h2>
                        <p className="text-[#94A3B8] mt-1 text-sm">
                            Manage your company's structure, departments, and view role permissions.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Departments */}
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 flex flex-col shadow-lg">
                    <h3 className="text-[#F1F5F9] font-bold text-lg flex items-center gap-2 mb-4">
                        <Network className="text-[#3B82F6]" size={20} /> Departments
                    </h3>
                    <p className="text-[#94A3B8] text-sm mb-4">
                        Create departments to categorize your staff members.
                    </p>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddDept()}
                            placeholder="e.g. Sales, Engineering..."
                            className="flex-1 bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00D084]"
                        />
                        <button
                            onClick={handleAddDept}
                            className="bg-[#1E2535] hover:bg-[#2A3548] text-[#F1F5F9] px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} /> Add
                        </button>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {departments.length === 0 ? (
                            <p className="text-[#475569] text-sm italic py-4 text-center">No departments added yet.</p>
                        ) : (
                            departments.map((dept, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={idx}
                                    className="flex items-center justify-between bg-[#0F1117] border border-[#1E2535] px-4 py-3 rounded-xl"
                                >
                                    <span className="text-[#F1F5F9] text-sm font-medium">{dept}</span>
                                    <button
                                        onClick={() => handleRemoveDept(dept)}
                                        className="text-[#475569] hover:text-[#EF4444] transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Work Shifts */}
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 shadow-lg">
                    <h3 className="text-[#F1F5F9] font-bold text-lg flex items-center gap-2 mb-4">
                        <Clock className="text-[#F59E0B]" size={20} /> Work Shifts
                    </h3>
                    <p className="text-[#94A3B8] text-sm mb-6">
                        Define standard working hours for your teams.
                    </p>
                    <div className="space-y-4">
                        <div className="bg-[#0F1117] border border-[#1E2535] rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[#F1F5F9] font-semibold text-sm">Morning Shift</span>
                                <input
                                    type="text"
                                    value={morningShift}
                                    onChange={(e) => setMorningShift(e.target.value)}
                                    className="bg-[#0F1117] border border-[#1E2535] rounded-md px-2 py-1 text-[#00D084] font-bold text-xs text-right w-32 focus:outline-none focus:border-[#00D084]"
                                    placeholder="09:00 - 17:00"
                                />
                            </div>
                            <p className="text-[#475569] text-xs">Standard daytime operating hours for general staff.</p>
                        </div>
                        <div className="bg-[#0F1117] border border-[#1E2535] rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[#F1F5F9] font-semibold text-sm">Night Shift</span>
                                <input
                                    type="text"
                                    value={nightShift}
                                    onChange={(e) => setNightShift(e.target.value)}
                                    className="bg-[#0F1117] border border-[#1E2535] rounded-md px-2 py-1 text-[#3B82F6] font-bold text-xs text-right w-32 focus:outline-none focus:border-[#3B82F6]"
                                    placeholder="17:00 - 01:00"
                                />
                            </div>
                            <p className="text-[#475569] text-xs">Evening operations and extended support teams.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Roles & Permissions Reference */}
            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 shadow-lg">
                <h3 className="text-[#F1F5F9] font-bold text-lg flex items-center gap-2 mb-6">
                    <Users className="text-[#8B5CF6]" size={20} /> Role Permissions Definitions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div className="bg-[#0F1117] border border-[#1E2535] rounded-xl p-5 relative overflow-hidden group hover:border-[#8B5CF6] transition-colors">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#8B5CF6]/20 to-transparent rounded-bl-full" />
                        <h4 className="text-[#F1F5F9] font-bold mb-1 text-base">Admin (Owner)</h4>
                        <p className="text-[#00D084] text-xs font-semibold mb-4">Full Access</p>
                        <ul className="space-y-2 text-sm text-[#94A3B8]">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00D084]" /> Create & Delete Organization</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00D084]" /> Manage Billing & Subscriptions</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00D084]" /> Reset Transaction PINs</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00D084]" /> Add Sub-Admins and Workers</li>
                        </ul>
                    </div>

                    <div className="bg-[#0F1117] border border-[#1E2535] rounded-xl p-5 relative overflow-hidden group hover:border-[#3B82F6] transition-colors">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#3B82F6]/20 to-transparent rounded-bl-full" />
                        <h4 className="text-[#F1F5F9] font-bold mb-1 text-base">Sub Admin</h4>
                        <p className="text-[#3B82F6] text-xs font-semibold mb-4">Manager Access</p>
                        <ul className="space-y-2 text-sm text-[#94A3B8]">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> View Dashboard & Analytics</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> Add & Pay Staff Members</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> Send Bulk Emails</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> Cannot delete organization</li>
                        </ul>
                    </div>

                    <div className="bg-[#0F1117] border border-[#1E2535] rounded-xl p-5 relative overflow-hidden group hover:border-[#F59E0B] transition-colors">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#F59E0B]/20 to-transparent rounded-bl-full" />
                        <h4 className="text-[#F1F5F9] font-bold mb-1 text-base">Worker</h4>
                        <p className="text-[#F59E0B] text-xs font-semibold mb-4">Limited Access</p>
                        <ul className="space-y-2 text-sm text-[#94A3B8]">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> View Personal Dashboard</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Access Team Chat</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> No Transactions Access</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> No Bulk Email Access</li>
                        </ul>
                    </div>

                </div>
            </div>
            {/* Team Members */}
            {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 shadow-lg">
                    <h3 className="text-[#F1F5F9] font-bold text-lg flex items-center gap-2 mb-2">
                        <Shield className="text-[#3B82F6]" size={20} /> Team Members & Roles
                    </h3>
                    <p className="text-[#94A3B8] text-sm mb-5">Change a member's role. They will receive an email notification automatically.</p>
                    {teamMembers.length === 0 ? (
                        <p className="text-[#475569] text-sm text-center py-6">No team members found. Invite workers to get started.</p>
                    ) : (
                        <div className="space-y-3">
                            {teamMembers.map(member => {
                                const isOwner = member.role === 'OWNER';
                                const isMe = member.id === user?.id;
                                const currentRole = roleChanges[member.id] || member.role;
                                return (
                                    <motion.div key={member.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center justify-between bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                                                style={{ background: `${roleColor(member.role)}20`, color: roleColor(member.role) }}>
                                                {member.fullName?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-[#F1F5F9] text-sm font-semibold">{member.fullName} {isMe && <span className="text-xs text-[#475569]">(you)</span>}</p>
                                                <p className="text-[#64748B] text-xs">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isOwner || isMe ? (
                                                <span className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: `${roleColor(member.role)}20`, color: roleColor(member.role) }}>
                                                    {roleLabel(member.role)}
                                                </span>
                                            ) : (
                                                <>
                                                    <select
                                                        value={currentRole}
                                                        onChange={e => setRoleChanges(prev => ({ ...prev, [member.id]: e.target.value }))}
                                                        className="bg-[#161B27] border border-[#1E2535] rounded-lg px-3 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] transition-colors"
                                                    >
                                                        {ROLE_OPTIONS.map(r => (
                                                            <option key={r.value} value={r.value}>{r.label}</option>
                                                        ))}
                                                    </select>
                                                    {roleChanges[member.id] && roleChanges[member.id] !== member.role && (
                                                        <button
                                                            onClick={() => saveRole(member.id)}
                                                            disabled={savingRole === member.id}
                                                            className="bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                                        >
                                                            {savingRole === member.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                                                            Save
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
