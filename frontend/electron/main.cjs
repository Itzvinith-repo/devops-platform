const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let flaskProcess = null;

const FLASK_PORT = 5000;
const FLASK_URL = `http://localhost:${FLASK_PORT}`;
const isDev = process.env.ELECTRON_DEV === 'true';

// ─── Flask Backend Management ───────────────────────────────────────────────

function findPython() {
  // Try common Python paths on Windows
  const pythonPaths = ['python', 'python3', 'py'];
  return pythonPaths[0]; // Default to 'python' on Windows
}

function startFlaskBackend() {
  return new Promise((resolve, reject) => {
    const backendDir = path.join(__dirname, '..', '..', 'backend');
    const venvPython = path.join(backendDir, 'venv', 'Scripts', 'python.exe');
    
    // Use venv python if it exists, otherwise fall back to system python
    const fs = require('fs');
    const pythonCmd = fs.existsSync(venvPython) ? venvPython : findPython();
    
    console.log(`Starting Flask backend with: ${pythonCmd}`);
    console.log(`Backend directory: ${backendDir}`);

    flaskProcess = spawn(pythonCmd, ['run.py'], {
      cwd: backendDir,
      env: { ...process.env, FLASK_ENV: 'development' },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true, // Hide the console window on Windows
    });

    flaskProcess.stdout.on('data', (data) => {
      console.log(`[Flask] ${data.toString().trim()}`);
    });

    flaskProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      console.log(`[Flask] ${msg}`);
      // Flask prints "Running on http://..." to stderr
      if (msg.includes('Running on')) {
        resolve();
      }
    });

    flaskProcess.on('error', (err) => {
      console.error('Failed to start Flask:', err);
      reject(err);
    });

    flaskProcess.on('close', (code) => {
      console.log(`Flask process exited with code ${code}`);
      flaskProcess = null;
    });

    // Timeout: if Flask doesn't start in 15 seconds, try polling
    setTimeout(() => {
      waitForFlask(30).then(resolve).catch(reject);
    }, 2000);
  });
}

function waitForFlask(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (attempt) => {
      if (attempt >= retries) {
        reject(new Error('Flask backend failed to start'));
        return;
      }

      http.get(`${FLASK_URL}/api/courses`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(() => check(attempt + 1), 500);
        }
      }).on('error', () => {
        setTimeout(() => check(attempt + 1), 500);
      });
    };
    check(0);
  });
}

function stopFlaskBackend() {
  if (flaskProcess) {
    console.log('Stopping Flask backend...');
    
    // On Windows, we need to kill the process tree
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', flaskProcess.pid.toString(), '/f', '/t'], {
        windowsHide: true,
      });
    } else {
      flaskProcess.kill('SIGTERM');
    }
    
    flaskProcess = null;
  }
}

// ─── Window Creation ────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Frameless window for custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0B1121',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false, // Don't show until ready
  });

  // Show window when ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Forward maximize/unmaximize events to the custom title bar
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized');
  });

  // Load the app
  if (isDev) {
    // In dev mode, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle external link navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http') && !url.includes('localhost')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC Handlers (Window Controls) ────────────────────────────────────────

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// ─── App Lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  console.log('Electron app starting...');
  
  try {
    // Start Flask backend first
    await startFlaskBackend();
    console.log('Flask backend is ready!');
  } catch (err) {
    console.error('Warning: Flask backend may not have started:', err.message);
    // Continue anyway — user might be running Flask separately
  }

  // Create the window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopFlaskBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopFlaskBackend();
});

// Handle uncaught errors gracefully
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  stopFlaskBackend();
});
