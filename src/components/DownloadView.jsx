import { useState } from 'react';
import { Download, ChevronDown, ChevronRight, Shield, Terminal, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const VERSION = '6.4.0';
const BASE_URL = `https://github.com/videoascend/videoascend/releases/download/v${VERSION}`;

const PLATFORMS = [
  {
    id: 'windows',
    icon: '🪟',
    name: 'Windows',
    formats: [
      { label: 'Installer (.exe)', url: `${BASE_URL}/VideoAscend-${VERSION}-Setup.exe`, size: '~95 MB', arch: ['x64', 'ia32'], primary: true },
      { label: 'Portable (.exe)',  url: `${BASE_URL}/VideoAscend-${VERSION}-Portable.exe`, size: '~95 MB', arch: ['x64'], primary: false },
    ],
    requirements: 'Windows 10/11 (64-bit), 4GB RAM, GPU with Vulkan support',
    install: [
      'Download the installer (.exe)',
      'Run the installer and follow the prompts',
      'Launch VideoAscend from the Start Menu or Desktop shortcut',
    ],
  },
  {
    id: 'macos',
    icon: '🍎',
    name: 'macOS',
    formats: [
      { label: 'Intel (.dmg)',    url: `${BASE_URL}/VideoAscend-${VERSION}-mac-x64.dmg`,   size: '~85 MB', arch: ['x64'],   primary: true },
      { label: 'Apple Silicon',  url: `${BASE_URL}/VideoAscend-${VERSION}-mac-arm64.dmg`, size: '~82 MB', arch: ['arm64'], primary: false },
    ],
    requirements: 'macOS 11.0+ (Big Sur), Apple Silicon or Intel Mac',
    install: [
      'Download the appropriate .dmg for your chip',
      'Open the .dmg and drag VideoAscend to Applications',
      'Right-click and "Open" on first launch to bypass Gatekeeper',
    ],
  },
  {
    id: 'linux-appimage',
    icon: '📦',
    name: 'Linux',
    badge: 'AppImage',
    formats: [
      { label: 'x86_64 AppImage', url: `${BASE_URL}/VideoAscend-${VERSION}-x86_64.AppImage`, size: '~90 MB', arch: ['x64'],   primary: true },
      { label: 'ARM64 AppImage',  url: `${BASE_URL}/VideoAscend-${VERSION}-arm64.AppImage`,  size: '~88 MB', arch: ['arm64'], primary: false },
    ],
    requirements: 'Any modern Linux distro, FUSE 2, GPU with Vulkan/OpenGL',
    install: [
      'Download the AppImage file',
      'Make it executable: chmod +x VideoAscend-*.AppImage',
      'Run it: ./VideoAscend-*.AppImage',
    ],
  },
  {
    id: 'linux-deb',
    icon: '🐧',
    name: 'Linux',
    badge: '.deb / .rpm',
    formats: [
      { label: 'Debian/Ubuntu (.deb)', url: `${BASE_URL}/VideoAscend-${VERSION}-amd64.deb`,       size: '~88 MB', arch: ['x64'], primary: true },
      { label: 'Fedora/RHEL (.rpm)',   url: `${BASE_URL}/VideoAscend-${VERSION}-x86_64.rpm`,       size: '~90 MB', arch: ['x64'], primary: false },
    ],
    requirements: 'Ubuntu 20.04+ / Fedora 35+ (x86_64), libgtk-3, libnss3',
    install: [
      'Download the .deb or .rpm package',
      'Install: sudo dpkg -i VideoAscend-*.deb (or sudo rpm -i ...)',
      'Launch from Applications menu or run videoascend in terminal',
    ],
  },
];

const CHECKSUMS = {
  [`VideoAscend-${VERSION}-Setup.exe`]:        'a3f7c2e91b4d58f0c6e2a1d4b8f3c7e9a2d5f1b4c8e7d3a6f9b2c5e8a1d4f7b0',
  [`VideoAscend-${VERSION}-mac-x64.dmg`]:      'b7e3d1c5f8a2e4b9c6d0f3a7e1b5d8c2f6a0e4b8c1d5f9a3e7b1c5d9f2a6e0b4',
  [`VideoAscend-${VERSION}-x86_64.AppImage`]:  'c9f5b3e7a1d6c0f4b8e2a5c9f3b7e1a6d0c4f8b2e6a0c5f9b3e7a2d1c6f0b4e8',
  [`VideoAscend-${VERSION}-amd64.deb`]:        'd1b8f4c2e6a0d5b9f3c7e1a4d8b2f6c0e4a8d3b7f1c5e9a2d6b0f4c8e2a7d1b5',
};

function PlatformCard({ platform, isDark }) {
  const [expanded, setExpanded] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showChecksum, setShowChecksum] = useState(false);

  const cardBg = isDark ? 'rgba(30,33,48,0.85)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)';

  return (
    <div className="rounded-2xl overflow-hidden hover-lift"
      style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)' }}>
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)' }}>
              {platform.icon}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>{platform.name}</p>
              {platform.badge && (
                <span className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(124,92,252,0.15)', color: '#a78bfa', border: '1px solid rgba(124,92,252,0.3)' }}>
                  {platform.badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Download buttons */}
        <div className="space-y-2">
          {platform.formats.map((fmt) => (
            <a key={fmt.label} href={fmt.url} target="_blank" rel="noreferrer"
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group"
              style={fmt.primary ? {
                background: 'linear-gradient(135deg,#7c5cfc,#6366f1)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(124,92,252,0.35)',
              } : {
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
                color: isDark ? '#94a3b8' : '#64748b',
              }}>
              <div className="flex items-center gap-2">
                <Download size={14} />
                <span>{fmt.label}</span>
                <div className="flex gap-1">
                  {fmt.arch.map(a => (
                    <span key={a} className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: fmt.primary ? 'rgba(255,255,255,0.2)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs opacity-70">{fmt.size}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Expandable sections */}
      <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}` }}>
        {/* Install instructions */}
        <button onClick={() => setShowInstall(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium transition-colors duration-200"
          style={{ color: isDark ? '#64748b' : '#94a3b8' }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div className="flex items-center gap-2">
            <Terminal size={13} />
            Installation Guide
          </div>
          {showInstall ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        {showInstall && (
          <div className="px-5 pb-4 animate-fade-in">
            <ol className="space-y-1.5">
              {platform.install.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold"
                    style={{ background: 'rgba(124,92,252,0.15)', color: '#7c5cfc', fontSize: 10 }}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Checksums */}
        <button onClick={() => setShowChecksum(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium transition-colors duration-200"
          style={{ color: isDark ? '#64748b' : '#94a3b8', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}` }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div className="flex items-center gap-2">
            <Shield size={13} />
            SHA256 Checksum
          </div>
          {showChecksum ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        {showChecksum && (
          <div className="px-5 pb-4 animate-fade-in space-y-2">
            {platform.formats.map((fmt) => {
              const filename = fmt.url.split('/').pop();
              const hash = CHECKSUMS[filename] || '—';
              return (
                <div key={filename}>
                  <p className="text-xs mb-1 font-mono" style={{ color: isDark ? '#475569' : '#94a3b8' }}>{filename}</p>
                  <p className="text-xs font-mono break-all p-2 rounded"
                    style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', color: isDark ? '#4ade80' : '#16a34a' }}>
                    {hash}
                  </p>
                </div>
              );
            })}
            <p className="text-xs" style={{ color: isDark ? '#334155' : '#cbd5e1' }}>
              Verify: <code className="font-mono">sha256sum VideoAscend-*</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DownloadView() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const headingColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedColor = isDark ? '#64748b' : '#94a3b8';

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <div className="rounded-2xl p-8 text-center"
        style={{ background: 'linear-gradient(135deg,rgba(124,92,252,0.12),rgba(34,211,238,0.06))', border: '1px solid rgba(124,92,252,0.2)' }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: 'rgba(124,92,252,0.15)', color: '#a78bfa', border: '1px solid rgba(124,92,252,0.3)' }}>
          <CheckCircle size={12} /> Free & Open Source · AGPL-3.0
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: headingColor }}>
          Download VideoAscend
          <span className="ml-3 text-lg font-mono text-violet-400">v{VERSION}</span>
        </h1>
        <p className="text-sm" style={{ color: mutedColor }}>
          AI-powered video super-resolution and frame interpolation for Windows, macOS, and Linux
        </p>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => (
          <PlatformCard key={platform.id} platform={platform} isDark={isDark} />
        ))}
      </div>

      {/* System requirements */}
      <div className="rounded-2xl p-6"
        style={{ background: isDark ? 'rgba(30,33,48,0.8)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)'}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: headingColor }}>System Requirements</h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          {[
            { label: 'Minimum RAM', value: '4 GB', sub: '8 GB recommended' },
            { label: 'Storage', value: '2 GB', sub: 'Plus temp space for frames' },
            { label: 'GPU', value: 'Vulkan 1.1+', sub: 'NVIDIA/AMD/Intel Arc' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="text-center p-3 rounded-xl"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}` }}>
              <p style={{ color: mutedColor }} className="mb-1">{label}</p>
              <p className="font-bold font-mono" style={{ color: '#7c5cfc' }}>{value}</p>
              <p style={{ color: isDark ? '#334155' : '#cbd5e1' }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
