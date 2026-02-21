import React, { useState, useEffect } from 'react';
import {
  User, CreditCard, Shield, Crown, Upload, Eye, EyeOff, Check, Loader2, Save, LogOut, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { settingsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

type SettingsTab = 'profile' | 'payments' | 'security' | 'plan';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile & Business', icon: User },
  { id: 'payments', label: 'Payment Integrations', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'plan', label: 'Plan', icon: Crown },
];

export function SettingsScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editProfile, setEditProfile] = useState<any>({});
  const [editBusiness, setEditBusiness] = useState<any>({});

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [profRes, payRes] = await Promise.all([
        settingsApi.getProfile(),
        settingsApi.getPaymentIntegrations(),
      ]);
      setProfile(profRes.data);
      setPayments(payRes.data);
      setEditProfile({ fullName: profRes.data.fullName, phone: profRes.data.phone || '' });
      setEditBusiness(profRes.data.business || {});
    } catch { } finally { setIsLoading(false); }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateProfile(editProfile);
      await refreshProfile();
      toast({ title: 'Success', description: 'Profile updated successfully!', status: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile.', status: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleSaveBusiness = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateBusiness(editBusiness);
      toast({ title: 'Success', description: 'Business updated successfully!', status: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update business.', status: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleTogglePayment = async (provider: string, connected: boolean) => {
    try {
      await settingsApi.connectPayment({ provider, connected: !connected });
      await loadSettings();
    } catch { }
  };

  const inputClass = 'w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#00D084]';

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 size={32} className="text-[#00D084] animate-spin" /></div>;
  }

  const providerColors: Record<string, string> = { paystack: '#00C3F7', flutterwave: '#F5A623', moniepoint: '#1A56DB', opay: '#00B140' };

  return (
    <div className="p-6">
      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[#00D084]/10 text-[#00D084]' : 'text-[#94A3B8] hover:bg-[#161B27]'}`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
          <div className="pt-4 mt-4 border-t border-[#1E2535]">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Personal Info */}
                  <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                    <h3 className="text-[#F1F5F9] text-base font-semibold mb-4">Personal Information</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D084] to-[#3B82F6] flex items-center justify-center text-white text-xl font-bold">
                        {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-[#F1F5F9] text-lg font-semibold">{user?.fullName}</p>
                        <p className="text-[#94A3B8] text-sm">{user?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#94A3B8] text-xs mb-1">Full Name</label>
                        <input value={editProfile.fullName || ''} onChange={(e) => setEditProfile({ ...editProfile, fullName: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-[#94A3B8] text-xs mb-1">Phone</label>
                        <input value={editProfile.phone || ''} onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })} className={inputClass} />
                      </div>
                    </div>
                    <button onClick={handleSaveProfile} disabled={isSaving} className="mt-4 bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Profile</>}
                    </button>
                  </div>

                  {/* Business Info */}
                  <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                    <h3 className="text-[#F1F5F9] text-base font-semibold mb-4 flex items-center gap-2"><Building2 size={16} /> Business Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#94A3B8] text-xs mb-1">Business Name</label>
                        <input value={editBusiness.name || ''} onChange={(e) => setEditBusiness({ ...editBusiness, name: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-[#94A3B8] text-xs mb-1">Type</label>
                        <input value={editBusiness.type || ''} onChange={(e) => setEditBusiness({ ...editBusiness, type: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-[#94A3B8] text-xs mb-1">Address</label>
                        <input value={editBusiness.address || ''} onChange={(e) => setEditBusiness({ ...editBusiness, address: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-[#94A3B8] text-xs mb-1">City</label>
                        <input value={editBusiness.city || ''} onChange={(e) => setEditBusiness({ ...editBusiness, city: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-[#94A3B8] text-xs mb-1">Business Phone</label>
                        <input value={editBusiness.phone || ''} onChange={(e) => setEditBusiness({ ...editBusiness, phone: e.target.value })} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-[#94A3B8] text-xs mb-1">Business Email</label>
                        <input value={editBusiness.email || ''} onChange={(e) => setEditBusiness({ ...editBusiness, email: e.target.value })} className={inputClass} />
                      </div>
                    </div>
                    <button onClick={handleSaveBusiness} disabled={isSaving} className="mt-4 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Business</>}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                    <h3 className="text-[#F1F5F9] text-base font-semibold mb-4">Payment Integrations</h3>
                    <p className="text-[#94A3B8] text-sm mb-6">Connect your payment providers to accept payments and process payroll</p>
                    <div className="space-y-4">
                      {payments.map((p) => (
                        <div key={p.provider} className="flex items-center justify-between p-4 bg-[#0F1117] rounded-xl border border-[#1E2535]">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: providerColors[p.provider] || '#475569' }}>
                              {p.provider[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[#F1F5F9] text-sm font-medium capitalize">{p.provider}</p>
                              <p className="text-[#475569] text-xs">{p.connected ? 'Connected' : 'Not connected'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleTogglePayment(p.provider, p.connected)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${p.connected ? 'bg-[#00D084]/10 text-[#00D084] hover:bg-[#EF4444]/10 hover:text-[#EF4444]' : 'bg-[#1E2535] text-[#94A3B8] hover:bg-[#00D084]/10 hover:text-[#00D084]'}`}
                          >
                            {p.connected ? '✓ Connected' : 'Connect'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                  <h3 className="text-[#F1F5F9] text-base font-semibold mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0F1117] rounded-xl border border-[#1E2535]">
                      <div>
                        <p className="text-[#F1F5F9] text-sm font-medium">Transaction PIN</p>
                        <p className="text-[#475569] text-xs">Default PIN: 1234 (used on Transactions page)</p>
                      </div>
                      <button className="px-4 py-2 bg-[#1E2535] text-[#94A3B8] rounded-xl text-sm hover:bg-[#2A3548]">Change PIN</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0F1117] rounded-xl border border-[#1E2535]">
                      <div>
                        <p className="text-[#F1F5F9] text-sm font-medium">Two-Factor Authentication</p>
                        <p className="text-[#475569] text-xs">Add an extra layer of security</p>
                      </div>
                      <button className="px-4 py-2 bg-[#1E2535] text-[#94A3B8] rounded-xl text-sm hover:bg-[#2A3548]">Enable</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'plan' && (
                <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                  <h3 className="text-[#F1F5F9] text-base font-semibold mb-4">Current Plan</h3>
                  <div className="bg-gradient-to-r from-[#00D084]/10 to-[#3B82F6]/10 rounded-xl p-6 border border-[#1E2535]">
                    <div className="flex items-center gap-3 mb-3">
                      <Crown size={24} className="text-[#F59E0B]" />
                      <span className="text-[#F1F5F9] text-xl font-bold capitalize">{profile?.business?.plan || 'BASIC'} Plan</span>
                    </div>
                    <p className="text-[#94A3B8] text-sm mb-4">
                      {profile?.business?.plan === 'PREMIUM' ? 'Full access to all features including CCTV, video calls, and priority support' : 'Access to basic business management features'}
                    </p>
                    {profile?.business?.plan !== 'PREMIUM' && (
                      <button className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
                        <Crown size={16} /> Upgrade to Premium
                      </button>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}