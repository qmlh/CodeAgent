/**
 * Main Application Component
 * Root component for the Multi-Agent IDE
 */

import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme, message } from 'antd';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { IDELayout } from './components/layout/IDELayout';
import { CommandPalette, useCommandPaletteShortcut } from './components/system';
import { AccessibilityProvider } from './components/accessibility/AccessibilityProvider';
import { initializeApp } from './store/slices/appSlice';
import { detectSystemTheme } from './store/slices/themeSlice';
import { serviceIntegrationManager } from './services/ServiceIntegrationManager';
import { initializeMockData } from './utils/initializeMockData';
import './styles/global.css';
import './styles/statusbar.css';
import './styles/sidebar.css';
// Layout components are used in IDELayout component

const AppInner: React.FC = () => {
  const dispatch = store.dispatch;

  // Initialize command palette shortcut
  useCommandPaletteShortcut();

  useEffect(() => {
    // Initialize app state
    dispatch(initializeApp());
    dispatch(detectSystemTheme());

    // Set up system theme change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      dispatch(detectSystemTheme());
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [dispatch]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: '#1e1e1e',
          colorBgElevated: '#252526',
          colorText: '#cccccc',
          colorTextSecondary: '#888888',
          colorBorder: '#3e3e42',
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AccessibilityProvider>
        <IDELayout />
        <CommandPalette />
      </AccessibilityProvider>
    </ConfigProvider>
  );
};

export const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Starting Multi-Agent IDE initialization...');
    
    const initializeServices = async () => {
      try {
        // Initialize core services
        console.log('Initializing core services...');
        
        // Check if Electron API is available
        if (window.electronAPI) {
          console.log('Electron API available');
          
          // Test basic functionality
          try {
            const systemInfo = await window.electronAPI.system?.getInfo();
            console.log('System info:', systemInfo);
          } catch (error) {
            console.warn('Failed to get system info:', error);
          }
        } else {
          console.warn('Electron API not available - running in development mode');
        }

        // Initialize service integration manager
        console.log('Initializing service integration...');
        try {
          await serviceIntegrationManager.initialize();
          console.log('Service integration initialized successfully');
        } catch (error) {
          console.warn('Service integration initialization failed:', error);
          // Continue anyway - some features may not work but the UI should still load
        }
        
        // Set up global error handling
        window.addEventListener('unhandledrejection', (event) => {
          console.error('Unhandled promise rejection:', event.reason);
          message.error('An unexpected error occurred');
        });

        // Initialize mock data for development
        if (process.env.NODE_ENV === 'development') {
          console.log('Loading mock data for development...');
          initializeMockData();
        }

        console.log('Multi-Agent IDE initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Multi-Agent IDE:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitialized(true); // Still show the app even if some services fail
      }
    };

    // Add a small delay to show the loading screen
    const timer = setTimeout(initializeServices, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #252526 100%)',
        color: '#cccccc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #333',
            borderTop: '4px solid #1890ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }} />
          <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px', color: '#ffffff' }}>
            Initializing Multi-Agent IDE...
          </div>
          <div style={{ fontSize: '14px', color: '#888', opacity: 0.8 }}>
            Setting up your collaborative development environment
          </div>
          {initError && (
            <div style={{ 
              fontSize: '12px', 
              color: '#ff6b6b', 
              marginTop: '16px',
              padding: '8px',
              background: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 107, 107, 0.2)'
            }}>
              Warning: {initError}
            </div>
          )}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  );
};