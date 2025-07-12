import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, loadProjects, loading } = useProject();
  const { addNotification } = useNotification();
  const [systemInfo, setSystemInfo] = useState(null);
  
  // Load system info
  useEffect(() => {
    const getSystemInfo = async () => {
      try {
        const info = await window.electron.system.getSystemInfo();
        setSystemInfo(info);
      } catch (error) {
        console.error('Error getting system info:', error);
      }
    };
    
    getSystemInfo();
  }, []);
  
  // Refresh projects
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  
  // Handle new project button
  const handleNewProject = () => {
    navigate('/problem-wizard');
  };
  
  // Handle open project
  const handleOpenProject = (id) => {
    navigate(`/projects?id=${id}`);
  };
  
  // Format bytes to human-readable
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          className="btn btn-primary"
          onClick={handleNewProject}
        >
          New Project
        </button>
      </div>
      
      {/* System Info */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">System Information</h2>
        {systemInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-500 dark:text-gray-400">Platform</h3>
              <p className="mt-1">{systemInfo.platform} ({systemInfo.arch})</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-500 dark:text-gray-400">CPU</h3>
              <p className="mt-1">{systemInfo.cpus?.[0]?.model || 'Unknown'} ({systemInfo.cpus?.length || 0} cores)</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-500 dark:text-gray-400">Memory</h3>
              <p className="mt-1">{formatBytes(systemInfo.freeMemory)} free of {formatBytes(systemInfo.totalMemory)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-500 dark:text-gray-400">Hostname</h3>
              <p className="mt-1">{systemInfo.hostname}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-500 dark:text-gray-400">Uptime</h3>
              <p className="mt-1">{Math.floor(systemInfo.uptime / 3600)} hours, {Math.floor((systemInfo.uptime % 3600) / 60)} minutes</p>
            </div>
          </div>
        ) : (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-dark-accent rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-dark-accent rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-dark-accent rounded w-3/4"></div>
          </div>
        )}
      </div>
      
      {/* Recent Projects */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Recent Projects</h2>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-dark-accent rounded"></div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-4">
            {projects.slice(0, 5).map(project => (
              <div
                key={project.id}
                className="p-4 border border-gray-200 dark:border-dark-accent rounded-lg hover:bg-gray-50 dark:hover:bg-dark-accent cursor-pointer transition-colors"
                onClick={() => handleOpenProject(project.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{project.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{project.description || 'No description'}</p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            
            {projects.length > 5 && (
              <button
                className="text-electric-teal hover:underline text-sm"
                onClick={() => navigate('/projects')}
              >
                View all projects
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No projects yet</p>
            <button
              className="mt-4 btn btn-outline"
              onClick={handleNewProject}
            >
              Create your first project
            </button>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className="p-4 border border-gray-200 dark:border-dark-accent rounded-lg hover:bg-gray-50 dark:hover:bg-dark-accent text-left"
            onClick={handleNewProject}
          >
            <div className="flex items-center">
              <div className="bg-electric-teal bg-opacity-10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-electric-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">New Project</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create a new optimization project</p>
              </div>
            </div>
          </button>
          
          <button
            className="p-4 border border-gray-200 dark:border-dark-accent rounded-lg hover:bg-gray-50 dark:hover:bg-dark-accent text-left"
            onClick={() => navigate('/algorithm-engine')}
          >
            <div className="flex items-center">
              <div className="bg-electric-teal bg-opacity-10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-electric-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">Algorithm Engine</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure optimization algorithms</p>
              </div>
            </div>
          </button>
          
          <button
            className="p-4 border border-gray-200 dark:border-dark-accent rounded-lg hover:bg-gray-50 dark:hover:bg-dark-accent text-left"
            onClick={() => {
              addNotification({
                title: 'API Server',
                message: 'API server is running at http://localhost:3000',
                type: 'info',
              });
              window.electron.shell.openExternal('http://localhost:3000/api/health');
            }}
          >
            <div className="flex items-center">
              <div className="bg-electric-teal bg-opacity-10 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-electric-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">API Server</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Access the local API server</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
