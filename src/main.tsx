import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

// Suppress Vite WebSocket connection errors in console
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('WebSocket') || args[0].includes('[vite]') || args[0].includes('closed without opened'))) {
    return;
  }
  originalConsoleError(...args);
};

// Suppress MetaMask and WebSocket unhandled rejection errors
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = event.reason?.message || String(event.reason) || '';
  if (typeof reasonStr === 'string' && (
      reasonStr.toLowerCase().includes('metamask') || 
      reasonStr.toLowerCase().includes('websocket') ||
      reasonStr.toLowerCase().includes('vite') ||
      reasonStr.includes('closed without opened') ||
      reasonStr.includes('WebSocket')
  )) {
    event.preventDefault(); 
    event.stopImmediatePropagation();
  }
}, { capture: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
