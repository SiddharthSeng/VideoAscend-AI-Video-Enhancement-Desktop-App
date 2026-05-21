import { useState, useEffect } from 'react';
import { Cpu, Monitor, Bell, Bot, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? 'linear-gradient(135deg,#7c5cfc,#6366f1)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s ease', flexShrink: 0,
        boxShadow: checked ? '0 0 8px rgba(124,92,252,0.4)' : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 19 : 3,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function Section({ title, icon: Icon, children, isDark }) {
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  return (
    <div style={{
      borderRadius: 12,
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
      border: `1px solid ${border}`,
      padding: '12px 14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Icon size={12} style={{ color: '#7c5cfc' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isDark ? '#475569' : '#94a3b8' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, sub, children, isDark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: isDark ? '#475569' : '#94a3b8', margin: '1px 0 0' }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsView({ systemInfo, hwAccelLabel }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled,         setSoundEnabled]         = useState(true);
  const [rememberConv,         setRememberConv]         = useState(false);
  const [sendMetadata,         setSendMetadata]         = useState(true);
  const [apiKeyStatus,         setApiKeyStatus]         = useState('unchecked'); // unchecked | set | unset
  const [version,              setVersion]              = useState('6.5.0');

  useEffect(() => {
    if (!isElectron) return;
    window.electronAPI.storeGet('notificationsEnabled').then(v => v !== null && setNotificationsEnabled(!!v)).catch(() => {});
    window.electronAPI.storeGet('soundEnabled').then(v => v !== null && setSoundEnabled(!!v)).catch(() => {});
    window.electronAPI.storeGet('rememberConversation').then(v => v !== null && setRememberConv(!!v)).catch(() => {});
    window.electronAPI.storeGet('sendFileMetadata').then(v => v !== null && setSendMetadata(!!v)).catch(() => {});
    window.electronAPI.getApiKey().then(k => setApiKeyStatus(k ? 'set' : 'unset')).catch(() => setApiKeyStatus('unset'));
    window.electronAPI.getAppVersion().then(v => v && setVersion(v)).catch(() => {});
  }, []);

  const persist = (key, val, setter) => {
    setter(val);
    if (isElectron) window.electronAPI.storeSet(key, val).catch(() => {});
  };

  const textPrimary = isDark ? '#e2e8f0' : '#1e293b';
  const textMuted   = isDark ? '#64748b' : '#94a3b8';

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 8 }}>
      {/* Hardware */}
      <Section title="Hardware & Acceleration" icon={Cpu} isDark={isDark}>
        <SettingRow label="Detected GPU" sub={hwAccelLabel} isDark={isDark}>
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 6, fontWeight: 700,
            background: hwAccelLabel !== 'CPU Software' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
            color: hwAccelLabel !== 'CPU Software' ? '#10b981' : textMuted,
            border: hwAccelLabel !== 'CPU Software' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
          }}>
            {hwAccelLabel !== 'CPU Software' ? '✓ Active' : 'Software'}
          </span>
        </SettingRow>
        {systemInfo && (
          <>
            <SettingRow label="GPU Model" isDark={isDark}>
              <span style={{ fontSize: 10, color: textMuted, fontFamily: 'monospace' }}>{systemInfo.gpu}</span>
            </SettingRow>
            <SettingRow label="VRAM" isDark={isDark}>
              <span style={{ fontSize: 10, color: textMuted, fontFamily: 'monospace' }}>{systemInfo.vram ? `${systemInfo.vram} MB` : 'N/A'}</span>
            </SettingRow>
          </>
        )}
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell} isDark={isDark}>
        <SettingRow label="Job complete alerts" sub="Notify when a video finishes" isDark={isDark}>
          <Toggle
            id="notifications-toggle"
            checked={notificationsEnabled}
            onChange={v => persist('notificationsEnabled', v, setNotificationsEnabled)}
          />
        </SettingRow>
        <SettingRow label="Sound on completion" isDark={isDark}>
          <Toggle
            id="sound-toggle"
            checked={soundEnabled}
            onChange={v => persist('soundEnabled', v, setSoundEnabled)}
          />
        </SettingRow>
      </Section>

      {/* AI Advisor */}
      <Section title="AI Advisor" icon={Bot} isDark={isDark}>
        <SettingRow
          label="API Key"
          sub={apiKeyStatus === 'set' ? 'Key configured ✓' : 'Not configured'}
          isDark={isDark}
        >
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 6,
            background: apiKeyStatus === 'set' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
            color: apiKeyStatus === 'set' ? '#10b981' : textMuted,
            border: apiKeyStatus === 'set' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
          }}>
            {apiKeyStatus === 'set' ? '● Connected' : '○ Not set'}
          </span>
        </SettingRow>
        <SettingRow label="Remember conversation" sub="Keep chat history between sessions" isDark={isDark}>
          <Toggle
            id="remember-conv-toggle"
            checked={rememberConv}
            onChange={v => persist('rememberConversation', v, setRememberConv)}
          />
        </SettingRow>
        <SettingRow label="Send file metadata" sub="Let AI know resolution, duration, etc." isDark={isDark}>
          <Toggle
            id="send-metadata-toggle"
            checked={sendMetadata}
            onChange={v => persist('sendFileMetadata', v, setSendMetadata)}
          />
        </SettingRow>
      </Section>

      {/* Interface */}
      <Section title="Interface" icon={Monitor} isDark={isDark}>
        <SettingRow label="Theme" isDark={isDark}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['dark', 'light'].map(t => (
              <button key={t} onClick={() => setTheme(t)} style={{
                padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: theme === t ? 'linear-gradient(135deg,#7c5cfc,#6366f1)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                color: theme === t ? '#fff' : textMuted,
              }}>
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
        </SettingRow>
      </Section>

      {/* About */}
      <Section title="About" icon={Info} isDark={isDark}>
        {[
          ['Version',  `v${version}`],
          ['License',  'AGPL-3.0'],
          ['Engine',   'FFmpeg + Sharp'],
          ['Platform', typeof window !== 'undefined' ? (window.electronAPI?.platform || 'web') : 'web'],
        ].map(([label, val]) => (
          <SettingRow key={label} label={label} isDark={isDark}>
            <span style={{ fontSize: 10, color: '#a78bfa', fontFamily: 'monospace', fontWeight: 700 }}>{val}</span>
          </SettingRow>
        ))}
      </Section>
    </div>
  );
}
