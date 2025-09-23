/**
 * Main Application Component
 * Root component for the Multi-Agent IDE
 */

import React, { useEffect, useState } from 'react';
import { Layout, message } from 'antd';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { MainWorkspace } from './components/layout/MainWorkspace';
import { StatusBar } from './components/layout/StatusBar';
import { useAppDispatch } from './hooks/redux';
import { initializeApp } from './store/slices/appSlice';
import { loadLayoutPreferences, saveLayoutPreferences } from './utils/layoutPersistence';
import { setTheme, setSidebarWidth, setActiveSidebarPanel, loadLayout } from './store/slices/uiSlice';
import './styles/App.css';

const { Content } = Layout;

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize the application
    const initialize = async () => {
      try {
        // Load saved layout preferences
        const savedPreferences = loadLayoutPreferences();
        if (savedPreferences) {
          dispatch(setTheme(savedPreferences.theme));
          dispatch(setSidebarWidth(savedPreferences.sidebarWidth));
          dispatch(setActiveSidebarPanel(savedPreferences.activeSidebarPanel));
          dispatch(loadLayout(savedPreferences.layout));
        }

        // Initialize app state
        await dispatch(initializeApp()).unwrap();
        
        // Set up global event listeners
        setupGlobalEventListeners();
        
        setIsInitialized(true);
        message.success('Multi-Agent IDE initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        message.error('Failed to initialize application');
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      cleanupGlobalEventListeners();
    };
  }, [dispatch]);

  const setupGlobalEventListeners = () => {
    // Listen for menu actions
    window.electronAPI?.onMenuAction((action) => {
      handleMenuAction(action);
    });

    // Listen for tray actions
    window.electronAPI?.onTrayAction((action) => {
      handleTrayAction(action);
    });

    // Listen for window state changes
    window.electronAPI?.window.onStateChanged((state) => {
      console.log('Window state changed:', state);
    });

    // Listen for window focus changes
    window.electronAPI?.window.onFocusChanged((focused) => {
      console.log('Window focus changed:', focused);
    });

    // Listen for file system changes
    window.electronAPI?.fs.onDirectoryChanged((data) => {
      console.log('Directory changed:', data);
      // TODO: Update file explorer
    });
  };

  const cleanupGlobalEventListeners = () => {
    // Remove all listeners
    if (window.electronAPI) {
      window.electronAPI.removeAllListeners('menu-action');
      window.electronAPI.removeAllListeners('tray-action');
      window.electronAPI.removeAllListeners('window-state-changed');
      window.electronAPI.removeAllListeners('window-focus-changed');
      window.electronAPI.removeAllListeners('fs:directory-changed');
    }
  };

  const handleMenuAction = (action: any) => {
    console.log('Menu action:', action);
    
    switch (action.action) {
      case 'new-project':
        // TODO: Handle new project
        message.info('New project action triggered');
        break;
      case 'open-project':
        // TODO: Handle open project
        message.info('Open project action triggered');
        break;
      case 'save':
        // TODO: Handle save
        message.info('Save action triggered');
        break;
      case 'find':
        // TODO: Handle find
        message.info('Find action triggered');
        break;
      case 'toggle-explorer':
        // TODO: Toggle explorer panel
        message.info('Toggle explorer action triggered');
        break;
      case 'toggle-agent-panel':
        // TODO: Toggle agent panel
        message.info('Toggle agent panel action triggered');
        break;
      case 'create-agent':
        // TODO: Create agent
        message.info('Create agent action triggered');
        break;
      default:
        console.log('Unhandled menu action:', action);
    }
  };

  const handleTrayAction = (action: any) => {
    console.log('Tray action:', action);
    handleMenuAction(action); // Reuse menu action handler
  };

  if (!isInitialized) {
    return (
      <Layout className="app-loading">
        <div className="loading-container">
          <div className="loading-spinner" />
          <div className="loading-text">Initializing Multi-Agent IDE...</div>
        </div>
      </Layout>
    );
  }

  return (
    <ThemeProvider>
      <Layout className="app-layout">
        <TitleBar />
        <Layout className="app-content">
          <Sidebar />
          <Layout className="main-layout">
            <Content className="main-content">
              <MainWorkspace />
            </Content>
            <StatusBar />
          </Layout>
        </Layout>
      </Layout>
    </ThemeProvider>
  );
};