import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const [systemTheme, setSystemTheme] = useState('light');
  
  // Effect to load theme from electron settings
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await window.electron.settings.getSettings();
        setTheme(settings.theme || 'system');
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Effect to detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    // Set initial value
    handleChange(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  // Effect to apply theme
  useEffect(() => {
    const applyTheme = async () => {
      const effectiveTheme = theme === 'system' ? systemTheme : theme;
      
      // Apply theme to document
      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Save theme to electron settings
      try {
        await window.electron.settings.toggleTheme(theme);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };
    
    applyTheme();
  }, [theme, systemTheme]);
  
  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
  };
  
  // Get effective theme
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  
  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
