/**
 * Browser Integration Hook
 * Handles browser functionality integration with the IDE
 */

import { useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from './redux';
import { updateTab, navigateTab } from '../store/slices/browserSlice';
import { fileWatcherService, FileChangeEvent } from '../services/FileWatcherService';

export const useBrowserIntegration = () => {
  const dispatch = useAppDispatch();
  const { tabs, activeTabId, previewSettings } = useAppSelector(state => state.browser);
  const { openFiles } = useAppSelector(state => state.file);

  // Handle file changes for hot reload
  const handleFileChange = useCallback((event: FileChangeEvent) => {
    if (!previewSettings.hotReload) return;

    // Find tabs that might be affected by this file change
    const affectedTabs = tabs.filter(tab => {
      // Check if the tab URL is a local file or localhost
      return tab.url.includes('localhost') || tab.url.includes('127.0.0.1') || tab.url.startsWith('file://');
    });

    // Refresh affected tabs
    affectedTabs.forEach(tab => {
      // Send a message to the webview to refresh
      const webview = document.querySelector(`webview[data-tab-id="${tab.id}"]`) as any;
      if (webview) {
        try {
          webview.executeJavaScript(`
            if (window.location.protocol === 'file:' || 
                window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1') {
              window.location.reload();
            }
          `);
        } catch (error) {
          console.warn('Failed to execute JavaScript in webview:', error);
        }
      }
    });
  }, [tabs, previewSettings.hotReload]);

  // Handle style file changes for CSS hot reload
  const handleStyleFileChange = useCallback((event: FileChangeEvent) => {
    if (!previewSettings.hotReload) return;

    const affectedTabs = tabs.filter(tab => 
      tab.url.includes('localhost') || tab.url.includes('127.0.0.1')
    );

    affectedTabs.forEach(tab => {
      const webview = document.querySelector(`webview[data-tab-id="${tab.id}"]`) as any;
      if (webview) {
        try {
          // Hot reload CSS without full page refresh
          webview.executeJavaScript(`
            // Reload all CSS files
            const links = document.querySelectorAll('link[rel="stylesheet"]');
            links.forEach(link => {
              const href = link.href;
              const newHref = href.includes('?') 
                ? href + '&_t=' + Date.now()
                : href + '?_t=' + Date.now();
              link.href = newHref;
            });
            
            // Reload inline styles (for CSS-in-JS)
            const styles = document.querySelectorAll('style');
            styles.forEach(style => {
              if (style.textContent) {
                const content = style.textContent;
                style.textContent = '';
                setTimeout(() => style.textContent = content, 10);
              }
            });
          `);
        } catch (error) {
          console.warn('Failed to hot reload CSS:', error);
        }
      }
    });
  }, [tabs, previewSettings.hotReload]);

  // Set up file watching when hot reload is enabled
  useEffect(() => {
    if (previewSettings.hotReload && openFiles.length > 0) {
      // Watch the workspace directory
      const workspacePaths = openFiles.map(file => {
        const parts = file.path.split('/');
        return parts.slice(0, -1).join('/'); // Get directory path
      });

      // Remove duplicates
      const uniquePaths = [...new Set(workspacePaths)];

      // Start watching directories
      uniquePaths.forEach(path => {
        if (path) {
          fileWatcherService.watchDirectory(path);
        }
      });

      // Set up event listeners
      fileWatcherService.on('file-changed', handleFileChange);
      fileWatcherService.on('style-file-changed', handleStyleFileChange);

      return () => {
        fileWatcherService.off('file-changed', handleFileChange);
        fileWatcherService.off('style-file-changed', handleStyleFileChange);
      };
    }
  }, [previewSettings.hotReload, openFiles, handleFileChange, handleStyleFileChange]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!previewSettings.autoRefresh) return;

    const interval = setInterval(() => {
      // Check if any tabs need refreshing based on file modification times
      tabs.forEach(tab => {
        if (tab.url.includes('localhost') || tab.url.includes('127.0.0.1')) {
          // In a real implementation, you would check file modification times
          // For now, we'll skip automatic refresh to avoid annoying the user
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [previewSettings.autoRefresh, tabs]);

  // Sync scroll functionality (placeholder)
  const syncScroll = useCallback((scrollTop: number, scrollLeft: number) => {
    if (!previewSettings.syncScroll) return;

    // Find all browser tabs and sync their scroll positions
    tabs.forEach(tab => {
      const webview = document.querySelector(`webview[data-tab-id="${tab.id}"]`) as any;
      if (webview && tab.id !== activeTabId) {
        try {
          webview.executeJavaScript(`
            window.scrollTo(${scrollLeft}, ${scrollTop});
          `);
        } catch (error) {
          console.warn('Failed to sync scroll:', error);
        }
      }
    });
  }, [tabs, activeTabId, previewSettings.syncScroll]);

  // Create preview URL for current file
  const createPreviewUrl = useCallback((filePath: string): string => {
    // If it's an HTML file, create a file:// URL
    if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      return `file://${filePath}`;
    }

    // If it's a web project, assume localhost development server
    if (filePath.includes('src') || filePath.includes('public')) {
      return 'http://localhost:3000';
    }

    // Default to localhost
    return 'http://localhost:3000';
  }, []);

  // Open current file in browser
  const openCurrentFileInBrowser = useCallback(() => {
    const currentFile = openFiles.find(file => file.path === activeTabId);
    if (currentFile) {
      const previewUrl = createPreviewUrl(currentFile.path);
      
      // Check if there's already a tab with this URL
      const existingTab = tabs.find(tab => tab.url === previewUrl);
      if (existingTab) {
        dispatch(updateTab({ id: existingTab.id, updates: { isLoading: true } }));
        // Refresh the existing tab
        const webview = document.querySelector(`webview[data-tab-id="${existingTab.id}"]`) as any;
        if (webview) {
          webview.reload();
        }
      } else {
        // Create a new tab
        dispatch(navigateTab({ id: activeTabId || '', url: previewUrl }));
      }
    }
  }, [openFiles, activeTabId, tabs, dispatch, createPreviewUrl]);

  return {
    syncScroll,
    createPreviewUrl,
    openCurrentFileInBrowser,
    isWatchingFiles: fileWatcherService.isActive(),
    watchedDirectories: fileWatcherService.getWatchedDirectories(),
  };
};