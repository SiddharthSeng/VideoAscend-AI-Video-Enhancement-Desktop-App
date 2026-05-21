import { LayoutDashboard, ArrowUpCircle, Film, List, Folder, Settings, ChevronLeft, ChevronRight, Zap, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'upscale',       label: 'Upscale',        icon: ArrowUpCircle },
  { id: 'interpolation', label: 'Interpolation',  icon: Film },
  { id: 'queue',         label: 'Queue',          icon: List },
  { id: 'output',        label: 'Output Files',   icon: Folder },
  { id: 'download',      label: 'Get the App',    icon: Download },
  { id: 'settings',      label: 'Settings',       icon: Settings },
];

export default function Sidebar({ active, onNavigate, collapsed, onToggle }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bg = isDark
    ? 'linear-gradient(180deg,#12151f 0%,#0f1117 100%)'
    : 'linear-gradient(180deg,#f8fafc 0%,#f1f3f9 100%)';
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  const logoSubColor = isDark ? '#475569' : '#94a3b8';

  return (
    <aside
      className="flex flex-col transition-all duration-300 ease-in-out relative flex-shrink-0"
      style={{
        width: collapsed ? 64 : 220,
        background: bg,
        minHeight: '100%',
        borderRight: `1px solid ${borderColor}`,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#7c5cfc,#6366f1)', boxShadow: '0 0 16px rgba(124,92,252,0.5)' }}>
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <span className="font-bold text-sm tracking-tight text-gradient-violet whitespace-nowrap">VideoAscend</span>
            <div className="text-xs font-mono" style={{ color: logoSubColor }}>v6.4.0</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : ''}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${isActive ? 'active-nav' : ''}`}
              style={!isActive ? {
                color: isDark ? '#64748b' : '#94a3b8',
              } : {
                color: '#c4b5fd',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={18} className="flex-shrink-0 transition-colors"
                style={{ color: isActive ? '#a78bfa' : isDark ? '#475569' : '#94a3b8' }} />
              {!collapsed && (
                <span className="truncate animate-fade-in whitespace-nowrap"
                  style={{ color: isActive ? '#c4b5fd' : isDark ? '#94a3b8' : '#64748b' }}>
                  {label}
                </span>
              )}
              {isActive && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-l-full bg-violet-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2" style={{ borderTop: `1px solid ${borderColor}` }}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg transition-all duration-200"
          style={{ color: isDark ? '#475569' : '#94a3b8' }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
