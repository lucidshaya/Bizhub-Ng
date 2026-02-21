import React, { useEffect, useState } from 'react';
import { Plus, X, WifiOff, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const cameras = [
{
  id: 1,
  name: 'Shop Floor',
  online: true
},
{
  id: 2,
  name: 'Entrance Gate',
  online: true
},
{
  id: 3,
  name: 'Warehouse A',
  online: false
},
{
  id: 4,
  name: 'Office',
  online: true
},
{
  id: 5,
  name: 'Parking Lot',
  online: true
},
{
  id: 6,
  name: 'Server Room',
  online: true
}];

function MiniCameraFeed({
  camera,
  onClick



}: {camera: (typeof cameras)[0];onClick: () => void;}) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      onClick={onClick}
      className="relative bg-[#0A0E1A] rounded-xl overflow-hidden cursor-pointer border border-[#1E2535]"
      style={{
        aspectRatio: '16/9'
      }}>

      {camera.online ?
      <>
          <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
            'linear-gradient(#00D084 1px, transparent 1px), linear-gradient(90deg, #00D084 1px, transparent 1px)',
            backgroundSize: '25px 25px'
          }} />

          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D084]/50 to-transparent cctv-scan" />
          <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-[#00D084]/60" />
          <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-[#00D084]/60" />
        </> :

      <div className="absolute inset-0 flex items-center justify-center">
          <WifiOff size={16} className="text-[#475569]" />
        </div>
      }
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
        <div className="flex items-center justify-between">
          <p className="text-white text-xs font-medium truncate">
            {camera.name}
          </p>
          <div
            className={`flex items-center gap-1 text-xs font-bold ${camera.online ? 'text-[#00D084]' : 'text-[#EF4444]'}`}>

            <div
              className={`w-1 h-1 rounded-full ${camera.online ? 'bg-[#00D084] live-dot' : 'bg-[#EF4444]'}`} />

            {camera.online ? 'LIVE' : 'OFF'}
          </div>
        </div>
      </div>
    </div>);

}
export function MobileCCTV() {
  const [fullscreen, setFullscreen] = useState<(typeof cameras)[0] | null>(null);
  return (
    <div className="pb-4">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <p className="text-[#F1F5F9] font-bold text-lg">Live Cameras</p>
          <p className="text-[#00D084] text-xs">
            {cameras.filter((c) => c.online).length} online ·{' '}
            {cameras.filter((c) => !c.online).length} offline
          </p>
        </div>
        <button className="w-8 h-8 bg-[#00D084] rounded-xl flex items-center justify-center">
          <Plus size={16} className="text-[#0F1117]" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        {cameras.map((cam) =>
        <MiniCameraFeed
          key={cam.id}
          camera={cam}
          onClick={() => cam.online && setFullscreen(cam)} />

        )}
      </div>

      {/* Fullscreen */}
      <AnimatePresence>
        {fullscreen &&
        <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          className="fixed inset-0 bg-[#0A0E1A] z-50 flex flex-col">

            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2535]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00D084] live-dot" />
                <span className="text-[#F1F5F9] font-semibold text-sm">
                  {fullscreen.name}
                </span>
                <span className="bg-[#00D084]/20 text-[#00D084] text-xs font-bold px-2 py-0.5 rounded-md">
                  LIVE
                </span>
              </div>
              <button
              onClick={() => setFullscreen(null)}
              className="w-8 h-8 bg-[#1E2535] rounded-xl flex items-center justify-center">

                <X size={16} className="text-[#94A3B8]" />
              </button>
            </div>
            <div className="flex-1 relative bg-[#0A0E1A] m-3 rounded-2xl overflow-hidden">
              <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                'linear-gradient(#00D084 1px, transparent 1px), linear-gradient(90deg, #00D084 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }} />

              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00D084]/60 to-transparent cctv-scan" />
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#00D084]/60" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#00D084]/60" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#00D084]/60" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#00D084]/60" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white/60 text-xs font-mono">
                  {new Date().toLocaleTimeString('en-NG')}
                </p>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}