import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Loader2, X, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    isOwner: boolean;
}

export function DeleteAccountModal({ isOpen, onClose, userEmail, isOwner }: DeleteAccountModalProps) {
    const toast = useToast();
    const navigate = useNavigate();
    const { deleteAccount } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

    const handleDelete = async () => {
        if (!isConfirmed) {
            setError('Please type DELETE into the confirmation box.');
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            await deleteAccount(password || undefined);
            toast.success('Your account has been deleted successfully.');
            onClose();
            navigate('/signup', { replace: true });
        } catch (err: any) {
            const serverMsg = err.response?.data?.message;
            if (Array.isArray(serverMsg)) {
                setError(serverMsg.join('. '));
            } else if (typeof serverMsg === 'string') {
                setError(serverMsg);
            } else if (err.response?.status === 401) {
                setError('Incorrect password. Please verify your password and try again.');
            } else {
                setError('Failed to delete account. Please try again or contact support.');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-[#161B27] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                                    <Trash2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[#F1F5F9] text-lg font-bold">Delete Account</h3>
                                    <p className="text-[#94A3B8] text-xs">Permanent removal of your profile</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Warning Box */}
                        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 mb-5 space-y-2">
                            <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                                <AlertTriangle size={16} />
                                <span>Warning: This action cannot be undone</span>
                            </div>
                            <p className="text-xs text-red-300/80 leading-relaxed">
                                {isOwner
                                    ? `Deleting this account will permanently erase your business, all associated staff records, transactions, inventory, and sales data.`
                                    : `Deleting your account will remove your worker credentials and revoke all access to this organization.`}
                            </p>
                            <p className="text-[11px] text-[#00D084] font-medium pt-1">
                                After deletion, this email ({userEmail}) will be completely released and can be used to create a brand new account anytime.
                            </p>
                        </div>

                        {/* Form Inputs */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[#94A3B8] text-xs font-medium mb-1 flex items-center gap-1.5">
                                    <Lock size={13} />
                                    <span>Account Password (if password set)</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your current password"
                                    disabled={isDeleting}
                                    className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-red-500/70"
                                />
                            </div>

                            <div>
                                <label className="block text-[#94A3B8] text-xs font-medium mb-1">
                                    Type <strong className="text-red-400 tracking-wider">DELETE</strong> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Type DELETE"
                                    disabled={isDeleting}
                                    className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-red-500"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[#EF4444] text-xs font-medium">
                                    {error}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[#1E2535] text-[#94A3B8] hover:bg-[#1E2535] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={!isConfirmed || isDeleting}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={16} />
                                            <span>Delete Account</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
