const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { startApiServer } = require('../api/server');
const { initDatabase } = require('../database/db');
const { loadUserSettings } = require('./settings');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;
let tray;
let apiServer;
let isDevelopment = process.env.NODE_ENV === 'development';

// User data paths
const userDataPath = app.getPath('userData');
const pluginsPath = path.join(userDataPath, 'plugins');
const projectsPath = path.join(userDataPath, 'projects');
const settingsPath = path.join(userDataPath, 'settings.json');

// Ensure directories exist
[pluginsPath, projectsPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize database
initDatabase(userDataPath);

// Load user settings
const settings = loadUserSettings(settingsPath);

// Apply theme from settings
if (settings.theme === 'dark') {
  nativeTheme.themeSource = 'dark';
} else if (settings.theme === 'light') {
  nativeTheme.themeSource = 'light';
} else {
  nativeTheme.themeSource = 'system';
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless window for custom title bar
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1a2e' : '#ECF0F1',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../public/icon.png'),
  });

  // Load the app
  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:12000');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Handle window close event
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create system tray
  createTray();
}

function createTray() {
  tray = new Tray(path.join(__dirname, '../../public/tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open MA-Optimizer', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Start Optimization', click: () => mainWindow.webContents.send('start-optimization') },
    { label: 'Stop Optimization', click: () => mainWindow.webContents.send('stop-optimization') },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('MA-Optimizer');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

// Start the API server
function startServer() {
  const port = settings.apiPort || 3000;
  apiServer = startApiServer(port);
  console.log(`API server running on port ${port}`);
}

// App ready event
app.whenReady().then(() => {
  createWindow();
  startServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-user-data-path', () => userDataPath);
ipcMain.handle('get-plugins-path', () => pluginsPath);
ipcMain.handle('get-projects-path', () => projectsPath);
ipcMain.handle('get-settings', () => settings);

// Window controls
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// File dialogs
ipcMain.handle('open-file-dialog', async (event, options) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(options);
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  const { canceled, filePath } = await dialog.showSaveDialog(options);
  if (canceled) return null;
  return filePath;
});

// Theme switching
ipcMain.handle('toggle-theme', (event, theme) => {
  if (theme === 'system' || theme === 'light' || theme === 'dark') {
    nativeTheme.themeSource = theme;
    settings.theme = theme;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return theme;
  }
  return nativeTheme.themeSource;
});

// Get system info
ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    hostname: os.hostname(),
    userInfo: os.userInfo(),
  };
});

// Open external links
ipcMain.on('open-external-link', (event, url) => {
  shell.openExternal(url);
});

// Clean up on app quit
app.on('quit', () => {
  if (apiServer) {
    apiServer.close();
  }
});