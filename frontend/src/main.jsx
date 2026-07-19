import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import './index.css';

// In production, point axios at the deployed backend (set VITE_API_URL on Vercel).
// In dev it stays empty, so requests use the Vite proxy.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#132a54',
                border: '1px solid #dbe4f0',
                borderRadius: '12px',
                fontSize: '14px',
                boxShadow: '0 8px 24px rgba(19,42,84,0.10)',
              },
              success: { iconTheme: { primary: '#2fbf8f', secondary: '#ffffff' } },
              error:   { iconTheme: { primary: '#f43f5e', secondary: '#ffffff' } },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
