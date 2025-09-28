/**
 * Command Palette Component
 * Fuzzy search for all available commands and quick actions
 */

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, List, Typography, Space, Tag, Empty } from 'antd';
import {
  SearchOutlined,
  FileOutlined,
  SettingOutlined,
  BugOutlined,
  BranchesOutlined,
  PlayCircleOutlined,
  FolderOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  setCommandPaletteVisible, 
  setCommands 
} from '../../store/slices/systemSlice';
import { Command, CommandCategory } from '../../types/system';
import './CommandPalette.css';

const { Text } = Typography;

interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  onClick: () => void;
}

const CommandItem: React.FC<CommandItemProps> = ({ command, isSelected, onClick }) => {
  const getIcon = (category: string) => {
    const icons = {
      'File': <FileOutlined />,
      'Edit': <CodeOutlined />,
      'View': <FolderOutlined />,
      'Terminal': <CodeOutlined />,
      'Debug': <BugOutlined />,
      'Git': <BranchesOutlined />,
      'Settings': <SettingOutlined />,
      'Run': <PlayCircleOutlined />
    };
    return icons[category as keyof typeof icons] || <CodeOutlined />;
  };

  return (
    <div 
      className={`command-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="command-icon">
        {getIcon(command.category)}
      </div>
      <div className="command-content">
        <div className="command-title">
          {command.title}
          {command.shortcut && (
            <Tag className="command-shortcut">{command.shortcut}</Tag>
          )}
        </div>
        {command.description && (
          <div className="command-description">
            {command.description}
          </div>
        )}
      </div>
      <div className="command-category">
        <Tag>{command.category}</Tag>
      </div>
    </div>
  );
};

export const CommandPalette: React.FC = () => {
  const dispatch = useAppDispatch();
  const { commandPaletteVisible, commands } = useAppSelector(state => state.system);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<any>(null);

  // Mock commands data
  useEffect(() => {
    const mockCommands: Command[] = [
      {
        id: 'file.new',
        title: 'New File',
        category: 'File',
        description: 'Create a new untitled file',
        shortcut: 'Ctrl+N',
        action: () => console.log('New file')
      },
      {
        id: 'file.open',
        title: 'Open File',
        category: 'File',
        description: 'Open an existing file',
        shortcut: 'Ctrl+O',
        action: () => console.log('Open file')
      },
      {
        id: 'file.save',
        title: 'Save File',
        category: 'File',
        description: 'Save the current file',
        shortcut: 'Ctrl+S',
        action: () => console.log('Save file')
      },
      {
        id: 'edit.copy',
        title: 'Copy',
        category: 'Edit',
        description: 'Copy selected text',
        shortcut: 'Ctrl+C',
        action: () => console.log('Copy')
      },
      {
        id: 'edit.paste',
        title: 'Paste',
        category: 'Edit',
        description: 'Paste from clipboard',
        shortcut: 'Ctrl+V',
        action: () => console.log('Paste')
      },
      {
        id: 'view.explorer',
        title: 'Show Explorer',
        category: 'View',
        description: 'Show the file explorer panel',
        shortcut: 'Ctrl+Shift+E',
        action: () => console.log('Show explorer')
      },
      {
        id: 'view.terminal',
        title: 'Toggle Terminal',
        category: 'Terminal',
        description: 'Show or hide the integrated terminal',
        shortcut: 'Ctrl+`',
        action: () => console.log('Toggle terminal')
      },
      {
        id: 'terminal.new',
        title: 'New Terminal',
        category: 'Terminal',
        description: 'Create a new terminal instance',
        shortcut: 'Ctrl+Shift+`',
        action: () => console.log('New terminal')
      },
      {
        id: 'debug.start',
        title: 'Start Debugging',
        category: 'Debug',
        description: 'Start debugging the current project',
        shortcut: 'F5',
        action: () => console.log('Start debugging')
      },
      {
        id: 'git.commit',
        title: 'Git: Commit',
        category: 'Git',
        description: 'Commit staged changes',
        action: () => console.log('Git commit')
      },
      {
        id: 'git.push',
        title: 'Git: Push',
        category: 'Git',
        description: 'Push commits to remote repository',
        action: () => console.log('Git push')
      },
      {
        id: 'settings.open',
        title: 'Open Settings',
        category: 'Settings',
        description: 'Open application settings',
        shortcut: 'Ctrl+,',
        action: () => console.log('Open settings')
      },
      {
        id: 'agent.create',
        title: 'Create New Agent',
        category: 'Agent',
        description: 'Create a new AI agent',
        action: () => console.log('Create agent')
      },
      {
        id: 'task.create',
        title: 'Create New Task',
        category: 'Task',
        description: 'Create a new development task',
        action: () => console.log('Create task')
      }
    ];

    dispatch(setCommands(mockCommands));
  }, [dispatch]);

  // Filter commands based on search query
  const filteredCommands = commands.filter(command => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      command.title.toLowerCase().includes(query) ||
      command.category.toLowerCase().includes(query) ||
      (command.description && command.description.toLowerCase().includes(query)) ||
      command.id.toLowerCase().includes(query)
    );
  });

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when modal opens
  useEffect(() => {
    if (commandPaletteVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [commandPaletteVisible]);

  const handleClose = () => {
    dispatch(setCommandPaletteVisible(false));
    setSearchQuery('');
    setSelectedIndex(0);
  };

  const handleExecuteCommand = (command: Command) => {
    try {
      command.action();
      handleClose();
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleExecuteCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  // Group commands by category for better organization
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const category = command.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(command);
    return groups;
  }, {} as Record<string, Command[]>);

  return (
    <Modal
      title={null}
      open={commandPaletteVisible}
      onCancel={handleClose}
      footer={null}
      width={600}
      className="command-palette-modal"
      centered
      destroyOnClose
    >
      <div className="command-palette">
        <div className="command-search">
          <Input
            ref={inputRef}
            size="large"
            placeholder="Type a command or search..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            bordered={false}
            autoFocus
          />
        </div>

        <div className="command-results">
          {filteredCommands.length > 0 ? (
            <div className="command-list">
              {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category} className="command-category">
                  <div className="category-header">
                    <Text type="secondary" className="category-title">
                      {category}
                    </Text>
                    <Text type="secondary" className="category-count">
                      {categoryCommands.length}
                    </Text>
                  </div>
                  {categoryCommands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    return (
                      <CommandItem
                        key={command.id}
                        command={command}
                        isSelected={globalIndex === selectedIndex}
                        onClick={() => handleExecuteCommand(command)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="command-empty">
              <Empty
                description="No commands found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </div>

        <div className="command-footer">
          <Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              â†‘â†“ to navigate â€?â†?to select â€?esc to close
            </Text>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

// Global keyboard shortcut handler
export const useCommandPaletteShortcut = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        dispatch(setCommandPaletteVisible(true));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);
};