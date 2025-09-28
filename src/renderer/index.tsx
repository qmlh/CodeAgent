/**
 * Renderer process entry point
 * React application for the Multi-Agent IDE
 */

/**
 * Renderer process entry point
 * React application for the Multi-Agent IDE
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { MinimalApp as App } from './MinimalApp';

// Add global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (event.error && event.error.message && event.error.message.includes('Object.values')) {
    console.error('Object.values error detected:', event.error.stack);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Override Object.values to add debugging
const originalObjectValues = Object.values;
Object.values = function(obj) {
  if (obj === null || obj === undefined) {
    console.error('Object.values called with null/undefined:', obj);
    console.trace('Stack trace:');
    return [];
  }
  return originalObjectValues.call(this, obj);
};

// Initialize app
async function initializeApp() {
  console.log('Initializing Multi-Agent IDE...');

  // Get the root element
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }

  // Create React root
  const root = createRoot(container);

  // Render the application
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log('Multi-Agent IDE initialized successfully');
}

// Start the application
initializeApp().catch(error => {
  console.error('Failed to initialize application:', error);
});