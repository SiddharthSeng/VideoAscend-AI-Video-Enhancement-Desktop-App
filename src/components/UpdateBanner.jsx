import { useState, useEffect } from 'react';
import { X, Download, RefreshCw, Sparkles } from 'lucide-react';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

export default function UpdateBanner() {
  const [status, setStatus]   = useState(null); // null | 'available' | 'downloading' | 'ready' | 'error'
  const [version, setVersion] = useState('');
  const [percent, setPercent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isElectron || !window.electronAPI.onUpdateStatus) return;
    const cleanup = window.electronAPI.onUpdateStatus((data) => {
      if (data.status === 'available') {
        setVersion(data.version || '');
        setStatus('available');
        setDismissed(false);
      } else if (data.status === 'downloading') {
        setStatus('downloading');
        setPercent(data.percent || 0);
      } else if (data.status === 'ready') {
        setStatus('ready');
      } else if (data.status === 'error') {
        setStatus('error');
      }
    });

    // Check on mount (silently fails in dev)
    if (window.electronAPI.checkForUpdates) {
      window.electronAPI.checkForUpdates().catch(() => {});
    }

    return cleanup;
  }, []);

  if (!status || dismissed || (status !== 'available' && status !== 'downloading' && status !== 'ready')) {
    return null;
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(124,92,252,0.12) 0%, rgba(99,102,241,0.08) 100%)',
      borderBottom: '1px solid rgba(124,92,252,0.2)',
      padding: '6px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
      flexShrink: 0, fontSize: 11,
    }}>
      <Sparkles size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />

      <span style={{ color: '#a78bfa', fontWeight: 600, flex: 1, minWidth: 0 }}>
        {status === 'available'   && `v${version} available`}
        {status === 'downloading' && `Downloading… ${percent}%`}
        {status === 'ready'       && 'Ready to install'}
      </span>

      {status === 'downloading' && (
        <div style={{
          flex: 1, height: 3, borderRadius: 2,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden', maxWidth: 80,
        }}>
          <div style={{
            width: `${percent}%`, height: '100%',
            background: 'linear-gradient(90deg, #7c5cfc, #a78bfa)',
            borderRadius: 2, transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {status === 'available' && (
        <>
          <button
            onClick={() => window.electronAPI?.downloadUpdate?.()}
            style={{
              padding: '2px 8px', borderRadius: 5, border: '1px solid rgba(124,92,252,0.4)',
              background: 'rgba(124,92,252,0.15)', color: '#a78bfa',
              cursor: 'pointer', fontSize: 10, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <Download size={10} /> Download
          </button>
        </>
      )}

      {status === 'ready' && (
        <button
          onClick={() => window.electronAPI?.installUpdate?.()}
          style={{
            padding: '2px 8px', borderRadius: 5, border: '1px solid rgba(16,185,129,0.4)',
            background: 'rgba(16,185,129,0.15)', color: '#10b981',
            cursor: 'pointer', fontSize: 10, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 3,
          }}
        >
          <RefreshCw size={10} /> Restart to Update
        </button>
      )}

      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}
      >
        <X size={11} />
      </button>
    </div>
  );
}
