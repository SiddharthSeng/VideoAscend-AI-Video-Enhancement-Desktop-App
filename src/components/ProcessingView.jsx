import { useState, useEffect, useRef, useCallback } from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

const STAGES_ORDER = ['probing', 'extracting', 'upscaling', 'encoding'];
const STAGE_LABELS = {
  probing:    'Probing',
  extracting: 'Extracting Frames',
  upscaling:  'Upscaling',
  encoding:   'Encoding',
};

const SIM_LOGS = [
  '[init] VideoAscend engine v6.5.0',
  '[gpu]  Detecting GPU acceleration...',
  '[gpu]  NVIDIA NVENC detected',
  '[probe] Input: 854×480 @ 23.976fps',
  '[probe] Output target: 3840×2160 (4×)',
  '[extract] Extracting frames...',
  '[upscale] Starting Anime4K pipeline (batch=8)',
  '[upscale] Frame 0042/3691 @ 28.4 fps',
  '[upscale] Frame 0487/3691 @ 36.2 fps',
  '[upscale] Frame 1481/3691 @ 38.7 fps',
  '[upscale] Frame 2934/3691 @ 39.5 fps',
  '[upscale] Frame 3691/3691 ✓',
  '[encode] H.265 CRF 18 via NVENC...',
  '[encode] Muxing audio...',
  '[done]  Enhancement complete! ✓',
];

function CircularProgress({ percent, isDark, size = 120 }) {
  const r   = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (percent / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'} strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#pg)" strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          className="progress-ring-circle"
          style={{ filter: 'drop-shadow(0 0 6px rgba(124,92,252,0.8))' }} />
        <defs>
          <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c5cfc" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: isDark ? '#fff' : '#1e293b' }}>
          {Math.round(percent)}
        </span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>%</span>
      </div>
    </div>
  );
}

export default function ProcessingView({ onCancel, onComplete, config, file, jobId }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [progress,         setProgress]         = useState(0);
  const [currentStage,     setCurrentStage]      = useState('probing');
  const [logs,             setLogs]              = useState([]);
  const [elapsed,          setElapsed]           = useState(0);
  const [fps,              setFps]               = useState(0);
  const [framesProcessed,  setFramesProcessed]   = useState(0);
  const [totalFrames,      setTotalFrames]       = useState(file?.totalFrames || 3691);
  const [eta,              setEta]               = useState(0);
  const [logExpanded,      setLogExpanded]       = useState(false);

  const logRef   = useRef(null);
  const startRef = useRef(Date.now());

  const addLog = useCallback((msg) => setLogs(prev => [...prev.slice(-100), msg]), []);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Real IPC progress
  useEffect(() => {
    if (!isElectron) return;
    const c1 = window.electronAPI.onProcessingProgress((data) => {
      if (data.jobId !== jobId) return;
      setCurrentStage(data.stage || 'upscaling');
      if (data.percent   !== undefined) setProgress(data.percent);
      if (data.fps)                     setFps(data.fps);
      if (data.currentFrame)            setFramesProcessed(data.currentFrame);
      if (data.totalFrames)             setTotalFrames(data.totalFrames);
      if (data.eta)                     setEta(data.eta);
      if (data.message)                 addLog(data.message);
    });
    const c2 = window.electronAPI.onProcessingComplete((data) => {
      if (data.jobId !== jobId) return;
      setProgress(100);
      addLog('[✓] Enhancement complete!');
      setTimeout(() => onComplete(data), 600);
    });
    const c3 = window.electronAPI.onProcessingError((data) => {
      if (data.jobId !== jobId) return;
      addLog(`[ERROR] ${data.error}`);
    });
    return () => { c1?.(); c2?.(); c3?.(); };
  }, [jobId, addLog, onComplete]);

  // Web simulation
  useEffect(() => {
    if (isElectron) return;
    const DURATION = 22000;
    const start    = Date.now();
    let logIdx     = 0;
    const tick = setInterval(() => {
      const e   = Date.now() - start;
      const pct = Math.min((e / DURATION) * 100, 100);
      setProgress(pct);
      setFramesProcessed(Math.floor((pct / 100) * totalFrames));
      setFps(pct > 5 ? parseFloat((28 + Math.min(pct * 0.12, 12)).toFixed(1)) : 0);
      setEta(Math.max(0, Math.round((DURATION - e) / 1000)));
      const si = Math.min(Math.floor((pct / 100) * STAGES_ORDER.length), STAGES_ORDER.length - 1);
      setCurrentStage(STAGES_ORDER[si]);
      const tl = Math.floor((pct / 100) * SIM_LOGS.length);
      while (logIdx < tl) { addLog(SIM_LOGS[logIdx]); logIdx++; }
      if (pct >= 100) {
        clearInterval(tick);
        setTimeout(() => onComplete({ jobId, outputPath: null, stats: { framesProcessed: totalFrames, outputSize: 847 } }), 600);
      }
    }, 100);
    return () => clearInterval(tick);
  }, [isElectron, totalFrames, addLog, onComplete, jobId]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  const stageIdx = STAGES_ORDER.indexOf(currentStage);
  const card = isDark ? 'rgba(30,33,48,0.8)' : 'rgba(255,255,255,0.9)';
  const bdr  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top: circular progress + stage info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, background: card, border: `1px solid ${bdr}` }}>
        <CircularProgress percent={progress} isDark={isDark} size={110} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file?.name || 'video.mp4'}
          </p>
          <p style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, margin: '0 0 8px' }}>
            {STAGE_LABELS[currentStage] || 'Processing'}…
          </p>
          {/* Pipeline dots */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {STAGES_ORDER.map((s, i) => {
              const done   = i < stageIdx;
              const active = i === stageIdx;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: done ? '#10b981' : active ? '#7c5cfc' : isDark ? '#1e293b' : '#cbd5e1',
                    border: active ? '1.5px solid #a78bfa' : 'none',
                    boxShadow: active ? '0 0 6px rgba(124,92,252,0.6)' : 'none',
                    animation: active ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }} />
                  {i < STAGES_ORDER.length - 1 && (
                    <div style={{ width: 14, height: 1, background: done ? '#10b981' : isDark ? '#1e293b' : '#e2e8f0' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3 stat pills */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { label: 'FPS',    value: fps.toFixed(1),   color: '#22d3ee' },
          { label: 'Frames', value: `${framesProcessed}/${totalFrames}`, color: '#a78bfa' },
          { label: 'ETA',    value: fmt(eta),          color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, textAlign: 'center', background: card, border: `1px solid ${bdr}` }}>
            <p style={{ fontSize: 9, color: isDark ? '#475569' : '#94a3b8', margin: '0 0 3px' }}>{label}</p>
            <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Compact log */}
      <div style={{ borderRadius: 10, overflow: 'hidden', background: isDark ? '#080a12' : '#1a1d27', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)'}` }}>
        <div
          onClick={() => setLogExpanded(v => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', cursor: 'pointer', borderBottom: logExpanded ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            {['#ef4444','#eab308','#22c55e'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.6 }} />)}
          </div>
          <span style={{ fontSize: 9, color: '#4b5563', fontFamily: 'monospace' }}>va-engine log</span>
          <span style={{ fontSize: 9, color: '#4b5563' }}>{logExpanded ? '▾' : '▸'}</span>
        </div>
        <div
          ref={logRef}
          style={{
            height: logExpanded ? 140 : 56, overflowY: 'auto', padding: '6px 10px',
            display: 'flex', flexDirection: 'column', gap: 1,
            transition: 'height 0.25s ease',
          }}
        >
          {(logExpanded ? logs : logs.slice(-3)).map((line, i) => {
            const isErr = line.toLowerCase().includes('error');
            const isOk  = line.includes('✓') || line.includes('complete');
            return (
              <div key={i} className="log-line-enter" style={{ fontSize: 9, fontFamily: 'monospace', color: isErr ? '#f43f5e' : isOk ? '#10b981' : '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {line}
              </div>
            );
          })}
          {progress < 100 && <span style={{ fontSize: 9, color: '#a78bfa', animation: 'pulse 1s infinite' }}>▌</span>}
        </div>
      </div>

      {/* Cancel */}
      <button
        id="cancel-processing-btn"
        onClick={onCancel}
        style={{
          width: '100%', padding: '10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
          border: '1px solid rgba(244,63,94,0.35)', color: '#f43f5e', background: 'rgba(244,63,94,0.06)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.06)'}
      >
        <XCircle size={14} /> Cancel Processing
      </button>
    </div>
  );
}
