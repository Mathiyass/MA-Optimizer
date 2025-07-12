import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:12001/api';

export const getSystemInfo = async () => {
  try {
    const response = await axios.get(`${API_URL}/system-info`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system info:', error);
    throw error;
  }
};

export const getPerformanceData = async () => {
  try {
    const response = await axios.get(`${API_URL}/performance-data`);
    return response.data;
  } catch (error) {
    console.error('Error fetching performance data:', error);
    throw error;
  }
};

export const runOptimization = async (options) => {
  try {
    const response = await axios.post(`${API_URL}/optimize`, { options });
    return response.data;
  } catch (error) {
    console.error('Error running optimization:', error);
    throw error;
  }
};

// Mock implementation of the optimization algorithms
export const optimizationAlgorithms = {
  // CPU optimization algorithm
  optimizeCPU: (systemInfo) => {
    // In a real implementation, this would contain actual optimization logic
    return {
      tweaksApplied: 5247,
      performanceGain: 120,
    };
  },
  
  // Memory optimization algorithm
  optimizeMemory: (systemInfo) => {
    return {
      tweaksApplied: 3892,
      performanceGain: 164,
    };
  },
  
  // Storage optimization algorithm
  optimizeStorage: (systemInfo) => {
    return {
      tweaksApplied: 4521,
      performanceGain: 243,
    };
  },
  
  // Network optimization algorithm
  optimizeNetwork: (systemInfo) => {
    return {
      tweaksApplied: 2987,
      performanceGain: 717,
    };
  },
  
  // GPU optimization algorithm
  optimizeGPU: (systemInfo) => {
    return {
      tweaksApplied: 3900,
      performanceGain: 193,
    };
  },
};