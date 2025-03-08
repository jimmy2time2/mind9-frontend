import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Polyfill Buffer for the browser environment
globalThis.Buffer = Buffer;

// Polyfill process for the browser environment
window.process = window.process || { env: {} };

// Polyfill global for the browser environment
window.global = window.global || window;

// Reset scroll position on page load
window.onload = () => {
  window.scrollTo(0, 0);
};

// Create a custom console.log that doesn't break when objects are too complex
const originalConsoleLog = console.log;
console.log = function(...args) {
  try {
    originalConsoleLog.apply(console, args);
  } catch (e) {
    // If circular reference or other JSON error, try a simpler approach
    originalConsoleLog("Couldn't log complex object:", 
      args.map(arg => 
        typeof arg === 'object' ? '[Complex Object]' : arg
      ).join(' ')
    );
  }
};

// Add global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
  return false;
};

// Add unhandled promise rejection handler
window.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);