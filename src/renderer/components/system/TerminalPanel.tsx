/**
 * Terminal Panel Component
 * Integrated terminal with multi-tab support, command history, and theming
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Tabs, 
  Button, 
  Dropdown, 
  Input, 
  Select, 
  Space,
  Typography,
  Tooltip,
  Modal
} from 'antd';
import {
  PlusOutlined,
  SettingOutlined,
  CloseOutlined,
  ClearOutlined,
  HistoryOutlined,
  CopyOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  addTerminal, 
  removeTerminal, 
  setActiveTerminal,
  updateTerminal,
  setTerminalTheme
} from '../../store/slices/systemSlice';
import { Terminal } from '../../types/system';
import './TerminalPanel.css';

const { TabPane } = Tabs;
const { Text } = Typography;
const { Option } = Select;

interface TerminalTabProps {
  terminal: Terminal;
  isActive: boolean;
  onInput: (input: string) => void;
  onClear: () => void;
}

const TerminalTab: React.FC<TerminalTabProps> = ({ 
  terminal, 
  isActive, 
  onInput, 
  onClear 
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminal.output]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (input.trim()) {
        onInput(input);
        setInput('');
        setHistoryIndex(-1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (terminal.history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, terminal.history.length - 1);
        setHistoryIndex(newIndex);
        setInput(terminal.history[terminal.history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(terminal.history[terminal.history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="terminal-tab">
      <div className="terminal-output" ref={outputRef}>
        {terminal.output.map((output) => (
          <div 
            key={output.id} 
            className={`terminal-line terminal-${output.type}`}
          >
            <span className="terminal-timestamp">
              {new Date(output.timestamp).toLocaleTimeString()}
            </span>
            <span className="terminal-content">{output.content}</span>
          </div>
        ))}
      </div>
      <div className="terminal-input-area">
        <span className="terminal-prompt">{terminal.cwd}$</span>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          bordered={false}
          className="terminal-input"
          autoFocus={isActive}
        />
      </div>
    </div>
  );
};

export const TerminalPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { terminals, activeTerminalId, terminalTheme } = useAppSelector(
    state => state.system
  );
  const [settingsVisible, setSettingsVisible] = useState(false);

  const createNewTerminal = () => {
    const newTerminal: Terminal = {
      id: `terminal-${Date.now()}`,
      title: `Terminal ${terminals.length + 1}`,
      cwd: (typeof process !== 'undefined' && process.cwd) ? process.cwd() : '/',
      isActive: true,
      history: [],
      output: [{
        id: `output-${Date.now()}`,
        content: 'Welcome to Multi-Agent IDE Terminal',
        type: 'output',
        timestamp: Date.now()
      }]
    };
    dispatch(addTerminal(newTerminal));
  };

  const closeTerminal = (terminalId: string) => {
    dispatch(removeTerminal(terminalId));
  };

  const handleTabChange = (activeKey: string) => {
    dispatch(setActiveTerminal(activeKey));
  };

  const handleTerminalInput = (terminalId: string, input: string) => {
    const terminal = terminals.find(t => t.id === terminalId);
    if (!terminal) return;

    // Add to history
    const newHistory = [...terminal.history, input];
    
    // Add input to output
    const inputOutput = {
      id: `output-${Date.now()}`,
      content: `${terminal.cwd}$ ${input}`,
      type: 'input' as const,
      timestamp: Date.now()
    };

    // Simulate command execution (in real implementation, this would call electron API)
    const mockOutput = {
      id: `output-${Date.now() + 1}`,
      content: `Command executed: ${input}`,
      type: 'output' as const,
      timestamp: Date.now() + 1
    };

    dispatch(updateTerminal({
      id: terminalId,
      history: newHistory,
      output: [...terminal.output, inputOutput, mockOutput]
    }));
  };

  const clearTerminal = (terminalId: string) => {
    dispatch(updateTerminal({
      id: terminalId,
      output: []
    }));
  };

  const copyTerminalOutput = (terminalId: string) => {
    const terminal = terminals.find(t => t.id === terminalId);
    if (terminal) {
      const content = terminal.output.map(o => o.content).join('\n');
      navigator.clipboard.writeText(content);
    }
  };

  const exportTerminalOutput = (terminalId: string) => {
    const terminal = terminals.find(t => t.id === terminalId);
    if (terminal) {
      const content = terminal.output.map(o => 
        `[${new Date(o.timestamp).toISOString()}] ${o.content}`
      ).join('\n');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terminal-${terminal.title}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const tabBarExtraContent = (
    <Space>
      <Tooltip title="Terminal Settings">
        <Button 
          type="text" 
          icon={<SettingOutlined />} 
          
          onClick={() => setSettingsVisible(true)}
        />
      </Tooltip>
      <Tooltip title="New Terminal">
        <Button 
          type="text" 
          icon={<PlusOutlined />} 
          
          onClick={createNewTerminal}
        />
      </Tooltip>
    </Space>
  );

  if (terminals.length === 0) {
    return (
      <div className="terminal-panel-empty">
        <div className="empty-state">
          <Text type="secondary">No terminals open</Text>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={createNewTerminal}
            style={{ marginTop: 16 }}
          >
            Create Terminal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel">
      <Tabs
        type="card"
        activeKey={activeTerminalId || undefined}
        onChange={handleTabChange}
        onEdit={(targetKey, action) => {
          if (action === 'remove' && typeof targetKey === 'string') {
            closeTerminal(targetKey);
          }
        }}
        tabBarExtraContent={tabBarExtraContent}
        className="terminal-tabs"
      >
        {terminals.map((terminal) => (
          <TabPane
            tab={
              <Dropdown
                trigger={['contextMenu']}
                menu={{
                  items: [
                    {
                      key: 'clear',
                      label: 'Clear Terminal',
                      icon: <ClearOutlined />,
                      onClick: () => clearTerminal(terminal.id)
                    },
                    {
                      key: 'copy',
                      label: 'Copy Output',
                      icon: <CopyOutlined />,
                      onClick: () => copyTerminalOutput(terminal.id)
                    },
                    {
                      key: 'export',
                      label: 'Export Output',
                      icon: <DownloadOutlined />,
                      onClick: () => exportTerminalOutput(terminal.id)
                    },
                    { type: 'divider' },
                    {
                      key: 'close',
                      label: 'Close Terminal',
                      icon: <CloseOutlined />,
                      onClick: () => closeTerminal(terminal.id)
                    }
                  ]
                }}
              >
                <span>{terminal.title}</span>
              </Dropdown>
            }
            key={terminal.id}
            closable
          >
            <TerminalTab
              terminal={terminal}
              isActive={terminal.id === activeTerminalId}
              onInput={(input) => handleTerminalInput(terminal.id, input)}
              onClear={() => clearTerminal(terminal.id)}
            />
          </TabPane>
        ))}
      </Tabs>

      <Modal
        title="Terminal Settings"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={null}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Theme</Text>
            <Select
              value={terminalTheme}
              onChange={(value) => dispatch(setTerminalTheme(value))}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="dark">Dark</Option>
              <Option value="light">Light</Option>
              <Option value="high-contrast">High Contrast</Option>
            </Select>
          </div>
        </Space>
      </Modal>
    </div>
  );
};