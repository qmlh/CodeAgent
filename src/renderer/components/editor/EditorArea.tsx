/**
 * Enhanced Editor Area Component
 * Advanced code editing area with split-screen support and enhanced tab management
 */

import React, { useState, useCallback, useRef } from 'react';
import { Tabs, Button, Dropdown, Space, Tooltip, Modal, Input } from 'antd';
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
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setActiveFile, closeFile, saveFile } from '../../store/slices/fileSlice';
import { CodeEditor, CodeEditorRef } from './CodeEditor';
import type { MenuProps } from 'antd';

interface EditorGroup {
  id: string;
  files: string[];
  activeFile: string | null;
}

interface SplitLayout {
  type: 'single' | 'horizontal' | 'vertical';
  groups: EditorGroup[];
}

export const EditorArea: React.FC = () => {
  const dispatch = useAppDispatch();
  const { openFiles, activeFile } = useAppSelector(state => state.file);
  
  // Split screen state
  const [layout, setLayout] = useState<SplitLayout>({
    type: 'single',
    groups: [{ id: 'main', files: [], activeFile: null }]
  });
  
  // Search and replace state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isGoToLineVisible, setIsGoToLineVisible] = useState(false);
  const [goToLineValue, setGoToLineValue] = useState('');
  
  // Editor refs for controlling editors
  const editorRefs = useRef<Map<string, CodeEditorRef>>(new Map());

  // Update layout when files change
  React.useEffect(() => {
    const mainGroup = layout.groups[0];
    const allOpenFilePaths = openFiles.map(f => f.path);
    
    // Update main group files
    setLayout(prev => ({
      ...prev,
      groups: prev.groups.map(group => 
        group.id === 'main' 
          ? { 
              ...group, 
              files: allOpenFilePaths,
              activeFile: activeFile 
            }
          : group
      )
    }));
  }, [openFiles, activeFile, layout.groups]);

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

  const handleSplitHorizontal = () => {
    if (layout.type === 'single' && activeFile) {
      setLayout({
        type: 'horizontal',
        groups: [
          { id: 'top', files: [activeFile], activeFile },
          { id: 'bottom', files: [], activeFile: null }
        ]
      });
    }
  };

  const handleSplitVertical = () => {
    if (layout.type === 'single' && activeFile) {
      setLayout({
        type: 'vertical',
        groups: [
          { id: 'left', files: [activeFile], activeFile },
          { id: 'right', files: [], activeFile: null }
        ]
      });
    }
  };

  const handleCloseSplit = () => {
    setLayout({
      type: 'single',
      groups: [{ id: 'main', files: openFiles.map(f => f.path), activeFile }]
    });
  };

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
        disabled: layout.type !== 'single'
      },
      {
        key: 'splitVertical',
        label: 'Split Vertical',
        icon: <ColumnWidthOutlined />,
        onClick: handleSplitVertical,
        disabled: layout.type !== 'single'
      }
    ]
  });

  // Editor toolbar
  const EditorToolbar = () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      padding: '4px 8px',
      background: '#2d2d30',
      borderBottom: '1px solid #3e3e42'
    }}>
      <Space size="small">
        <Tooltip title="Undo (Ctrl+Z)">
          <Button 
            type="text" 
            size="small" 
            icon={<UndoOutlined />} 
            onClick={handleUndo}
            disabled={!activeFile}
          />
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y)">
          <Button 
            type="text" 
            size="small" 
            icon={<RedoOutlined />} 
            onClick={handleRedo}
            disabled={!activeFile}
          />
        </Tooltip>
        <Tooltip title="Format Document (Shift+Alt+F)">
          <Button 
            type="text" 
            size="small" 
            icon={<FormatPainterOutlined />} 
            onClick={handleFormatDocument}
            disabled={!activeFile}
          />
        </Tooltip>
        <Tooltip title="Find (Ctrl+F)">
          <Button 
            type="text" 
            size="small" 
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
            size="small" 
            icon={<FileTextOutlined />} 
            onClick={handleGoToLine}
            disabled={!activeFile}
          />
        </Tooltip>
      </Space>
      
      <div style={{ flex: 1 }} />
      
      <Space size="small">
        {layout.type !== 'single' && (
          <Tooltip title="Close Split">
            <Button 
              type="text" 
              size="small" 
              icon={<CloseOutlined />} 
              onClick={handleCloseSplit}
            />
          </Tooltip>
        )}
        <Tooltip title="Split Horizontal">
          <Button 
            type="text" 
            size="small" 
            icon={<RowHeightOutlined />} 
            onClick={handleSplitHorizontal}
            disabled={layout.type !== 'single' || !activeFile}
          />
        </Tooltip>
        <Tooltip title="Split Vertical">
          <Button 
            type="text" 
            size="small" 
            icon={<ColumnWidthOutlined />} 
            onClick={handleSplitVertical}
            disabled={layout.type !== 'single' || !activeFile}
          />
        </Tooltip>
      </Space>
    </div>
  );

  const renderTabLabel = (file: any) => (
    <Dropdown menu={getTabContextMenu(file.path)} trigger={['contextMenu']}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {file.isReadonly && (
          <Tooltip title="File is locked by another agent">
            <span style={{ color: '#ff4d4f', fontSize: '12px' }}>🔒</span>
          </Tooltip>
        )}
        <span>{file.name}</span>
        {file.isDirty && (
          <Tooltip title="Unsaved changes">
            <span style={{ color: '#faad14' }}>●</span>
          </Tooltip>
        )}
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleTabClose(file.path);
          }}
          style={{ 
            width: '16px', 
            height: '16px', 
            minWidth: '16px',
            padding: 0,
            color: '#888'
          }}
        />
      </div>
    </Dropdown>
  );

  const renderEditor = (groupId: string, files: string[], activeFileInGroup: string | null) => {
    const groupFiles = files.map(filePath => 
      openFiles.find(f => f.path === filePath)
    ).filter(Boolean);

    if (groupFiles.length === 0) {
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

    const tabItems = groupFiles.map(file => ({
      key: file!.path,
      label: renderTabLabel(file!),
      children: (
        <CodeEditor 
          file={file!} 
          onFindReplace={setIsSearchVisible}
          ref={(ref: CodeEditorRef | null) => {
            if (ref) {
              editorRefs.current.set(file!.path, ref);
            } else {
              editorRefs.current.delete(file!.path);
            }
          }}
        />
      )
    }));

    return (
      <Tabs
        type="editable-card"
        activeKey={activeFileInGroup || undefined}
        onChange={handleTabChange}
        hideAdd
        items={tabItems}
        style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
        tabBarStyle={{
          margin: 0,
          background: '#2d2d30',
          borderBottom: '1px solid #3e3e42'
        }}
      />
    );
  };

  const renderSplitLayout = () => {
    if (layout.type === 'single') {
      return renderEditor('main', layout.groups[0].files, layout.groups[0].activeFile);
    }

    const [group1, group2] = layout.groups;
    const splitStyle = {
      display: 'flex',
      flexDirection: layout.type === 'horizontal' ? 'column' as const : 'row' as const,
      height: '100%'
    };

    return (
      <div style={splitStyle}>
        <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
          {renderEditor(group1.id, group1.files, group1.activeFile)}
        </div>
        <div style={{ 
          width: layout.type === 'vertical' ? '1px' : '100%',
          height: layout.type === 'horizontal' ? '1px' : '100%',
          background: '#3e3e42'
        }} />
        <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
          {renderEditor(group2.id, group2.files, group2.activeFile)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <EditorToolbar />
      {renderSplitLayout()}
      
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
    </div>
  );
};