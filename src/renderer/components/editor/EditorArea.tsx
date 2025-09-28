/**
 * Enhanced Editor Area Component
 * Advanced code editing area with split-screen support and enhanced tab management
 * Implements task 17 requirements for Monaco editor optimization
 */

import React, { useState, useCallback, useRef } from 'react';
import { Tabs, Button, Dropdown, Space, Tooltip, Modal, Input, Drawer } from 'antd';
import { 
  CloseOutlined, 
  SplitCellsOutlined, 
  MoreOutlined,
  SearchOutlined,
  SettingOutlined,
  FileTextOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  FormatPainterOutlined,
  ColumnWidthOutlined,
  MenuOutlined as RowHeightOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setActiveFile, closeFile, saveFile } from '../../store/slices/fileSlice';
import { EnhancedMonacoEditor, EnhancedMonacoEditorRef } from './EnhancedMonacoEditor';
import { EnhancedTabManager } from './EnhancedTabManager';
import { SplitScreenEditor } from './SplitScreenEditor';
import { CollaborationVisualization } from './CollaborationVisualization';
import { EditorPersonalization } from './EditorPersonalization';
import type { MenuProps } from 'antd';
import { Layout } from 'antd';

export const EditorArea: React.FC = () => {
  const dispatch = useAppDispatch();
  const { openFiles, activeFile } = useAppSelector(state => state.file);
  
  // Enhanced editor state
  const [editorMode, setEditorMode] = useState<'standard' | 'split' | 'enhanced-tabs'>('enhanced-tabs');
  const [isCollaborationVisible, setIsCollaborationVisible] = useState(false);
  const [isPersonalizationVisible, setIsPersonalizationVisible] = useState(false);
  const [enableAICompletion, setEnableAICompletion] = useState(true);
  const [enablePerformanceMode, setEnablePerformanceMode] = useState(false);
  
  // Search and replace state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isGoToLineVisible, setIsGoToLineVisible] = useState(false);
  const [goToLineValue, setGoToLineValue] = useState('');
  
  // Editor refs for controlling editors
  const editorRefs = useRef<Map<string, EnhancedMonacoEditorRef>>(new Map());

  // Detect large files for performance optimization
  const currentFile = openFiles.find(f => f.path === activeFile);
  const isLargeFile = currentFile ? (currentFile.content?.length || 0) > 100000 : false;

  const handleTabChange = (key: string) => {
    dispatch(setActiveFile(key));
  };

  const handleTabClose = (targetKey: string) => {
    dispatch(closeFile(targetKey));
  };

  const handleSaveFile = async (filePath: string) => {
    const file = openFiles.find(f => f.path === filePath);
    if (file) {
      try {
        await dispatch(saveFile({ filePath, content: file.content })).unwrap();
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  };

  const handleSaveAll = async () => {
    const dirtyFiles = openFiles.filter(f => f.isDirty);
    for (const file of dirtyFiles) {
      await handleSaveFile(file.path);
    }
  };

  const handleCloseAll = () => {
    openFiles.forEach(file => {
      dispatch(closeFile(file.path));
    });
  };

  const handleCloseOthers = (keepFilePath: string) => {
    openFiles.forEach(file => {
      if (file.path !== keepFilePath) {
        dispatch(closeFile(file.path));
      }
    });
  };

  const handleSplitTab = useCallback((filePath: string, direction: 'horizontal' | 'vertical') => {
    setEditorMode('split');
  }, []);

  const handleEditorModeChange = useCallback((mode: typeof editorMode) => {
    setEditorMode(mode);
  }, []);

  const handleGoToLine = () => {
    setIsGoToLineVisible(true);
  };

  const executeGoToLine = () => {
    const lineNumber = parseInt(goToLineValue);
    if (!isNaN(lineNumber) && activeFile) {
      const editorRef = editorRefs.current.get(activeFile);
      if (editorRef) {
        editorRef.revealLine(lineNumber);
        editorRef.focus();
      }
    }
    setIsGoToLineVisible(false);
    setGoToLineValue('');
  };

  const handleFormatDocument = () => {
    if (activeFile) {
      const editorRef = editorRefs.current.get(activeFile);
      if (editorRef) {
        editorRef.format();
      }
    }
  };

  const handleToggleComment = () => {
    if (activeFile) {
      const editorRef = editorRefs.current.get(activeFile);
      if (editorRef) {
        editorRef.toggleComment();
      }
    }
  };

  const handleUndo = () => {
    if (activeFile) {
      const editorRef = editorRefs.current.get(activeFile);
      if (editorRef) {
        editorRef.undo();
      }
    }
  };

  const handleRedo = () => {
    if (activeFile) {
      const editorRef = editorRefs.current.get(activeFile);
      if (editorRef) {
        editorRef.redo();
      }
    }
  };

  const handleSplitHorizontal = () => {
    setEditorMode('split');
    // Additional split logic would go here
  };

  const handleSplitVertical = () => {
    setEditorMode('split');
    // Additional split logic would go here
  };

  // Tab context menu
  const getTabContextMenu = (filePath: string): MenuProps => ({
    items: [
      {
        key: 'save',
        label: 'Save',
        icon: <SaveOutlined />,
        onClick: () => handleSaveFile(filePath),
        disabled: !openFiles.find(f => f.path === filePath)?.isDirty
      },
      {
        key: 'saveAll',
        label: 'Save All',
        icon: <SaveOutlined />,
        onClick: handleSaveAll,
        disabled: !openFiles.some(f => f.isDirty)
      },
      { type: 'divider' },
      {
        key: 'close',
        label: 'Close',
        icon: <CloseOutlined />,
        onClick: () => handleTabClose(filePath)
      },
      {
        key: 'closeOthers',
        label: 'Close Others',
        onClick: () => handleCloseOthers(filePath)
      },
      {
        key: 'closeAll',
        label: 'Close All',
        icon: <CloseCircleOutlined />,
        onClick: handleCloseAll
      },
      { type: 'divider' },
      {
        key: 'splitHorizontal',
        label: 'Split Horizontal',
        icon: <RowHeightOutlined />,
        onClick: handleSplitHorizontal,
        disabled: editorMode !== 'standard'
      },
      {
        key: 'splitVertical',
        label: 'Split Vertical',
        icon: <ColumnWidthOutlined />,
        onClick: handleSplitVertical,
        disabled: editorMode !== 'standard'
      }
    ]
  });

  // Enhanced Editor toolbar
  const EditorToolbar = () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      padding: '4px 8px',
      background: '#2d2d30',
      borderBottom: '1px solid #3e3e42'
    }}>
      <Space >
        {/* Basic editing actions */}
        <Tooltip title="Undo (Ctrl+Z)">
          <Button 
            type="text" 
             
            icon={<UndoOutlined />} 
            onClick={handleUndo}
            disabled={!activeFile}
          />
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y)">
          <Button 
            type="text" 
             
            icon={<RedoOutlined />} 
            onClick={handleRedo}
            disabled={!activeFile}
          />
        </Tooltip>
        <Tooltip title="Format Document (Shift+Alt+F)">
          <Button 
            type="text" 
             
            icon={<FormatPainterOutlined />} 
            onClick={handleFormatDocument}
            disabled={!activeFile}
          />
        </Tooltip>
        <Tooltip title="Find (Ctrl+F)">
          <Button 
            type="text" 
             
            icon={<SearchOutlined />} 
            onClick={() => {
              if (activeFile) {
                const editorRef = editorRefs.current.get(activeFile);
                if (editorRef) {
                  editorRef.find();
                }
              }
            }}
            disabled={!activeFile}
          />
        </Tooltip>
        <Tooltip title="Go to Line (Ctrl+G)">
          <Button 
            type="text" 
             
            icon={<FileTextOutlined />} 
            onClick={handleGoToLine}
            disabled={!activeFile}
          />
        </Tooltip>
      </Space>
      
      <div style={{ flex: 1 }} />
      
      <Space >
        {/* Editor mode switcher */}
        <Dropdown
          menu={{
            items: [
              {
                key: 'enhanced-tabs',
                label: 'Enhanced Tabs',
                onClick: () => handleEditorModeChange('enhanced-tabs')
              },
              {
                key: 'split',
                label: 'Split Screen',
                onClick: () => handleEditorModeChange('split')
              },
              {
                key: 'standard',
                label: 'Standard',
                onClick: () => handleEditorModeChange('standard')
              }
            ]
          }}
        >
          <Tooltip title="Editor Mode">
            <Button 
              type="text" 
               
              icon={<SplitCellsOutlined />}
            />
          </Tooltip>
        </Dropdown>

        {/* AI Completion toggle */}
        <Tooltip title={enableAICompletion ? "Disable AI Completion" : "Enable AI Completion"}>
          <Button 
            type={enableAICompletion ? "primary" : "text"}
             
            icon={<ThunderboltOutlined />} 
            onClick={() => setEnableAICompletion(!enableAICompletion)}
          />
        </Tooltip>

        {/* Performance mode toggle */}
        {isLargeFile && (
          <Tooltip title={enablePerformanceMode ? "Disable Performance Mode" : "Enable Performance Mode"}>
            <Button 
              type={enablePerformanceMode ? "primary" : "text"}
               
              icon={<ThunderboltOutlined />} 
              onClick={() => setEnablePerformanceMode(!enablePerformanceMode)}
            />
          </Tooltip>
        )}

        {/* Collaboration panel */}
        <Tooltip title="Collaboration">
          <Button 
            type={isCollaborationVisible ? "primary" : "text"}
             
            icon={<TeamOutlined />} 
            onClick={() => setIsCollaborationVisible(!isCollaborationVisible)}
          />
        </Tooltip>

        {/* Personalization panel */}
        <Tooltip title="Personalization">
          <Button 
            type={isPersonalizationVisible ? "primary" : "text"}
             
            icon={<SettingOutlined />} 
            onClick={() => setIsPersonalizationVisible(!isPersonalizationVisible)}
          />
        </Tooltip>
      </Space>
    </div>
  );

  // Render editor content based on mode
  const renderEditorContent = () => {
    switch (editorMode) {
      case 'enhanced-tabs':
        return (
          <EnhancedTabManager
            onTabChange={handleTabChange}
            onTabClose={handleTabClose}
            onSplitTab={handleSplitTab}
            enableGrouping={true}
            enableHistory={true}
            enableSearch={true}
          />
        );
      
      case 'split':
        return (
          <SplitScreenEditor
            initialFile={currentFile}
            enableDiffMode={true}
            enableSyncScrolling={true}
            enableGridLayout={true}
          />
        );
      
      case 'standard':
      default:
        if (!currentFile) {
          return (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#888',
              fontSize: '16px'
            }}>
              No files open
            </div>
          );
        }
        
        return (
          <EnhancedMonacoEditor
            file={currentFile}
            onFindReplace={setIsSearchVisible}
            isLargeFile={isLargeFile}
            enableAICompletion={enableAICompletion}
            enablePerformanceMode={enablePerformanceMode}
            ref={(ref: EnhancedMonacoEditorRef | null) => {
              if (ref && currentFile) {
                editorRefs.current.set(currentFile.path, ref);
              }
            }}
          />
        );
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <EditorToolbar />
      
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Main editor area */}
        <div style={{ flex: 1 }}>
          {renderEditorContent()}
        </div>
        
        {/* Collaboration panel */}
        {isCollaborationVisible && (
          <div style={{ 
            width: '300px', 
            borderLeft: '1px solid #3e3e42',
            background: '#252526'
          }}>
            <CollaborationVisualization
              currentFile={activeFile || undefined}
              showHistory={true}
              showConflicts={true}
            />
          </div>
        )}
      </div>
      
      {/* Go to Line Modal */}
      <Modal
        title="Go to Line"
        open={isGoToLineVisible}
        onOk={executeGoToLine}
        onCancel={() => setIsGoToLineVisible(false)}
        width={300}
      >
        <Input
          placeholder="Enter line number"
          value={goToLineValue}
          onChange={(e) => setGoToLineValue(e.target.value)}
          onPressEnter={executeGoToLine}
          autoFocus
        />
      </Modal>

      {/* Personalization Drawer */}
      <Drawer
        title="Editor Personalization"
        placement="right"
        width={600}
        open={isPersonalizationVisible}
        onClose={() => setIsPersonalizationVisible(false)}
      >
        <EditorPersonalization
          onSettingsChange={(settings) => {
            console.log('Settings changed:', settings);
          }}
          onThemeChange={(theme) => {
            console.log('Theme changed:', theme);
          }}
          onShortcutChange={(shortcuts) => {
            console.log('Shortcuts changed:', shortcuts);
          }}
        />
      </Drawer>
    </div>
  );
};