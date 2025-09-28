/**
 * Browser WebView Component
 * Handles the actual web content rendering and interaction
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Spin } from 'antd';
import { useAppDispatch } from '../../hooks/redux';
import { updateTab } from '../../store/slices/browserSlice';
import { BrowserTab, PreviewSettings } from '../../types/browser';

interface BrowserWebViewProps {
  tab: BrowserTab;
  previewSettings: PreviewSettings;
}

export interface BrowserWebViewRef {
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
  capturePage: () => Promise<HTMLCanvasElement>;
  executeJavaScript: (code: string) => Promise<any>;
}

export const BrowserWebView = forwardRef<BrowserWebViewRef, BrowserWebViewProps>(
  ({ tab, previewSettings }, ref) => {
    const dispatch = useAppDispatch();
    const webViewRef = useRef<HTMLWebViewElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      reload: () => {
        if (webViewRef.current) {
          if (process.env.NODE_ENV === 'development') {
            // For iframe in development
            (webViewRef.current as any).src = (webViewRef.current as any).src;
          } else {
            // For webview in production
            (webViewRef.current as any).reload();
          }
        }
      },
      goBack: () => {
        if (webViewRef.current) {
          if (process.env.NODE_ENV === 'development') {
            // For iframe, use history API
            try {
              (webViewRef.current as any).contentWindow?.history.back();
            } catch (error) {
              console.warn('Cannot go back in iframe:', error);
            }
          } else {
            // For webview
            const webview = webViewRef.current as any;
            if (webview.canGoBack && webview.canGoBack()) {
              webview.goBack();
            }
          }
        }
      },
      goForward: () => {
        if (webViewRef.current) {
          if (process.env.NODE_ENV === 'development') {
            // For iframe, use history API
            try {
              (webViewRef.current as any).contentWindow?.history.forward();
            } catch (error) {
              console.warn('Cannot go forward in iframe:', error);
            }
          } else {
            // For webview
            const webview = webViewRef.current as any;
            if (webview.canGoForward && webview.canGoForward()) {
              webview.goForward();
            }
          }
        }
      },
      capturePage: async () => {
        if (!webViewRef.current) {
          throw new Error('WebView not available');
        }
        
        const { screenCaptureService } = await import('../../services/ScreenCaptureService');
        const dataUrl = await screenCaptureService.captureScreenshot(
          webViewRef.current as HTMLElement,
          { type: 'viewport', format: 'png' }
        );
        
        // Convert data URL to canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise((resolve, reject) => {
          img.onload = () => {
            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(canvas);
          };
          img.onerror = reject;
          img.src = dataUrl;
        });
      },
      executeJavaScript: async (code: string) => {
        if (webViewRef.current) {
          if (process.env.NODE_ENV === 'development') {
            // For iframe, execute in content window
            try {
              return (webViewRef.current as any).contentWindow?.eval(code);
            } catch (error) {
              console.warn('Cannot execute JavaScript in iframe:', error);
              throw error;
            }
          } else {
            // For webview
            return (webViewRef.current as any).executeJavaScript(code);
          }
        }
        throw new Error('WebView not available');
      },
    }));

    useEffect(() => {
      const webView = webViewRef.current;
      if (!webView) return;

      const handleLoadStart = () => {
        dispatch(updateTab({
          id: tab.id,
          updates: { isLoading: true }
        }));
      };

      const handleLoadStop = () => {
        dispatch(updateTab({
          id: tab.id,
          updates: { 
            isLoading: false,
            canGoBack: process.env.NODE_ENV === 'development' ? false : (webView as any).canGoBack?.() || false,
            canGoForward: process.env.NODE_ENV === 'development' ? false : (webView as any).canGoForward?.() || false
          }
        }));
      };

      const handleTitleUpdated = (event: any) => {
        dispatch(updateTab({
          id: tab.id,
          updates: { title: event.title }
        }));
      };

      const handleNavigate = (event: any) => {
        dispatch(updateTab({
          id: tab.id,
          updates: { url: event.url }
        }));
      };

      const handleDomReady = () => {
        // Apply device emulation if enabled
        if (previewSettings.deviceEmulation.enabled) {
          const { device } = previewSettings.deviceEmulation;
          const executeJS = process.env.NODE_ENV === 'development' 
            ? (code: string) => {
                try {
                  (webView as any).contentWindow?.eval(code);
                } catch (error) {
                  console.warn('Failed to execute device emulation script:', error);
                }
              }
            : (code: string) => (webView as any).executeJavaScript(code);

          executeJS(`
            // Set viewport meta tag for responsive design
            let viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
              viewport = document.createElement('meta');
              viewport.name = 'viewport';
              document.head.appendChild(viewport);
            }
            viewport.content = 'width=${device.width}, initial-scale=${1 / device.pixelRatio}';
            
            // Add device class to body for CSS targeting
            document.body.classList.add('device-${device.name.toLowerCase()}');
            
            // Simulate touch events if device supports touch
            if (${device.touch}) {
              document.body.classList.add('touch-device');
            }
          `);
        }

        // Inject hot reload script if enabled
        if (previewSettings.hotReload) {
          const executeJS = process.env.NODE_ENV === 'development' 
            ? (code: string) => {
                try {
                  (webView as any).contentWindow?.eval(code);
                } catch (error) {
                  console.warn('Failed to execute hot reload script:', error);
                }
              }
            : (code: string) => (webView as any).executeJavaScript(code);

          executeJS(`
            // Hot reload functionality
            if (!window.__hotReloadInjected) {
              window.__hotReloadInjected = true;
              
              // Listen for file changes from the IDE
              window.addEventListener('message', (event) => {
                if (event.data.type === 'file-changed') {
                  location.reload();
                }
              });
              
              // Periodic check for changes (fallback)
              setInterval(() => {
                fetch(location.href, { method: 'HEAD' })
                  .then(response => {
                    const lastModified = response.headers.get('last-modified');
                    if (lastModified && window.__lastModified && lastModified !== window.__lastModified) {
                      location.reload();
                    }
                    window.__lastModified = lastModified;
                  })
                  .catch(() => {});
              }, 2000);
            }
          `);
        }
      };

      // Add event listeners
      webView.addEventListener('did-start-loading', handleLoadStart);
      webView.addEventListener('did-stop-loading', handleLoadStop);
      webView.addEventListener('page-title-updated', handleTitleUpdated);
      webView.addEventListener('will-navigate', handleNavigate);
      webView.addEventListener('dom-ready', handleDomReady);

      return () => {
        webView.removeEventListener('did-start-loading', handleLoadStart);
        webView.removeEventListener('did-stop-loading', handleLoadStop);
        webView.removeEventListener('page-title-updated', handleTitleUpdated);
        webView.removeEventListener('will-navigate', handleNavigate);
        webView.removeEventListener('dom-ready', handleDomReady);
      };
    }, [tab.id, dispatch, previewSettings]);

    // Apply device emulation styles
    const getWebViewStyle = () => {
      const baseStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        border: 'none',
        background: '#fff',
      };

      if (previewSettings.deviceEmulation.enabled) {
        const { device } = previewSettings.deviceEmulation;
        return {
          ...baseStyle,
          width: `${device.width}px`,
          height: `${device.height}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          margin: '0 auto',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          borderRadius: device.name.includes('Mobile') ? '20px' : '8px',
        };
      }

      return baseStyle;
    };

    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: previewSettings.deviceEmulation.enabled ? '#f0f0f0' : 'transparent',
      overflow: 'auto',
      position: 'relative',
    };

    return (
      <div ref={containerRef} style={containerStyle}>
        {tab.isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}>
            <Spin size="large" />
          </div>
        )}
        
        {/* For development, we'll use an iframe instead of webview */}
        {process.env.NODE_ENV === 'development' ? (
          <iframe
            ref={webViewRef as any}
            src={tab.url === 'about:blank' ? '' : tab.url}
            style={getWebViewStyle()}
            onLoad={() => {
              dispatch(updateTab({
                id: tab.id,
                updates: { isLoading: false }
              }));
            }}
            title={tab.title}
            data-tab-id={tab.id}
          />
        ) : (
          <webview
            ref={webViewRef}
            src={tab.url}
            style={getWebViewStyle()}
            nodeintegration={false}
            security="restricted"
            allowpopups={false}
            data-tab-id={tab.id}
          />
        )}
      </div>
    );
  }
);