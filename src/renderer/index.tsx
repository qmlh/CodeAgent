/**
 * Renderer process entry point
 * React application for the Multi-Agent IDE
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

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

// Hot module replacement for development
if ((module as any).hot) {
  (module as any).hot.accept('./App', () => {
    const NextApp = require('./App').App;
    root.render(
      <React.StrictMode>
        <NextApp />
      </React.StrictMode>
    );
  });
}