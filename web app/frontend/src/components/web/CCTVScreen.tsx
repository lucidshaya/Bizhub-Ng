import { useState, useRef, useEffect } from 'react';
import { Plus, Maximize2, X, Wifi, WifiOff, Grid, List, Edit2, Trash2, Loader2, Save, RefreshCw, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { camerasApi } from '../../services/api';
import { useToast } from './Toast';

const WebRTCPlayer = ({ cameraId, fallbackUrl }: { cameraId: string, fallbackUrl?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    camerasApi.getStreamConfig(cameraId).then((res) => {
      console.log('WebRTC Config loaded', cameraId, res.data);
    }).catch(console.error);
  }, [cameraId]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
      poster={fallbackUrl ? undefined : "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80"}
      onError={(e) => { (e.target as any).style.display = 'none'; }}
    />
  );
};

export function CCTVScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<any>(null);
  const [newCamera, setNewCamera] = useState({ name: '', location: '', streamUrl: '', status: 'OFFLINE' });

  // Queries
  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => camerasApi.getAll().then(res => res.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => camerasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setShowAddModal(false);
      setNewCamera({ name: '', location: '', streamUrl: '', status: 'OFFLINE' });
      toast.success('Camera added');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => camerasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      setShowEditModal(false);
      setEditingCamera(null);
      toast.success('Camera updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => camerasApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] });
      toast.success('Camera removed');
    }
  });

  const inputClass = 'w-full bg-[var(--bg-primary)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all';

  if (isLoading && cameras.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  const onlineCount = cameras.filter((c: any) => c.status === 'LIVE').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[var(--text-main)] text-xl font-bold">CCTV Intelligence</h2>
          <p className="text-[var(--text-dim)] text-sm">{onlineCount}/{cameras.length} units currently live</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}><Grid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}><List size={18} /></button>
          </div>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['cameras'] })}
            className="p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl text-[var(--text-dim)] hover:text-[var(--accent)] transition-all"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[var(--accent)] text-[var(--bg-primary)] font-black px-5 py-2.5 rounded-xl text-sm hover:opacity-90 shadow-lg shadow-[var(--accent)]/20 transition-all">
            <Plus size={18} /> Add Module
          </button>
        </div>
      </div>

      {cameras.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-[var(--accent)]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera size={40} className="text-[var(--text-dim)] opacity-40" />
          </div>
          <h3 className="text-[var(--text-main)] text-lg font-bold">Secure Your Workspace</h3>
          <p className="text-[var(--text-dim)] text-sm mb-8 max-w-xs mx-auto">Connect your RTSP or WebRTC hardware to begin real-time surveillance.</p>
          <button onClick={() => setShowAddModal(true)} className="bg-[var(--accent)] text-[var(--bg-primary)] font-black px-8 py-3 rounded-xl text-sm hover:scale-105 active:scale-95 transition-all">
            Initialize Setup
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {cameras.map((camera: any) => (
            <motion.div
              key={camera.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-[var(--accent)]/5 transition-all"
            >
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {camera.status === 'LIVE' ? (
                  <>
                    <WebRTCPlayer cameraId={camera.id} fallbackUrl={camera.streamUrl} />
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                      <span className="text-white text-[10px] font-black tracking-widest uppercase">Live Feed</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <WifiOff size={32} className="text-[var(--text-dim)] opacity-20 mx-auto mb-2" />
                    <p className="text-[var(--text-dim)] text-[10px] font-bold uppercase tracking-widest">Signal Lost</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button onClick={() => setExpanded(camera.id)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:scale-110 transition-transform">
                     <Maximize2 size={20} />
                   </button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[var(--text-main)] text-sm font-bold">{camera.name}</p>
                  <p className="text-[var(--text-dim)] text-[10px] font-bold uppercase tracking-tight mt-0.5">{camera.location || 'UNSET LOCATION'}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingCamera({ ...camera }); setShowEditModal(true); }} className="p-2 hover:bg-blue-500/10 rounded-xl transition-all"><Edit2 size={16} className="text-blue-500" /></button>
                  <button onClick={() => deleteMutation.mutate(camera.id)} className="p-2 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} className="text-red-500" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals handled similarly with theme classes */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setExpanded(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-3xl overflow-hidden w-full max-w-5xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="aspect-video bg-black relative">
                 <WebRTCPlayer cameraId={expanded} fallbackUrl={cameras.find((c: any) => c.id === expanded)?.streamUrl} />
                 <button onClick={() => setExpanded(null)} className="absolute top-6 right-6 p-2 bg-black/50 rounded-full text-white"><X size={24} /></button>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-[var(--text-main)] text-xl font-bold">{cameras.find((c: any) => c.id === expanded)?.name}</h3>
                  <p className="text-[var(--text-dim)] text-sm">{cameras.find((c: any) => c.id === expanded)?.location}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[var(--text-main)] text-xl font-bold">New Camera Unit</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} className="text-[var(--text-dim)]" /></button>
              </div>
              <div className="space-y-6">
                <div><label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5">Module Name</label><input value={newCamera.name} onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })} className={inputClass} placeholder="Front Entrance" /></div>
                <div><label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5">Physical Location</label><input value={newCamera.location} onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })} className={inputClass} placeholder="Level 1" /></div>
                <div><label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5">RTSP/Stream Endpoint</label><input value={newCamera.streamUrl} onChange={(e) => setNewCamera({ ...newCamera, streamUrl: e.target.value })} className={inputClass} placeholder="rtsp://192.168.1.100..." /></div>
                <div><label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5">Status</label>
                  <select value={newCamera.status} onChange={(e) => setNewCamera({ ...newCamera, status: e.target.value })} className={inputClass}>
                    <option value="OFFLINE">Offline</option><option value="LIVE">Live</option>
                  </select>
                </div>
                <button onClick={() => createMutation.mutate(newCamera)} disabled={createMutation.isPending || !newCamera.name} className="w-full bg-[var(--accent)] text-[var(--bg-primary)] font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-[var(--accent)]/20 hover:opacity-90 active:scale-95 transition-all">
                  {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Register Module
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingCamera && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowEditModal(false); setEditingCamera(null); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[var(--text-main)] text-xl font-bold">Update Module</h3>
                <button onClick={() => { setShowEditModal(false); setEditingCamera(null); }}><X size={20} className="text-[var(--text-dim)]" /></button>
              </div>
              <div className="space-y-6">
                <div><label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5">Name</label><input value={editingCamera.name} onChange={(e) => setEditingCamera({ ...editingCamera, name: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-[var(--text-dim)] text-[10px] uppercase font-black mb-1.5">Location</label><input value={editingCamera.location || ''} onChange={(e) => setEditingCamera({ ...editingCamera, location: e.target.value })} className={inputClass} /></div>
                <button onClick={() => updateMutation.mutate({ id: editingCamera.id, data: editingCamera })} disabled={updateMutation.isPending} className="w-full bg-blue-500 text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all">
                  {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}