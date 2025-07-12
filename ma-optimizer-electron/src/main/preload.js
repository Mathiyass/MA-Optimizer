const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Window controls
  windowControls: {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
  },
  
  // File system operations
  fileSystem: {
    openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
    saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
    getPluginsPath: () => ipcRenderer.invoke('get-plugins-path'),
    getProjectsPath: () => ipcRenderer.invoke('get-projects-path'),
  },
  
  // Settings and theme
  settings: {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    toggleTheme: (theme) => ipcRenderer.invoke('toggle-theme', theme),
  },
  
  // System information
  system: {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    getPlatform: () => process.platform,
    getArch: () => process.arch,
    getCpuInfo: () => os.cpus(),
    getMemoryInfo: () => ({
      total: os.totalmem(),
      free: os.freemem(),
    }),
  },
  
  // External links
  shell: {
    openExternal: (url) => ipcRenderer.send('open-external-link', url),
  },
  
  // Optimization events
  optimization: {
    startOptimization: () => ipcRenderer.send('start-optimization'),
    stopOptimization: () => ipcRenderer.send('stop-optimization'),
    onOptimizationProgress: (callback) => 
      ipcRenderer.on('optimization-progress', (_, data) => callback(data)),
    onOptimizationComplete: (callback) => 
      ipcRenderer.on('optimization-complete', (_, data) => callback(data)),
  },
  
  // Notifications
  notifications: {
    showNotification: (options) => ipcRenderer.send('show-notification', options),
  },
  
  // Listeners
  on: (channel, callback) => {
    const validChannels = [
      'start-optimization', 
      'stop-optimization', 
      'optimization-progress', 
      'optimization-complete',
      'theme-changed'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    }
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    const validChannels = [
      'start-optimization', 
      'stop-optimization', 
      'optimization-progress', 
      'optimization-complete',
      'theme-changed'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
});