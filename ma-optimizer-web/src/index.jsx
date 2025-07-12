import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { OptimizerProvider } from './contexts/OptimizerContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <OptimizerProvider>
        <App />
      </OptimizerProvider>
    </BrowserRouter>
  </React.StrictMode>
);