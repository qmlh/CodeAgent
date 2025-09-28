/**
 * Shortcut Visualizer Component
 * Displays available shortcuts and detects conflicts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Input, List, Tag, Badge, Tooltip, Button, Space, Modal, Alert, Divider } from 'antd';
import {
  SearchOutlined,
  KeyOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  EyeOutlined,
  FilterOutlined
} from '@ant-design/icons';

interface Shortcut {
  id: string;
  key: string;
  description: string;
  category: string;
  context?: string;
  action: () => void;
  enabled: boolean;
  global?: boolean;
}

interface ShortcutVisualizerProps {
  visible?: boolean;
  onClose?: () => void;
}

const defaultShortcuts: Shortcut[] = [
  // File operations
  { id: 'file-new', key: 'Ctrl+N', description: '新建文件', category: '文件', action: () => { }, enabled: true },
  { id: 'file-open', key: 'Ctrl+O', description: '打开文件', category: '文件', action: () => { }, enabled: true },
  { id: 'file-save', key: 'Ctrl+S', description: '保存文件', category: '文件', action: () => { }, enabled: true },
  { id: 'file-save-as', key: 'Ctrl+Shift+S', description: '另存为', category: '文件', action: () => { }, enabled: true },
  { id: 'file-close', key: 'Ctrl+W', description: '关闭文件', category: '文件', action: () => { }, enabled: true },

  // Edit operations
  { id: 'edit-undo', key: 'Ctrl+Z', description: '撤销', category: '编辑器', action: () => { }, enabled: true },
  { id: 'edit-redo', key: 'Ctrl+Y', description: '重做', category: '编辑器', action: () => { }, enabled: true },
  { id: 'edit-cut', key: 'Ctrl+X', description: '剪切', category: '编辑器', action: () => { }, enabled: true },
  { id: 'edit-copy', key: 'Ctrl+C', description: '复制行', category: '编辑器', action: () => { }, enabled: true },
  { id: 'edit-paste', key: 'Ctrl+V', description: '粘贴', category: '编辑器', action: () => { }, enabled: true },
  { id: 'edit-select-all', key: 'Ctrl+A', description: '全选', category: '编辑器', action: () => { }, enabled: true },
  { id: 'edit-find', key: 'Ctrl+F', description: '查找', category: '编辑器', action: () => { }, enabled: true },
  { id: 'edit-replace', key: 'Ctrl+H', description: '替换', category: '编辑器', action: () => { }, enabled: true },

  // View operations
  { id: 'view-explorer', key: 'Ctrl+Shift+E', description: '显示资源管理器', category: '视图', action: () => { }, enabled: true },
  { id: 'view-search', key: 'Ctrl+Shift+F', description: '显示搜索', category: '视图', action: () => { }, enabled: true },
  { id: 'view-agents', key: 'Ctrl+Shift+A', description: '显示Agent面板', category: '视图', action: () => { }, enabled: true },
  { id: 'view-tasks', key: 'Ctrl+Shift+T', description: '显示任务面板', category: '视图', action: () => { }, enabled: true },
  { id: 'view-collaboration', key: 'Ctrl+Shift+C', description: '显示协作面板', category: '视图', action: () => { }, enabled: true },
  { id: 'view-git', key: 'Ctrl+Shift+G', description: '显示Git面板', category: '视图', action: () => { }, enabled: true },
  { id: 'view-terminal', key: 'Ctrl+`', description: '显示终端', category: '视图', action: () => { }, enabled: true },
  { id: 'view-command-palette', key: 'Ctrl+Shift+P', description: '命令面板', category: '视图', action: () => { }, enabled: true },

  // Navigation
  { id: 'nav-go-to-file', key: 'Ctrl+P', description: '转到文件', category: '导航', action: () => { }, enabled: true },
  { id: 'nav-go-to-line', key: 'Ctrl+G', description: '转到行', category: '导航', action: () => { }, enabled: true },
  { id: 'nav-go-to-definition', key: 'F12', description: '转到定义', category: '导航', action: () => { }, enabled: true },
  { id: 'nav-go-back', key: 'Alt+Left', description: '后退', category: '导航', action: () => { }, enabled: true },
  { id: 'nav-go-forward', key: 'Alt+Right', description: '前进', category: '导航', action: () => { }, enabled: true },

  // Editor
  { id: 'editor-format', key: 'Shift+Alt+F', description: '格式化文档', category: '编辑器', action: () => { }, enabled: true },
  { id: 'editor-comment', key: 'Ctrl+/', description: '切换注释', category: '编辑器', action: () => { }, enabled: true },
  { id: 'editor-duplicate-line', key: 'Shift+Alt+Down', description: '复制行', category: '编辑器', action: () => { }, enabled: true },
  { id: 'editor-move-line-up', key: 'Alt+Up', description: '上移行', category: '编辑器', action: () => { }, enabled: true },
  { id: 'editor-move-line-down', key: 'Alt+Down', description: '下移行', category: '编辑器', action: () => { }, enabled: true },
  { id: 'editor-multi-cursor', key: 'Ctrl+Alt+Down', description: '多光标', category: '编辑器', action: () => { }, enabled: true },

  // Debug
  { id: 'debug-start', key: 'F5', description: '开始调试', category: '调试', action: () => { }, enabled: true },
  { id: 'debug-stop', key: 'Shift+F5', description: '停止调试', category: '调试', action: () => { }, enabled: true },
  { id: 'debug-restart', key: 'Ctrl+Shift+F5', description: '重启调试', category: '调试', action: () => { }, enabled: true },
  { id: 'debug-step-over', key: 'F10', description: '单步跳过', category: '调试', action: () => { }, enabled: true },
  { id: 'debug-step-into', key: 'F11', description: '单步进入', category: '调试', action: () => { }, enabled: true },
  { id: 'debug-step-out', key: 'Shift+F11', description: '单步跳出', category: '调试', action: () => { }, enabled: true },
  { id: 'debug-toggle-breakpoint', key: 'F9', description: '切换断点', category: '调试', action: () => { }, enabled: true },

  // System
  { id: 'system-settings', key: 'Ctrl+,', description: '打开设置', category: '系统', action: () => { }, enabled: true },
  { id: 'system-reload', key: 'Ctrl+R', description: '重新加载', category: '系统', action: () => { }, enabled: true },
  { id: 'system-dev-tools', key: 'F12', description: '开发者工具', category: '系统', action: () => { }, enabled: true, context: 'global' },
  { id: 'system-zoom-in', key: 'Ctrl+=', description: '放大', category: '系统', action: () => { }, enabled: true },
  { id: 'system-zoom-out', key: 'Ctrl+-', description: '缩小', category: '系统', action: () => { }, enabled: true },
  { id: 'system-zoom-reset', key: 'Ctrl+0', description: '重置缩放', category: '系统', action: () => { }, enabled: true }
];

export const ShortcutVisualizer: React.FC<ShortcutVisualizerProps> = ({ visible = true, onClose }) => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaultShortcuts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Detect key presses for real-time shortcut display
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const modifiers = [];

      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.altKey) modifiers.push('Alt');
      if (e.metaKey) modifiers.push('Meta');

      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
        modifiers.push(key);
      }

      setPressedKeys(new Set(modifiers));
    };

    const handleKeyUp = () => {
      setPressedKeys(new Set());
    };

    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleKeyUp);
    };
  }, [visible]);

  // Detect shortcut conflicts
  const conflicts = useMemo(() => {
    const keyMap = new Map<string, Shortcut[]>();

    shortcuts.forEach(shortcut => {
      if (!shortcut.enabled) return;

      const key = shortcut.key.toLowerCase();
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(shortcut);
    });

    return Array.from(keyMap.entries())
      .filter(([_, shortcuts]) => shortcuts.length > 1)
      .map(([key, shortcuts]) => ({ key, shortcuts }));
  }, [shortcuts]);

  // Get categories
  const categories = useMemo(() => {
    const cats = new Set(shortcuts.map(s => s.category));
    return ['all', ...Array.from(cats).sort()];
  }, [shortcuts]);

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    let filtered = shortcuts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(shortcut =>
        shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortcut.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortcut.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(shortcut => shortcut.category === selectedCategory);
    }

    // Filter by conflicts
    if (showConflictsOnly) {
      const conflictKeys = new Set(conflicts.map(c => c.key));
      filtered = filtered.filter(shortcut =>
        conflictKeys.has(shortcut.key.toLowerCase())
      );
    }

    return filtered;
  }, [shortcuts, searchTerm, selectedCategory, showConflictsOnly, conflicts]);

  // Check if a shortcut is currently being pressed
  const isShortcutPressed = (shortcut: Shortcut) => {
    const keys = shortcut.key.split('+').map(k => k.trim());
    return keys.every(key => pressedKeys.has(key));
  };

  // Get shortcut by pressed keys
  const getCurrentShortcut = () => {
    if (pressedKeys.size === 0) return null;

    const pressedKeyString = Array.from(pressedKeys).join('+');
    return shortcuts.find(s =>
      s.enabled && s.key.toLowerCase() === pressedKeyString.toLowerCase()
    );
  };

  const currentShortcut = getCurrentShortcut();

  const renderShortcutKey = (key: string, isPressed: boolean = false) => {
    const keys = key.split('+').map(k => k.trim());

    return (
      <Space size={2}>
        {keys.map((k, index) => (
          <React.Fragment key={k}>
            <Tag
              color={isPressed ? 'blue' : 'default'}
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                margin: 0,
                padding: '2px 6px',
                borderRadius: '4px',
                background: isPressed ? '#1890ff' : 'var(--bg-tertiary)',
                color: isPressed ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${isPressed ? '#1890ff' : 'var(--border-color)'}`,
                transition: 'all 0.2s ease'
              }}
            >
              {k}
            </Tag>
            {index < keys.length - 1 && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+</span>}
          </React.Fragment>
        ))}
      </Space>
    );
  };

  if (!visible) return null;

  return (
    <div className="shortcut-visualizer-container" style={{ padding: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
      {/* Current Shortcut Display */}
      {pressedKeys.size > 0 && (
        <Card size="small" style={{ marginBottom: '16px', background: 'var(--bg-tertiary)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              当前按键组合:
            </div>
            <div style={{ marginBottom: '8px' }}>
              {renderShortcutKey(Array.from(pressedKeys).join('+'), true)}
            </div>
            {currentShortcut ? (
              <div style={{ color: 'var(--accent-color)', fontSize: '14px', fontWeight: 500 }}>
                {currentShortcut.description}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                未找到匹配的快捷键
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert
          type="warning"
          message={`发现 ${conflicts.length} 个快捷键冲突`}
          description="某些快捷键被多个功能使用，可能导致功能冲突"
          showIcon
          style={{ marginBottom: '16px' }}
          action={
            <Button
              type="text"
              onClick={() => setShowConflictsOnly(!showConflictsOnly)}
            >
              {showConflictsOnly ? '显示全部' : '仅显示冲突'}
            </Button>
          }
        />
      )}

      {/* Search and Filters */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="搜索快捷键..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
          <Space wrap>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>分类:</span>
            {categories.map(category => (
              <Button
                key={category}
                size="small"
                type={selectedCategory === category ? 'primary' : 'default'}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? '全部' : category}
              </Button>
            ))}
          </Space>
        </Space>
      </Card>

      {/* Shortcuts List */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>快捷键列表 ({filteredShortcuts.length})</span>
            <Space>
              <Button
                icon={<InfoCircleOutlined />}
                onClick={() => setIsHelpVisible(true)}
              >
                帮助
              </Button>
            </Space>
          </div>
        }
        size="small"
      >
        <List
          dataSource={filteredShortcuts}
          renderItem={(shortcut) => {
            const isPressed = isShortcutPressed(shortcut);
            const hasConflict = conflicts.some(c =>
              c.shortcuts.some(s => s.id === shortcut.id)
            );

            return (
              <List.Item
                style={{
                  background: isPressed ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  padding: '8px 12px'
                }}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px' }}>{shortcut.description}</span>
                      {hasConflict && (
                        <Tooltip title="此快捷键存在冲突">
                          <WarningOutlined style={{ color: '#faad14', fontSize: '12px' }} />
                        </Tooltip>
                      )}
                      {!shortcut.enabled && (
                        <Tag color="red">已禁用</Tag>
                      )}
                      {shortcut.global && (
                        <Tag color="blue">全局</Tag>
                      )}
                    </div>
                  }
                  description={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="default">{shortcut.category}</Tag>
                      {shortcut.context && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {shortcut.context}
                        </span>
                      )}
                    </div>
                  }
                />
                <div>
                  {renderShortcutKey(shortcut.key, isPressed)}
                </div>
              </List.Item>
            );
          }}
        />
      </Card>

      {/* Help Modal */}
      <Modal
        title="快捷键帮助"
        open={isHelpVisible}
        onCancel={() => setIsHelpVisible(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            type="info"
            message="如何使用快捷键可视化器"
            description={
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>按住任意键组合查看对应的快捷键功能</li>
                <li>使用搜索框快速查找特定快捷键</li>
                <li>按分类筛选快捷键</li>
                <li>查看快捷键冲突并解决</li>
              </ul>
            }
          />

          <Divider orientation="left">快捷键说明</Divider>
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <p><strong>修饰键</strong></p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><code>Ctrl</code> - Control 键</li>
              <li><code>Shift</code> - Shift 键</li>
              <li><code>Alt</code> - Alt 键</li>
              <li><code>Meta</code> - Windows 键 / Cmd 键</li>
            </ul>

            <p><strong>功能键</strong></p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><code>F1-F12</code> - 功能键</li>
              <li><code>Tab</code> - Tab 键</li>
              <li><code>Enter</code> - 回车键</li>
              <li><code>Escape</code> - Esc 键</li>
              <li><code>Space</code> - 空格键</li>
            </ul>
          </div>
        </Space>
      </Modal>
    </div>
  );
};