/**
 * Renderer process entry point
 * React application for the Multi-Agent IDE
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import { App } from './App';
import { store } from './store/store';
import './styles/global.css';

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
    <Provider store={store}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm, // Default to dark theme
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
            fontSize: 14
          }
        }}
      >
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);

// Hot module replacement for development
if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').App;
    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <ConfigProvider
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#1890ff',
                borderRadius: 6,
                fontSize: 14
              }
            }}
          >
            <NextApp />
          </ConfigProvider>
        </Provider>
      </React.StrictMode>
    );
  });
}