import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Loader2, X } from 'lucide-react';
import { authApi } from '../../services/api';
import { useToast } from './Toast';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const toast = useToast();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setIsSaving(true);
        setError('');
        try {
            await authApi.changePassword({ oldPassword, newPassword });
            toast.success('Password changed successfully!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        } catch (err: any) {
            const serverMsg = err.response?.data?.message;
            if (Array.isArray(serverMsg)) {
                setError(serverMsg.join('. '));
            } else if (typeof serverMsg === 'string') {
                setError(serverMsg);
            } else if (err.response?.status === 401) {
                setError('Incorrect current password. Please try again.');
            } else if (err.response?.status === 400) {
                setError('New password does not meet requirements (min. 8 characters).');
            } else {
                setError('Failed to change password. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 w-full max-w-sm"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[#F1F5F9] text-lg font-bold flex items-center gap-2">
                                <KeyRound size={20} className="text-[#3B82F6]" /> Change Password
                            </h3>
                            <button onClick={onClose} className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[#94A3B8] text-xs mb-1">Old Password</label>
                                <input 
                                    type="password" 
                                    value={oldPassword} 
                                    onChange={(e) => setOldPassword(e.target.value)} 
                                    className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#00D084]"
                                />
                            </div>
                            <div>
                                <label className="block text-[#94A3B8] text-xs mb-1">New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#00D084]"
                                />
                            </div>
                            <div>
                                <label className="block text-[#94A3B8] text-xs mb-1">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#00D084]"
                                />
                            </div>

                            {error && <p className="text-[#EF4444] text-xs font-medium">{error}</p>}

                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="w-full mt-4 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
