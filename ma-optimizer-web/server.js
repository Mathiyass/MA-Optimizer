const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 12001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.get('/api/system-info', (req, res) => {
  try {
    const systemInfo = {
      cpu: os.cpus()[0].model,
      memory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
      storage: '1TB NVMe SSD', // Mock data as we can't easily get this info
      gpu: 'NVIDIA RTX 3080', // Mock data as we can't easily get this info
      os: `${os.type()} ${os.release()}`,
      hostname: os.hostname(),
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    };
    
    res.json(systemInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/performance-data', (req, res) => {
  // Mock performance data
  const performanceData = [
    { name: 'CPU', pre: 850, post: 1870 },
    { name: 'Memory', pre: 22, post: 58 },
    { name: 'Disk I/O', pre: 350, post: 1200 },
    { name: 'Graphics', pre: 45, post: 132 },
    { name: 'Network', pre: 120, post: 980 },
  ];
  
  res.json(performanceData);
});

app.post('/api/optimize', (req, res) => {
  const { options } = req.body;
  
  // In a real app, this would trigger actual optimization processes
  // For now, we'll just return a success message
  
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Optimization completed successfully',
      tweaksApplied: 20547,
      optimizationScore: 87,
    });
  }, 2000); // Simulate a delay
});

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});