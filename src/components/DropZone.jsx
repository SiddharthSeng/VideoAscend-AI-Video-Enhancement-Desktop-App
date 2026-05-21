import { useState, useCallback, useRef } from 'react';
import { Upload, FileVideo, AlertTriangle, X, Clock, HardDrive, Monitor, Loader2, Film, Plus, ListPlus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

const SAMPLE_FILE = {
  name: 'spirited-away-trailer.mp4',
  path: null,
  resolution: '854×480',
  width: 854, height: 480,
  size: '142 MB',
  duration: '2m 34s',
  durationSec: 154,
  fps: '23.976',
  codec: 'H.264',
  bitrate: '7,420 kbps',
  totalFrames: 3691,
};

function MetaTile({ icon: Icon, label, value, color = '#7c5cfc', isDark }) {
  return (
    <div style={{
      borderRadius: 8, padding: '6px 8px', textAlign: 'center',
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
      flex: 1,
    }}>
      <Icon size={11} style={{ color }} />
      <p style={{ fontSize: 9, color: isDark ? '#475569' : '#94a3b8', margin: '2px 0 1px' }}>{label}</p>
      <p style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: isDark ? '#e2e8f0' : '#1e293b', margin: 0 }}>{value}</p>
    </div>
  );
}

export default function DropZone({ file, onFileSet, onFileClear, onMultiFilesSet, compact }) {
  const { theme } = useTheme();
  const isDark    = theme === 'dark';
  const [dragging,     setDragging]     = useState(false);
  const [probing,      setProbing]      = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);

  const probeFile = useCallback(async (filePath) => {
    if (!filePath) return SAMPLE_FILE;
    try {
      if (isElectron && window.electronAPI.probeVideo) {
        const meta = await window.electronAPI.probeVideo(filePath);
        const name = filePath.split(/[\\/]/).pop();
        const dMin = Math.floor(meta.duration / 60);
        const dSec = Math.floor(meta.duration % 60);
        return {
          name, path: filePath,
          resolution: `${meta.width}×${meta.height}`,
          width: meta.width, height: meta.height,
          size: `${meta.fileSize} MB`,
          duration: `${dMin}m ${String(dSec).padStart(2, '0')}s`,
          durationSec: meta.duration,
          fps: String(meta.fps),
          codec: meta.codec?.toUpperCase(),
          bitrate: `${meta.bitrate?.toLocaleString()} kbps`,
          totalFrames: meta.totalFrames,
          hasAudio: meta.hasAudio,
        };
      }
      return { ...SAMPLE_FILE, name: filePath.split(/[\\/]/).pop(), path: filePath };
    } catch {
      return { ...SAMPLE_FILE, name: filePath.split(/[\\/]/).pop(), path: filePath };
    }
  }, []);

  const loadSingleFile = useCallback(async (filePath) => {
    setProbing(true);
    const result = await probeFile(filePath);
    onFileSet(result);
    setProbing(false);
  }, [probeFile, onFileSet]);

  const handleClick = useCallback(async () => {
    if (file) return;
    if (isElectron) {
      const picked = await window.electronAPI.selectFile();
      if (!picked) return;
      if (Array.isArray(picked)) {
        if (picked.length === 1) {
          await loadSingleFile(picked[0]);
        } else {
          // Multiple files — probe all and show pending list
          setProbing(true);
          const probed = await Promise.all(picked.map(probeFile));
          setPendingFiles(probed);
          setProbing(false);
        }
      } else {
        await loadSingleFile(picked);
      }
    } else {
      onFileSet(SAMPLE_FILE);
    }
  }, [file, loadSingleFile, probeFile, onFileSet]);

  const handleDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback(() => setDragging(false), []);
  const handleDrop      = useCallback(async (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) { onFileSet(SAMPLE_FILE); return; }
    if (files.length === 1) {
      await loadSingleFile(files[0].path || files[0].name);
    } else {
      setProbing(true);
      const probed = await Promise.all(files.map(f => probeFile(f.path || f.name)));
      setPendingFiles(probed);
      setProbing(false);
    }
  }, [loadSingleFile, probeFile, onFileSet]);

  const cardBg  = isDark ? 'rgba(30,33,48,0.8)'  : 'rgba(255,255,255,0.9)';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';

  if (probing) {
    return (
      <div style={{ borderRadius: 14, padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: cardBg, border: `1px solid ${border}` }}>
        <Loader2 size={22} style={{ color: '#7c5cfc', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>Probing video…</p>
      </div>
    );
  }

  // Multi-file pending list
  if (pendingFiles.length > 0) {
    return (
      <div style={{ borderRadius: 14, background: cardBg, border: `1px solid ${border}`, overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>
            {pendingFiles.length} files selected
          </span>
          <button onClick={() => setPendingFiles([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#475569' : '#94a3b8' }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ maxHeight: 130, overflowY: 'auto', borderTop: `1px solid ${border}` }}>
          {pendingFiles.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 12px', borderBottom: i < pendingFiles.length - 1 ? `1px solid ${border}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <Film size={12} style={{ color: '#7c5cfc', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: isDark ? '#e2e8f0' : '#1e293b', truncate: 'true', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                  {f.name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: isDark ? '#475569' : '#94a3b8', fontFamily: 'monospace' }}>{f.resolution}</span>
                <span style={{ fontSize: 10, color: isDark ? '#475569' : '#94a3b8' }}>{f.size}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
          <button
            onClick={() => { onFileSet(pendingFiles[0]); setPendingFiles([]); }}
            style={{
              flex: 1, padding: '6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${border}`, color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer',
            }}
          >
            Use first only
          </button>
          <button
            onClick={() => {
              if (onMultiFilesSet) onMultiFilesSet(pendingFiles);
              setPendingFiles([]);
            }}
            style={{
              flex: 2, padding: '6px', borderRadius: 8, fontSize: 10, fontWeight: 700,
              background: 'linear-gradient(135deg,#7c5cfc,#6366f1)',
              border: 'none', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <ListPlus size={11} /> Add All → Queue
          </button>
        </div>
      </div>
    );
  }

  // Single file loaded
  if (file) {
    const isLowRes = file.height && file.height < 720;
    return (
      <div className="animate-fade-in" style={{ borderRadius: 14, background: cardBg, border: `1px solid ${border}`, overflow: 'hidden' }}>
        {/* Compact thumbnail */}
        <div style={{ height: compact ? 80 : 120, position: 'relative', background: isDark ? 'linear-gradient(135deg,#1e2130,#2a2d3e)' : 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,92,252,0.2)', border: '1.5px solid rgba(124,92,252,0.4)' }}>
            <Film size={18} style={{ color: '#a78bfa' }} />
          </div>

          {isLowRes && (
            <div style={{ position: 'absolute', top: 6, left: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 20, fontSize: 9, fontWeight: 600, background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.4)', color: '#fb7185' }}>
              <AlertTriangle size={8} /> Low Res
            </div>
          )}
          <div style={{ position: 'absolute', top: 6, right: 28, fontSize: 9, fontWeight: 700, fontFamily: 'monospace', padding: '2px 5px', borderRadius: 4, background: 'rgba(0,0,0,0.5)', color: '#94a3b8' }}>
            {file.resolution}
          </div>
          <button onClick={onFileClear} style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <X size={10} />
          </button>
        </div>

        <div style={{ padding: '8px 12px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </p>
          <div style={{ display: 'flex', gap: 5 }}>
            <MetaTile icon={Monitor} label="Res"      value={file.resolution} isDark={isDark} />
            <MetaTile icon={HardDrive} label="Size"   value={file.size}       isDark={isDark} color="#22d3ee" />
            <MetaTile icon={Clock}    label="Duration" value={file.duration}   isDark={isDark} color="#10b981" />
            <MetaTile icon={FileVideo} label="FPS"    value={file.fps}        isDark={isDark} color="#f59e0b" />
          </div>
        </div>
      </div>
    );
  }

  // Empty drop zone
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        borderRadius: 14, border: `2px dashed ${dragging ? '#7c5cfc' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'}`,
        background: dragging ? 'rgba(124,92,252,0.06)' : isDark ? 'rgba(26,29,39,0.5)' : 'rgba(255,255,255,0.7)',
        padding: compact ? '20px 16px' : '40px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s ease',
        boxShadow: dragging ? '0 0 0 1px rgba(124,92,252,0.5), inset 0 0 30px rgba(124,92,252,0.06)' : 'none',
      }}
    >
      <div style={{
        width: compact ? 40 : 52, height: compact ? 40 : 52,
        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,rgba(124,92,252,0.2),rgba(99,102,241,0.1))',
        border: '1px solid rgba(124,92,252,0.3)',
        transform: dragging ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s',
      }}>
        <Upload size={compact ? 18 : 22} style={{ color: '#a78bfa' }} />
      </div>

      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 3px' }}>
          {dragging ? 'Release to load video' : (isElectron ? 'Click or drag a video file' : 'Drop video here')}
        </p>
        <p style={{ fontSize: 10, color: isDark ? '#475569' : '#94a3b8', margin: 0 }}>
          Supports MP4, MKV, AVI, MOV · Multi-file OK
        </p>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {['MP4','MKV','AVI','MOV'].map(fmt => (
          <span key={fmt} style={{
            padding: '2px 6px', borderRadius: 5, fontSize: 9, fontFamily: 'monospace',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
            color: isDark ? '#475569' : '#94a3b8',
          }}>
            {fmt}
          </span>
        ))}
      </div>
    </div>
  );
}
