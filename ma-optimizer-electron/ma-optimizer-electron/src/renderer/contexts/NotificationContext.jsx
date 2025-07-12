import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const NotificationContext = createContext();

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Add a notification
  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info', // 'info', 'success', 'warning', 'error'
      duration: notification.duration || 5000, // ms
      timestamp: new Date(),
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Show desktop notification if enabled
    if (notification.showDesktop !== false) {
      try {
        window.electron.notifications.showNotification({
          title: newNotification.title,
          body: newNotification.message,
        });
      } catch (error) {
        console.error('Error showing desktop notification:', error);
      }
    }
    
    // Auto-remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  };
  
  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  // Listen for notifications from the main process
  useEffect(() => {
    const handleNotification = (data) => {
      addNotification(data);
    };
    
    // Register listener
    if (window.electron && window.electron.on) {
      window.electron.on('notification', handleNotification);
    }
    
    // Clean up
    return () => {
      if (window.electron && window.electron.removeAllListeners) {
        window.electron.removeAllListeners('notification');
      }
    };
  }, []);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
      
      {/* Notification display */}
      <div className="fixed top-0 right-0 p-4 z-50 space-y-2 max-w-md">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`card shadow-lg transition-all duration-300 transform translate-x-0 ${
              notification.type === 'success' ? 'border-l-4 border-green-500' :
              notification.type === 'error' ? 'border-l-4 border-red-500' :
              notification.type === 'warning' ? 'border-l-4 border-yellow-500' :
              'border-l-4 border-electric-teal'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm">{notification.title}</h3>
                <p className="text-sm mt-1">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};
