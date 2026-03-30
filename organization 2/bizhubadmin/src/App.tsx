import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, CreditCard, LogOut, Loader2, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'ivorilucid@gmail.com' && password === 'ugoreX52') {
      localStorage.setItem('admin_auth', 'true');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkPrimary p-4">
      <div className="bg-darkCard border border-darkBorder p-8 rounded-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center mx-auto mb-4">
            <span className="text-darkPrimary font-black text-xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-textMain">BizHub Admin</h1>
          <p className="text-textMuted mt-2">Enter credentials to access platform data</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-textMuted text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-darkPrimary border border-darkBorder rounded-xl px-4 py-3 text-textMain focus:border-brand focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-textMuted text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-darkPrimary border border-darkBorder rounded-xl px-4 py-3 text-textMain focus:border-brand focus:outline-none"
              required
            />
          </div>
          <button type="submit" className="w-full bg-brand hover:opacity-90 text-darkPrimary font-bold py-3 rounded-xl transition-opacity mt-4">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (!localStorage.getItem('admin_auth')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:3333/api/admin/superadmin/data');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand" size={40} /></div>;

  return (
    <div className="min-h-screen bg-darkPrimary flex">
      {/* Sidebar */}
      <div className="w-64 bg-darkCard border-r border-darkBorder flex flex-col">
        <div className="p-6 border-b border-darkBorder flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-darkPrimary font-black text-sm">B</span>
          </div>
          <span className="text-textMain font-bold text-lg">AdminHub</span>
        </div>
        <div className="p-4 flex-1 space-y-2">
          {['users', 'businesses', 'transactions', 'reports'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-xl capitalize font-medium transition-all duration-200 flex items-center ${activeTab === tab ? 'bg-brand/10 text-brand shadow-lg shadow-brand/5' : 'text-textMuted hover:bg-darkBorder hover:text-textMain'}`}
            >
              {tab === 'users' && <Users size={18} className="mr-3" />}
              {tab === 'businesses' && <Building2 size={18} className="mr-3" />}
              {tab === 'transactions' && <CreditCard size={18} className="mr-3" />}
              {tab === 'reports' && <MessageSquare size={18} className="mr-3" />}
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-darkBorder">
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-medium">
            <LogOut size={18} className="inline mr-3" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold text-textMain mb-8">Platform Overview</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-darkCard border border-darkBorder p-6 rounded-2xl">
            <h3 className="text-textMuted font-medium mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-textMain">{data?.users?.length || 0}</p>
          </div>
          <div className="bg-darkCard border border-darkBorder p-6 rounded-2xl">
            <h3 className="text-textMuted font-medium mb-2">Total Businesses</h3>
            <p className="text-4xl font-bold text-textMain">{data?.businesses?.length || 0}</p>
          </div>
          <div className="bg-darkCard border border-darkBorder p-6 rounded-2xl">
            <h3 className="text-textMuted font-medium mb-2">Total Transactions</h3>
            <p className="text-4xl font-bold text-textMain">{data?.transactions?.length || 0}</p>
          </div>
        </div>

        {/* Dynamic Table */}
        {activeTab !== 'reports' ? (
          <div className="bg-darkCard border border-darkBorder rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-darkBorder flex items-center justify-between">
              <h2 className="text-xl font-bold text-textMain capitalize">{activeTab} Details</h2>
              <div className="flex gap-2">
                <div className="bg-darkPrimary border border-darkBorder px-3 py-1.5 rounded-lg text-xs text-textMuted font-medium">
                  {data?.[activeTab]?.length || 0} Total
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-darkBorder text-textMuted text-sm">
                    {activeTab === 'users' && (
                      <><th className="p-4 font-semibold">Name</th><th className="p-4 font-semibold">Email</th><th className="p-4 font-semibold">Role</th><th className="p-4 font-semibold">Joined</th></>
                    )}
                    {activeTab === 'businesses' && (
                      <><th className="p-4 font-semibold">Name</th><th className="p-4 font-semibold">Plan</th><th className="p-4 font-semibold">Phone</th><th className="p-4 font-semibold">Address</th></>
                    )}
                    {activeTab === 'transactions' && (
                      <><th className="p-4 font-semibold">Amount</th><th className="p-4 font-semibold">Reason</th><th className="p-4 font-semibold">Status</th><th className="p-4 font-semibold">Date</th></>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkBorder">
                  {(data?.[activeTab] || []).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-brand/5 transition-colors group">
                      {activeTab === 'users' && (
                        <><td className="p-4 text-textMain font-medium">{row.fullName}</td><td className="p-4 text-textMuted">{row.email}</td><td className="p-4"><span className="px-2 py-1 bg-brand/10 text-brand rounded-lg text-[10px] font-bold uppercase tracking-wider">{row.role}</span></td><td className="p-4 text-textMuted">{new Date(row.createdAt).toLocaleDateString()}</td></>
                      )}
                      {activeTab === 'businesses' && (
                        <><td className="p-4 text-textMain font-medium">{row.name}</td><td className="p-4"><span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">{row.plan}</span></td><td className="p-4 text-textMuted">{row.phone || '-'}</td><td className="p-4 text-textMuted">{row.address || '-'}</td></>
                      )}
                      {activeTab === 'transactions' && (
                        <><td className="p-4 text-textMain font-bold">₦{row.amount.toLocaleString()}</td><td className="p-4 text-textMuted">{row.reason}</td><td className="p-4"><span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${row.status === 'COMPLETED' ? 'bg-brand/10 text-brand' : 'bg-yellow-500/10 text-yellow-500'}`}>{row.status}</span></td><td className="p-4 text-textMuted">{new Date(row.createdAt).toLocaleDateString()}</td></>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!data?.[activeTab] || data[activeTab].length === 0) && (
              <div className="p-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-darkBorder mb-4">
                  <Loader2 className="text-textMuted" size={24} />
                </div>
                <p className="text-textMuted font-medium">No {activeTab} records found</p>
              </div>
            )}
          </div>
        ) : (
          <ReportsView />
        )}
      </div>
    </div>
  );
}

function ReportsView() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('http://localhost:3333/api/support/tickets');
      const json = await res.json();
      setTickets(json);
    } catch (e) {
      console.error(e);
      // Mock for now until backend is ready
      setTickets([
        { id: '1', userEmail: 'user@example.com', subject: 'Login issue', message: 'I cannot login to my account since yesterday.', status: 'OPEN', createdAt: new Date().toISOString() },
        { id: '2', userEmail: 'biz@corp.com', subject: 'Payment failed', message: 'My wallet funding shows pending for 2 hours.', status: 'OPEN', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    console.log('Replying to', selectedTicket.id, reply);
    setReply('');
    setSelectedTicket(null);
    alert('Reply sent to user!');
  };

  return (
    <>
      <div className="bg-darkCard border border-darkBorder rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-darkBorder flex items-center justify-between">
          <h2 className="text-xl font-bold text-textMain capitalize">Platform Reports</h2>
          <div className="flex gap-2">
            <div className="bg-darkPrimary border border-darkBorder px-3 py-1.5 rounded-lg text-xs text-textMuted font-medium">
              {tickets.length} Total
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-darkBorder text-textMuted text-sm">
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Subject</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Message snippet</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                <th className="p-4 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder">
              {tickets.map((row: any) => (
                <tr key={row.id} className="hover:bg-brand/5 transition-colors group cursor-pointer" onClick={() => setSelectedTicket(row)}>
                  <td className="p-4 text-textMain font-medium">{row.subject}</td>
                  <td className="p-4 text-textMuted truncate max-w-[250px]">{row.message}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-md text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </td>
                  <td className="p-4 text-textMuted">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageSquare size={16} className="inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tickets.length === 0 && !loading && (
          <div className="p-20 text-center">
            <p className="text-textMuted font-medium">No reports found</p>
          </div>
        )}
      </div>

      {/* Dark Glassmorphic Modal mimicking Bizhub Ng */ }
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-lg bg-[#0F1117] border border-[#1E2535] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1E2535]">
              <div>
                <h2 className="text-xl font-bold text-[#F1F5F9]">Submit a Reply</h2>
                <p className="text-sm text-[#94A3B8] mt-1">Review the issue and provide support</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-[#F1F5F9] mb-2 font-medium">User & Subject</label>
                <div className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl px-4 py-3 text-[#F1F5F9]">
                  <span className="text-[#00D084] text-xs font-bold mb-1 block uppercase">{selectedTicket.userEmail}</span>
                  {selectedTicket.subject}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#F1F5F9] mb-2 font-medium">Message</label>
                <div className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl px-4 py-3 text-[#F1F5F9] min-h-[100px] text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#F1F5F9] mb-2 font-medium">Your Reply</label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Describe exactly how to resolve this..."
                  className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl px-4 py-3 text-[#F1F5F9] focus:outline-none focus:border-[#00D084] min-h-[120px] resize-none transition-colors placeholder-[#475569]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#1E2535] flex items-center justify-between bg-[#161B27]/50">
              <button 
                onClick={() => setSelectedTicket(null)}
                className="px-6 py-2.5 text-sm font-medium text-[#F1F5F9] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendReply}
                disabled={!reply.trim()}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#00D084] text-[#0F1117] rounded-xl hover:bg-[#00D084]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
                Submit Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
