import { ArrowUpCircle, Zap, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const RECENT = [
  { name: 'naruto-ep247.mkv', algo: 'Anime4K v4', from: '720p', to: '4K', time: '1m 48s', status: 'done' },
  { name: 'ghibli-clip.mp4', algo: 'Real-CUGAN', from: '480p', to: '1080p', time: '54s', status: 'done' },
  { name: 'chainsaw-man-op.mkv', algo: 'Real-ESRGAN', from: '1080p', to: '4K', time: '3m 12s', status: 'done' },
];

export default function DashboardView({ onNavigate }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back 👋</h1>
        <p className="text-slate-400 text-sm">Your AI video enhancement studio is ready.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: CheckCircle, label: 'Videos Enhanced', value: '247', sub: '+12 this week', color: '#10b981' },
          { icon: ArrowUpCircle, label: 'Avg Scale Factor', value: '3.2x', sub: 'Across all jobs', color: '#7c5cfc' },
          { icon: Zap, label: 'Avg Speed', value: '38.4 fps', sub: 'Processing speed', color: '#22d3ee' },
          { icon: Clock, label: 'Time Saved', value: '14.2 hrs', sub: 'vs CPU processing', color: '#f59e0b' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="rounded-2xl p-5 hover-lift"
            style={{ background: 'rgba(30,33,48,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <TrendingUp size={14} className="text-slate-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-white mb-0.5">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Upscale a Video', desc: 'Enhance resolution with AI', icon: '🔥', action: 'upscale', color: '#7c5cfc' },
            { label: 'Interpolate FPS', desc: 'Smooth motion with RIFE', icon: '🎬', action: 'interpolation', color: '#22d3ee' },
            { label: 'View Queue', desc: 'Monitor running jobs', icon: '📋', action: 'queue', color: '#10b981' },
          ].map(({ label, desc, icon, action, color }) => (
            <button key={action} onClick={() => onNavigate(action)}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 hover-lift group"
              style={{ background: 'rgba(30,33,48,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                {icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Jobs */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Jobs</p>
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(30,33,48,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {RECENT.map((job, i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i < RECENT.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/2 transition-all duration-200`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)' }}>
                🎌
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{job.name}</p>
                <p className="text-xs text-slate-500">{job.algo}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>{job.from}</span>
                <span className="text-slate-700">→</span>
                <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(124,92,252,0.1)', color: '#a78bfa' }}>{job.to}</span>
              </div>
              <span className="text-xs text-slate-500 font-mono w-16 text-right">{job.time}</span>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <CheckCircle size={12} /> Done
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
