/**
 * Conflict Resolution Toolbar
 * Toolbar with conflict resolution actions and view options
 */

import React from 'react';
import { Button, Space, Dropdown, Tooltip, Divider } from 'antd';
import { 
  CheckOutlined,
  CloseOutlined,
  UndoOutlined,
  RedoOutlined,
  SettingOutlined,
  EyeOutlined,
  NumberOutlined,
  BgColorsOutlined,
  HighlightOutlined,
  SplitCellsOutlined,
  UnorderedListOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './ConflictToolbar.css';

interface ConflictToolbarProps {
  onAcceptLocal: () => void;
  onAcceptRemote: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  diffViewMode: 'side-by-side' | 'unified' | 'three-way';
  onViewModeChange: (mode: 'side-by-side' | 'unified' | 'three-way') => void;
  showLineNumbers: boolean;
  onToggleLineNumbers: () => void;
  showWhitespace: boolean;
  onToggleWhitespace: () => void;
  syntaxHighlighting: boolean;
  onToggleSyntaxHighlighting: () => void;
}

export const ConflictToolbar: React.FC<ConflictToolbarProps> = ({
  onAcceptLocal,
  onAcceptRemote,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  diffViewMode,
  onViewModeChange,
  showLineNumbers,
  onToggleLineNumbers,
  showWhitespace,
  onToggleWhitespace,
  syntaxHighlighting,
  onToggleSyntaxHighlighting
}) => {
  const viewModeItems: MenuProps['items'] = [
    {
      key: 'three-way',
      label: 'Three-way View',
      icon: <AppstoreOutlined />,
      onClick: () => onViewModeChange('three-way')
    },
    {
      key: 'side-by-side',
      label: 'Side by Side',
      icon: <SplitCellsOutlined />,
      onClick: () => onViewModeChange('side-by-side')
    },
    {
      key: 'unified',
      label: 'Unified View',
      icon: <UnorderedListOutlined />,
      onClick: () => onViewModeChange('unified')
    }
  ];

  const viewOptionsItems: MenuProps['items'] = [
    {
      key: 'line-numbers',
      label: 'Line Numbers',
      icon: <NumberOutlined />,
      onClick: onToggleLineNumbers
    },
    {
      key: 'whitespace',
      label: 'Show Whitespace',
      icon: <BgColorsOutlined />,
      onClick: onToggleWhitespace
    },
    {
      key: 'syntax-highlighting',
      label: 'Syntax Highlighting',
      icon: <HighlightOutlined />,
      onClick: onToggleSyntaxHighlighting
    }
  ];

  const getViewModeIcon = () => {
    switch (diffViewMode) {
      case 'three-way':
        return <AppstoreOutlined />;
      case 'side-by-side':
        return <SplitCellsOutlined />;
      case 'unified':
        return <UnorderedListOutlined />;
      default:
        return <AppstoreOutlined />;
    }
  };

  const getViewModeLabel = () => {
    switch (diffViewMode) {
      case 'three-way':
        return 'Three-way';
      case 'side-by-side':
        return 'Side by Side';
      case 'unified':
        return 'Unified';
      default:
        return 'Three-way';
    }
  };

  return (
    <div className="conflict-toolbar">
      <div className="toolbar-section">
        <Space>
          <Tooltip title="Accept local version (your changes)">
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              onClick={onAcceptLocal}
              className="accept-local-btn"
            >
              Accept Local
            </Button>
          </Tooltip>
          
          <Tooltip title="Accept remote version (their changes)">
            <Button 
              icon={<CheckOutlined />}
              onClick={onAcceptRemote}
              className="accept-remote-btn"
            >
              Accept Remote
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Divider type="vertical" />

      <div className="toolbar-section">
        <Space>
          <Tooltip title="Undo last change">
            <Button 
              icon={<UndoOutlined />}
              onClick={onUndo}
              disabled={!canUndo}
            >
              Undo
            </Button>
          </Tooltip>
          
          <Tooltip title="Redo last undone change">
            <Button 
              icon={<RedoOutlined />}
              onClick={onRedo}
              disabled={!canRedo}
            >
              Redo
            </Button>
          </Tooltip>
        </Space>
      </div>

      <Divider type="vertical" />

      <div className="toolbar-section">
        <Space>
          <Dropdown menu={{ items: viewModeItems }} placement="bottomLeft">
            <Button icon={getViewModeIcon()}>
              {getViewModeLabel()}
            </Button>
          </Dropdown>
          
          <Dropdown menu={{ items: viewOptionsItems }} placement="bottomLeft">
            <Button icon={<EyeOutlined />}>
              View Options
            </Button>
          </Dropdown>
        </Space>
      </div>

      <div className="toolbar-section toolbar-indicators">
        <Space>
          {showLineNumbers && (
            <span className="toolbar-indicator">
              <NumberOutlined /> Line Numbers
            </span>
          )}
          {showWhitespace && (
            <span className="toolbar-indicator">
              <BgColorsOutlined /> Whitespace
            </span>
          )}
          {syntaxHighlighting && (
            <span className="toolbar-indicator">
              <HighlightOutlined /> Syntax
            </span>
          )}
        </Space>
      </div>
    </div>
  );
};