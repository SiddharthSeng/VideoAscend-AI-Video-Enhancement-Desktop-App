import { Wand2, ListOrdered, Download, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const TABS = [
  { id: 'upscale',  Icon: Wand2,       label: 'Upscale'  },
  { id: 'queue',    Icon: ListOrdered,  label: 'Queue'    },
  { id: 'download', Icon: Download,     label: 'Download' },
  { id: 'settings', Icon: Settings,     label: 'Settings' },
];

export default function BottomNav({ active, onNavigate, queueBadge = 0 }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bar    = isDark ? 'rgba(15,17,23,0.95)' : 'rgba(248,249,252,0.97)';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)';
  const muted  = isDark ? '#475569' : '#94a3b8';

  return (
    <nav
      style={{
        height: 52,
        background: bar,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${border}`,
        boxShadow: `0 -4px 16px rgba(124,92,252,0.06)`,
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
        position: 'relative',
        zIndex: 50,
      }}
    >
      {TABS.map(({ id, Icon, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            id={`nav-${id}`}
            onClick={() => onNavigate(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '4px 0 2px',
              position: 'relative',
              transition: 'all 0.2s ease',
              color: isActive ? '#a78bfa' : muted,
            }}
          >
            {/* Active underline */}
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: 0, left: '20%', right: '20%',
                height: 2,
                borderRadius: '2px 2px 0 0',
                background: 'linear-gradient(90deg, #7c5cfc, #a78bfa)',
                boxShadow: '0 0 8px rgba(124,92,252,0.6)',
              }} />
            )}

            {/* Icon with badge for queue */}
            <div style={{ position: 'relative' }}>
              <Icon
                size={17}
                style={{
                  filter: isActive ? 'drop-shadow(0 0 4px rgba(167,139,250,0.7))' : 'none',
                  transition: 'filter 0.2s',
                }}
              />
              {id === 'queue' && queueBadge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -5, right: -7,
                  minWidth: 14, height: 14,
                  borderRadius: 7,
                  background: '#7c5cfc',
                  color: '#fff',
                  fontSize: 8,
                  fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 2px',
                  lineHeight: 1,
                }}>
                  {queueBadge > 99 ? '99+' : queueBadge}
                </span>
              )}
            </div>

            <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, letterSpacing: '0.04em' }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
