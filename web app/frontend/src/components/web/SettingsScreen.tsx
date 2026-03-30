import React, { useState, useEffect } from 'react';
import {
  User, CreditCard, Shield, Crown, Upload, Eye, EyeOff, Check, Loader2, Save, LogOut, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { settingsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';
import { PinSetupModal } from './PinSetupModal';

type SettingsTab = 'profile' | 'payments' | 'security' | 'plan';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile & Business', icon: User },
  { id: 'payments', label: 'Payment Integrations', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'plan', label: 'Plan', icon: Crown },
];

export function SettingsScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const { toast } = useToast() as any;
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editProfile, setEditProfile] = useState<any>({});
  const [editBusiness, setEditBusiness] = useState<any>({});
  const [showPinModal, setShowPinModal] = useState(false);

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

  const handleGenerateVirtualAccount = async () => {
    setIsSaving(true);
    try {
      toast({ title: 'Info', description: 'Generating virtual account...', status: 'info' });
      await settingsApi.generateVirtualAccount();
      await loadSettings();
      toast({ title: 'Success', description: 'Virtual account generated successfully!', status: 'success' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to generate virtual account.', status: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleUpgradePlan = async (plan: string) => {
    setIsSaving(true);
    try {
      toast({ title: 'Info', description: `Processing payment for ${plan} plan...`, status: 'info' });
      await settingsApi.upgradePlan(plan);
      await loadSettings();
      toast({ title: 'Success', description: 'Paid from wallet! Plan upgraded successfully.', status: 'success' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to upgrade plan.', status: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleUpgradePlanPaystack = async (plan: string) => {
    setIsSaving(true);
    try {
      if ((toast as any).info) (toast as any).info(`Initializing Paystack payment for ${plan} plan...`);
      const res = await settingsApi.upgradePlanPaystack(plan);
      window.location.href = res.data.authorization_url;
    } catch (e: any) {
      if ((toast as any).error) (toast as any).error(e.response?.data?.message || 'Failed to initialize payment.');
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
                      <button onClick={() => setShowPinModal(true)} className="px-4 py-2 bg-[#1E2535] text-[#94A3B8] rounded-xl text-sm hover:bg-[#2A3548]">Change PIN</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0F1117] rounded-xl border border-[#1E2535]">
                      <div>
                        <p className="text-[#F1F5F9] text-sm font-medium">Two-Factor Authentication</p>
                        <p className="text-[#475569] text-xs">Add an extra layer of security</p>
                      </div>
                      <button onClick={() => {
                        toast({ title: 'Info', description: '2-Factor Authentication is coming soon!', status: 'info' });
                      }} className="px-4 py-2 bg-[#1E2535] text-[#94A3B8] rounded-xl text-sm hover:bg-[#2A3548]">Enable</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'plan' && (
                <div className="space-y-6">
                  {/* Wallet & Billing */}
                  <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#F1F5F9] text-base font-semibold">Wallet & Billing</h3>
                    </div>
                    <div className="bg-[#0F1117] border border-[#1E2535] rounded-xl p-6">
                      <p className="text-[#94A3B8] text-sm mb-1">Available Balance</p>
                      <p className="text-[#00D084] text-3xl font-bold mb-6">
                        ₦{(profile?.business?.walletBalance || 0).toLocaleString('en-NG')}
                      </p>

                      {profile?.business?.virtualAccountNumber ? (
                        <div className="bg-[#00D084]/10 border border-[#00D084]/20 rounded-xl p-4">
                          <h4 className="text-[#F1F5F9] text-sm font-semibold mb-2 flex items-center gap-2">
                            <CreditCard size={16} className="text-[#00D084]" /> Fund Your Wallet
                          </h4>
                          <p className="text-[#94A3B8] text-xs mb-3">
                            Transfer funds to your virtual account to top up your Bizhub wallet. Make payments for your staff payroll or subscription plans directly from this wallet.
                          </p>
                          <div className="flex gap-4 items-center">
                            <div>
                              <p className="text-[#475569] text-[10px] uppercase font-bold">Bank Name</p>
                              <p className="text-[#F1F5F9] text-sm font-medium">{profile?.business?.virtualAccountBank || 'OPay'}</p>
                            </div>
                            <div className="w-px h-8 bg-[#1E2535]"></div>
                            <div>
                              <p className="text-[#475569] text-[10px] uppercase font-bold">Account Number</p>
                              <p className="text-[#F1F5F9] text-sm font-medium tracking-wider">{profile?.business?.virtualAccountNumber}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerateVirtualAccount}
                          className="bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2"
                        >
                          <CreditCard size={16} /> Generate Virtual Account
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subscription Plans */}
                  <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                    <h3 className="text-[#F1F5F9] text-base font-semibold mb-4 flex items-center gap-2">
                      <Crown size={18} className="text-[#F59E0B]" /> Subscription Plans
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {/* Starter */}
                      <div className={`rounded-xl p-5 border ${profile?.business?.plan === 'STARTER' || !profile?.business?.plan ? 'border-[#00D084] bg-[#00D084]/5' : 'border-[#1E2535] bg-[#0F1117]'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-[#F1F5F9] font-bold text-lg">Starter</h4>
                          {(profile?.business?.plan === 'STARTER' || !profile?.business?.plan) && <span className="bg-[#00D084] text-[#0F1117] text-[10px] font-bold px-2 py-1 rounded-full uppercase">Active</span>}
                        </div>
                        <p className="text-[#00D084] font-bold text-xl mb-4">₦5,000<span className="text-[#475569] text-xs font-normal"> /mo</span></p>
                        {(profile?.business?.plan === 'STARTER' || !profile?.business?.plan) && profile?.business?.planExpiryDate && (
                          <p className="text-[#94A3B8] text-[10px] mb-4">Expires: {new Date(profile.business.planExpiryDate).toLocaleDateString()}</p>
                        )}
                        <ul className="space-y-2 mb-6 text-[#94A3B8] text-xs">
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#00D084]" /> 1 User (Owner)</li>
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#00D084]" /> Dashboard Access</li>
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#00D084]" /> Staff & Payroll</li>
                        </ul>
                        {profile?.business?.plan !== 'STARTER' && profile?.business?.plan && (
                          <button className="w-full py-2 rounded-lg text-sm font-semibold border border-[#1E2535] text-[#94A3B8] hover:bg-[#1E2535] transition-colors"
                            onClick={() => handleUpgradePlan('STARTER')} disabled={isSaving}
                          >
                            Downgrade to Starter
                          </button>
                        )}
                      </div>

                      {/* Growth */}
                      <div className={`rounded-xl p-5 border ${profile?.business?.plan === 'GROWTH' ? 'border-[#F59E0B] bg-[#F59E0B]/5' : 'border-[#1E2535] bg-[#0F1117]'} relative overflow-hidden`}>
                        {profile?.business?.plan !== 'GROWTH' && (
                          <div className="absolute top-0 right-0 bg-[#F59E0B] text-[#0F1117] text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase">Popular</div>
                        )}
                        <div className="flex justify-between items-start mb-2 mt-1">
                          <h4 className="text-[#F1F5F9] font-bold text-lg">Growth</h4>
                          {profile?.business?.plan === 'GROWTH' && <span className="bg-[#F59E0B] text-[#0F1117] text-[10px] font-bold px-2 py-1 rounded-full uppercase">Active</span>}
                        </div>
                        <p className="text-[#F59E0B] font-bold text-xl mb-4">₦15,000<span className="text-[#475569] text-xs font-normal"> /mo</span></p>
                        {profile?.business?.plan === 'GROWTH' && profile?.business?.planExpiryDate && (
                          <p className="text-[#94A3B8] text-[10px] mb-4">Expires: {new Date(profile.business.planExpiryDate).toLocaleDateString()}</p>
                        )}
                        <ul className="space-y-2 mb-6 text-[#94A3B8] text-xs">
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#F59E0B]" /> Up to 50 Staff members</li>
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#F59E0B]" /> Full Platform Access</li>
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#F59E0B]" /> Communications & CCTV Live</li>
                        </ul>
                        {profile?.business?.plan !== 'GROWTH' && (
                          <div className="flex flex-col gap-2">
                            <button className="w-full py-2 rounded-lg text-sm font-bold bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#0F1117] transition-colors"
                              onClick={() => handleUpgradePlanPaystack('GROWTH')} disabled={isSaving}
                            >
                              Upgrade Plan
                            </button>
                            <button className="w-full py-2 rounded-lg text-sm font-bold border border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 disabled:opacity-50 transition-colors"
                              onClick={() => handleUpgradePlan('GROWTH')} disabled={isSaving}
                            >
                              Pay with Wallet
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Scale */}
                      <div className={`rounded-xl p-5 border ${profile?.business?.plan === 'SCALE' ? 'border-[#3B82F6] bg-[#3B82F6]/5' : 'border-[#1E2535] bg-[#0F1117]'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-[#F1F5F9] font-bold text-lg">Scale</h4>
                          {profile?.business?.plan === 'SCALE' && <span className="bg-[#3B82F6] text-[#white] text-[10px] font-bold px-2 py-1 rounded-full uppercase">Active</span>}
                        </div>
                        <p className="text-[#3B82F6] font-bold text-xl mb-4">₦50,000<span className="text-[#475569] text-xs font-normal"> /mo</span></p>
                        {profile?.business?.plan === 'SCALE' && profile?.business?.planExpiryDate && (
                          <p className="text-[#94A3B8] text-[10px] mb-4">Expires: {new Date(profile.business.planExpiryDate).toLocaleDateString()}</p>
                        )}
                        <ul className="space-y-2 mb-6 text-[#94A3B8] text-xs">
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#3B82F6]" /> Unlimited Users & Staff</li>
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#3B82F6]" /> Advanced Analytics</li>
                          <li className="flex items-center gap-2"><Check size={12} className="text-[#3B82F6]" /> Multi-branch & API Access</li>
                        </ul>
                        {profile?.business?.plan !== 'SCALE' && (
                          <div className="flex flex-col gap-2">
                            <button className="w-full py-2 rounded-lg text-sm font-bold bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white transition-colors"
                              onClick={() => handleUpgradePlanPaystack('SCALE')} disabled={isSaving}
                            >
                              Upgrade Plan
                            </button>
                            <button className="w-full py-2 rounded-lg text-sm font-bold border border-[#3B82F6] disabled:opacity-50 text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"
                              onClick={() => handleUpgradePlan('SCALE')} disabled={isSaving}
                            >
                              Pay with Wallet
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {showPinModal && <PinSetupModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onComplete={() => setShowPinModal(false)} />}
    </div>
  );
}