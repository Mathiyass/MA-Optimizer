import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProblemWizard from './pages/ProblemWizard';
import AlgorithmEngine from './pages/AlgorithmEngine';
import Visualization from './pages/Visualization';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NotificationProvider } from './contexts/NotificationContext';

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
    <ThemeProvider>
      <ProjectProvider>
        <NotificationProvider>
          <div className="flex flex-col h-screen">
            <TitleBar 
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
              sidebarOpen={sidebarOpen} 
            />
            
            <div className="flex flex-1 overflow-hidden">
              {sidebarOpen && <Sidebar />}
              
              <main className="flex-1 overflow-auto p-6">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/problem-wizard" element={<ProblemWizard />} />
                  <Route path="/algorithm-engine" element={<AlgorithmEngine />} />
                  <Route path="/visualization" element={<Visualization />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </div>
        </NotificationProvider>
      </ProjectProvider>
    </ThemeProvider>
  );
};

export default App;