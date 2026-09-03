const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sentinelDesktop', {
  platform: process.platform,
  isDesktop: true,
  getVersion: () => '2.0.0-enterprise',
  closeApp: () => ipcRenderer.send('app-close'),
  minimizeApp: () => ipcRenderer.send('app-minimize'),
  maximizeApp: () => ipcRenderer.send('app-maximize')
});
