import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    autoOptimize: false,
    optimizationLevel: 'performance',
    createBackup: true,
    telemetry: true,
    updateCheck: true,
    language: 'en',
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSave = () => {
    // In a real app, this would save to localStorage or a backend
    alert('Settings saved successfully!');
  };
  
  const handleReset = () => {
    setSettings({
      theme: 'dark',
      notifications: true,
      autoOptimize: false,
      optimizationLevel: 'performance',
      createBackup: true,
      telemetry: true,
      updateCheck: true,
      language: 'en',
    });
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <div className="flex space-x-3">
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-background-light text-white rounded-lg hover:bg-background-dark transition-colors"
          >
            Reset
          </button>
          <button 
            onClick={handleSave}
            className="quantum-button"
          >
            Save Settings
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="quantum-card">
          <h2 className="text-xl font-bold mb-6 text-white">Appearance</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-white mb-2">Theme</label>
              <select 
                name="theme"
                value={settings.theme}
                onChange={handleChange}
                className="quantum-input w-full"
              >
                <option value="dark">Dark (Default)</option>
                <option value="light">Light</option>
                <option value="system">System Preference</option>
                <option value="quantum">Quantum (High Contrast)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white mb-2">Language</label>
              <select 
                name="language"
                value={settings.language}
                onChange={handleChange}
                className="quantum-input w-full"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="animations" 
                name="animations"
                checked={settings.animations}
                onChange={handleChange}
                className="mr-3" 
              />
              <label htmlFor="animations" className="text-white">Enable animations</label>
            </div>
          </div>
        </div>
        
        <div className="quantum-card">
          <h2 className="text-xl font-bold mb-6 text-white">Optimization</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-white mb-2">Optimization Level</label>
              <select 
                name="optimizationLevel"
                value={settings.optimizationLevel}
                onChange={handleChange}
                className="quantum-input w-full"
              >
                <option value="balanced">Balanced</option>
                <option value="performance">Performance (Recommended)</option>
                <option value="extreme">Extreme Performance</option>
                <option value="quantum">Quantum Overdrive</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="createBackup" 
                name="createBackup"
                checked={settings.createBackup}
                onChange={handleChange}
                className="mr-3" 
              />
              <label htmlFor="createBackup" className="text-white">Create system restore point before optimization</label>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="autoOptimize" 
                name="autoOptimize"
                checked={settings.autoOptimize}
                onChange={handleChange}
                className="mr-3" 
              />
              <label htmlFor="autoOptimize" className="text-white">Auto-optimize on system startup</label>
            </div>
          </div>
        </div>
        
        <div className="quantum-card">
          <h2 className="text-xl font-bold mb-6 text-white">Notifications</h2>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="notifications" 
                name="notifications"
                checked={settings.notifications}
                onChange={handleChange}
                className="mr-3" 
              />
              <label htmlFor="notifications" className="text-white">Enable notifications</label>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="updateCheck" 
                name="updateCheck"
                checked={settings.updateCheck}
                onChange={handleChange}
                className="mr-3" 
              />
              <label htmlFor="updateCheck" className="text-white">Check for updates automatically</label>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="optimizationAlerts" 
                name="optimizationAlerts"
                checked={settings.optimizationAlerts}
                onChange={handleChange}
                className="mr-3" 
              />
              <label htmlFor="optimizationAlerts" className="text-white">Show optimization alerts</label>
            </div>
          </div>
        </div>
        
        <div className="quantum-card">
          <h2 className="text-xl font-bold mb-6 text-white">Privacy</h2>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="telemetry" 
                name="telemetry"
                checked={settings.telemetry}
                onChange={handleChange}
                className="mr-3" 
              />
              <label htmlFor="telemetry" className="text-white">Send anonymous usage data</label>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="crashReports" 
                name="crashReports"
                checked={settings.crashReports}
                onChange={handleChange}
                className="mr-3" 
              />
              <label htmlFor="crashReports" className="text-white">Send crash reports</label>
            </div>
            
            <button className="text-secondary hover:text-primary transition-colors">
              View Privacy Policy
            </button>
          </div>
        </div>
      </div>
      
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-6 text-white">Advanced Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white mb-2">Backup Location</label>
            <div className="flex">
              <input 
                type="text" 
                value="C:\MATHIYA_BACKUP"
                readOnly
                className="quantum-input flex-1 mr-2" 
              />
              <button className="px-4 py-2 bg-background-light text-white rounded-lg hover:bg-background-dark transition-colors">
                Browse
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-white mb-2">Log Level</label>
            <select 
              name="logLevel"
              value={settings.logLevel}
              onChange={handleChange}
              className="quantum-input w-full"
            >
              <option value="error">Error Only</option>
              <option value="warning">Warning & Error</option>
              <option value="info">Info, Warning & Error</option>
              <option value="debug">Debug (Verbose)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-white mb-2">API Port</label>
            <input 
              type="number" 
              name="apiPort"
              value={settings.apiPort || 3000}
              onChange={handleChange}
              className="quantum-input w-full" 
            />
          </div>
          
          <div>
            <label className="block text-white mb-2">Max Threads</label>
            <input 
              type="number" 
              name="maxThreads"
              value={settings.maxThreads || 4}
              onChange={handleChange}
              className="quantum-input w-full" 
            />
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-white/10">
          <button className="text-red-500 hover:text-red-400 transition-colors">
            Reset All Settings to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;