import { Folder, Download, Eye, Trash2 } from 'lucide-react';

const FILES = [
  { name: 'naruto-ep247_Anime4K_4x_2160p.mkv', size: '2.1 GB', date: 'Today, 14:23', res: '3840×2160', algo: 'Anime4K v4' },
  { name: 'ghibli-clip_RealCUGAN_2x_1080p.mp4', size: '640 MB', date: 'Today, 12:05', res: '1920×1080', algo: 'Real-CUGAN' },
  { name: 'chainsaw-man-op_RealESRGAN_4x_2160p.mkv', size: '1.8 GB', date: 'Yesterday', res: '3840×2160', algo: 'Real-ESRGAN' },
  { name: 'one-piece-1094_Anime4K_2x_1440p.mp4', size: '980 MB', date: 'Yesterday', res: '2560×1440', algo: 'Anime4K v4' },
];

export default function OutputView() {
  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Output Files</h2>
          <p className="text-xs text-slate-500 mt-0.5">4 files · 5.5 GB total</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-white/8"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
          <Folder size={15} />
          Open Folder
        </button>
      </div>
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(30,33,48,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 border-b border-white/6"
          style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 80px', background: 'rgba(255,255,255,0.02)' }}>
          <span>Filename</span><span>Resolution</span><span>Algorithm</span><span>Size</span><span className="text-right">Actions</span>
        </div>
        {FILES.map((file, i) => (
          <div key={i} className={`grid items-center px-5 py-4 ${i < FILES.length - 1 ? 'border-b border-white/4' : ''} hover:bg-white/2 transition-all duration-200`}
            style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 80px' }}>
            <div>
              <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
              <p className="text-xs text-slate-600 mt-0.5">{file.date}</p>
            </div>
            <span className="text-xs font-mono text-violet-400 font-bold">{file.res}</span>
            <span className="text-xs text-slate-400">{file.algo}</span>
            <span className="text-xs font-mono text-slate-400">{file.size}</span>
            <div className="flex items-center justify-end gap-1">
              <button className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 transition-all duration-200"><Eye size={14} /></button>
              <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-all duration-200"><Download size={14} /></button>
              <button className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
