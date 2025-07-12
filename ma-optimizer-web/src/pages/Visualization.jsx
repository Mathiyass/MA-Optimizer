import React, { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, RadarChart, Radar, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

const Visualization = () => {
  const [activeTab, setActiveTab] = useState('performance');
  
  const performanceData = [
    { name: 'Day 1', cpu: 45, memory: 30, disk: 25, network: 40 },
    { name: 'Day 2', cpu: 50, memory: 35, disk: 28, network: 45 },
    { name: 'Day 3', cpu: 55, memory: 40, disk: 32, network: 50 },
    { name: 'Day 4', cpu: 70, memory: 55, disk: 45, network: 65 },
    { name: 'Day 5', cpu: 85, memory: 70, disk: 60, network: 80 },
    { name: 'Day 6', cpu: 90, memory: 75, disk: 65, network: 85 },
    { name: 'Day 7', cpu: 95, memory: 80, disk: 70, network: 90 },
  ];
  
  const optimizationData = [
    { name: 'CPU', value: 95 },
    { name: 'Memory', value: 80 },
    { name: 'Disk', value: 70 },
    { name: 'Network', value: 90 },
    { name: 'GPU', value: 85 },
  ];
  
  const comparisonData = [
    { name: 'Boot Time', before: 45, after: 10 },
    { name: 'App Loading', before: 12, after: 3 },
    { name: 'File Transfer', before: 60, after: 15 },
    { name: 'Game FPS', before: 45, after: 120 },
    { name: 'Response Time', before: 250, after: 50 },
  ];
  
  const radarData = [
    { subject: 'CPU', A: 95, fullMark: 100 },
    { subject: 'Memory', A: 80, fullMark: 100 },
    { subject: 'Disk', A: 70, fullMark: 100 },
    { subject: 'Network', A: 90, fullMark: 100 },
    { subject: 'GPU', A: 85, fullMark: 100 },
    { subject: 'System', A: 88, fullMark: 100 },
  ];
  
  const COLORS = ['#ff00ff', '#00ffff', '#ff5500', '#00ff00', '#0088fe'];
  
  const renderPerformanceTab = () => (
    <div className="space-y-8">
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-4 text-white">Performance Over Time</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
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
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#ff00ff" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="memory" stroke="#00ffff" />
              <Line type="monotone" dataKey="disk" stroke="#ff5500" />
              <Line type="monotone" dataKey="network" stroke="#00ff00" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="quantum-card">
          <h2 className="text-xl font-bold mb-4 text-white">Optimization Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={optimizationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {optimizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1b2e', 
                    borderColor: '#ff00ff',
                    color: 'white' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="quantum-card">
          <h2 className="text-xl font-bold mb-4 text-white">System Performance Radar</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#2a2b40" />
                <PolarAngleAxis dataKey="subject" stroke="#8892b0" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#8892b0" />
                <Radar name="Performance" dataKey="A" stroke="#ff00ff" fill="#ff00ff" fillOpacity={0.6} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1b2e', 
                    borderColor: '#ff00ff',
                    color: 'white' 
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderComparisonTab = () => (
    <div className="space-y-8">
      <div className="quantum-card">
        <h2 className="text-xl font-bold mb-4 text-white">Before vs After Optimization</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
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
              <Legend />
              <Bar name="Before Optimization" dataKey="before" fill="#8892b0" />
              <Bar name="After Optimization" dataKey="after" fill="#ff00ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="quantum-card">
          <h2 className="text-xl font-bold mb-4 text-white">Improvement Percentage</h2>
          <div className="space-y-4">
            {comparisonData.map((item, index) => {
              const improvementPercent = ((item.before - item.after) / item.before) * 100;
              const isPositive = item.name === 'Game FPS' ? item.after > item.before : item.after < item.before;
              const percentValue = item.name === 'Game FPS' 
                ? ((item.after - item.before) / item.before) * 100
                : improvementPercent;
              
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-white">{item.name}</span>
                    <span className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : '-'}{Math.abs(percentValue).toFixed(0)}%
                    </span>
                  </div>
                  <div className="quantum-progress">
                    <div 
                      className="quantum-progress-bar" 
                      style={{ 
                        width: `${Math.min(100, Math.abs(percentValue))}%`,
                        background: isPositive 
                          ? 'linear-gradient(90deg, #00ffff, #00ff00)' 
                          : 'linear-gradient(90deg, #ff5500, #ff0000)' 
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="quantum-card">
          <h2 className="text-xl font-bold mb-4 text-white">Optimization Summary</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-white/70 text-sm mb-1">Overall Improvement</h3>
              <p className="text-3xl font-bold gradient-text">+187%</p>
            </div>
            <div>
              <h3 className="text-white/70 text-sm mb-1">Optimizations Applied</h3>
              <p className="text-white">20,547 tweaks</p>
            </div>
            <div>
              <h3 className="text-white/70 text-sm mb-1">System Health</h3>
              <p className="text-white">98% (Excellent)</p>
            </div>
            <div>
              <h3 className="text-white/70 text-sm mb-1">Quantum Efficiency</h3>
              <div className="quantum-progress mt-2">
                <div className="quantum-progress-bar" style={{ width: '92%' }}></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-white/60">
                <span>Efficiency</span>
                <span>92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Performance Visualization</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'performance' 
                ? 'bg-primary text-background-dark' 
                : 'bg-background-light text-white hover:bg-primary/20'
            }`}
          >
            Performance
          </button>
          <button 
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'comparison' 
                ? 'bg-primary text-background-dark' 
                : 'bg-background-light text-white hover:bg-primary/20'
            }`}
          >
            Comparison
          </button>
        </div>
      </div>
      
      {activeTab === 'performance' ? renderPerformanceTab() : renderComparisonTab()}
    </div>
  );
};

export default Visualization;