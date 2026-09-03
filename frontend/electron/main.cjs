const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = 5174;
const BACKEND_PORT = 8000;

function startBackend() {
  const backendDir = path.resolve(__dirname, '../../backend');
  const pythonVenv = path.resolve(__dirname, '../../../sentinel-jwt/backend/venv/Scripts/python.exe');
  
  const pythonCmd = require('fs').existsSync(pythonVenv) ? pythonVenv : 'python';
  
  console.log('[Desktop] Launching Sentinel Backend via:', pythonCmd);
  
  backendProcess = spawn(pythonCmd, ['main.py'], {
    cwd: backendDir,
    stdio: 'ignore',
    detached: false
  });

  backendProcess.on('error', (err) => {
    console.error('[Desktop] Failed to start backend:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1080,
    minHeight: 720,
    title: 'Sentinel Enterprise v2.0 — Desktop Application',
    backgroundColor: '#070b14',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Once ready, show window smoothly without white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // In dev mode or when server is accessible, load URL, else fallback to dist/index.html
  const loadTarget = () => {
    const http = require('http');
    http.get(`http://localhost:${PORT}`, (res) => {
      mainWindow.loadURL(`http://localhost:${PORT}`);
    }).on('error', () => {
      const distIndex = path.join(__dirname, '../dist/index.html');
      if (require('fs').existsSync(distIndex)) {
        mainWindow.loadFile(distIndex);
      } else {
        mainWindow.loadURL(`http://localhost:${PORT}`);
      }
    });
  };

  loadTarget();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    console.log('[Desktop] Shutting down backend process...');
    try {
      backendProcess.kill('SIGTERM');
    } catch (e) {}
  }
});

// IPC handlers
ipcMain.on('app-close', () => app.quit());
ipcMain.on('app-minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('app-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
