import React, { useState, useEffect } from 'react';
import { Building2, Users, Network, Plus, Trash2, Loader2, Save, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { settingsApi } from '../../services/api';
import { useToast } from './Toast';

export function OrganizationSettingsScreen() {
    const toast = useToast();
    const [departments, setDepartments] = useState<string[]>([]);
    const [newDept, setNewDept] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [business, setBusiness] = useState<any>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const res = await settingsApi.getProfile();
            setBusiness(res.data.business);
            setDepartments(res.data.business?.departments || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDept = () => {
        if (!newDept.trim() || departments.includes(newDept.trim())) return;
        setDepartments([...departments, newDept.trim()]);
        setNewDept('');
    };

    const handleRemoveDept = (dept: string) => {
        setDepartments(departments.filter((d) => d !== dept));
    };

    const handleSave = async () => {
        if (!business) return;
        setIsSaving(true);
        try {
            const payload: any = {
                departments,
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

                {/* Work Shifts (Suggestion implementation) */}
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 shadow-lg">
                    <h3 className="text-[#F1F5F9] font-bold text-lg flex items-center gap-2 mb-4">
                        <Clock className="text-[#F59E0B]" size={20} /> Work Shifts
                    </h3>
                    <p className="text-[#94A3B8] text-sm mb-6">
                        Define standard working hours for your teams. (Visual placeholder)
                    </p>
                    <div className="space-y-4">
                        <div className="bg-[#0F1117] border border-[#1E2535] rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[#F1F5F9] font-semibold text-sm">Morning Shift</span>
                                <span className="bg-[#00D084]/20 text-[#00D084] text-xs px-2 py-1 rounded-md font-bold">09:00 - 17:00</span>
                            </div>
                            <p className="text-[#475569] text-xs">Standard daytime operating hours for general staff.</p>
                        </div>
                        <div className="bg-[#0F1117] border border-[#1E2535] rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[#F1F5F9] font-semibold text-sm">Night Shift</span>
                                <span className="bg-[#3B82F6]/20 text-[#3B82F6] text-xs px-2 py-1 rounded-md font-bold">17:00 - 01:00</span>
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
        </div>
    );
}
