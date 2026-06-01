import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Check, Loader2, Zap, TrendingUp, Rocket } from 'lucide-react';
import { settingsApi } from '../services/api';
import { useToast } from '../components/web/Toast';

const plans = [
    {
        id: 'STARTER',
        name: 'Starter',
        label: 'Free Trial',
        tagline: 'Get started — no card needed',
        icon: Zap,
        color: '#00D084',
        monthlyPrice: null,
        yearlyPrice: null,
        trialDays: 3,
        isFree: true,
        features: [
            'Dashboard access',
            'Basic transactions',
            'Up to 5 staff records',
            '3-day trial period',
        ],
        cta: 'Start Free Trial',
        ctaClass: 'bg-[#00D084] hover:bg-[#00b872] text-[#0A0E1A]',
        cardClass: 'border-[#00D084]/40 bg-[#00D084]/5',
    },
    {
        id: 'GROWTH',
        name: 'Growth',
        label: 'Popular',
        tagline: 'For growing corporate teams',
        icon: TrendingUp,
        color: '#F59E0B',
        monthlyPrice: 15000,
        yearlyPrice: 150000,
        savingsMonthly: 30000,
        savingsYearly: '~₦30k saved',
        features: [
            'Up to 50 staff members',
            'Full Platform Access',
            'Communications & CCTV Live',
            'Priority Support',
        ],
        cta: 'Select Growth',
        ctaClass: 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A]',
        cardClass: 'border-[#F59E0B]/40 bg-[#F59E0B]/5',
        popular: true,
    },
    {
        id: 'SCALE',
        name: 'Scale',
        label: 'Enterprise',
        tagline: 'For established large companies',
        icon: Rocket,
        color: '#3B82F6',
        monthlyPrice: 50000,
        yearlyPrice: 500000,
        savingsYearly: '~₦100k saved',
        features: [
            'Unlimited users & staff',
            'Advanced analytics & reports',
            'Multi-branch support',
            'Dedicated account manager',
            'Full API Access',
        ],
        cta: 'Select Scale',
        ctaClass: 'bg-[#3B82F6] hover:bg-[#2563EB] text-white',
        cardClass: 'border-[#3B82F6]/40 bg-[#3B82F6]/5',
    },
];

export function SubscriptionFlow() {
    const { refreshProfile } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [isYearly, setIsYearly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');

    const handleSelectPlan = async (plan: string, isFree?: boolean) => {
        setSelectedPlan(plan);
        setIsLoading(true);
        try {
            console.log(`[SubscriptionFlow] Selecting plan: ${plan}, isFree: ${isFree}, isYearly: ${isYearly}`);
            
            if (isFree) {
                // STARTER: directly activate trial — no Paystack needed
                await settingsApi.upgradePlan(plan);
                toast.success('Starter plan activated! Welcome to Bizhub.');
                await refreshProfile();
                navigate('/dashboard');
                return;
            }

            const res = await settingsApi.upgradePlanPaystack(plan, isYearly);
            if (res.data?.authorization_url) {
                window.location.href = res.data.authorization_url;
            } else {
                toast.success(`Successfully subscribed to ${plan} plan!`);
                await refreshProfile();
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error('[SubscriptionFlow] Error selecting plan:', err);
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.message || 'Failed to subscribe to plan. Try again.';
            
            if (status === 404) {
                toast.error('API endpoint not found (404). Please ensure the backend is up to date.');
            } else {
                toast.error(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#0A0E1A] flex flex-col px-4 py-12"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <span className="inline-block bg-[#00D084]/15 text-[#00D084] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                        Choose your Plan
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-[#F1F5F9]">
                        Set up your Corporate Workspace
                    </h1>
                    <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-8">
                        Start free for 3 days, or select a paid plan to unlock the full Bizhub platform.
                    </p>

                    {/* Monthly/Yearly toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-base font-medium ${!isYearly ? 'text-[#F1F5F9]' : 'text-[#475569]'}`}>Monthly</span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${isYearly ? 'bg-[#00D084]' : 'bg-[#1E2535]'}`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isYearly ? 'translate-x-8' : 'translate-x-1'}`}
                            />
                        </button>
                        <span className={`text-base font-medium flex items-center gap-2 ${isYearly ? 'text-[#F1F5F9]' : 'text-[#475569]'}`}>
                            Yearly <span className="text-[10px] font-bold bg-[#00D084] text-[#0A0E1A] px-2 py-0.5 rounded-full">Save ~17%</span>
                        </span>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
                    {plans.map((plan, i) => {
                        const Icon = plan.icon;
                        const isSelected = isLoading && selectedPlan === plan.id;
                        const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                        const savings = isYearly && !plan.isFree ? plan.savingsYearly : null;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative rounded-3xl p-7 border flex flex-col ${plan.cardClass} ${plan.popular ? 'ring-1 ring-[#F59E0B]/50' : ''}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-[#0A0E1A] text-[10px] font-extrabold px-4 py-1 rounded-full uppercase tracking-wide shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                {/* Icon + Label */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}20` }}>
                                        <Icon size={18} style={{ color: plan.color }} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#F1F5F9]">{plan.name}</h3>
                                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: plan.color }}>
                                            {plan.label}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-[#94A3B8] text-sm mb-5">{plan.tagline}</p>

                                {/* Price */}
                                <div className="mb-6 h-16 flex flex-col justify-center">
                                    {plan.isFree ? (
                                        <>
                                            <p className="text-4xl font-extrabold text-[#00D084]">Free</p>
                                            <p className="text-xs text-[#64748B] mt-1">for {plan.trialDays} days, then choose a paid plan</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-extrabold text-[#F1F5F9]">
                                                    ₦{price?.toLocaleString()}
                                                </span>
                                                <span className="text-[#64748B] text-sm">/{isYearly ? 'yr' : 'mo'}</span>
                                            </div>
                                            {savings && (
                                                <p className="text-xs font-bold mt-1" style={{ color: plan.color }}>{savings}</p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2.5 text-sm text-[#CBD5E1]">
                                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${plan.color}25` }}>
                                                <Check size={10} style={{ color: plan.color }} />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    disabled={isLoading}
                                    onClick={() => handleSelectPlan(plan.id, plan.isFree)}
                                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${plan.ctaClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    {isSelected ? <Loader2 size={16} className="animate-spin" /> : plan.cta}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                <p className="text-center text-[#475569] text-xs mt-8">
                    Payments secured by Paystack. Cancel anytime.
                </p>
            </div>
        </div>
    );
}
