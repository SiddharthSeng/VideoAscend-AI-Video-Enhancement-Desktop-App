import { useState, useRef, useCallback, useEffect } from 'react';
import { FolderOpen, RefreshCcw, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// CSS confetti burst (no library)
function ConfettiBurst() {
  const colors = ['#7c5cfc','#22d3ee','#10b981','#f59e0b','#f43f5e','#a78bfa'];
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${20 + Math.random() * 60}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${1 + Math.random() * 0.8}s`,
    rotate: `${Math.random() * 360}deg`,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            top: '-10px',
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotate})`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function CompletionView({ onProcessAnother, onOpenOutput, completionData, file }) {
  const { theme } = useTheme();
  const isDark   = theme === 'dark';
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(t);
  }, []);

  const stats       = completionData?.stats || {};
  const inputRes    = stats.inputResolution  || file?.resolution || '854×480';
  const outputRes   = stats.outputResolution || '3840×2160';
  const frameCount  = stats.framesProcessed  || file?.totalFrames || 3691;
  const outputSize  = stats.outputSize ? `${stats.outputSize} MB` : '847 MB';
  const elapsedTime = completionData?.elapsedTime || '';

  const card = isDark ? 'rgba(30,33,48,0.8)' : 'rgba(255,255,255,0.9)';
  const bdr  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';

  return (
    <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
      {showConfetti && <ConfettiBurst />}

      {/* Success banner */}
      <div style={{
        borderRadius: 14, padding: '16px 14px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(124,92,252,0.08))',
        border: '1px solid rgba(16,185,129,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.5)', position: 'relative' }}>
          <CheckCircle size={24} style={{ color: '#10b981' }} />
          <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(16,185,129,0.2)', animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: isDark ? '#fff' : '#1e293b', margin: '0 0 4px' }}>
          Enhancement Complete!
        </h2>
        <p style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', margin: 0 }}>
          {file?.name} → {outputRes}
          {elapsedTime && <span> in {elapsedTime}</span>}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[
          { label: 'Output Resolution', value: outputRes,             color: '#a78bfa' },
          { label: 'Input Resolution',  value: inputRes,              color: '#64748b' },
          { label: 'Frames Processed',  value: frameCount.toLocaleString(), color: '#22d3ee' },
          { label: 'Output Size',       value: outputSize,            color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '10px 12px', borderRadius: 10, background: card, border: `1px solid ${bdr}`, textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: isDark ? '#475569' : '#94a3b8', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Before/After mini */}
      <div style={{ borderRadius: 12, overflow: 'hidden', height: 80, position: 'relative', background: isDark ? 'linear-gradient(135deg,#1a1d27,#2a2d3e)' : 'linear-gradient(135deg,#e0e7ff,#c7d2fe)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '2px solid rgba(124,92,252,0.6)' }}>
            <span style={{ fontSize: 22, fontWeight: 800, opacity: 0.12, fontFamily: 'monospace', color: isDark ? '#fff' : '#1e293b' }}>
              {inputRes.split('×')[1] || 480}p
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(124,92,252,0.08)' : 'rgba(124,92,252,0.05)' }}>
            <span style={{ fontSize: 22, fontWeight: 800, opacity: 0.2, fontFamily: 'monospace', color: '#7c5cfc' }}>4K</span>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 6, left: 8, padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: 'rgba(244,63,94,0.2)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.35)' }}>
          Before
        </div>
        <div style={{ position: 'absolute', top: 6, right: 8, padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)' }}>
          After
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          id="open-output-btn"
          onClick={onOpenOutput}
          style={{
            flex: 1, padding: '10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
            background: card, border: `1px solid ${bdr}`, color: isDark ? '#e2e8f0' : '#374151',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = card}
        >
          <FolderOpen size={13} /> Open Folder
        </button>
        <button
          id="process-another-btn"
          onClick={onProcessAnother}
          style={{
            flex: 2, padding: '10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
            background: 'linear-gradient(135deg,#7c5cfc,#6366f1)',
            border: 'none', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: '0 4px 16px rgba(124,92,252,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <RefreshCcw size={13} /> Process Another
        </button>
      </div>
    </div>
  );
}
