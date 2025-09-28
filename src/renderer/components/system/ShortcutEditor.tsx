/**
 * Keyboard Shortcut Editor Component
 * Visual shortcut editor with conflict detection and search
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Button,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Typography,
  Alert,
  Tooltip,
  Divider,
  Card,
  List,
  Badge
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  setShortcuts, 
  updateShortcut, 
  setShortcutConflicts 
} from '../../store/slices/systemSlice';
import { KeyboardShortcut, ShortcutCategory } from '../../types/system';
import './ShortcutEditor.css';

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;
const { Column } = Table;

interface ShortcutRecorderProps {
  value?: string;
  onChange?: (value: string) => void;
  onConflict?: (conflicts: string[]) => void;
}

const ShortcutRecorder: React.FC<ShortcutRecorderProps> = ({ 
  value, 
  onChange, 
  onConflict 
}) => {
  const [recording, setRecording] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const newKeys = [];
    if (e.ctrlKey) newKeys.push('Ctrl');
    if (e.altKey) newKeys.push('Alt');
    if (e.shiftKey) newKeys.push('Shift');
    if (e.metaKey) newKeys.push('Cmd');
    
    if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      newKeys.push(e.key.toUpperCase());
    }
    
    if (newKeys.length > 0) {
      const shortcut = newKeys.join('+');
      setKeys(newKeys);
      onChange?.(shortcut);
      setRecording(false);
    }
  };

  const startRecording = () => {
    setRecording(true);
    setKeys([]);
  };

  const stopRecording = () => {
    setRecording(false);
    setKeys([]);
  };

  return (
    <div className="shortcut-recorder">
      <Input
        value={recording ? keys.join('+') || 'Press keys...' : value}
        readOnly
        placeholder="Click to record shortcut"
        onClick={startRecording}
        onKeyDown={handleKeyDown}
        onBlur={stopRecording}
        suffix={
          <Button
            type="text"
            
            icon={<SettingOutlined />}
            onClick={startRecording}
          />
        }
        className={recording ? 'recording' : ''}
      />
    </div>
  );
};

export const ShortcutEditor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shortcuts, shortcutConflicts } = useAppSelector(state => state.system);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState<KeyboardShortcut | null>(null);
  const [form] = Form.useForm();
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Mock shortcut data
  useEffect(() => {
    const mockShortcuts: KeyboardShortcut[] = [
      {
        id: 'file.new',
        command: 'workbench.action.files.newUntitledFile',
        key: 'Ctrl+N',
        description: 'New File',
        category: 'File',
        when: 'editorFocus'
      },
      {
        id: 'file.open',
        command: 'workbench.action.files.openFile',
        key: 'Ctrl+O',
        description: 'Open File',
        category: 'File'
      },
      {
        id: 'file.save',
        command: 'workbench.action.files.save',
        key: 'Ctrl+S',
        description: 'Save File',
        category: 'File',
        when: 'editorFocus'
      },
      {
        id: 'edit.copy',
        command: 'editor.action.clipboardCopyAction',
        key: 'Ctrl+C',
        description: 'Copy',
        category: 'Edit',
        when: 'editorFocus'
      },
      {
        id: 'edit.paste',
        command: 'editor.action.clipboardPasteAction',
        key: 'Ctrl+V',
        description: 'Paste',
        category: 'Edit',
        when: 'editorFocus'
      },
      {
        id: 'view.commandPalette',
        command: 'workbench.action.showCommands',
        key: 'Ctrl+Shift+P',
        description: 'Show Command Palette',
        category: 'View'
      },
      {
        id: 'view.terminal',
        command: 'workbench.action.terminal.toggleTerminal',
        key: 'Ctrl+`',
        description: 'Toggle Terminal',
        category: 'View'
      },
      {
        id: 'debug.start',
        command: 'workbench.action.debug.start',
        key: 'F5',
        description: 'Start Debugging',
        category: 'Debug'
      }
    ];

    dispatch(setShortcuts(mockShortcuts));
  }, [dispatch]);

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));
  
  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch = shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shortcut.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shortcut.command.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || shortcut.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const detectConflicts = (newKey: string, excludeId?: string) => {
    const conflictingShortcuts = shortcuts.filter(s => 
      s.key === newKey && s.id !== excludeId
    );
    return conflictingShortcuts.map(s => s.id);
  };

  const handleEditShortcut = (shortcut: KeyboardShortcut) => {
    setSelectedShortcut(shortcut);
    form.setFieldsValue({
      description: shortcut.description,
      key: shortcut.key,
      when: shortcut.when || ''
    });
    setEditModalVisible(true);
  };

  const handleSaveShortcut = () => {
    if (!selectedShortcut) return;
    
    const values = form.getFieldsValue();
    const newConflicts = detectConflicts(values.key, selectedShortcut.id);
    
    if (newConflicts.length > 0) {
      Modal.confirm({
        title: 'Shortcut Conflict',
        content: `This shortcut conflicts with existing shortcuts. Do you want to continue?`,
        onOk: () => {
          dispatch(updateShortcut({
            id: selectedShortcut.id,
            ...values
          }));
          setEditModalVisible(false);
          setSelectedShortcut(null);
          form.resetFields();
        }
      });
    } else {
      dispatch(updateShortcut({
        id: selectedShortcut.id,
        ...values
      }));
      setEditModalVisible(false);
      setSelectedShortcut(null);
      form.resetFields();
    }
  };

  const handleResetShortcuts = () => {
    Modal.confirm({
      title: 'Reset All Shortcuts',
      content: 'Are you sure you want to reset all shortcuts to their default values?',
      okText: 'Reset',
      okType: 'danger',
      onOk: () => {
        // Reset to default shortcuts
        console.log('Resetting shortcuts to defaults');
      }
    });
  };

  const conflictingShortcuts = shortcuts.filter(s => 
    shortcuts.some(other => other.id !== s.id && other.key === s.key)
  );

  return (
    <div className="shortcut-editor">
      <div className="shortcut-editor-header">
        <Title level={4}>Keyboard Shortcuts</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleResetShortcuts}>
            Reset to Defaults
          </Button>
        </Space>
      </div>

      {conflictingShortcuts.length > 0 && (
        <Alert
          type="warning"
          message="Shortcut Conflicts Detected"
          description={`${conflictingShortcuts.length} shortcuts have conflicts that may prevent them from working correctly.`}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="shortcut-filters">
        <Space wrap>
          <Search
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 150 }}
            placeholder="Category"
          >
            <Option value="all">All Categories</Option>
            {categories.map(category => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        dataSource={filteredShortcuts}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        className="shortcuts-table"
      >
        <Column
          title="Command"
          dataIndex="description"
          key="description"
          render={(text, record: KeyboardShortcut) => (
            <div>
              <Text strong>{text}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.command}
              </Text>
            </div>
          )}
        />
        <Column
          title="Shortcut"
          dataIndex="key"
          key="key"
          render={(key, record: KeyboardShortcut) => {
            const hasConflict = shortcuts.some(s => 
              s.id !== record.id && s.key === key
            );
            return (
              <Space>
                <Tag 
                  color={hasConflict ? 'error' : 'default'}
                  className="shortcut-tag"
                >
                  {key}
                </Tag>
                {hasConflict && (
                  <Tooltip title="This shortcut conflicts with another command">
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  </Tooltip>
                )}
              </Space>
            );
          }}
        />
        <Column
          title="Category"
          dataIndex="category"
          key="category"
          render={(category) => <Tag>{category}</Tag>}
        />
        <Column
          title="When"
          dataIndex="when"
          key="when"
          render={(when) => when ? <Tag color="blue">{when}</Tag> : '-'}
        />
        <Column
          title="Actions"
          key="actions"
          render={(_, record: KeyboardShortcut) => (
            <Button
              type="text"
              
              icon={<EditOutlined />}
              onClick={() => handleEditShortcut(record)}
            >
              Edit
            </Button>
          )}
        />
      </Table>

      {/* Edit shortcut modal */}
      <Modal
        title="Edit Keyboard Shortcut"
        open={editModalVisible}
        onOk={handleSaveShortcut}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedShortcut(null);
          form.resetFields();
        }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="key"
            label="Keyboard Shortcut"
            rules={[{ required: true, message: 'Please set a keyboard shortcut' }]}
          >
            <ShortcutRecorder
              onConflict={(conflicts) => setConflicts(conflicts)}
            />
          </Form.Item>
          <Form.Item
            name="when"
            label="When (Context)"
            help="Optional context when this shortcut is active"
          >
            <Select allowClear placeholder="Select context">
              <Option value="editorFocus">Editor Focus</Option>
              <Option value="terminalFocus">Terminal Focus</Option>
              <Option value="explorerFocus">Explorer Focus</Option>
              <Option value="debugMode">Debug Mode</Option>
            </Select>
          </Form.Item>
          {conflicts.length > 0 && (
            <Alert
              type="warning"
              message="Shortcut Conflict"
              description={`This shortcut conflicts with ${conflicts.length} other command(s).`}
              showIcon
            />
          )}
        </Form>
      </Modal>
    </div>
  );
};