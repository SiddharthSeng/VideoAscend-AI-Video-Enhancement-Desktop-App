import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Check, X, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

export const BUILT_IN_PRESETS = [
  {
    id: 'anime-4k',
    name: '🎌 Anime 4K',
    description: 'Best for anime series and movies',
    config: { algorithm: 'anime4k', scaleFactor: '4x', codec: 'h265', crf: 18, targetFps: null },
  },
  {
    id: 'anime-smooth',
    name: '🎌 Anime 60fps',
    description: 'Upscale + interpolate to 60fps',
    config: { algorithm: 'anime4k', scaleFactor: '2x', codec: 'h265', crf: 20, targetFps: 60, mode: 'Both' },
  },
  {
    id: 'photo-realistic',
    name: '📸 Photo Real',
    description: 'Real-ESRGAN for live action',
    config: { algorithm: 'realesrgan', scaleFactor: '2x', codec: 'h264', crf: 18, targetFps: null },
  },
  {
    id: 'fast-preview',
    name: '⚡ Fast Preview',
    description: 'Quick result to check quality',
    config: { algorithm: 'anime4k', scaleFactor: '2x', codec: 'h264', crf: 28, targetFps: null },
  },
  {
    id: 'archival',
    name: '🗄️ Archival',
    description: 'Maximum quality, large file',
    config: { algorithm: 'realesrgan', scaleFactor: '4x', codec: 'h265', crf: 14, targetFps: null },
  },
];

function configMatches(config, presetConfig) {
  return Object.keys(presetConfig).every(k => String(config[k]) === String(presetConfig[k]));
}

export default function PresetBar({ config, onApplyPreset, onSavePreset }) {
  const { theme }  = useTheme();
  const isDark     = theme === 'dark';
  const [userPresets, setUserPresets] = useState([]);
  const [saving,     setSaving]       = useState(false);
  const [newName,    setNewName]      = useState('');
  const [ctxMenu,    setCtxMenu]      = useState(null); // { id, x, y }
  const scrollRef  = useRef(null);

  // Load user presets from store
  const loadPresets = useCallback(async () => {
    if (isElectron) {
      const stored = await window.electronAPI.storeGet('presets').catch(() => []);
      setUserPresets(Array.isArray(stored) ? stored : []);
    }
  }, []);

  useEffect(() => { loadPresets(); }, [loadPresets]);

  const saveUserPreset = useCallback(async () => {
    if (!newName.trim()) return;
    const newPreset = {
      id: `user_${Date.now()}`,
      name: newName.trim(),
      description: 'Custom preset',
      config: { ...config },
    };
    const updated = [...userPresets, newPreset];
    setUserPresets(updated);
    if (isElectron) await window.electronAPI.storeSet('presets', updated).catch(() => {});
    setSaving(false);
    setNewName('');
  }, [newName, config, userPresets]);

  const deleteUserPreset = useCallback(async (id) => {
    const updated = userPresets.filter(p => p.id !== id);
    setUserPresets(updated);
    if (isElectron) await window.electronAPI.storeSet('presets', updated).catch(() => {});
    setCtxMenu(null);
  }, [userPresets]);

  // Detect active / custom
  const allPresets = [...BUILT_IN_PRESETS, ...userPresets];
  const activePreset = allPresets.find(p => configMatches(config, p.config));
  const isCustom = !activePreset;

  const pill = (label, isActive, onClick, isBuiltIn = false, id = null) => (
    <button
      key={id || label}
      onClick={onClick}
      onContextMenu={!isBuiltIn && id ? (e) => { e.preventDefault(); setCtxMenu({ id, x: e.clientX, y: e.clientY }); } : undefined}
      title={label}
      style={{
        padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
        whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
        border: isActive ? '1.5px solid rgba(124,92,252,0.6)' : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
        background: isActive ? 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(99,102,241,0.12))' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        color: isActive ? '#a78bfa' : isDark ? '#64748b' : '#94a3b8',
        boxShadow: isActive ? '0 0 10px rgba(124,92,252,0.25)' : 'none',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ position: 'relative', marginBottom: 8 }}>
      <div
        ref={scrollRef}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Custom indicator */}
        {isCustom && (
          <span style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Custom ✦
          </span>
        )}

        {/* Built-in presets */}
        {BUILT_IN_PRESETS.map(p => pill(
          p.name,
          activePreset?.id === p.id,
          () => onApplyPreset(p.config),
          true, p.id
        ))}

        {/* User presets */}
        {userPresets.map(p => pill(
          p.name,
          activePreset?.id === p.id,
          () => onApplyPreset(p.config),
          false, p.id
        ))}

        {/* Save current */}
        {saving ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveUserPreset(); if (e.key === 'Escape') { setSaving(false); setNewName(''); } }}
              placeholder="Preset name…"
              style={{
                padding: '3px 8px', borderRadius: 8, fontSize: 10,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                border: '1px solid rgba(124,92,252,0.4)',
                color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none', width: 100,
              }}
            />
            <button onClick={saveUserPreset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: 2 }}>
              <Check size={12} />
            </button>
            <button onClick={() => { setSaving(false); setNewName(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSaving(true)}
            title="Save current settings as preset"
            style={{
              padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
              border: `1px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
              background: 'transparent', color: isDark ? '#475569' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: 3,
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={9} /> Save…
          </button>
        )}
      </div>

      {/* Context menu for user presets */}
      {ctxMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setCtxMenu(null)}
          />
          <div style={{
            position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 1000,
            background: isDark ? '#1e2130' : '#fff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
            borderRadius: 8, padding: '4px 0', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            minWidth: 120,
          }}>
            <button
              onClick={() => deleteUserPreset(ctxMenu.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '6px 12px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#ef4444',
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
