const fs = require('fs');
const path = require('path');

/**
 * Default settings for the application
 */
const defaultSettings = {
  theme: 'system', // 'light', 'dark', or 'system'
  apiPort: 3000,
  enableNotifications: true,
  autoStartServer: true,
  minimizeToTray: true,
  checkForUpdatesOnStartup: true,
  telemetry: false,
  plugins: {
    enabled: true,
    allowedExtensions: ['.js', '.py'],
  },
  optimization: {
    defaultAlgorithm: 'genetic',
    maxConcurrentJobs: 4,
    saveHistory: true,
    autoSaveInterval: 5, // minutes
  },
  visualization: {
    refreshRate: 1000, // ms
    maxDataPoints: 100,
    defaultChartType: 'line',
  },
  recentProjects: [],
  customAlgorithms: [],
};

/**
 * Load user settings from the settings file
 * @param {string} settingsPath - Path to the settings file
 * @returns {Object} - User settings
 */
function loadUserSettings(settingsPath) {
  try {
    if (fs.existsSync(settingsPath)) {
      const userSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      // Merge with default settings to ensure all properties exist
      return { ...defaultSettings, ...userSettings };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  // If settings file doesn't exist or is invalid, create it with defaults
  saveUserSettings(settingsPath, defaultSettings);
  return defaultSettings;
}

/**
 * Save user settings to the settings file
 * @param {string} settingsPath - Path to the settings file
 * @param {Object} settings - User settings to save
 */
function saveUserSettings(settingsPath, settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Update specific settings
 * @param {string} settingsPath - Path to the settings file
 * @param {Object} updatedSettings - Settings to update
 * @returns {Object} - Updated settings
 */
function updateUserSettings(settingsPath, updatedSettings) {
  const currentSettings = loadUserSettings(settingsPath);
  const newSettings = { ...currentSettings, ...updatedSettings };
  saveUserSettings(settingsPath, newSettings);
  return newSettings;
}

module.exports = {
  loadUserSettings,
  saveUserSettings,
  updateUserSettings,
  defaultSettings,
};