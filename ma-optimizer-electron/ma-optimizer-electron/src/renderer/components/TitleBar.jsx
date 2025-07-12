import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const TitleBar = ({ toggleSidebar, sidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  
  const handleMinimize = () => {
    window.electron.windowControls.minimize();
  };
  
  const handleMaximize = () => {
    window.electron.windowControls.maximize();
  };
  
  const handleClose = () => {
    window.electron.windowControls.close();
  };
  
  return (
    <div className="title-bar">
      <div className="flex items-center">
        <button 
          className="no-drag mr-2 text-white hover:text-electric-teal"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>
        <span className="text-sm font-medium">MA-Optimizer</span>
      </div>
      
      <div className="flex items-center">
        <button 
          className="no-drag mr-2 text-white hover:text-electric-teal"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        
        <div className="flex">
          <button 
            className="title-bar-button title-bar-minimize"
            onClick={handleMinimize}
          />
          <button 
            className="title-bar-button title-bar-maximize"
            onClick={handleMaximize}
          />
          <button 
            className="title-bar-button title-bar-close"
            onClick={handleClose}
          />
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
