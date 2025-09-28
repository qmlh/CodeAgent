/**
 * Browser Panel Component
 * Main browser interface with tabs, navigation, and preview functionality
 */

import React, { useRef, useEffect, useState } from 'react';
import { Tabs, Button, Input, Tooltip, Dropdown, Space, Switch } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  BookOutlined,
  CameraOutlined,
  VideoCameraOutlined,
  BugOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  createTab,
  closeTab,
  setActiveTab,
  updateTab,
  navigateTab,
  toggleDevTools,
  toggleAutoRefresh,
  toggleHotReload,
  setDeviceEmulation,
} from '../../store/slices/browserSlice';
import { DEVICE_PRESETS } from '../../types/browser';
import { BrowserWebView } from './BrowserWebView';
import { DeviceToolbar } from './DeviceToolbar';
import { BookmarkSidebar } from './BookmarkSidebar';
import './BrowserPanel.css';

const { TabPane } = Tabs;

export const BrowserPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tabs, activeTabId, previewSettings } = useAppSelector(state => state.browser);
  const [urlInput, setUrlInput] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const webViewRefs = useRef<{ [key: string]: any }>({});

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
    }
  }, [activeTab]);

  const handleCreateTab = () => {
    const url = 'about:blank';
    dispatch(createTab({ url, title: 'New Tab' }));
  };

  const handleCloseTab = (tabId: string) => {
    dispatch(closeTab(tabId));
  };

  const handleTabChange = (tabId: string) => {
    dispatch(setActiveTab(tabId));
  };

  const handleNavigate = (url?: string) => {
    if (!activeTabId) return;
    
    const targetUrl = url || urlInput;
    if (!targetUrl) return;

    // Add protocol if missing
    let finalUrl = targetUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('file://')) {
      finalUrl = targetUrl.startsWith('localhost') || targetUrl.includes('127.0.0.1') 
        ? `http://${targetUrl}` 
        : `https://${targetUrl}`;
    }

    dispatch(navigateTab({ id: activeTabId, url: finalUrl }));
    setUrlInput(finalUrl);
  };

  const handleRefresh = () => {
    if (!activeTabId || !webViewRefs.current[activeTabId]) return;
    webViewRefs.current[activeTabId].reload();
  };

  const handleGoBack = () => {
    if (!activeTabId || !webViewRefs.current[activeTabId]) return;
    webViewRefs.current[activeTabId].goBack();
  };

  const handleGoForward = () => {
    if (!activeTabId || !webViewRefs.current[activeTabId]) return;
    webViewRefs.current[activeTabId].goForward();
  };

  const handleToggleDevTools = () => {
    if (!activeTabId) return;
    dispatch(toggleDevTools(activeTabId));
  };

  const handleScreenshot = async () => {
    if (!activeTabId || !webViewRefs.current[activeTabId]) return;
    
    try {
      const canvas = await webViewRefs.current[activeTabId].capturePage();
      const dataUrl = canvas.toDataURL('image/png');
      
      // Import screen capture service
      const { screenCaptureService } = await import('../../services/ScreenCaptureService');
      const filename = `screenshot-${activeTab?.title || 'preview'}-${Date.now()}.png`;
      screenCaptureService.downloadCapture(dataUrl, filename);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  };

  const handleStartRecording = async () => {
    if (!activeTabId || !webViewRefs.current[activeTabId]) return;
    
    try {
      const { screenCaptureService } = await import('../../services/ScreenCaptureService');
      const webViewElement = document.querySelector(`webview[data-tab-id="${activeTabId}"]`) as HTMLElement;
      
      if (webViewElement) {
        await screenCaptureService.startRecording(webViewElement, {
          fps: 30,
          format: 'webm',
          includeAudio: false,
        });
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      const { screenCaptureService } = await import('../../services/ScreenCaptureService');
      const videoUrl = await screenCaptureService.stopRecording();
      
      // Create download link
      const link = document.createElement('a');
      link.download = `recording-${activeTab?.title || 'preview'}-${Date.now()}.webm`;
      link.href = videoUrl;
      link.click();
      
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  };

  const deviceMenuItems = DEVICE_PRESETS.map(device => ({
    key: device.name,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {device.name === 'Desktop' && <DesktopOutlined />}
        {device.name === 'Tablet' && <TabletOutlined />}
        {(device.name.includes('Mobile') || device.name === 'Mobile') && <MobileOutlined />}
        <span>{device.name}</span>
        <span style={{ color: '#888', fontSize: '12px' }}>
          {device.width}×{device.height}
        </span>
      </div>
    ),
    onClick: () => {
      dispatch(setDeviceEmulation({
        enabled: true,
        device: device,
      }));
    },
  }));

  const settingsMenuItems = [
    {
      key: 'auto-refresh',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '200px' }}>
          <span>Auto Refresh</span>
          <Switch 
             
            checked={previewSettings.autoRefresh}
            onChange={() => dispatch(toggleAutoRefresh())}
          />
        </div>
      ),
    },
    {
      key: 'hot-reload',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '200px' }}>
          <span>Hot Reload</span>
          <Switch 
             
            checked={previewSettings.hotReload}
            onChange={() => dispatch(toggleHotReload())}
          />
        </div>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'disable-device',
      label: 'Disable Device Emulation',
      onClick: () => {
        dispatch(setDeviceEmulation({
          enabled: false,
          device: DEVICE_PRESETS[0],
        }));
      },
    },
  ];

  if (tabs.length === 0) {
    return (
      <div className="browser-panel-empty">
        <div className="empty-state">
          <h3>Browser Preview</h3>
          <p>Create a new tab to start browsing</p>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTab}>
            New Tab
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="browser-panel">
      {/* Browser Toolbar */}
      <div className="browser-toolbar">
        <div className="navigation-controls">
          <Button
            
            icon={<ArrowLeftOutlined />}
            disabled={!activeTab?.canGoBack}
            onClick={handleGoBack}
            title="Go Back"
          />
          <Button
            
            icon={<ArrowRightOutlined />}
            disabled={!activeTab?.canGoForward}
            onClick={handleGoForward}
            title="Go Forward"
          />
          <Button
            
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            title="Refresh"
          />
        </div>

        <div className="address-bar">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onPressEnter={() => handleNavigate()}
            placeholder="Enter URL or search..."
            style={{ flex: 1 }}
          />
        </div>

        <div className="browser-actions">
          <Tooltip title="Device Emulation">
            <Dropdown menu={{ items: deviceMenuItems }} placement="bottomRight">
              <Button  icon={<MobileOutlined />} />
            </Dropdown>
          </Tooltip>

          <Tooltip title="Developer Tools">
            <Button
              
              icon={<BugOutlined />}
              type={activeTab?.isDevToolsOpen ? 'primary' : 'default'}
              onClick={handleToggleDevTools}
            />
          </Tooltip>

          <Tooltip title="Screenshot">
            <Button  icon={<CameraOutlined />} onClick={handleScreenshot} />
          </Tooltip>

          <Tooltip title={isRecording ? "Stop Recording" : "Start Recording"}>
            <Button 
               
              icon={<VideoCameraOutlined />} 
              type={isRecording ? 'primary' : 'default'}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
            />
          </Tooltip>

          <Tooltip title="Bookmarks">
            <Button
              
              icon={<BookOutlined />}
              type={showBookmarks ? 'primary' : 'default'}
              onClick={() => setShowBookmarks(!showBookmarks)}
            />
          </Tooltip>

          <Tooltip title="Settings">
            <Dropdown menu={{ items: settingsMenuItems }} placement="bottomRight">
              <Button  icon={<SettingOutlined />} />
            </Dropdown>
          </Tooltip>

          <Button  icon={<PlusOutlined />} onClick={handleCreateTab} title="New Tab" />
        </div>
      </div>

      {/* Device Emulation Toolbar */}
      {previewSettings.deviceEmulation.enabled && (
        <DeviceToolbar />
      )}

      {/* Browser Content */}
      <div className="browser-content">
        {showBookmarks && (
          <div className="browser-sidebar">
            <BookmarkSidebar onNavigate={handleNavigate} />
          </div>
        )}

        <div className="browser-main">
          <Tabs
            type="editable-card"
            activeKey={activeTabId || undefined}
            onChange={handleTabChange}
            onEdit={(targetKey, action) => {
              if (action === 'remove' && typeof targetKey === 'string') {
                handleCloseTab(targetKey);
              }
            }}
            className="browser-tabs"
            hideAdd
          >
            {tabs.map(tab => (
              <TabPane
                key={tab.id}
                tab={
                  <div className="browser-tab-title">
                    <span className="tab-favicon">🌐</span>
                    <span className="tab-title">{tab.title}</span>
                    {tab.isLoading && <span className="tab-loading">⟳</span>}
                  </div>
                }
                closable={true}
              >
                <BrowserWebView
                  ref={(ref) => {
                    if (ref) {
                      webViewRefs.current[tab.id] = ref;
                    }
                  }}
                  tab={tab}
                  previewSettings={previewSettings}
                />
              </TabPane>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};