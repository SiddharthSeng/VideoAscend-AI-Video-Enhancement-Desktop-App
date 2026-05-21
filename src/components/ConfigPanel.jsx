import { Folder } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ALGORITHMS = [
  { id: 'anime4k',   emoji: '🎌', name: 'Anime4K v4',  desc: 'GLSL, fast',      badge: 'GLSL',   badgeColor: '#22d3ee' },
  { id: 'realesrgan',emoji: '🔥', name: 'Real-ESRGAN', desc: 'Photorealistic',   badge: 'Vulkan', badgeColor: '#f59e0b' },
  { id: 'realcugan', emoji: '💎', name: 'Real-CUGAN',  desc: 'Sharp edges',      badge: 'CUGAN',  badgeColor: '#10b981' },
  { id: 'glsl',      emoji: '⚡', name: 'Custom GLSL', desc: 'MPV shader',       badge: 'Custom', badgeColor: '#a78bfa' },
];

const RIFE_MODELS   = ['RIFE v4.6', 'RIFE v4.14', 'RIFE v4.18'];
const SCALE_FACTORS = ['1x', '2x', '3x', '4x'];
const MODES         = ['Upscaling', 'Frame Interpolation', 'Both'];
const FORMATS       = ['MP4', 'MKV'];
const CODECS        = ['H.264', 'H.265', 'AV1'];

function CRFLabel(crf) {
  if (crf <= 17) return { label: 'Lossless',  color: '#10b981' };
  if (crf <= 23) return { label: 'Excellent', color: '#22d3ee' };
  if (crf <= 28) return { label: 'Good',      color: '#f59e0b' };
  return { label: 'Low Quality', color: '#f43f5e' };
}

export default function ConfigPanel({ config, onChange, compact = false, showAdvanced = false }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { mode, algorithm, scaleFactor, rifeModel, targetFps, format, codec, crf, outputPath } = config;
  const crfInfo = CRFLabel(crf);
  const showInterp = mode === 'Frame Interpolation' || mode === 'Both';

  const label    = isDark ? '#64748b' : '#94a3b8';
  const textCol  = isDark ? '#e2e8f0' : '#1e293b';
  const inputBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const sectionBg  = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';

  const pillBtn = (opts, current, field) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {opts.map(opt => (
        <button
          key={opt}
          id={`${field}-${opt.replace(/\s+/g,'-').toLowerCase()}`}
          onClick={() => onChange(field, opt)}
          style={{
            flex: 1, padding: '5px 4px', borderRadius: 8, fontSize: 10, fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: current === opt ? 'linear-gradient(135deg,#7c5cfc,#6366f1)' : inputBg,
            color: current === opt ? '#fff' : isDark ? '#94a3b8' : '#64748b',
            boxShadow: current === opt ? '0 2px 8px rgba(124,92,252,0.35)' : 'none',
            outline: current !== opt ? `1px solid ${inputBorder}` : 'none',
            transition: 'all 0.15s',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const sectionLabel = (text) => (
    <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: label, display: 'block', marginBottom: 6 }}>
      {text}
    </label>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Mode */}
      <div>
        {sectionLabel('Mode')}
        {pillBtn(MODES, mode, 'mode')}
      </div>

      {/* Algorithm — horizontal scrollable cards (compact) */}
      {(mode === 'Upscaling' || mode === 'Both') && (
        <div className="animate-fade-in">
          {sectionLabel('Algorithm')}
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
            {ALGORITHMS.map(algo => {
              const sel = algorithm === algo.id;
              return (
                <button
                  key={algo.id}
                  id={`algo-${algo.id}`}
                  onClick={() => onChange('algorithm', algo.id)}
                  style={{
                    minWidth: compact ? 90 : 120, padding: '7px 8px', borderRadius: 10,
                    border: sel ? '1.5px solid rgba(124,92,252,0.5)' : `1px solid ${inputBorder}`,
                    background: sel ? 'rgba(124,92,252,0.12)' : inputBg,
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>{algo.emoji}</span>
                    <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, fontWeight: 700, background: `${algo.badgeColor}20`, color: algo.badgeColor }}>
                      {algo.badge}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: sel ? '#a78bfa' : textCol }}>{algo.name}</span>
                  <span style={{ fontSize: 9, color: label }}>{algo.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scale factor — pill row */}
      {(mode === 'Upscaling' || mode === 'Both') && (
        <div className="animate-fade-in">
          {sectionLabel('Scale Factor')}
          <div style={{ display: 'flex', gap: 5 }}>
            {SCALE_FACTORS.map(sf => (
              <button
                key={sf}
                id={`scale-${sf}`}
                onClick={() => onChange('scaleFactor', sf)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: scaleFactor === sf ? 'linear-gradient(135deg,#7c5cfc,#6366f1)' : inputBg,
                  color: scaleFactor === sf ? '#fff' : isDark ? '#94a3b8' : '#64748b',
                  boxShadow: scaleFactor === sf ? '0 2px 10px rgba(124,92,252,0.4)' : 'none',
                  outline: scaleFactor !== sf ? `1px solid ${inputBorder}` : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {sf}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RIFE — interpolation */}
      {showInterp && (
        <div className="animate-fade-in" style={{ borderRadius: 10, padding: '10px 10px', background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)' }}>
          {sectionLabel('Interpolation Model')}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {RIFE_MODELS.map(m => (
              <button key={m} onClick={() => onChange('rifeModel', m)} style={{
                flex: 1, padding: '4px 2px', borderRadius: 6, fontSize: 9, fontWeight: 600,
                background: rifeModel === m ? 'rgba(34,211,238,0.2)' : inputBg,
                border: rifeModel === m ? '1px solid rgba(34,211,238,0.5)' : `1px solid ${inputBorder}`,
                color: rifeModel === m ? '#22d3ee' : isDark ? '#94a3b8' : '#64748b',
                cursor: 'pointer',
              }}>{m}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: label, whiteSpace: 'nowrap' }}>Target FPS</span>
            {[24, 60, 120].map(fps => (
              <button key={fps} onClick={() => onChange('targetFps', fps)} style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                background: targetFps === fps ? 'rgba(34,211,238,0.2)' : inputBg,
                border: targetFps === fps ? '1px solid rgba(34,211,238,0.5)' : `1px solid ${inputBorder}`,
                color: targetFps === fps ? '#22d3ee' : isDark ? '#94a3b8' : '#64748b',
                cursor: 'pointer',
              }}>{fps}</button>
            ))}
          </div>
        </div>
      )}

      {/* Output settings — always visible basics, advanced behind toggle */}
      <div style={{ borderRadius: 10, padding: '10px', background: sectionBg, border: `1px solid ${inputBorder}` }}>
        {sectionLabel('Output')}

        {/* Format + Codec */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 9, color: label }}>Format</span>
            {pillBtn(FORMATS, format, 'format')}
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 9, color: label }}>Codec</span>
            {pillBtn(CODECS, codec === 'h264' ? 'H.264' : codec === 'h265' ? 'H.265' : 'AV1', 'codec')}
          </div>
        </div>

        {/* CRF Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: label }}>CRF Quality</span>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: crfInfo.color }}>{crf} — {crfInfo.label}</span>
          </div>
          <input
            id="crf-slider"
            type="range" min="0" max="51" value={crf}
            onChange={e => onChange('crf', Number(e.target.value))}
            style={{
              width: '100%', height: 6, borderRadius: 3, appearance: 'none', cursor: 'pointer',
              background: `linear-gradient(to right,${crfInfo.color} 0%,${crfInfo.color} ${(crf/51)*100}%,${isDark ? 'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'} ${(crf/51)*100}%,${isDark ? 'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'} 100%)`,
            }}
          />
        </div>

        {/* Advanced: output path (if showAdvanced) */}
        {showAdvanced && (
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 9, color: label }}>Output Path</span>
            <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
              <input
                id="output-path"
                type="text"
                value={outputPath}
                onChange={e => onChange('outputPath', e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 7, fontSize: 9, fontFamily: 'monospace', outline: 'none', background: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? '#94a3b8' : '#64748b' }}
              />
              <button
                onClick={async () => {
                  if (window.electronAPI) {
                    const dir = await window.electronAPI.selectOutputDir();
                    if (dir) onChange('outputPath', dir);
                  }
                }}
                style={{ padding: '5px 8px', borderRadius: 7, background: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}
              >
                <Folder size={11} /> Browse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
