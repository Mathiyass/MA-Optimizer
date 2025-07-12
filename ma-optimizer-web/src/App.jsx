import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Optimizer from './pages/Optimizer';
import Visualization from './pages/Visualization';
import Settings from './pages/Settings';
import About from './pages/About';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Check if we're on the dashboard
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  
  // Effect to handle initial navigation
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [location.pathname, navigate]);
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/optimizer" element={<Optimizer />} />
            <Route path="/visualization" element={<Visualization />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;