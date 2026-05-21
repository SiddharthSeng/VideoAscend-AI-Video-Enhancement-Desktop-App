const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Platform ───────────────────────────────────────────────────────────────
  platform: process.platform,
  isElectron: true,

  // ── App ────────────────────────────────────────────────────────────────────
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // ── System info ────────────────────────────────────────────────────────────
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // ── File dialogs ───────────────────────────────────────────────────────────
  selectFile:      () => ipcRenderer.invoke('select-file'),
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),

  // ── Shell ──────────────────────────────────────────────────────────────────
  openOutputFolder:   (p)   => ipcRenderer.invoke('open-output-folder', p),
  openExternal:       (url) => ipcRenderer.invoke('open-external', url),
  showItemInFolder:   (p)   => ipcRenderer.invoke('show-item-in-folder', p),

  // ── Window controls ────────────────────────────────────────────────────────
  windowMinimize:        () => ipcRenderer.send('window-minimize'),
  windowMaximize:        () => ipcRenderer.send('window-maximize'),
  windowClose:           () => ipcRenderer.send('window-close'),
  windowHide:            () => ipcRenderer.send('window-hide'),
  windowExpand:          (v) => ipcRenderer.send('window-expand', v),
  windowToggleAlwaysOnTop: (v) => ipcRenderer.invoke('window-toggle-always-on-top', v),
  windowGetAlwaysOnTop:  () => ipcRenderer.invoke('window-get-always-on-top'),

  // ── Store ──────────────────────────────────────────────────────────────────
  storeGet:    (key)        => ipcRenderer.invoke('store-get', key),
  storeSet:    (key, value) => ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key)        => ipcRenderer.invoke('store-delete', key),

  // ── API key (encrypted) ────────────────────────────────────────────────────
  saveApiKey:  (key) => ipcRenderer.invoke('save-api-key', key),
  getApiKey:   ()    => ipcRenderer.invoke('get-api-key'),
  clearApiKey: ()    => ipcRenderer.invoke('clear-api-key'),

  // ── Theme ──────────────────────────────────────────────────────────────────
  getTheme: ()    => ipcRenderer.invoke('get-theme'),
  setTheme: (t)   => ipcRenderer.invoke('set-theme', t),

  // ── Hardware accel ─────────────────────────────────────────────────────────
  setHwAccelLabel: (label) => ipcRenderer.invoke('set-hwaccel-label', label),
  getHwAccelLabel: ()      => ipcRenderer.invoke('get-hwaccel-label'),

  // ── Queue state (push to main for tray) ────────────────────────────────────
  queueUpdate: (state) => ipcRenderer.send('queue-update', state),

  // ── Notification triggers ──────────────────────────────────────────────────
  jobCompleteNotify:   (job)  => ipcRenderer.send('job-complete-notify', job),
  batchCompleteNotify: (jobs) => ipcRenderer.send('batch-complete-notify', jobs),

  // ── Video ──────────────────────────────────────────────────────────────────
  probeVideo:       (p)  => ipcRenderer.invoke('probe-video', p),
  processVideo:     (o)  => ipcRenderer.invoke('process-video', o),
  cancelProcessing: (id) => ipcRenderer.invoke('cancel-processing', id),

  // ── Processing events ──────────────────────────────────────────────────────
  onProcessingProgress: (cb) => {
    const h = (_, d) => cb(d);
    ipcRenderer.on('processing-progress', h);
    return () => ipcRenderer.removeListener('processing-progress', h);
  },
  onProcessingComplete: (cb) => {
    const h = (_, d) => cb(d);
    ipcRenderer.on('processing-complete', h);
    return () => ipcRenderer.removeListener('processing-complete', h);
  },
  onProcessingError: (cb) => {
    const h = (_, d) => cb(d);
    ipcRenderer.on('processing-error', h);
    return () => ipcRenderer.removeListener('processing-error', h);
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  onNavigateTo: (cb) => {
    const h = (_, view) => cb(view);
    ipcRenderer.on('navigate-to', h);
    return () => ipcRenderer.removeListener('navigate-to', h);
  },
  onStartNewJob: (cb) => {
    const h = () => cb();
    ipcRenderer.on('start-new-job', h);
    return () => ipcRenderer.removeListener('start-new-job', h);
  },
  onNavigate: (cb) => {
    const h = (_, view) => cb(view);
    ipcRenderer.on('navigate', h);
    return () => ipcRenderer.removeListener('navigate', h);
  },

  // ── Auto-updater ───────────────────────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate:  () => ipcRenderer.invoke('download-update'),
  installUpdate:   () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (cb) => {
    const h = (_, data) => cb(data);
    ipcRenderer.on('update-status', h);
    return () => ipcRenderer.removeListener('update-status', h);
  },
});
