import React, { createContext, useState, useContext, useEffect } from 'react';
import { getSystemInfo, getPerformanceData } from '../api/optimizer';

const OptimizerContext = createContext();

export const useOptimizer = () => useContext(OptimizerContext);

export const OptimizerProvider = ({ children }) => {
  const [systemInfo, setSystemInfo] = useState({
    cpu: 'Loading...',
    memory: 'Loading...',
    storage: 'Loading...',
    gpu: 'Loading...',
    os: 'Loading...',
  });
  
  const [performanceData, setPerformanceData] = useState([]);
  
  const [optimizationStatus, setOptimizationStatus] = useState({
    lastRun: 'Never',
    status: 'Not Optimized',
    score: 0,
    tweaksApplied: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch system info
        const sysInfo = await getSystemInfo();
        setSystemInfo(sysInfo);
        
        // Fetch performance data
        const perfData = await getPerformanceData();
        setPerformanceData(perfData);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load system data. Please try again later.');
        setIsLoading(false);
        
        // Set fallback data
        setSystemInfo({
          cpu: 'Intel Core i7-10700K',
          memory: '32GB DDR4',
          storage: '1TB NVMe SSD',
          gpu: 'NVIDIA RTX 3080',
          os: 'Windows 11 Pro',
        });
        
        setPerformanceData([
          { name: 'CPU', pre: 850, post: 1870 },
          { name: 'Memory', pre: 22, post: 58 },
          { name: 'Disk I/O', pre: 350, post: 1200 },
          { name: 'Graphics', pre: 45, post: 132 },
          { name: 'Network', pre: 120, post: 980 },
        ]);
      }
    };
    
    fetchData();
  }, []);
  
  const updateOptimizationStatus = (status) => {
    setOptimizationStatus({
      ...optimizationStatus,
      ...status,
      lastRun: new Date().toLocaleString(),
    });
  };
  
  const value = {
    systemInfo,
    performanceData,
    optimizationStatus,
    isLoading,
    error,
    updateOptimizationStatus,
  };
  
  return (
    <OptimizerContext.Provider value={value}>
      {children}
    </OptimizerContext.Provider>
  );
};