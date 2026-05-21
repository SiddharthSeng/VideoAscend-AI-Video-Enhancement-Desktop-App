'use strict';

let autoUpdater, log;

try {
  ({ autoUpdater } = require('electron-updater'));
  log = require('electron-log');
} catch {
  // Not available — export stubs
  module.exports = {
    setupAutoUpdater: () => {},
    checkForUpdates:  () => Promise.resolve(null),
    downloadUpdate:   () => Promise.resolve(null),
    installUpdate:    () => {},
  };
  return;
}

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;

function setupAutoUpdater(mainWindow) {
  const send = (data) => {
    if (mainWindow?.webContents && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('update-status', data);
    }
  };

  autoUpdater.on('checking-for-update', () => send({ status: 'checking' }));
  autoUpdater.on('update-available', (info) =>
    send({ status: 'available', version: info.version, releaseNotes: info.releaseNotes }));
  autoUpdater.on('update-not-available', () => send({ status: 'latest' }));
  autoUpdater.on('download-progress', (progress) =>
    send({
      status: 'downloading',
      percent: Math.round(progress.percent),
      speed: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    }));
  autoUpdater.on('update-downloaded', () => send({ status: 'ready' }));
  autoUpdater.on('error', (err) => send({ status: 'error', message: err.message }));
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates: () => { try { return autoUpdater.checkForUpdates(); } catch { return null; } },
  downloadUpdate:  () => { try { return autoUpdater.downloadUpdate(); } catch { return null; } },
  installUpdate:   () => { try { autoUpdater.quitAndInstall(); } catch {} },
};
