/**
 * Simple test entry point to diagnose rendering issues
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

const TestApp: React.FC = () => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1f1f1f',
      color: '#cccccc',
      fontSize: '24px'
    }}>
      <div>
        <h1>Multi-Agent IDE Test</h1>
        <p>If you can see this, React is working!</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

// Get the root element
const container = document.getElementById('root');
if (!container) {
  console.error('Root element not found');
} else {
  console.log('Root element found, creating React root...');
  
  // Create React root
  const root = createRoot(container);
  
  console.log('Rendering test app...');
  
  // Render the test application
  root.render(<TestApp />);
  
  console.log('Test app rendered successfully');
}