import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const ProjectContext = createContext();

// Project provider component
export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load projects from API
  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/projects');
      
      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);
  
  // Load a project by ID
  const loadProject = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCurrentProject(data);
      return data;
    } catch (error) {
      console.error('Error loading project:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new project
  const createProject = async (project) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProjects([...projects, data]);
      setCurrentProject(data);
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Update a project
  const updateProject = async (id, project) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update projects list
      setProjects(projects.map(p => p.id === id ? data : p));
      
      // Update current project if it's the one being edited
      if (currentProject && currentProject.id === id) {
        setCurrentProject(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a project
  const deleteProject = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.statusText}`);
      }
      
      // Update projects list
      setProjects(projects.filter(p => p.id !== id));
      
      // Clear current project if it's the one being deleted
      if (currentProject && currentProject.id === id) {
        setCurrentProject(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Add a variable to a project
  const addVariable = async (projectId, variable) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/variables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variable),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add variable: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update current project if it's the one being edited
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject({
          ...currentProject,
          variables: [...(currentProject.variables || []), data],
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error adding variable:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Add a constraint to a project
  const addConstraint = async (projectId, constraint) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/constraints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(constraint),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add constraint: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update current project if it's the one being edited
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject({
          ...currentProject,
          constraints: [...(currentProject.constraints || []), data],
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error adding constraint:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Add an objective to a project
  const addObjective = async (projectId, objective) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(objective),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add objective: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update current project if it's the one being edited
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject({
          ...currentProject,
          objectives: [...(currentProject.objectives || []), data],
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error adding objective:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Start an optimization run
  const startOptimization = async (projectId, algorithm, parameters) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/projects/${projectId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ algorithm, parameters }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start optimization: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting optimization:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Get optimization run status
  const getOptimizationStatus = async (runId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/optimization-runs/${runId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get optimization status: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting optimization status:', error);
      return null;
    }
  };
  
  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        loading,
        error,
        loadProjects,
        loadProject,
        createProject,
        updateProject,
        deleteProject,
        addVariable,
        addConstraint,
        addObjective,
        startOptimization,
        getOptimizationStatus,
        setCurrentProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use the project context
export const useProject = () => {
  const context = useContext(ProjectContext);
  
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  
  return context;
};
