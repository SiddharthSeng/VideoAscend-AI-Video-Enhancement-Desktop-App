import { useState, useEffect, useCallback } from 'react';
import { Pin, Sun, Moon, Minus, Maximize2, Minimize2, X, HelpCircle, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

export default function TitleBar({ currentView, viewTitle, onOpenAI, hwAccelLabel, queueCount, onHelpToggle }) {
  const { theme, setTheme } = useTheme();
  const isDark  = theme === 'dark';
  const [pinned,    setPinned]   = useState(false);
  const [expanded,  setExpanded] = useState(false);
  const [iconAnim,  setIconAnim] = useState(false);

  // Restore always-on-top state
  useEffect(() => {
    if (isElectron) {
      window.electronAPI.windowGetAlwaysOnTop().then(v => setPinned(!!v)).catch(() => {});
    }
  }, []);

  const togglePin = useCallback(async () => {
    if (isElectron) {
      const next = await window.electronAPI.windowToggleAlwaysOnTop();
      setPinned(next);
    } else {
      setPinned(p => !p);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
    setIconAnim(true);
    setTimeout(() => setIconAnim(false), 400);
  }, [isDark, setTheme]);

  const toggleExpand = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    if (isElectron) window.electronAPI.windowExpand(next);
  }, [expanded]);

  const handleMinimize = useCallback(() => {
    if (isElectron) window.electronAPI.windowMinimize();
  }, []);

  const handleClose = useCallback(() => {
    if (isElectron) window.electronAPI.windowHide();
  }, []);

  const bar     = isDark ? 'rgba(15,17,23,0.92)' : 'rgba(248,249,252,0.92)';
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)';
  const muted   = isDark ? '#475569' : '#94a3b8';
  const normal  = isDark ? '#94a3b8' : '#64748b';

  const btnStyle = {
    width: 28, height: 28,
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: 'none', background: 'transparent',
    color: normal, transition: 'all 0.15s ease',
    WebkitAppRegion: 'no-drag',
    flexShrink: 0,
  };

  return (
    <header
      style={{
        height: 40,
        background: bar,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 8px 0 12px',
        gap: 4,
        flexShrink: 0,
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Left: icon + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14 }}>⬆️</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: muted, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
          VideoAscend
        </span>
        {hwAccelLabel && hwAccelLabel !== 'CPU Software' && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace',
            background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
            WebkitAppRegion: 'no-drag',
          }}>
            {hwAccelLabel.split(' ').slice(-1)[0]} ✓
          </span>
        )}
      </div>

      {/* Center: view title */}
      <span style={{
        fontSize: 11, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b',
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        whiteSpace: 'nowrap', pointerEvents: 'none',
      }}>
        {viewTitle}
      </span>

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, WebkitAppRegion: 'no-drag', flexShrink: 0 }}>
        {/* AI Advisor */}
        <button
          id="ai-advisor-btn"
          onClick={onOpenAI}
          title="AI Advisor"
          style={{
            ...btnStyle,
            color: '#a78bfa',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,252,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Sparkles size={13} />
        </button>

        {/* Help */}
        {onHelpToggle && (
          <button
            id="help-btn"
            onClick={onHelpToggle}
            title="Keyboard shortcuts"
            style={btnStyle}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <HelpCircle size={13} />
          </button>
        )}

        <div style={{ width: 1, height: 16, background: border, margin: '0 2px' }} />

        {/* Pin */}
        <button
          id="pin-btn"
          onClick={togglePin}
          title={pinned ? 'Unpin (always on top)' : 'Pin (always on top)'}
          style={{
            ...btnStyle,
            color: pinned ? '#a78bfa' : normal,
            background: pinned ? 'rgba(124,92,252,0.15)' : 'transparent',
            boxShadow: pinned ? '0 0 8px rgba(124,92,252,0.4)' : 'none',
          }}
          onMouseEnter={e => { if (!pinned) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { if (!pinned) e.currentTarget.style.background = 'transparent'; }}
        >
          <Pin size={13} />
        </button>

        {/* Theme */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
          style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className={iconAnim ? 'theme-icon-enter' : ''}>
            {isDark ? <Moon size={13} style={{ color: '#a78bfa' }} /> : <Sun size={13} style={{ color: '#f59e0b' }} />}
          </div>
        </button>

        <div style={{ width: 1, height: 16, background: border, margin: '0 2px' }} />

        {/* Minimize */}
        <button
          id="minimize-btn"
          onClick={handleMinimize}
          title="Minimize"
          style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Minus size={13} />
        </button>

        {/* Expand/compact */}
        <button
          id="expand-btn"
          onClick={toggleExpand}
          title={expanded ? 'Compact view' : 'Expand view'}
          style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>

        {/* Close → hide */}
        <button
          id="close-btn"
          onClick={handleClose}
          title="Hide to tray"
          style={{ ...btnStyle, color: '#f87171' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f87171'; }}
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
}
