import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

// Suppress Vite WebSocket connection errors and Firestore BloomFilter warnings in console
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const str = String(args[0] || '') + ' ' + String(args[1] || '');
  if (str.includes('BloomFilter') || str.includes('WebSocket') || str.includes('[vite]') || str.includes('closed without opened')) {
    return;
  }
  originalConsoleWarn(...args);
};

const originalConsoleError = console.error;
console.error = (...args) => {
  const str = String(args[0] || '') + ' ' + String(args[1] || '');
  if (str.includes('WebSocket') || str.includes('[vite]') || str.includes('closed without opened') || str.includes('BloomFilter')) {
    return;
  }
  originalConsoleError(...args);
};

// Suppress MetaMask and WebSocket unhandled rejection errors
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = event.reason?.message || event.reason?.name || String(event.reason) || '';
  if (
    reasonStr.toLowerCase().includes('metamask') || 
    reasonStr.toLowerCase().includes('websocket') ||
    reasonStr.toLowerCase().includes('vite') ||
    reasonStr.includes('closed without opened') ||
    reasonStr.includes('BloomFilter')
  ) {
    event.preventDefault(); 
    event.stopImmediatePropagation();
  }
}, { capture: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
