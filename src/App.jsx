import { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import TitleBar    from './components/TitleBar';
import BottomNav   from './components/BottomNav';
import UpdateBanner from './components/UpdateBanner';
import DropZone    from './components/DropZone';
import ConfigPanel from './components/ConfigPanel';
import PresetBar   from './components/PresetBar';
import ProcessingView from './components/ProcessingView';
import CompletionView from './components/CompletionView';
import QueueView   from './components/QueueView';
import SettingsView from './components/SettingsView';
import AIAdvisor   from './components/AIAdvisor';
import DownloadView from './components/DownloadView';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

const generateJobId = () => `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_CONFIG = {
  mode: 'Upscaling',
  algorithm: 'anime4k',
  scaleFactor: '4x',
  rifeModel: 'RIFE v4.18',
  targetFps: 60,
  format: 'MP4',
  codec: 'h265',
  crf: 18,
  outputPath: isElectron ? '' : 'C:\\Users\\User\\Videos\\VideoAscend\\Output',
};

const VIEW_TITLES = {
  upscale:  'Upscale Video',
  queue:    'Queue',
  download: 'Download App',
  settings: 'Settings',
};

function AppInner() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeNav,      setActiveNav]      = useState('upscale');
  const [aiOpen,         setAiOpen]         = useState(false);
  const [helpOpen,       setHelpOpen]       = useState(false);
  const [file,           setFile]           = useState(null);
  const [pendingFiles,   setPendingFiles]   = useState([]); // batch queue
  const [config,         setConfig]         = useState(DEFAULT_CONFIG);
  const [stage,          setStage]          = useState('idle'); // idle | processing | complete
  const [completionData, setCompletionData] = useState(null);
  const [systemInfo,     setSystemInfo]     = useState(null);
  const [hwAccelLabel,   setHwAccelLabel]   = useState('CPU Software');
  const [queue,          setQueue]          = useState([]); // real job queue
  const [showAdvanced,   setShowAdvanced]   = useState(false);
  const jobIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const handleStartRef = useRef(null); // stable ref for keyboard shortcut

  // ── Boot ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isElectron) return;
    // Fetch system info
    window.electronAPI.getSystemInfo().then(setSystemInfo).catch(() => {});
    // Fetch stored hwaccel label
    window.electronAPI.getHwAccelLabel().then(l => l && setHwAccelLabel(l)).catch(() => {});
  }, []);

  // ── Tray navigation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isElectron) return;
    const c1 = window.electronAPI.onNavigateTo(view => setActiveNav(view));
    const c2 = window.electronAPI.onNavigate   && window.electronAPI.onNavigate(view => setActiveNav(view));
    const c3 = window.electronAPI.onStartNewJob && window.electronAPI.onStartNewJob(() => {
      setFile(null); setStage('idle'); setActiveNav('upscale');
    });
    return () => { c1?.(); c2?.(); c3?.(); };
  }, []);

  // ── In-app keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'o') { e.preventDefault(); document.getElementById('start-enhancement-btn')?.click(); }
      if (mod && e.key === 'Enter') { e.preventDefault(); handleStartRef.current?.(); }
      if (mod && e.key === ',') { e.preventDefault(); setActiveNav('settings'); }
      if (e.key === 'Escape') { setAiOpen(false); setHelpOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // stable — uses ref for handleStart

  // ── Sync queue count to tray ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isElectron) return;
    const pendingCount = queue.filter(j => j.status === 'queued').length;
    const activeJb = queue.find(j => j.status === 'processing');
    window.electronAPI.queueUpdate({
      active: activeJb ? { filename: activeJb.filename, percent: activeJb.progress } : null,
      queued: queue.filter(j => j.status === 'queued'),
    });
  }, [queue]);

  // ── Config changes ───────────────────────────────────────────────────────────
  const handleConfigChange = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApplyPreset = useCallback((presetConfig) => {
    setConfig(prev => ({ ...prev, ...presetConfig }));
  }, []);

  // ── Add files to batch ───────────────────────────────────────────────────────
  const handleAddToQueue = useCallback((files) => {
    const newJobs = files.map(f => ({
      id: generateJobId(),
      filename: f.name,
      filePath: f.path,
      inputRes: f.resolution || '?×?',
      outputRes: '—',
      algorithm: config.algorithm,
      config: { ...config },
      status: 'queued',
      progress: 0,
    }));
    setQueue(prev => [...prev, ...newJobs]);
    setActiveNav('queue');
  }, [config]);

  // ── Start processing ────────────────────────────────────────────────────────
  // Keep ref up-to-date for keyboard shortcut without dep-array issues
  useEffect(() => { handleStartRef.current = handleStart; });

  const handleStart = useCallback(async () => {
    if (!file) return;
    const jobId = generateJobId();
    jobIdRef.current = jobId;
    startTimeRef.current = Date.now();
    setStage('processing');

    if (isElectron && file.path) {
      const scaleNum  = parseInt(config.scaleFactor, 10) || 2;
      const outputDir = config.outputPath || (window.electronAPI?.platform === 'win32'
        ? 'C:\\Users\\User\\Videos\\VideoAscend\\Output'
        : '/tmp/videoascend-output');
      const ext      = config.format === 'MKV' ? '.mkv' : '.mp4';
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const outputFile = `${outputDir}/${baseName}_${config.algorithm}_${config.scaleFactor}${ext}`.replace(/\/\//g, '/');

      try {
        const result = await window.electronAPI.processVideo({
          inputPath: file.path, outputPath: outputFile,
          algorithm: config.algorithm, scaleFactor: scaleNum,
          targetFps: config.mode !== 'Upscaling' ? config.targetFps : null,
          codec: config.codec, crf: config.crf, jobId,
        });
        // Update hwaccel label from result
        if (result?.hwAccelLabel) {
          setHwAccelLabel(result.hwAccelLabel);
          window.electronAPI.setHwAccelLabel(result.hwAccelLabel).catch(() => {});
        }
      } catch (err) {
        console.error('Processing error:', err);
        setStage('idle');
      }
    }
  }, [file, config]);

  const handleComplete = useCallback((data) => {
    const elapsed = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const mins    = Math.floor(elapsed / 60);
    const secs    = elapsed % 60;
    const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const completionWithTime = { ...data, elapsedTime: elapsedStr };
    setCompletionData(completionWithTime);
    setStage('complete');

    // Fire OS notification
    if (isElectron && file) {
      window.electronAPI.jobCompleteNotify({
        filename: file.name,
        outputResolution: data?.stats?.outputResolution || '',
        elapsedTime: elapsedStr,
        outputPath: data?.outputPath || '',
      });
    }
  }, [file]);

  const handleCancel = useCallback(() => {
    if (isElectron && jobIdRef.current) window.electronAPI.cancelProcessing(jobIdRef.current);
    setStage('idle');
    jobIdRef.current = null;
  }, []);

  const handleProcessAnother = useCallback(() => {
    setFile(null); setStage('idle'); setCompletionData(null);
  }, []);

  const handleOpenOutput = useCallback(() => {
    if (isElectron && completionData?.outputPath) {
      const p   = completionData.outputPath.replace(/\\/g, '/');
      const dir = p.substring(0, p.lastIndexOf('/')) || p;
      window.electronAPI.openOutputFolder(dir);
    }
  }, [completionData]);

  // ── Queue: pending count for badge ──────────────────────────────────────────
  const queueBadge = queue.filter(j => j.status === 'queued').length;

  // ── Render upscale view ─────────────────────────────────────────────────────
  const renderUpscaleView = () => {
    if (stage === 'processing') {
      return (
        <ProcessingView
          onCancel={handleCancel}
          onComplete={handleComplete}
          config={config}
          file={file}
          jobId={jobIdRef.current}
        />
      );
    }
    if (stage === 'complete') {
      return (
        <CompletionView
          onProcessAnother={handleProcessAnother}
          onOpenOutput={handleOpenOutput}
          completionData={completionData}
          file={file}
        />
      );
    }

    const startDisabled = !file;
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Preset bar */}
        <PresetBar config={config} onApplyPreset={handleApplyPreset} />

        {/* Drop zone — compact */}
        <DropZone
          file={file}
          onFileSet={setFile}
          onFileClear={() => setFile(null)}
          onMultiFilesSet={handleAddToQueue}
          compact
        />

        {/* Config — collapsed advanced */}
        <ConfigPanel config={config} onChange={handleConfigChange} compact showAdvanced={showAdvanced} />

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 11,
            color: isDark ? '#475569' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {showAdvanced ? '▾' : '▸'} Advanced
        </button>

        {/* Start button — sticky / full-width */}
        <button
          id="start-enhancement-btn"
          onClick={handleStart}
          disabled={startDisabled}
          style={{
            width: '100%', height: 48, borderRadius: 14, fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: startDisabled ? 'not-allowed' : 'pointer',
            background: !startDisabled
              ? 'linear-gradient(135deg,#7c5cfc 0%,#6366f1 50%,#4f46e5 100%)'
              : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            boxShadow: !startDisabled ? '0 8px 32px rgba(124,92,252,0.5)' : 'none',
            color: !startDisabled ? 'white' : isDark ? '#475569' : '#94a3b8',
            border: 'none',
            transition: 'all 0.2s ease',
            opacity: startDisabled ? 0.5 : 1,
          }}
        >
          <Sparkles size={18} style={{ animation: !startDisabled ? 'pulse 2s infinite' : 'none' }} />
          {!startDisabled ? '✨ Start Enhancement' : 'Select a video to begin'}
        </button>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'upscale':  return renderUpscaleView();
      case 'queue':    return <QueueView queue={queue} onQueueChange={setQueue} />;
      case 'download': return <DownloadView />;
      case 'settings': return (
        <SettingsView
          systemInfo={systemInfo}
          hwAccelLabel={hwAccelLabel}
        />
      );
      default: return null;
    }
  };

  const bg = isDark ? '#0f1117' : '#f1f3f9';

  return (
    <div
      className="app-root"
      style={{
        width: '100%', height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: bg,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* TitleBar */}
      <TitleBar
        currentView={activeNav}
        viewTitle={VIEW_TITLES[activeNav] || ''}
        onOpenAI={() => setAiOpen(true)}
        hwAccelLabel={hwAccelLabel}
        queueCount={queueBadge}
        onHelpToggle={() => setHelpOpen(v => !v)}
      />

      {/* Update banner */}
      <UpdateBanner />

      {/* Help shortcuts overlay */}
      {helpOpen && (
        <div
          onClick={() => setHelpOpen(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: isDark ? '#1e2130' : '#fff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 14, padding: '20px 24px', minWidth: 260,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 12px' }}>
              ⌨️ Keyboard Shortcuts
            </h3>
            {[
              ['Ctrl+Shift+V', 'Toggle app visibility'],
              ['Ctrl+O',       'Open file picker'],
              ['Ctrl+Enter',   'Start processing'],
              ['Escape',       'Cancel / close'],
              ['Ctrl+,',       'Open settings'],
            ].map(([key, desc]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 8 }}>
                <code style={{ fontSize: 10, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', padding: '2px 6px', borderRadius: 5, color: '#a78bfa' }}>
                  {key}
                </code>
                <span style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#475569' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main scrollable content */}
      <main style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '12px 14px',
        scrollbarWidth: 'thin',
      }}>
        <div style={{ maxWidth: '100%' }}>
          {renderContent()}
        </div>
      </main>

      {/* Bottom nav */}
      <BottomNav
        active={activeNav}
        onNavigate={(id) => {
          setActiveNav(id);
        }}
        queueBadge={queueBadge}
      />

      {/* AI Advisor slide-up sheet */}
      <AIAdvisor
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        file={file}
        config={config}
        systemInfo={systemInfo}
        isProcessing={stage === 'processing'}
        onApplyConfig={handleApplyPreset}
        onNavigate={setActiveNav}
        onStartProcessing={handleStart}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
