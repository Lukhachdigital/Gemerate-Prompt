import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// --- POLYFILL FOR GITHUB PAGES / VITE BUILDS ---
// Many libraries expect 'process.env' to exist. This prevents "process is not defined" crashes.
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = { env: {} };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);