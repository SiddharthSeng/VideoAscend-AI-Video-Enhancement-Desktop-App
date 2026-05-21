'use strict';

const {
  app, BrowserWindow, screen, ipcMain, shell,
  Menu, Tray, globalShortcut, Notification,
  safeStorage, dialog, nativeImage, protocol
} = require('electron');
const path = require('path');
const os   = require('os');
const fs   = require('fs');

// ── electron-store ─────────────────────────────────────────────────────────────
let Store;
try {
  Store = require('electron-store');
} catch {
  // fallback shim if somehow not installed
  Store = class { constructor() { this._d = {}; } get(k,d) { return this._d[k] ?? d; } set(k,v) { this._d[k]=v; } delete(k) { delete this._d[k]; } };
}

const store = new Store({
  defaults: {
    windowBounds: null,
    alwaysOnTop: false,
    theme: 'dark',
    anthropicApiKey: null,
    notificationsEnabled: true,
    soundEnabled: true,
    rememberConversation: false,
    sendFileMetadata: true,
    presets: [],
    hwAccelLabel: 'CPU Software',
  }
});

// ── App state ──────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray       = null;
let activeJob  = null;   // { filename, percent }
let queuedJobs = [];     // array of job objects
const isDev = process.env.NODE_ENV === 'development';

// ── Single instance lock ───────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ── Protocol handler ───────────────────────────────────────────────────────────
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('videoascend', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('videoascend');
}

// ── Create compact floating window ─────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 640,
    minWidth: 420,
    minHeight: 500,
    maxWidth: 680,
    maxHeight: 900,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: true,
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    backgroundMaterial: process.platform === 'win32' ? 'acrylic' : undefined,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
    },
  });

  // Restore last position or place bottom-right
  const savedBounds = store.get('windowBounds');
  if (savedBounds) {
    mainWindow.setBounds(savedBounds);
  } else {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(width - 500, height - 680);
  }

  // Persist position / size
  mainWindow.on('moved',   () => store.set('windowBounds', mainWindow.getBounds()));
  mainWindow.on('resized', () => store.set('windowBounds', mainWindow.getBounds()));

  // Apply always-on-top preference
  mainWindow.setAlwaysOnTop(store.get('alwaysOnTop', false));

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Close = hide (stays in tray)
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  return mainWindow;
}

// ── Tray ───────────────────────────────────────────────────────────────────────
function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: `VideoAscend v${app.getVersion()}`, enabled: false },
    { type: 'separator' },
    {
      label: activeJob
        ? `Processing: ${activeJob.filename} (${activeJob.percent}%)`
        : 'Idle',
      enabled: false
    },
    { label: `Queue: ${queuedJobs.length} pending`, enabled: false },
    { type: 'separator' },
    { label: 'Show VideoAscend', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: 'Pause Queue', enabled: queuedJobs.length > 0, click: pauseQueue },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
}

function refreshTray() {
  if (!tray) return;
  tray.setContextMenu(buildTrayMenu());
  const pending = queuedJobs.length;
  tray.setToolTip(pending > 0 ? `VideoAscend — ${pending} jobs remaining` : 'VideoAscend');
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('VideoAscend');
  refreshTray();

  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

// ── Queue helpers ──────────────────────────────────────────────────────────────
let queuePaused = false;

function pauseQueue() {
  queuePaused = !queuePaused;
  refreshTray();
}

// ── Notifications ──────────────────────────────────────────────────────────────
function sendJobCompleteNotification(job) {
  if (!Notification.isSupported()) return;
  if (!store.get('notificationsEnabled')) return;

  const iconPath = path.join(__dirname, '../assets/icon.png');
  const n = new Notification({
    title: 'VideoAscend — Processing Complete',
    body: `${job.filename} → ${job.outputResolution || ''} in ${job.elapsedTime || ''}`,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    silent: !store.get('soundEnabled'),
    actions: process.platform === 'darwin' ? [
      { type: 'button', text: 'Show File' },
      { type: 'button', text: 'Process Another' }
    ] : undefined
  });

  n.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
  n.on('action', (_, index) => {
    if (index === 0 && job.outputPath) shell.showItemInFolder(job.outputPath);
    if (index === 1) {
      mainWindow?.show();
      mainWindow?.webContents?.send('start-new-job');
    }
  });
  n.show();
}

function sendBatchCompleteNotification(jobs) {
  if (!Notification.isSupported()) return;
  if (!store.get('notificationsEnabled')) return;
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const n = new Notification({
    title: 'VideoAscend — Batch Complete',
    body: `${jobs.length} videos processed successfully`,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
  });
  n.on('click', () => {
    mainWindow?.show();
    mainWindow?.webContents?.send('navigate', 'queue');
  });
  n.show();
}

// ── App lifecycle ──────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerIpcHandlers();

  // Global shortcut: toggle visibility
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    if (mainWindow?.isVisible()) mainWindow.hide();
    else { mainWindow?.show(); mainWindow?.focus(); }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Keep running in tray on all platforms
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// ── IPC Handlers ───────────────────────────────────────────────────────────────
function registerIpcHandlers() {

  // ── Window controls ──────────────────────────────────────────────────────────
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on('window-close',  () => mainWindow?.hide());
  ipcMain.on('window-hide',   () => mainWindow?.hide());
  ipcMain.on('window-expand', (_, expanded) => {
    if (expanded) {
      mainWindow?.setSize(900, 700, true);
    } else {
      mainWindow?.setSize(480, 640, true);
    }
  });
  ipcMain.handle('window-toggle-always-on-top', (_, flag) => {
    const val = flag !== undefined ? flag : !mainWindow?.isAlwaysOnTop();
    mainWindow?.setAlwaysOnTop(val);
    store.set('alwaysOnTop', val);
    return val;
  });
  ipcMain.handle('window-get-always-on-top', () => store.get('alwaysOnTop', false));

  // ── File / folder dialogs ────────────────────────────────────────────────────
  ipcMain.handle('select-file', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Video File',
        filters: [
          { name: 'Video Files', extensions: ['mp4','mkv','avi','mov','wmv','flv','webm','m4v'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile', 'multiSelections'],
      });
      if (result.canceled) return null;
      return result.filePaths.length === 1 ? result.filePaths[0] : result.filePaths;
    } catch (err) {
      return null;
    }
  });

  ipcMain.handle('select-output-dir', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Output Folder',
        properties: ['openDirectory', 'createDirectory'],
      });
      return result.canceled ? null : result.filePaths[0];
    } catch { return null; }
  });

  // ── Shell ────────────────────────────────────────────────────────────────────
  ipcMain.handle('open-output-folder', async (_, folderPath) => {
    try {
      if (folderPath && fs.existsSync(folderPath)) await shell.openPath(folderPath);
      else await shell.openPath(path.join(os.homedir(), 'Videos'));
    } catch {}
  });
  ipcMain.handle('open-external', async (_, url) => {
    try { await shell.openExternal(url); } catch {}
  });
  ipcMain.handle('show-item-in-folder', async (_, p) => {
    try { shell.showItemInFolder(p); } catch {}
  });

  // ── App version ───────────────────────────────────────────────────────────────
  ipcMain.handle('get-app-version', () => app.getVersion());

  // ── System info ──────────────────────────────────────────────────────────────
  ipcMain.handle('get-system-info', async () => {
    try {
      const si = require('systeminformation');
      const [gpuData, cpuData, memData] = await Promise.all([si.graphics(), si.cpu(), si.mem()]);
      const gpu = gpuData.controllers?.[0];
      return {
        gpu: gpu?.model || 'Unknown GPU',
        vram: gpu?.vram || 0,
        gpuVendor: gpu?.vendor || '',
        platform: process.platform,
        cpuCores: cpuData.cores || os.cpus().length,
        ram: Math.round(memData.total / (1024 ** 3)),
        vulkanAvailable: !!(gpu?.vendor && !gpu.vendor.includes('Intel')),
        arch: process.arch,
      };
    } catch {
      return {
        gpu: 'Unknown GPU', vram: 0, platform: process.platform,
        cpuCores: os.cpus().length, ram: Math.round(os.totalmem() / (1024 ** 3)),
        vulkanAvailable: false, arch: process.arch,
      };
    }
  });

  // ── Store / settings ─────────────────────────────────────────────────────────
  ipcMain.handle('store-get', (_, key) => store.get(key));
  ipcMain.handle('store-set', (_, key, value) => { store.set(key, value); return true; });
  ipcMain.handle('store-delete', (_, key) => { store.delete(key); return true; });

  // ── API key (encrypted) ───────────────────────────────────────────────────────
  ipcMain.handle('save-api-key', (_, key) => {
    try {
      store.set('anthropicApiKey',
        safeStorage.isAvailable()
          ? safeStorage.encryptString(key).toString('base64')
          : key
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
  ipcMain.handle('get-api-key', () => {
    const stored = store.get('anthropicApiKey');
    if (!stored) return null;
    try {
      return safeStorage.isAvailable()
        ? safeStorage.decryptString(Buffer.from(stored, 'base64'))
        : stored;
    } catch { return null; }
  });
  ipcMain.handle('clear-api-key', () => {
    store.delete('anthropicApiKey');
    return { success: true };
  });

  // ── Navigation from tray ──────────────────────────────────────────────────────
  ipcMain.handle('navigate-to', (_, view) => {
    mainWindow?.webContents?.send('navigate-to', view);
  });

  // ── Theme persistence ─────────────────────────────────────────────────────────
  ipcMain.handle('get-theme', () => store.get('theme', 'dark'));
  ipcMain.handle('set-theme', (_, t) => { store.set('theme', t); return true; });

  // ── Hardware accel label ──────────────────────────────────────────────────────
  ipcMain.handle('set-hwaccel-label', (_, label) => { store.set('hwAccelLabel', label); refreshTray(); });
  ipcMain.handle('get-hwaccel-label', () => store.get('hwAccelLabel', 'CPU Software'));

  // ── Queue state updates from renderer ─────────────────────────────────────────
  ipcMain.on('queue-update', (_, { active, queued }) => {
    activeJob  = active  || null;
    queuedJobs = queued  || [];
    refreshTray();
  });

  // ── Job complete notification triggers ────────────────────────────────────────
  ipcMain.on('job-complete-notify', (_, job) => sendJobCompleteNotification(job));
  ipcMain.on('batch-complete-notify', (_, jobs) => sendBatchCompleteNotification(jobs));

  // ── Video probe ───────────────────────────────────────────────────────────────
  const VideoProcessor = require('./processor');
  const processor = new VideoProcessor();

  ipcMain.handle('probe-video', async (_, filePath) => {
    try { return await processor.probeVideo(filePath); }
    catch (err) {
      mainWindow?.webContents?.send('processing-error', { error: err.message });
      throw err;
    }
  });

  // ── Video processing ──────────────────────────────────────────────────────────
  ipcMain.handle('process-video', async (event, options) => {
    try { return await processor.processVideo(event, options); }
    catch (err) {
      if (event?.sender && !event.sender.isDestroyed()) {
        event.sender.send('processing-error', { jobId: options.jobId, error: err.message });
      }
      throw err;
    }
  });

  ipcMain.handle('cancel-processing', async (_, jobId) => {
    return processor.cancelJob(jobId);
  });

  // ── Auto-updater ──────────────────────────────────────────────────────────────
  try {
    const updater = require('./updater');
    updater.setupAutoUpdater(mainWindow);

    ipcMain.handle('check-for-updates',  () => updater.checkForUpdates());
    ipcMain.handle('download-update',    () => updater.downloadUpdate());
    ipcMain.handle('install-update',     () => updater.installUpdate());
  } catch {
    // updater not available in dev without publish config
    ipcMain.handle('check-for-updates',  () => null);
    ipcMain.handle('download-update',    () => null);
    ipcMain.handle('install-update',     () => null);
  }
}
