import { X, Cpu, Monitor, Globe, Info, Sliders } from 'lucide-react';

const SECTIONS = [
  { id: 'hardware', label: 'Hardware', icon: Cpu },
  { id: 'processing', label: 'Processing', icon: Sliders },
  { id: 'output', label: 'Output', icon: Monitor },
  { id: 'interface', label: 'Interface', icon: Globe },
  { id: 'about', label: 'About', icon: Info },
];

const GPUS = ['NVIDIA RTX 3080 (12GB)', 'NVIDIA RTX 4090 (24GB)', 'AMD RX 7900 XTX', 'Intel Arc A770'];

export default function SettingsModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <h2 className="text-base font-bold text-white">Settings</h2>
            <p className="text-xs text-slate-500">Configure VideoAscend preferences</p>
          </div>
          <button id="close-settings-btn" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Hardware */}
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              <Cpu size={13} /> Hardware
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">GPU Device</label>
                  <select id="gpu-select" className="w-full px-3 py-2 rounded-lg text-sm text-slate-300 outline-none appearance-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {GPUS.map(g => <option key={g} value={g} style={{ background: '#1a1d27' }}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Vulkan Device</label>
                  <select className="w-full px-3 py-2 rounded-lg text-sm text-slate-300 outline-none appearance-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option style={{ background: '#1a1d27' }}>Auto-detect</option>
                    <option style={{ background: '#1a1d27' }}>Device 0 (RTX 3080)</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <label className="text-slate-500">Processing Threads</label>
                  <span className="text-violet-400 font-mono font-bold">8</span>
                </div>
                <input type="range" min="1" max="32" defaultValue="8" className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #7c5cfc 50%, rgba(255,255,255,0.1) 50%)' }} />
              </div>
            </div>
          </section>

          <div className="border-t border-white/6" />

          {/* Processing Defaults */}
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              <Sliders size={13} /> Processing Defaults
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Default Algorithm</label>
                <select className="w-full px-3 py-2 rounded-lg text-sm text-slate-300 outline-none appearance-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {['Anime4K v4', 'Real-ESRGAN', 'Real-CUGAN', 'Custom GLSL'].map(a => (
                    <option key={a} style={{ background: '#1a1d27' }}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Default Scale Factor</label>
                <select className="w-full px-3 py-2 rounded-lg text-sm text-slate-300 outline-none appearance-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {['1x', '2x', '3x', '4x'].map(s => <option key={s} style={{ background: '#1a1d27' }}>{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          <div className="border-t border-white/6" />

          {/* Output */}
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              <Monitor size={13} /> Output
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Default Save Path</label>
                <input type="text" defaultValue="C:\Users\User\Videos\VideoAscend\Output"
                  className="w-full px-3 py-2 rounded-lg text-xs text-slate-300 font-mono outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Filename Template</label>
                <input type="text" defaultValue="{filename}_{algorithm}_{scale}_{resolution}"
                  className="w-full px-3 py-2 rounded-lg text-xs text-slate-300 font-mono outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            </div>
          </section>

          <div className="border-t border-white/6" />

          {/* Interface */}
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              <Globe size={13} /> Interface
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Theme</label>
                <div className="flex gap-2">
                  {['Dark', 'Light'].map(t => (
                    <button key={t} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${t === 'Dark' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      style={t === 'Dark' ? {
                        background: 'linear-gradient(135deg, #7c5cfc, #6366f1)',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Language</label>
                <select className="w-full px-3 py-2 rounded-lg text-sm text-slate-300 outline-none appearance-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {['English', 'Japanese (日本語)', 'Chinese (中文)', 'Korean (한국어)', 'German'].map(l => (
                    <option key={l} style={{ background: '#1a1d27' }}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="border-t border-white/6" />

          {/* About */}
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              <Info size={13} /> About
            </h3>
            <div className="rounded-xl p-4 space-y-2"
              style={{ background: 'rgba(124,92,252,0.05)', border: '1px solid rgba(124,92,252,0.15)' }}>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Version</span>
                <span className="text-violet-400 font-mono font-bold">v6.4.0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">License</span>
                <span className="text-slate-300 font-mono">AGPL-3.0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Engine</span>
                <span className="text-slate-300 font-mono">ncnn + Vulkan</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Built with</span>
                <span className="text-slate-300 font-mono">React + Vite</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              VideoAscend is inspired by <span className="text-violet-400">Video2X</span> by k4yt3x.
              This is an open-source project licensed under AGPL-3.0.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/6"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/6 transition-all duration-200">
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #6366f1)', boxShadow: '0 4px 14px rgba(124,92,252,0.35)' }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
