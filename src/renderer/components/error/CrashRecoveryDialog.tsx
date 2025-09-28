import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, Alert, List, Checkbox, Progress } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import './CrashRecoveryDialog.css';

const { Title, Text, Paragraph } = Typography;

interface RecoveryData {
  id: string;
  type: 'file' | 'session' | 'settings';
  name: string;
  path?: string;
  lastModified: Date;
  size?: number;
  canRecover: boolean;
}

interface CrashRecoveryDialogProps {
  visible: boolean;
  onClose: () => void;
  onRecover: (selectedItems: string[]) => void;
}

export const CrashRecoveryDialog: React.FC<CrashRecoveryDialogProps> = ({
  visible,
  onClose,
  onRecover
}) => {
  const [recoveryData, setRecoveryData] = useState<RecoveryData[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);

  useEffect(() => {
    if (visible) {
      // Simulate loading recovery data
      const mockData: RecoveryData[] = [
        {
          id: '1',
          type: 'file',
          name: 'main.tsx (unsaved changes)',
          path: '/src/main.tsx',
          lastModified: new Date(Date.now() - 300000), // 5 minutes ago
          size: 2048,
          canRecover: true
        },
        {
          id: '2',
          type: 'file',
          name: 'components/Agent.tsx (auto-saved)',
          path: '/src/components/Agent.tsx',
          lastModified: new Date(Date.now() - 120000), // 2 minutes ago
          size: 1536,
          canRecover: true
        },
        {
          id: '3',
          type: 'session',
          name: 'Editor Session (3 open files)',
          lastModified: new Date(Date.now() - 60000), // 1 minute ago
          canRecover: true
        },
        {
          id: '4',
          type: 'settings',
          name: 'Layout Configuration',
          lastModified: new Date(Date.now() - 180000), // 3 minutes ago
          canRecover: true
        },
        {
          id: '5',
          type: 'file',
          name: 'corrupted-file.js',
          path: '/src/corrupted-file.js',
          lastModified: new Date(Date.now() - 600000), // 10 minutes ago
          size: 0,
          canRecover: false
        }
      ];

      setRecoveryData(mockData);
      // Auto-select recoverable items
      setSelectedItems(mockData.filter(item => item.canRecover).map(item => item.id));
    }
  }, [visible]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(recoveryData.filter(item => item.canRecover).map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleRecover = async () => {
    setIsRecovering(true);
    setRecoveryProgress(0);

    // Simulate recovery process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setRecoveryProgress(i);
    }

    setIsRecovering(false);
    onRecover(selectedItems);
  };

  const handleDiscardAll = () => {
    Modal.confirm({
      title: 'Discard All Recovery Data',
      content: 'Are you sure you want to discard all recovery data? This action cannot be undone.',
      icon: <ExclamationCircleOutlined />,
      okText: 'Discard',
      okType: 'danger',
      onOk: () => {
        onClose();
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file': return '📄';
      case 'session': return '🖥️';
      case 'settings': return '⚙️';
      default: return '📋';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const recoverableItems = recoveryData.filter(item => item.canRecover);
  const allRecoverableSelected = recoverableItems.length > 0 && 
    recoverableItems.every(item => selectedItems.includes(item.id));

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <Title level={4} style={{ margin: 0 }}>Application Crash Recovery</Title>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="discard" danger icon={<DeleteOutlined />} onClick={handleDiscardAll}>
          Discard All
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="recover"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleRecover}
          loading={isRecovering}
          disabled={selectedItems.length === 0}
        >
          Recover Selected ({selectedItems.length})
        </Button>
      ]}
      closable={!isRecovering}
      maskClosable={!isRecovering}
    >
      <div className="crash-recovery-dialog">
        <Alert
          message="Application Crash Detected"
          description="The application crashed unexpectedly. We found some data that can be recovered. Please select what you'd like to restore."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {isRecovering && (
          <div style={{ marginBottom: 16 }}>
            <Text>Recovering selected items...</Text>
            <Progress percent={recoveryProgress} status="active" />
          </div>
        )}

        <div className="recovery-controls">
          <Checkbox
            checked={allRecoverableSelected}
            indeterminate={selectedItems.length > 0 && !allRecoverableSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            disabled={isRecovering}
          >
            Select All Recoverable Items ({recoverableItems.length})
          </Checkbox>
        </div>

        <List
          dataSource={recoveryData}
          renderItem={(item) => (
            <List.Item
              className={`recovery-item ${!item.canRecover ? 'recovery-item-disabled' : ''}`}
              actions={[
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                  disabled={!item.canRecover || isRecovering}
                />
              ]}
            >
              <List.Item.Meta
                avatar={<span className="recovery-item-icon">{getTypeIcon(item.type)}</span>}
                title={
                  <Space>
                    <Text strong={item.canRecover} type={item.canRecover ? undefined : 'secondary'}>
                      {item.name}
                    </Text>
                    {!item.canRecover && <Text type="danger">(Corrupted)</Text>}
                  </Space>
                }
                description={
                  <div>
                    {item.path && <Text type="secondary">Path: {item.path}</Text>}
                    <br />
                    <Text type="secondary">
                      Last modified: {item.lastModified.toLocaleString()}
                      {item.size !== undefined && ` �?Size: ${formatFileSize(item.size)}`}
                    </Text>
                    {!item.canRecover && (
                      <div>
                        <Text type="danger">This item is corrupted and cannot be recovered.</Text>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />

        <Alert
          message="Recovery Tips"
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              <li>Auto-saved files are more likely to be recoverable</li>
              <li>Session data includes open files and window layout</li>
              <li>Settings include your preferences and configurations</li>
              <li>Corrupted files cannot be recovered and should be restored from backup</li>
            </ul>
          }
          type="info"
          style={{ marginTop: 16 }}
        />
      </div>
    </Modal>
  );
};