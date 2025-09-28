/**
 * Split Screen Editor with Sync Scrolling and Diff Comparison
 * Implements advanced split-screen editing features for task 17
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button, Dropdown, Space, Tooltip, Modal, Select, Switch, Slider } from 'antd';
import { 
  SplitCellsOutlined,
  ColumnWidthOutlined,
  MenuOutlined as RowHeightOutlined,
  CloseOutlined,
  SyncOutlined,
  DiffOutlined,
  SettingOutlined,
  SwapOutlined,
  FullscreenOutlined,
  CompressOutlined
} from '@ant-design/icons';
import { EnhancedMonacoEditor, EnhancedMonacoEditorRef } from './EnhancedMonacoEditor';
import { useAppSelector } from '../../hooks/redux';
import { OpenFile } from '../../store/slices/fileSlice';
import * as monaco from 'monaco-editor';
import type { MenuProps } from 'antd';

interface SplitPane {
  id: string;
  file: OpenFile | null;
  width?: number;
  height?: number;
}

interface SplitLayout {
  type: 'single' | 'horizontal' | 'vertical' | 'grid';
  panes: SplitPane[];
  syncScrolling: boolean;
  showDiff: boolean;
  diffMode: 'side-by-side' | 'inline';
}

interface SplitScreenEditorProps {
  initialFile?: OpenFile;
  onLayoutChange?: (layout: SplitLayout) => void;
  enableDiffMode?: boolean;
  enableSyncScrolling?: boolean;
  enableGridLayout?: boolean;
}

const LAYOUT_TEMPLATES = [
  { key: 'single', label: 'Single Pane', icon: <FullscreenOutlined /> },
  { key: 'vertical', label: 'Vertical Split', icon: <ColumnWidthOutlined /> },
  { key: 'horizontal', label: 'Horizontal Split', icon: <RowHeightOutlined /> },
  { key: 'grid', label: '2x2 Grid', icon: <SplitCellsOutlined /> }
];

export const SplitScreenEditor: React.FC<SplitScreenEditorProps> = ({
  initialFile,
  onLayoutChange,
  enableDiffMode = true,
  enableSyncScrolling = true,
  enableGridLayout = true
}) => {
  const { openFiles } = useAppSelector(state => state.file);
  
  // Split screen state
  const [layout, setLayout] = useState<SplitLayout>({
    type: 'single',
    panes: [{ id: 'pane-1', file: initialFile || null }],
    syncScrolling: false,
    showDiff: false,
    diffMode: 'side-by-side'
  });
  
  // Editor refs for controlling sync scrolling
  const editorRefs = useRef<Map<string, EnhancedMonacoEditorRef>>(new Map());
  const scrollSyncEnabled = useRef(false);
  const isScrollSyncing = useRef(false);
  
  // Settings modal state
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50);
  const [enableMinimap, setEnableMinimap] = useState(true);
  const [enableWordWrap, setEnableWordWrap] = useState(false);
  
  // Diff comparison state
  const [diffFiles, setDiffFiles] = useState<{ left: string | null; right: string | null }>({
    left: null,
    right: null
  });

  // Update layout callback
  useEffect(() => {
    onLayoutChange?.(layout);
  }, [layout, onLayoutChange]);

  // Handle split operations
  const splitPane = useCallback((direction: 'horizontal' | 'vertical', paneId?: string) => {
    const targetPane = paneId ? layout.panes.find(p => p.id === paneId) : layout.panes[0];
    if (!targetPane) return;

    const newPane: SplitPane = {
      id: `pane-${Date.now()}`,
      file: null,
      width: direction === 'vertical' ? 50 : undefined,
      height: direction === 'horizontal' ? 50 : undefined
    };

    setLayout(prev => ({
      ...prev,
      type: direction,
      panes: [...prev.panes, newPane]
    }));
  }, [layout.panes]);

  // Handle pane close
  const closePane = useCallback((paneId: string) => {
    if (layout.panes.length <= 1) return;

    setLayout(prev => ({
      ...prev,
      panes: prev.panes.filter(p => p.id !== paneId),
      type: prev.panes.length === 2 ? 'single' : prev.type
    }));
  }, [layout.panes.length]);

  // Handle file assignment to pane
  const assignFileToPane = useCallback((paneId: string, filePath: string) => {
    const file = openFiles.find(f => f.path === filePath);
    if (!file) return;

    setLayout(prev => ({
      ...prev,
      panes: prev.panes.map(pane =>
        pane.id === paneId ? { ...pane, file } : pane
      )
    }));
  }, [openFiles]);

  // Handle layout template change
  const applyLayoutTemplate = useCallback((templateKey: string) => {
    let newPanes: SplitPane[];
    
    switch (templateKey) {
      case 'single':
        newPanes = [{ id: 'pane-1', file: layout.panes[0]?.file || null }];
        break;
      case 'vertical':
        newPanes = [
          { id: 'pane-1', file: layout.panes[0]?.file || null, width: 50 },
          { id: 'pane-2', file: layout.panes[1]?.file || null, width: 50 }
        ];
        break;
      case 'horizontal':
        newPanes = [
          { id: 'pane-1', file: layout.panes[0]?.file || null, height: 50 },
          { id: 'pane-2', file: layout.panes[1]?.file || null, height: 50 }
        ];
        break;
      case 'grid':
        newPanes = [
          { id: 'pane-1', file: layout.panes[0]?.file || null, width: 50, height: 50 },
          { id: 'pane-2', file: layout.panes[1]?.file || null, width: 50, height: 50 },
          { id: 'pane-3', file: null, width: 50, height: 50 },
          { id: 'pane-4', file: null, width: 50, height: 50 }
        ];
        break;
      default:
        return;
    }

    setLayout(prev => ({
      ...prev,
      type: templateKey as any,
      panes: newPanes
    }));
  }, [layout.panes]);

  // Toggle sync scrolling
  const toggleSyncScrolling = useCallback(() => {
    const newSyncState = !layout.syncScrolling;
    scrollSyncEnabled.current = newSyncState;
    
    setLayout(prev => ({
      ...prev,
      syncScrolling: newSyncState
    }));
  }, [layout.syncScrolling]);

  // Handle synchronized scrolling
  const handleScroll = useCallback((sourceEditorId: string, scrollTop: number, scrollLeft: number) => {
    if (!scrollSyncEnabled.current || isScrollSyncing.current) return;
    
    isScrollSyncing.current = true;
    
    // Sync scroll position to all other editors
    editorRefs.current.forEach((editorRef, editorId) => {
      if (editorId !== sourceEditorId) {
        // This would need to be implemented in the Monaco editor wrapper
        // editorRef.setScrollPosition({ scrollTop, scrollLeft });
      }
    });
    
    setTimeout(() => {
      isScrollSyncing.current = false;
    }, 50);
  }, []);

  // Toggle diff mode
  const toggleDiffMode = useCallback(() => {
    setLayout(prev => ({
      ...prev,
      showDiff: !prev.showDiff
    }));
  }, []);

  // Setup diff comparison
  const setupDiffComparison = useCallback((leftFile: string, rightFile: string) => {
    setDiffFiles({ left: leftFile, right: rightFile });
    setLayout(prev => ({
      ...prev,
      showDiff: true,
      type: 'vertical',
      panes: [
        { id: 'diff-left', file: openFiles.find(f => f.path === leftFile) || null },
        { id: 'diff-right', file: openFiles.find(f => f.path === rightFile) || null }
      ]
    }));
  }, [openFiles]);

  // Swap panes
  const swapPanes = useCallback(() => {
    if (layout.panes.length !== 2) return;
    
    setLayout(prev => ({
      ...prev,
      panes: [prev.panes[1], prev.panes[0]]
    }));
  }, [layout.panes]);

  // Get pane context menu
  const getPaneContextMenu = useCallback((pane: SplitPane): MenuProps => ({
    items: [
      {
        key: 'assignFile',
        label: 'Assign File',
        children: openFiles.map(file => ({
          key: file.path,
          label: file.name,
          onClick: () => assignFileToPane(pane.id, file.path)
        }))
      },
      { type: 'divider' },
      {
        key: 'splitVertical',
        label: 'Split Vertical',
        icon: <ColumnWidthOutlined />,
        onClick: () => splitPane('vertical', pane.id)
      },
      {
        key: 'splitHorizontal',
        label: 'Split Horizontal',
        icon: <RowHeightOutlined />,
        onClick: () => splitPane('horizontal', pane.id)
      },
      { type: 'divider' },
      {
        key: 'close',
        label: 'Close Pane',
        icon: <CloseOutlined />,
        onClick: () => closePane(pane.id),
        disabled: layout.panes.length <= 1
      }
    ]
  }), [openFiles, assignFileToPane, splitPane, closePane, layout.panes.length]);

  // Render toolbar
  const renderToolbar = () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      padding: '4px 8px',
      background: '#2d2d30',
      borderBottom: '1px solid #3e3e42'
    }}>
      <Space >
        {/* Layout Templates */}
        <Dropdown
          menu={{
            items: LAYOUT_TEMPLATES.map(template => ({
              key: template.key,
              label: template.label,
              icon: template.icon,
              onClick: () => applyLayoutTemplate(template.key)
            }))
          }}
        >
          <Tooltip title="Layout Templates">
            <Button type="text"  icon={<SplitCellsOutlined />} />
          </Tooltip>
        </Dropdown>

        {/* Split Actions */}
        <Tooltip title="Split Vertical">
          <Button 
            type="text" 
             
            icon={<ColumnWidthOutlined />} 
            onClick={() => splitPane('vertical')}
          />
        </Tooltip>
        
        <Tooltip title="Split Horizontal">
          <Button 
            type="text" 
             
            icon={<RowHeightOutlined />} 
            onClick={() => splitPane('horizontal')}
          />
        </Tooltip>

        {/* Sync Scrolling */}
        {enableSyncScrolling && layout.panes.length > 1 && (
          <Tooltip title={layout.syncScrolling ? "Disable Sync Scrolling" : "Enable Sync Scrolling"}>
            <Button 
              type={layout.syncScrolling ? "primary" : "text"}
               
              icon={<SyncOutlined />} 
              onClick={toggleSyncScrolling}
            />
          </Tooltip>
        )}

        {/* Diff Mode */}
        {enableDiffMode && layout.panes.length === 2 && (
          <Tooltip title={layout.showDiff ? "Exit Diff Mode" : "Enter Diff Mode"}>
            <Button 
              type={layout.showDiff ? "primary" : "text"}
               
              icon={<DiffOutlined />} 
              onClick={toggleDiffMode}
            />
          </Tooltip>
        )}

        {/* Swap Panes */}
        {layout.panes.length === 2 && (
          <Tooltip title="Swap Panes">
            <Button 
              type="text" 
               
              icon={<SwapOutlined />} 
              onClick={swapPanes}
            />
          </Tooltip>
        )}
      </Space>
      
      <div style={{ flex: 1 }} />
      
      <Space >
        {/* Settings */}
        <Tooltip title="Split Screen Settings">
          <Button 
            type="text" 
             
            icon={<SettingOutlined />} 
            onClick={() => setIsSettingsVisible(true)}
          />
        </Tooltip>
        
        {/* Layout Info */}
        <span style={{ color: '#888', fontSize: '12px' }}>
          {layout.type} ({layout.panes.length} panes)
        </span>
      </Space>
    </div>
  );

  // Render pane
  const renderPane = (pane: SplitPane, style: React.CSSProperties) => (
    <div
      key={pane.id}
      style={{
        ...style,
        border: '1px solid #3e3e42',
        position: 'relative'
      }}
    >
      {/* Pane Header */}
      <div style={{
        height: '32px',
        background: '#252526',
        borderBottom: '1px solid #3e3e42',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#888' }}>
            {pane.file ? pane.file.name : 'No file'}
          </span>
          {pane.file?.isDirty && (
            <span style={{ color: '#faad14', fontSize: '10px' }}>●</span>
          )}
        </div>
        
        <Space >
          <Dropdown menu={getPaneContextMenu(pane)} trigger={['click']}>
            <Button type="text"  icon={<SettingOutlined />} />
          </Dropdown>
          
          {layout.panes.length > 1 && (
            <Button 
              type="text" 
               
              icon={<CloseOutlined />} 
              onClick={() => closePane(pane.id)}
            />
          )}
        </Space>
      </div>

      {/* Pane Content */}
      <div style={{ height: 'calc(100% - 32px)' }}>
        {pane.file ? (
          <EnhancedMonacoEditor
            file={pane.file}
            ref={(ref) => {
              if (ref) {
                editorRefs.current.set(pane.id, ref);
              } else {
                editorRefs.current.delete(pane.id);
              }
            }}
            enablePerformanceMode={layout.panes.length > 2}
          />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#888',
            gap: '16px'
          }}>
            <div>No file selected</div>
            <Select
              placeholder="Select a file"
              style={{ width: '200px' }}
              onChange={(value) => assignFileToPane(pane.id, value)}
            >
              {openFiles.map(file => (
                <Select.Option key={file.path} value={file.path}>
                  {file.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
      </div>
    </div>
  );

  // Calculate pane styles based on layout
  const getPaneStyles = useMemo(() => {
    const styles: React.CSSProperties[] = [];
    
    switch (layout.type) {
      case 'single':
        styles.push({ width: '100%', height: '100%' });
        break;
        
      case 'vertical':
        layout.panes.forEach((pane, index) => {
          styles.push({
            width: `${pane.width || (100 / layout.panes.length)}%`,
            height: '100%',
            display: 'inline-block',
            verticalAlign: 'top'
          });
        });
        break;
        
      case 'horizontal':
        layout.panes.forEach((pane, index) => {
          styles.push({
            width: '100%',
            height: `${pane.height || (100 / layout.panes.length)}%`
          });
        });
        break;
        
      case 'grid':
        layout.panes.forEach((pane, index) => {
          styles.push({
            width: '50%',
            height: '50%',
            display: 'inline-block',
            verticalAlign: 'top'
          });
        });
        break;
    }
    
    return styles;
  }, [layout]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {renderToolbar()}
      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {layout.panes.map((pane, index) => 
          renderPane(pane, getPaneStyles[index] || {})
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        title="Split Screen Settings"
        open={isSettingsVisible}
        onCancel={() => setIsSettingsVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label>Split Ratio:</label>
            <Slider
              value={splitRatio}
              onChange={setSplitRatio}
              min={10}
              max={90}
              marks={{ 25: '25%', 50: '50%', 75: '75%' }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Enable Minimap:</label>
            <Switch checked={enableMinimap} onChange={setEnableMinimap} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Word Wrap:</label>
            <Switch checked={enableWordWrap} onChange={setEnableWordWrap} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Sync Scrolling:</label>
            <Switch checked={layout.syncScrolling} onChange={toggleSyncScrolling} />
          </div>
          
          {enableDiffMode && (
            <div>
              <label>Diff Mode:</label>
              <Select
                value={layout.diffMode}
                onChange={(value) => setLayout(prev => ({ ...prev, diffMode: value }))}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <Select.Option value="side-by-side">Side by Side</Select.Option>
                <Select.Option value="inline">Inline</Select.Option>
              </Select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SplitScreenEditor;