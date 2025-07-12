import React, { useState } from 'react';

const Optimizer = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  
  const optimizationSteps = [
    { name: "NEURAL NETWORK OPTIMIZATION", description: "Applying AI-driven performance algorithms" },
    { name: "QUANTUM COMPUTING EMULATION", description: "Harnessing quantum principles for performance" },
    { name: "KERNEL HYPER-TUNING", description: "Optimizing system core parameters" },
    { name: "SERVICE DNA RECODING", description: "Disabling non-essential services" },
    { name: "NETWORK DNA RECONFIGURATION", description: "Reconfiguring network stack" },
    { name: "STORAGE TURBO BOOST", description: "Maximizing SSD/HDD performance" },
    { name: "SYSTEM PURIFICATION", description: "Cleaning temporary files and caches" },
    { name: "SECURITY FORTIFICATION", description: "Hardening system security" },
    { name: "GAMING DNA ACTIVATION", description: "Applying gaming performance tweaks" },
    { name: "VISUAL PERFORMANCE", description: "Optimizing UI responsiveness" },
    { name: "MEMORY RE-ARCHITECTURE", description: "Tuning RAM management" },
    { name: "CPU HYPER-OVERDRIVE", description: "Maximizing processor performance" }
  ];
  
  const startOptimization = () => {
    setIsOptimizing(true);
    setCurrentStep(0);
    setProgress(0);
    setLogs([]);
    
    // Simulate optimization process
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsOptimizing(false);
          addLog("OPTIMIZATION COMPLETE", "success");
          return 100;
        }
        
        const newProgress = prev + 1;
        
        // Update current step based on progress
        const stepIndex = Math.floor((newProgress / 100) * optimizationSteps.length);
        if (stepIndex !== currentStep && stepIndex < optimizationSteps.length) {
          setCurrentStep(stepIndex);
          addLog(`STARTING: ${optimizationSteps[stepIndex].name}`, "info");
          
          // Add some random success logs
          if (Math.random() > 0.7) {
            setTimeout(() => {
              addLog(`Applied ${Math.floor(Math.random() * 100) + 1} optimizations to ${getRandomComponent()}`, "success");
            }, 300);
          }
        }
        
        return newProgress;
      });
    }, 100);
  };
  
  const getRandomComponent = () => {
    const components = ["CPU", "Memory", "Storage", "Network", "Graphics", "System Services", "Registry", "Drivers"];
    return components[Math.floor(Math.random() * components.length)];
  };
  
  const addLog = (message, type = "info") => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Quantum Optimizer</h1>
        {!isOptimizing ? (
          <button 
            onClick={startOptimization} 
            className="quantum-button"
          >
            INITIATE QUANTUM SEQUENCE
          </button>
        ) : (
          <button 
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
            onClick={() => setIsOptimizing(false)}
          >
            ABORT SEQUENCE
          </button>
        )}
      </div>
      
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-4 text-white">Optimization Control</h2>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-white">Progress</span>
            <span className="text-white">{progress}%</span>
          </div>
          <div className="quantum-progress">
            <div 
              className="quantum-progress-bar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {isOptimizing && currentStep < optimizationSteps.length && (
          <div className="mb-6 animated-border p-4">
            <h3 className="text-lg font-semibold gradient-text mb-1">
              {optimizationSteps[currentStep].name}
            </h3>
            <p className="text-white/70">
              {optimizationSteps[currentStep].description}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {optimizationSteps.map((step, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                index === currentStep && isOptimizing
                  ? 'border-primary bg-primary/10 animate-pulse-slow'
                  : index < currentStep || (index === optimizationSteps.length - 1 && progress === 100)
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/10 bg-background-dark'
              }`}
            >
              <h4 className={`text-sm font-medium ${
                index === currentStep && isOptimizing
                  ? 'text-primary'
                  : index < currentStep || (index === optimizationSteps.length - 1 && progress === 100)
                  ? 'text-green-500'
                  : 'text-white/70'
              }`}>
                {step.name}
              </h4>
            </div>
          ))}
        </div>
      </div>
      
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-4 text-white">Optimization Log</h2>
        <div className="bg-background-dark rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-white/50">No logs yet. Start optimization to see logs.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-white/50">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                <span className={
                  log.type === 'success' ? 'text-green-500' : 
                  log.type === 'error' ? 'text-red-500' : 
                  log.type === 'warning' ? 'text-yellow-500' : 
                  'text-secondary'
                }>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-4 text-white">Optimization Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Performance Targets</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input type="checkbox" id="cpu" className="mr-3" defaultChecked />
                <label htmlFor="cpu" className="text-white">CPU Optimization</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="memory" className="mr-3" defaultChecked />
                <label htmlFor="memory" className="text-white">Memory Optimization</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="storage" className="mr-3" defaultChecked />
                <label htmlFor="storage" className="text-white">Storage Optimization</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="network" className="mr-3" defaultChecked />
                <label htmlFor="network" className="text-white">Network Optimization</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="gpu" className="mr-3" defaultChecked />
                <label htmlFor="gpu" className="text-white">GPU Optimization</label>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Optimization Level</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input type="radio" id="balanced" name="level" className="mr-3" />
                <label htmlFor="balanced" className="text-white">Balanced</label>
              </div>
              <div className="flex items-center">
                <input type="radio" id="performance" name="level" className="mr-3" defaultChecked />
                <label htmlFor="performance" className="text-white">Performance</label>
              </div>
              <div className="flex items-center">
                <input type="radio" id="extreme" name="level" className="mr-3" />
                <label htmlFor="extreme" className="text-white">Extreme Performance</label>
              </div>
              <div className="flex items-center">
                <input type="radio" id="quantum" name="level" className="mr-3" />
                <label htmlFor="quantum" className="text-white">Quantum Overdrive</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="backup" className="mr-3" defaultChecked />
                <label htmlFor="backup" className="text-white">Create System Restore Point</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Optimizer;