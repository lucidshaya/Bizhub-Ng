import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

interface PlatformStats {
    totalUsers: number;
    totalBusinesses: number;
    totalStaff: number;
    totalTransactions: number;
    totalCameras: number;
    totalChatMessages: number;
    totalRevenue: number;
    totalExpenses: number;
    paidUsers: number;
    unpaidUsers: number;
    planBreakdown: Record<string, number>;
    recentSignups: number;
    todaySignups: number;
}

interface UserRow {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string;
    businessName: string | null;
    businessType: string | null;
    plan: string;
    hasPaid: boolean;
}

interface Activity {
    type: string;
    description: string;
    email: string | null;
    time: string;
}

type Tab = 'overview' | 'users' | 'activity' | 'support';

export function AdminDashboard() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('overview');
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [users, setUsers] = useState<{ data: UserRow[]; total: number; totalPages: number }>({ data: [], total: 0, totalPages: 1 });
    const [activity, setActivity] = useState<Activity[]>([]);
    interface SupportMetrics {
        totalRooms: number;
        totalMessages: number;
        todayMessages: number;
    }
    const [supportMetrics, setSupportMetrics] = useState<SupportMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [userPage, setUserPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [userFilter, setUserFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

    useEffect(() => {
        const admin = localStorage.getItem('bizhub_admin');
        if (!admin) { navigate('/admin'); return; }
    }, [navigate]);

    // Use bizhub JWT for API calls
    const headers = () => {
        const token = localStorage.getItem('bizhub_token');
        return { Authorization: `Bearer ${token}` };
    };

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, actRes, supRes] = await Promise.all([
                axios.get(`${API}/admin/stats`, { headers: headers() }).catch(() => ({ data: null })),
                axios.get(`${API}/admin/users`, { headers: headers() }).catch(() => ({ data: { data: [], total: 0, totalPages: 1 } })),
                axios.get(`${API}/admin/activity`, { headers: headers() }).catch(() => ({ data: [] })),
                axios.get(`${API}/admin/support`, { headers: headers() }).catch(() => ({ data: null })),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setActivity(actRes.data);
            setSupportMetrics(supRes.data);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        }
        setLoading(false);
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/admin/users`, {
                headers: headers(),
                params: { page: userPage, limit: 20, search: userSearch || undefined },
            });
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    }, [userPage, userSearch]);

    useEffect(() => { loadAll(); }, [loadAll]);
    useEffect(() => { loadUsers(); }, [userPage, userSearch, loadUsers]);

    const logout = () => {
        localStorage.removeItem('bizhub_admin');
        navigate('/admin');
    };

    const fmt = (v: number) => `₦${v.toLocaleString()}`;
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
    const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

    const filteredUsers = users.data.filter((u) => {
        if (userFilter === 'paid') return u.hasPaid;
        if (userFilter === 'unpaid') return !u.hasPaid;
        return true;
    });

    const tabs = [
        { id: 'overview' as Tab, label: 'Overview', icon: '📊' },
        { id: 'users' as Tab, label: 'Users', icon: '👥' },
        { id: 'activity' as Tab, label: 'Activity', icon: '📋' },
        { id: 'support' as Tab, label: 'Support', icon: '💬' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#1E2535] border-t-[#EF4444] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0E1A]">
            {/* Header */}
            <header className="bg-[#161B27] border-b border-[#1E2535] px-6 py-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                            <span className="text-white font-bold text-lg">B</span>
                        </div>
                        <div>
                            <h1 className="text-[#F1F5F9] font-bold text-lg">Admin Panel</h1>
                            <p className="text-[#475569] text-xs">Customer Support Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[#94A3B8] text-sm hidden sm:block">ohinegames@gmail.com</span>
                        <button onClick={logout} className="bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-sm px-4 py-2 rounded-lg transition-colors">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-[#161B27] border-b border-[#1E2535]">
                <div className="max-w-7xl mx-auto flex overflow-x-auto">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${tab === t.id
                                    ? 'border-[#EF4444] text-[#F1F5F9]'
                                    : 'border-transparent text-[#94A3B8] hover:text-[#F1F5F9]'
                                }`}
                        >
                            <span className="mr-2">{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-6">
                {tab === 'overview' && <OverviewTab stats={stats} fmt={fmt} />}
                {tab === 'users' && (
                    <UsersTab
                        users={filteredUsers}
                        total={users.total}
                        totalPages={users.totalPages}
                        page={userPage}
                        search={userSearch}
                        filter={userFilter}
                        onPageChange={setUserPage}
                        onSearchChange={(s) => { setUserSearch(s); setUserPage(1); }}
                        onFilterChange={setUserFilter}
                        fmtDate={fmtDate}
                    />
                )}
                {tab === 'activity' && <ActivityTab activity={activity} fmtDate={fmtDate} fmtTime={fmtTime} />}
                {tab === 'support' && <SupportTab metrics={supportMetrics} />}
            </main>
        </div>
    );
}

// ─── OVERVIEW TAB ───────────────────────────────────────

function OverviewTab({ stats, fmt }: { stats: PlatformStats | null; fmt: (v: number) => string }) {
    if (!stats) return <p className="text-[#94A3B8] text-center py-8">No data available</p>;

    const cards = [
        { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#3B82F6', growth: `+${stats.todaySignups} today` },
        { label: 'Total Businesses', value: stats.totalBusinesses, icon: '🏢', color: '#8B5CF6', growth: `${stats.recentSignups} this month` },
        { label: 'Paid Users', value: stats.paidUsers, icon: '✅', color: '#00D084', growth: `${stats.totalBusinesses ? Math.round((stats.paidUsers / stats.totalBusinesses) * 100) : 0}% conversion` },
        { label: 'Unpaid Users', value: stats.unpaidUsers, icon: '⏳', color: '#F59E0B', growth: `${stats.totalBusinesses ? Math.round((stats.unpaidUsers / stats.totalBusinesses) * 100) : 0}% of total` },
        { label: 'Total Revenue', value: fmt(stats.totalRevenue), icon: '💰', color: '#00D084', growth: `${stats.totalTransactions} transactions` },
        { label: 'Total Expenses', value: fmt(stats.totalExpenses), icon: '📉', color: '#EF4444', growth: `${stats.totalStaff} staff on payroll` },
        { label: 'Active Cameras', value: stats.totalCameras, icon: '📹', color: '#06B6D4', growth: 'Across all businesses' },
        { label: 'Chat Messages', value: stats.totalChatMessages, icon: '💬', color: '#EC4899', growth: 'Total platform messages' },
    ];

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((c) => (
                    <div key={c.label} className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5 hover:border-[#2A3548] transition-colors">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: c.color + '15' }}>
                                {c.icon}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-[#F1F5F9] mb-1">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</p>
                        <p className="text-[#94A3B8] text-sm">{c.label}</p>
                        <p className="text-[#475569] text-xs mt-2">{c.growth}</p>
                    </div>
                ))}
            </div>

            {/* Plan Breakdown */}
            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 mb-6">
                <h3 className="text-[#F1F5F9] font-bold text-lg mb-4">📋 Plan Distribution</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(stats.planBreakdown || {}).map(([plan, count]) => (
                        <div key={plan} className="bg-[#0F1117] rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-[#F1F5F9]">{count}</p>
                            <p className="text-[#94A3B8] text-sm capitalize">{plan.toLowerCase()}</p>
                        </div>
                    ))}
                    {Object.keys(stats.planBreakdown || {}).length === 0 && (
                        <p className="text-[#475569] text-sm col-span-4">No plan data yet</p>
                    )}
                </div>
            </div>

            {/* System Status */}
            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                <h3 className="text-[#F1F5F9] font-bold text-lg mb-4">🟢 System Status</h3>
                <div className="space-y-3">
                    {[
                        { name: 'API Server', status: 'Online', color: '#00D084' },
                        { name: 'Database', status: 'Connected', color: '#00D084' },
                        { name: 'Authentication', status: 'Active', color: '#00D084' },
                        { name: 'Payment Gateway', status: 'Ready', color: '#F59E0B' },
                        { name: 'Chat Service', status: 'Active', color: '#00D084' },
                    ].map((s) => (
                        <div key={s.name} className="flex items-center justify-between bg-[#0F1117] rounded-xl px-4 py-3">
                            <span className="text-[#F1F5F9] text-sm">{s.name}</span>
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                <span className="text-sm" style={{ color: s.color }}>{s.status}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── USERS TAB ──────────────────────────────────────────

function UsersTab({
    users, total, totalPages, page, search, filter,
    onPageChange, onSearchChange, onFilterChange, fmtDate,
}: {
    users: UserRow[];
    total: number;
    totalPages: number;
    page: number;
    search: string;
    filter: 'all' | 'paid' | 'unpaid';
    onPageChange: (p: number) => void;
    onSearchChange: (s: string) => void;
    onFilterChange: (f: 'all' | 'paid' | 'unpaid') => void;
    fmtDate: (d: string) => string;
}) {
    return (
        <div>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]">🔍</span>
                    <input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#EF4444]"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'paid', 'unpaid'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                                    : 'bg-[#161B27] text-[#94A3B8] border border-[#1E2535] hover:text-[#F1F5F9]'
                                }`}
                        >
                            {f === 'all' ? `All (${total})` : f === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1E2535]">
                                {['User', 'Business', 'Plan', 'Status', 'Joined'].map((h) => (
                                    <th key={h} className="text-left text-[#94A3B8] text-xs font-semibold uppercase tracking-wider px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-b border-[#1E2535] hover:bg-[#1E2535]/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6] text-xs font-bold">
                                                {u.fullName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-[#F1F5F9] text-sm font-medium">{u.fullName}</p>
                                                <p className="text-[#475569] text-xs">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-[#F1F5F9] text-sm">{u.businessName || '—'}</p>
                                        <p className="text-[#475569] text-xs">{u.businessType || ''}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${u.plan === 'PREMIUM' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                                                u.plan === 'ENTERPRISE' ? 'bg-[#8B5CF6]/15 text-[#8B5CF6]' :
                                                    'bg-[#475569]/15 text-[#94A3B8]'
                                            }`}>
                                            {u.plan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`flex items-center gap-1.5 text-xs font-medium ${u.hasPaid ? 'text-[#00D084]' : 'text-[#F59E0B]'}`}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: u.hasPaid ? '#00D084' : '#F59E0B' }} />
                                            {u.hasPaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[#94A3B8] text-sm">{fmtDate(u.createdAt)}</td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center text-[#475569] py-8">No users found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E2535]">
                        <span className="text-[#94A3B8] text-sm">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="px-3 py-1 bg-[#0F1117] text-[#F1F5F9] rounded-lg text-sm disabled:opacity-30">←</button>
                            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="px-3 py-1 bg-[#0F1117] text-[#F1F5F9] rounded-lg text-sm disabled:opacity-30">→</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── ACTIVITY TAB ───────────────────────────────────────

function ActivityTab({ activity, fmtDate, fmtTime }: { activity: Activity[]; fmtDate: (d: string) => string; fmtTime: (d: string) => string }) {
    return (
        <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E2535]">
                <h3 className="text-[#F1F5F9] font-bold">Recent Platform Activity</h3>
                <p className="text-[#475569] text-xs mt-1">Signups, transactions, and system events</p>
            </div>
            <div className="divide-y divide-[#1E2535]">
                {activity.map((a, i) => (
                    <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-[#1E2535]/30 transition-colors">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${a.type === 'signup' ? 'bg-[#3B82F6]/15' : 'bg-[#00D084]/15'
                            }`}>
                            {a.type === 'signup' ? '👤' : '💸'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[#F1F5F9] text-sm">{a.description}</p>
                            {a.email && <p className="text-[#475569] text-xs">{a.email}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-[#94A3B8] text-xs">{fmtDate(a.time)}</p>
                            <p className="text-[#475569] text-xs">{fmtTime(a.time)}</p>
                        </div>
                    </div>
                ))}
                {activity.length === 0 && (
                    <p className="text-[#475569] text-sm text-center py-8">No activity yet</p>
                )}
            </div>
        </div>
    );
}

// ─── SUPPORT TAB ────────────────────────────────────────

function SupportTab({ metrics }: { metrics: SupportMetrics | null }) {
    return (
        <div>
            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Chat Rooms', value: metrics?.totalRooms || 0, icon: '💬', color: '#3B82F6' },
                    { label: 'Total Messages', value: metrics?.totalMessages || 0, icon: '📨', color: '#8B5CF6' },
                    { label: 'Messages Today', value: metrics?.todayMessages || 0, icon: '🔥', color: '#EF4444' },
                ].map((m) => (
                    <div key={m.label} className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3" style={{ backgroundColor: m.color + '15' }}>
                            {m.icon}
                        </div>
                        <p className="text-2xl font-bold text-[#F1F5F9]">{m.value.toLocaleString()}</p>
                        <p className="text-[#94A3B8] text-sm">{m.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6">
                <h3 className="text-[#F1F5F9] font-bold text-lg mb-4">🛠️ Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { label: 'View All Users', desc: 'Browse and search platform users', icon: '👥', action: 'users' },
                        { label: 'Monitor Activity', desc: 'See real-time signups and transactions', icon: '📋', action: 'activity' },
                        { label: 'System Health', desc: 'Check API and database status', icon: '🟢', action: 'overview' },
                        { label: 'Export Data', desc: 'Download user and transaction reports', icon: '📥', action: '' },
                    ].map((a) => (
                        <div key={a.label} className="bg-[#0F1117] rounded-xl p-4 flex items-start gap-3 hover:bg-[#1E2535]/50 transition-colors cursor-pointer">
                            <span className="text-xl">{a.icon}</span>
                            <div>
                                <p className="text-[#F1F5F9] text-sm font-medium">{a.label}</p>
                                <p className="text-[#475569] text-xs">{a.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Support Tips */}
            <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 mt-6">
                <h3 className="text-[#F1F5F9] font-bold text-lg mb-4">📌 Support Guidelines</h3>
                <div className="space-y-3">
                    {[
                        'Always verify user email before making account changes',
                        'Check the "Paid" status before escalating billing issues',
                        'Use the Activity tab to track user behavior in real-time',
                        'Contact engineering for database-level issues',
                    ].map((tip, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[#0F1117] rounded-xl px-4 py-3">
                            <span className="text-[#F59E0B]">💡</span>
                            <span className="text-[#94A3B8] text-sm">{tip}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
