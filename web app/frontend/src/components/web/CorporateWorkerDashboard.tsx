import { MessageSquare, Calendar, Bell, Zap, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { WebScreen } from '../../pages/WebApp';

interface CorporateWorkerDashboardProps {
  onNavigate: (screen: WebScreen) => void;
}

export function CorporateWorkerDashboard({ onNavigate }: CorporateWorkerDashboardProps) {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Area */}
      <div className="bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border border-[var(--border-main)] rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">
          Good to see you, {user?.fullName?.split(' ')[0] || 'Worker'}
        </h1>
        <p className="text-[var(--text-dim)] text-sm mb-6">
          Here's what's happening in your workspace today.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-xl p-4 hover:border-[#00D084]/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#00D084]/10 text-[#00D084] flex items-center justify-center">
                <Briefcase size={16} />
              </div>
              <p className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-wider">Department</p>
            </div>
            <p className="text-[var(--text-main)] text-xl font-bold break-words">{user?.businessName || 'Workspace'}</p>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-xl p-4 hover:border-[#8B5CF6]/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <p className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-wider">Date</p>
            </div>
            <p className="text-[var(--text-main)] text-xl font-bold break-words">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-xl p-4 hover:border-[#3B82F6]/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center">
                <Zap size={16} />
              </div>
              <p className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-wider">Status</p>
            </div>
            <p className="text-[#00D084] text-xl font-bold break-words">Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Communications Shortcut */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[var(--text-main)]">Communications</h3>
            <button
              onClick={() => onNavigate('comms')}
              className="text-xs font-bold bg-[var(--bg-tertiary)] hover:bg-[var(--accent)] text-[var(--text-main)] hover:text-[#0A0E1A] px-3 py-1.5 rounded-lg transition-colors"
            >
              Open Messaging
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-[var(--border-main)] rounded-xl bg-[var(--bg-primary)]/30">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-dim)] mb-3">
              <MessageSquare size={20} />
            </div>
            <p className="text-[var(--text-dim)] text-sm mb-4 max-w-xs text-center">
              Connect with your team members and management within your workspace.
            </p>
            <button
              onClick={() => onNavigate('comms')}
              className="px-4 py-2 bg-[var(--accent)] text-[#0A0E1A] font-bold text-sm rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
            >
              Go to Communications
            </button>
          </div>
        </div>

        {/* Notifications or Announcements */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Bell size={20} className="text-[#F59E0B]" />
            <h3 className="text-xl font-bold text-[var(--text-main)]">Announcements</h3>
          </div>
          <div className="flex flex-col space-y-3">
            <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-main)] border-l-4 border-l-[#F59E0B]">
              <p className="text-xs font-bold text-[#F59E0B] mb-1">System Message</p>
              <p className="text-sm text-[var(--text-main)] font-medium">Welcome to your new workspace dashboard.</p>
              <p className="text-xs text-[var(--text-dim)] mt-1">Today</p>
            </div>
            {/* You could add more messages mapped from an API here */}
          </div>
        </div>
      </div>
    </div>
  );
}
