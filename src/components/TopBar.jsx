import { useState, useEffect } from 'react';
import { Settings, Cpu, Wifi, Sun, Moon, Minus, Square, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

export default function TopBar({ onSettingsOpen }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const [systemInfo, setSystemInfo] = useState({
    gpu: 'NVIDIA RTX 3080',
    vulkanAvailable: true,
  });
  const [iconAnim, setIconAnim] = useState(false);

  useEffect(() => {
    if (isElectron) {
      window.electronAPI.getSystemInfo().then(info => {
        setSystemInfo(info);
      }).catch(() => {});
    }
  }, []);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
    setIconAnim(true);
    setTimeout(() => setIconAnim(false), 400);
  };

  const bg = isDark ? 'rgba(15,17,23,0.95)' : 'rgba(248,249,252,0.95)';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const textNormal = isDark ? '#94a3b8' : '#475569';

  return (
    <header
      className="flex items-center justify-between px-6 py-3 flex-shrink-0 select-none"
      style={{ background: bg, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${borderColor}`, zIndex: 10 }}
    >
      {/* Left: GPU Status */}
      <div className="flex items-center gap-2">
        <Cpu size={14} style={{ color: textMuted }} />
        <span className="text-xs font-mono" style={{ color: textNormal }}>
          {systemInfo.gpu || 'Detecting GPU...'}
        </span>
        <span className="mx-2" style={{ color: isDark ? '#334155' : '#cbd5e1' }}>|</span>
        <Wifi size={14} className={systemInfo.vulkanAvailable ? 'text-emerald-400' : 'text-red-400'} />
        <span className={`text-xs font-medium ${systemInfo.vulkanAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
          {systemInfo.vulkanAvailable ? 'Vulkan Ready ✓' : 'Vulkan N/A'}
        </span>
        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-mono font-bold"
          style={{ background: 'rgba(124,92,252,0.15)', color: '#a78bfa', border: '1px solid rgba(124,92,252,0.3)' }}>
          CUDA 12.4
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="relative flex items-center gap-1 p-2 rounded-lg transition-all duration-200 group"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${borderColor}`,
          }}
        >
          <div className={`transition-all duration-300 ${iconAnim ? 'theme-icon-enter' : ''}`}>
            {isDark
              ? <Moon size={15} className="text-violet-400" />
              : <Sun size={15} className="text-amber-400" />
            }
          </div>
          {/* Animated pill indicator */}
          <div className="flex items-center gap-1 px-1 py-0.5 rounded-full text-xs font-semibold ml-0.5"
            style={{ color: isDark ? '#a78bfa' : '#f59e0b' }}>
            {isDark ? 'Dark' : 'Light'}
          </div>
        </button>

        <div className="w-px h-5 mx-1" style={{ background: borderColor }} />

        {/* Settings */}
        <button
          id="settings-btn"
          onClick={onSettingsOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 group"
          style={{ color: textNormal }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Settings size={15} className="group-hover:rotate-45 transition-transform duration-300" />
          <span className="text-xs font-medium">Settings</span>
        </button>

        {/* Window controls (Electron Windows/Linux) */}
        {isElectron && window.electronAPI?.platform === 'win32' && (
          <>
            <div className="w-px h-5 mx-1" style={{ background: borderColor }} />
            <div className="flex items-center">
              {[
                { Icon: Minus, action: () => window.electronAPI.windowMinimize(), hover: 'hover:bg-white/10' },
                { Icon: Square, action: () => window.electronAPI.windowMaximize(), hover: 'hover:bg-white/10' },
                { Icon: X, action: () => window.electronAPI.windowClose(), hover: 'hover:bg-red-500' },
              ].map(({ Icon, action, hover }, i) => (
                <button key={i} onClick={action}
                  className={`w-8 h-7 flex items-center justify-center rounded transition-all duration-150 ${hover}`}
                  style={{ color: textMuted }}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
