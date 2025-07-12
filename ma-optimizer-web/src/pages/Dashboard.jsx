import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [systemInfo, setSystemInfo] = useState({
    cpu: 'Intel Core i7-10700K',
    memory: '32GB DDR4',
    storage: '1TB NVMe SSD',
    gpu: 'NVIDIA RTX 3080',
    os: 'Windows 11 Pro',
  });
  
  const [performanceData, setPerformanceData] = useState([
    { name: 'CPU', pre: 850, post: 1870 },
    { name: 'Memory', pre: 22, post: 58 },
    { name: 'Disk I/O', pre: 350, post: 1200 },
    { name: 'Graphics', pre: 45, post: 132 },
    { name: 'Network', pre: 120, post: 980 },
  ]);
  
  const [optimizationStatus, setOptimizationStatus] = useState({
    lastRun: '2025-07-10 14:32:45',
    status: 'Optimized',
    score: 87,
    tweaksApplied: 20547,
  });
  
  const stats = [
    { label: 'System Responsiveness', value: '99%', color: 'from-primary to-secondary' },
    { label: 'Memory Speed', value: '164%', color: 'from-secondary to-accent' },
    { label: 'Disk I/O', value: '243%', color: 'from-accent to-primary' },
    { label: 'Graphics Rendering', value: '193%', color: 'from-primary to-secondary' },
  ];
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <Link to="/optimizer" className="quantum-button">
          Run Optimizer
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="quantum-card">
            <h3 className="text-white/70 text-sm mb-1">{stat.label}</h3>
            <div className="flex items-end">
              <span className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                +{stat.value}
              </span>
              <span className="text-white/50 ml-1 mb-1">improvement</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="quantum-card lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 text-white">Performance Gains</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2b40" />
                <XAxis dataKey="name" stroke="#8892b0" />
                <YAxis stroke="#8892b0" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1b2e', 
                    borderColor: '#ff00ff',
                    color: 'white' 
                  }} 
                />
                <Bar name="Pre-Optimization" dataKey="pre" fill="#8892b0" />
                <Bar name="Post-Optimization" dataKey="post" fill="#ff00ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="quantum-card">
          <h2 className="text-xl font-bold mb-4 text-white">System Information</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-white/70 text-sm mb-1">CPU</h3>
              <p className="text-white">{systemInfo.cpu}</p>
            </div>
            <div>
              <h3 className="text-white/70 text-sm mb-1">Memory</h3>
              <p className="text-white">{systemInfo.memory}</p>
            </div>
            <div>
              <h3 className="text-white/70 text-sm mb-1">Storage</h3>
              <p className="text-white">{systemInfo.storage}</p>
            </div>
            <div>
              <h3 className="text-white/70 text-sm mb-1">GPU</h3>
              <p className="text-white">{systemInfo.gpu}</p>
            </div>
            <div>
              <h3 className="text-white/70 text-sm mb-1">Operating System</h3>
              <p className="text-white">{systemInfo.os}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-4 text-white">Optimization Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="text-white/70 text-sm mb-1">Last Optimization</h3>
            <p className="text-white">{optimizationStatus.lastRun}</p>
          </div>
          <div>
            <h3 className="text-white/70 text-sm mb-1">Status</h3>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              <p className="text-white">{optimizationStatus.status}</p>
            </div>
          </div>
          <div>
            <h3 className="text-white/70 text-sm mb-1">Optimization Score</h3>
            <p className="text-white">{optimizationStatus.score}/100</p>
          </div>
          <div>
            <h3 className="text-white/70 text-sm mb-1">Tweaks Applied</h3>
            <p className="text-white">{optimizationStatus.tweaksApplied.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;