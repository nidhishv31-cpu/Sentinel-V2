import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

// Apply theme from localStorage before first render to avoid flash
const stored = localStorage.getItem('scanner-theme');
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    const theme = parsed?.state?.theme;
    const resolved = parsed?.state?.resolvedTheme;
    if (resolved === 'dark' || (theme === 'dark') || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (_) {}
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
