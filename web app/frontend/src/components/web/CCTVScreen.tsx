import React, { useEffect, useState, useRef } from 'react';
import { Plus, Maximize2, X, Wifi, WifiOff, Grid, List, Edit2, Trash2, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { camerasApi } from '../../services/api';
import { useToast } from './Toast';

const WebRTCPlayer = ({ cameraId, fallbackUrl }: { cameraId: string, fallbackUrl?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Fetch stream config to get WebRTC / WebSocket signaling URL
    camerasApi.getStreamConfig(cameraId).then((res) => {
      console.log('WebRTC Config loaded for camera', cameraId, res.data);
      // In a full implementation, you'd initialize a WebRTCAdaptor here
      // e.g., new WebRTCAdaptor({ websocket_url: res.data.wsUrl, ... })
      // and attach the resulting MediaStream to videoRef.current.srcObject
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
  const [cameras, setCameras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCamera, setNewCamera] = useState({ name: '', location: '', streamUrl: '', status: 'OFFLINE' });

  useEffect(() => { loadCameras(); }, []);

  const loadCameras = async () => {
    setIsLoading(true);
    try {
      const res = await camerasApi.getAll();
      setCameras(res.data);
    } catch { setCameras([]); }
    finally { setIsLoading(false); }
  };

  const handleCreate = async () => {
    if (!newCamera.name) return;
    setIsSaving(true);
    try {
      await camerasApi.create(newCamera);
      setShowAddModal(false);
      setNewCamera({ name: '', location: '', streamUrl: '', status: 'OFFLINE' });
      await loadCameras();
      toast.success('Camera added successfully!');
    } catch {
      toast.error('Failed to add camera.');
    } finally { setIsSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editingCamera) return;
    setIsSaving(true);
    try {
      await camerasApi.update(editingCamera.id, editingCamera);
      setShowEditModal(false);
      setEditingCamera(null);
      await loadCameras();
      toast.success('Camera updated successfully!');
    } catch {
      toast.error('Failed to update camera.');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this camera?')) return;
    try {
      await camerasApi.remove(id);
      await loadCameras();
      toast.success('Camera removed successfully!');
    } catch {
      toast.error('Failed to remove camera.');
    }
  };

  const inputClass = 'w-full bg-[#0F1117] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#00D084]';

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 size={32} className="text-[#00D084] animate-spin" /></div>;
  }

  const onlineCount = cameras.filter(c => c.status === 'LIVE').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#F1F5F9] text-xl font-bold">CCTV Live Monitor</h2>
          <p className="text-[#94A3B8] text-sm">{onlineCount}/{cameras.length} cameras online</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#161B27] border border-[#1E2535] rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-[#00D084]/10 text-[#00D084]' : 'text-[#475569]'}`}><Grid size={16} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-[#00D084]/10 text-[#00D084]' : 'text-[#475569]'}`}><List size={16} /></button>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold px-4 py-2 rounded-xl text-sm">
            <Plus size={16} /> Add Camera
          </button>
        </div>
      </div>

      {/* Camera Grid */}
      {cameras.length === 0 ? (
        <div className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-12 text-center">
          <Wifi size={48} className="text-[#475569] mx-auto mb-4" />
          <h3 className="text-[#F1F5F9] text-lg font-semibold mb-2">No Cameras Added</h3>
          <p className="text-[#94A3B8] text-sm mb-4">Connect your first CCTV camera to start monitoring</p>
          <button onClick={() => setShowAddModal(true)} className="bg-[#00D084] hover:bg-[#00b872] text-[#0F1117] font-bold px-6 py-2.5 rounded-xl text-sm">
            <Plus size={16} className="inline mr-2" /> Add Camera
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {cameras.map((camera) => (
            <motion.div
              key={camera.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#161B27] border border-[#1E2535] rounded-2xl overflow-hidden group hover:border-[#2A3548] transition-colors"
            >
              {/* Feed placeholder */}
              <div className="relative aspect-video bg-[#0A0E1A] flex items-center justify-center">
                {camera.status === 'LIVE' ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {camera.streamUrl ? (
                      <WebRTCPlayer cameraId={camera.id} fallbackUrl={camera.streamUrl} />
                    ) : (
                      <div className="text-center">
                        <Wifi size={24} className="text-[#00D084] mx-auto mb-2" />
                        <p className="text-[#94A3B8] text-xs">Live Feed Active</p>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                      <span className="text-white text-xs font-semibold">LIVE</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <WifiOff size={24} className="text-[#475569] mx-auto mb-2" />
                    <p className="text-[#475569] text-xs">Offline</p>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setExpanded(camera.id)} className="p-1.5 bg-black/50 rounded-lg"><Maximize2 size={12} className="text-white" /></button>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-[#F1F5F9] text-sm font-medium">{camera.name}</p>
                  <p className="text-[#475569] text-xs">{camera.location || 'No location set'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingCamera({ ...camera }); setShowEditModal(true); }} className="p-1.5 hover:bg-[#3B82F6]/10 rounded-lg"><Edit2 size={14} className="text-[#3B82F6]" /></button>
                  <button onClick={() => handleDelete(camera.id)} className="p-1.5 hover:bg-[#EF4444]/10 rounded-lg"><Trash2 size={14} className="text-[#EF4444]" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Expanded View */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setExpanded(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[#161B27] border border-[#1E2535] rounded-2xl overflow-hidden w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <div className="aspect-video bg-[#0A0E1A] flex items-center justify-center">
                <div className="text-center">
                  <Wifi size={48} className="text-[#00D084] mx-auto mb-3" />
                  <p className="text-[#F1F5F9] text-lg font-semibold">{cameras.find(c => c.id === expanded)?.name}</p>
                  <p className="text-[#94A3B8] text-sm">Full-screen camera view</p>
                </div>
              </div>
              <div className="p-4 flex justify-end">
                <button onClick={() => setExpanded(null)} className="flex items-center gap-2 text-[#94A3B8] hover:text-[#F1F5F9] text-sm"><X size={16} /> Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Camera Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[#F1F5F9] text-lg font-semibold">Add Camera</h3>
                <button onClick={() => setShowAddModal(false)}><X size={18} className="text-[#94A3B8]" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-[#94A3B8] text-xs mb-1">Camera Name *</label><input value={newCamera.name} onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })} className={inputClass} placeholder="Shop Floor Camera" /></div>
                <div><label className="block text-[#94A3B8] text-xs mb-1">Location</label><input value={newCamera.location} onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })} className={inputClass} placeholder="Ground Floor" /></div>
                <div><label className="block text-[#94A3B8] text-xs mb-1">Stream URL</label><input value={newCamera.streamUrl} onChange={(e) => setNewCamera({ ...newCamera, streamUrl: e.target.value })} className={inputClass} placeholder="rtsp://..." /></div>
                <div><label className="block text-[#94A3B8] text-xs mb-1">Status</label>
                  <select value={newCamera.status} onChange={(e) => setNewCamera({ ...newCamera, status: e.target.value })} className={inputClass}>
                    <option value="OFFLINE">Offline</option><option value="LIVE">Live</option>
                  </select>
                </div>
                <button onClick={handleCreate} disabled={isSaving || !newCamera.name} className="w-full bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 text-[#0F1117] font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Add Camera</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Camera Modal */}
      <AnimatePresence>
        {showEditModal && editingCamera && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setShowEditModal(false); setEditingCamera(null); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#161B27] border border-[#1E2535] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[#F1F5F9] text-lg font-semibold">Edit Camera</h3>
                <button onClick={() => { setShowEditModal(false); setEditingCamera(null); }}><X size={18} className="text-[#94A3B8]" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-[#94A3B8] text-xs mb-1">Camera Name</label><input value={editingCamera.name} onChange={(e) => setEditingCamera({ ...editingCamera, name: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-[#94A3B8] text-xs mb-1">Location</label><input value={editingCamera.location || ''} onChange={(e) => setEditingCamera({ ...editingCamera, location: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-[#94A3B8] text-xs mb-1">Stream URL</label><input value={editingCamera.streamUrl || ''} onChange={(e) => setEditingCamera({ ...editingCamera, streamUrl: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-[#94A3B8] text-xs mb-1">Status</label>
                  <select value={editingCamera.status} onChange={(e) => setEditingCamera({ ...editingCamera, status: e.target.value })} className={inputClass}>
                    <option value="OFFLINE">Offline</option><option value="LIVE">Live</option>
                  </select>
                </div>
                <button onClick={handleUpdate} disabled={isSaving} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}