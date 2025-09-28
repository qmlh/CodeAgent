/**
 * Enhanced Layout Manager Component
 * Provides layout snapshots, sharing, and advanced layout management
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Input, Modal, List, Tooltip, message, Popconfirm, Tag } from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  ShareAltOutlined, 
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  CopyOutlined,
  SettingOutlined,
  LayoutOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { resetLayout, loadLayout } from '../../store/slices/uiSlice';

interface LayoutSnapshot {
  id: string;
  name: string;
  description?: string;
  layout: any;
  timestamp: number;
  favorite: boolean;
  tags: string[];
  author?: string;
  version: string;
}

interface LayoutManagerProps {
  visible?: boolean;
  onClose?: () => void;
}

const defaultLayouts: LayoutSnapshot[] = [
  {
    id: 'default-coding',
    name: '编程布局',
    description: '适合日常编程工作的布局',
    layout: {
      sidebar: { visible: true, width: 300, activePanel: 'explorer' },
      editor: { splitLayout: 'single', activeGroup: 0 },
      panel: { visible: true, height: 200, activePanel: 'terminal' },
      statusBar: { visible: true }
    },
    timestamp: Date.now(),
    favorite: true,
    tags: ['编程', '默认'],
    version: '1.0.0'
  },
  {
    id: 'debugging-layout',
    name: '调试布局',
    description: '专为调试优化的布局',
    layout: {
      sidebar: { visible: true, width: 350, activePanel: 'agents' },
      editor: { splitLayout: 'vertical', activeGroup: 0 },
      panel: { visible: true, height: 300, activePanel: 'debug' },
      statusBar: { visible: true }
    },
    timestamp: Date.now(),
    favorite: false,
    tags: ['调试', '开发'],
    version: '1.0.0'
  },
  {
    id: 'collaboration-layout',
    name: '协作布局',
    description: '多人协作时的最佳布局',
    layout: {
      sidebar: { visible: true, width: 280, activePanel: 'collaboration' },
      editor: { splitLayout: 'horizontal', activeGroup: 0 },
      panel: { visible: true, height: 250, activePanel: 'git' },
      statusBar: { visible: true }
    },
    timestamp: Date.now(),
    favorite: false,
    tags: ['协作', '团队'],
    version: '1.0.0'
  },
  {
    id: 'minimal-layout',
    name: '极简布局',
    description: '专注编码的极简界面',
    layout: {
      sidebar: { visible: false, width: 300, activePanel: 'explorer' },
      editor: { splitLayout: 'single', activeGroup: 0 },
      panel: { visible: false, height: 200, activePanel: 'terminal' },
      statusBar: { visible: true }
    },
    timestamp: Date.now(),
    favorite: false,
    tags: ['极简', '专注'],
    version: '1.0.0'
  }
];

export const LayoutManager: React.FC<LayoutManagerProps> = ({ visible = true, onClose }) => {
  const dispatch = useAppDispatch();
  const currentLayout = useAppSelector(state => state.ui.layout);
  const [snapshots, setSnapshots] = useState<LayoutSnapshot[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('');
  const [newSnapshotTags, setNewSnapshotTags] = useState('');
  const [importData, setImportData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load snapshots from localStorage
    const savedSnapshots = localStorage.getItem('layoutSnapshots');
    if (savedSnapshots) {
      try {
        const parsed = JSON.parse(savedSnapshots);
        setSnapshots([...defaultLayouts, ...parsed]);
      } catch (error) {
        console.error('Failed to parse saved snapshots:', error);
        setSnapshots(defaultLayouts);
      }
    } else {
      setSnapshots(defaultLayouts);
    }
  }, []);

  const saveSnapshots = (newSnapshots: LayoutSnapshot[]) => {
    const userSnapshots = newSnapshots.filter(s => !s.id.startsWith('default-'));
    localStorage.setItem('layoutSnapshots', JSON.stringify(userSnapshots));
    setSnapshots(newSnapshots);
  };

  const handleCreateSnapshot = () => {
    if (!newSnapshotName.trim()) {
      message.error('请输入布局名称');
      return;
    }

    const newSnapshot: LayoutSnapshot = {
      id: `user-${Date.now()}`,
      name: newSnapshotName.trim(),
      description: newSnapshotDescription.trim(),
      layout: currentLayout,
      timestamp: Date.now(),
      favorite: false,
      tags: newSnapshotTags.split(',').map(tag => tag.trim()).filter(Boolean),
      version: '1.0.0'
    };

    const newSnapshots = [...snapshots, newSnapshot];
    saveSnapshots(newSnapshots);
    
    setIsCreateModalVisible(false);
    setNewSnapshotName('');
    setNewSnapshotDescription('');
    setNewSnapshotTags('');
    
    message.success('布局快照已保存');
  };

  const handleApplyLayout = (snapshot: LayoutSnapshot) => {
    dispatch(loadLayout(snapshot.layout));
    message.success(`已应用布局: ${snapshot.name}`);
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    if (snapshotId.startsWith('default-')) {
      message.error('无法删除默认布局');
      return;
    }

    const newSnapshots = snapshots.filter(s => s.id !== snapshotId);
    saveSnapshots(newSnapshots);
    message.success('布局快照已删除');
  };

  const handleToggleFavorite = (snapshotId: string) => {
    const newSnapshots = snapshots.map(s => 
      s.id === snapshotId ? { ...s, favorite: !s.favorite } : s
    );
    saveSnapshots(newSnapshots);
  };

  const handleExportSnapshot = (snapshot: LayoutSnapshot) => {
    const exportData = {
      ...snapshot,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Multi-Agent IDE'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `layout-${snapshot.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success('布局已导出');
  };

  const handleImportSnapshot = () => {
    try {
      const importedData = JSON.parse(importData);
      
      // Validate imported data
      if (!importedData.name || !importedData.layout) {
        throw new Error('Invalid layout data');
      }

      const newSnapshot: LayoutSnapshot = {
        ...importedData,
        id: `imported-${Date.now()}`,
        timestamp: Date.now(),
        favorite: false
      };

      const newSnapshots = [...snapshots, newSnapshot];
      saveSnapshots(newSnapshots);
      
      setIsImportModalVisible(false);
      setImportData('');
      message.success('布局已导入');
    } catch (error) {
      message.error('导入失败：数据格式不正确');
    }
  };

  const handleShareSnapshot = (snapshot: LayoutSnapshot) => {
    const shareData = {
      name: snapshot.name,
      description: snapshot.description,
      layout: snapshot.layout,
      tags: snapshot.tags,
      version: snapshot.version,
      sharedAt: new Date().toISOString()
    };

    const shareText = JSON.stringify(shareData, null, 2);
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        message.success('布局数据已复制到剪贴板');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success('布局数据已复制到剪贴板');
    }
  };

  const handleResetToDefault = () => {
    dispatch(resetLayout());
    message.success('已重置为默认布局');
  };

  const filteredSnapshots = snapshots.filter(snapshot =>
    snapshot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    snapshot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    snapshot.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const favoriteSnapshots = filteredSnapshots.filter(s => s.favorite);
  const regularSnapshots = filteredSnapshots.filter(s => !s.favorite);

  if (!visible) return null;

  return (
    <div className="layout-manager-container" style={{ padding: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
      {/* Header Actions */}
      <Card  style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => setIsCreateModalVisible(true)}
          >
            保存当前布局
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetToDefault}
          >
            重置布局
          </Button>
          <Button
            icon={<ImportOutlined />}
            onClick={() => setIsImportModalVisible(true)}
          >
            导入布局
          </Button>
        </Space>
      </Card>

      {/* Search */}
      <Card  style={{ marginBottom: '16px' }}>
        <Input.Search
          placeholder="搜索布局..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </Card>

      {/* Favorite Layouts */}
      {favoriteSnapshots.length > 0 && (
        <Card title="收藏布局"  style={{ marginBottom: '16px' }}>
          <List
            
            dataSource={favoriteSnapshots}
            renderItem={(snapshot) => (
              <List.Item
                actions={[
                  <Tooltip title="应用布局">
                    <Button
                      type="link"
                      icon={<LayoutOutlined />}
                      onClick={() => handleApplyLayout(snapshot)}
                    />
                  </Tooltip>,
                  <Tooltip title="取消收藏">
                    <Button
                      type="link"
                      icon={<StarFilled />}
                      onClick={() => handleToggleFavorite(snapshot.id)}
                      style={{ color: '#faad14' }}
                    />
                  </Tooltip>,
                  <Tooltip title="分享">
                    <Button
                      type="link"
                      icon={<ShareAltOutlined />}
                      onClick={() => handleShareSnapshot(snapshot)}
                    />
                  </Tooltip>,
                  <Tooltip title="导出">
                    <Button
                      type="link"
                      icon={<ExportOutlined />}
                      onClick={() => handleExportSnapshot(snapshot)}
                    />
                  </Tooltip>,
                  !snapshot.id.startsWith('default-') && (
                    <Popconfirm
                      title="确定要删除这个布局吗？"
                      onConfirm={() => handleDeleteSnapshot(snapshot.id)}
                    >
                      <Button
                        type="link"
                        icon={<DeleteOutlined />}
                        danger
                      />
                    </Popconfirm>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{snapshot.name}</span>
                      {snapshot.tags.map(tag => (
                        <Tag key={tag} >{tag}</Tag>
                      ))}
                    </div>
                  }
                  description={
                    <div>
                      <div>{snapshot.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(snapshot.timestamp).toLocaleString()}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* All Layouts */}
      <Card title="所有布局" >
        <List
          
          dataSource={regularSnapshots}
          renderItem={(snapshot) => (
            <List.Item
              actions={[
                <Tooltip title="应用布局">
                  <Button
                    type="link"
                    icon={<LayoutOutlined />}
                    onClick={() => handleApplyLayout(snapshot)}
                  />
                </Tooltip>,
                <Tooltip title="收藏">
                  <Button
                    type="link"
                    icon={<StarOutlined />}
                    onClick={() => handleToggleFavorite(snapshot.id)}
                  />
                </Tooltip>,
                <Tooltip title="分享">
                  <Button
                    type="link"
                    icon={<ShareAltOutlined />}
                    onClick={() => handleShareSnapshot(snapshot)}
                  />
                </Tooltip>,
                <Tooltip title="导出">
                  <Button
                    type="link"
                    icon={<ExportOutlined />}
                    onClick={() => handleExportSnapshot(snapshot)}
                  />
                </Tooltip>,
                !snapshot.id.startsWith('default-') && (
                  <Popconfirm
                    title="确定要删除这个布局吗？"
                    onConfirm={() => handleDeleteSnapshot(snapshot.id)}
                  >
                    <Button
                      type="link"
                      icon={<DeleteOutlined />}
                      danger
                    />
                  </Popconfirm>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{snapshot.name}</span>
                    {snapshot.tags.map(tag => (
                      <Tag key={tag} >{tag}</Tag>
                    ))}
                    {snapshot.id.startsWith('default-') && (
                      <Tag color="blue" >默认</Tag>
                    )}
                  </div>
                }
                description={
                  <div>
                    <div>{snapshot.description}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Create Snapshot Modal */}
      <Modal
        title="保存布局快照"
        open={isCreateModalVisible}
        onOk={handleCreateSnapshot}
        onCancel={() => setIsCreateModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="布局名称 *"
            value={newSnapshotName}
            onChange={(e) => setNewSnapshotName(e.target.value)}
          />
          <Input.TextArea
            placeholder="布局描述（可选）"
            value={newSnapshotDescription}
            onChange={(e) => setNewSnapshotDescription(e.target.value)}
            rows={3}
          />
          <Input
            placeholder="标签（用逗号分隔）"
            value={newSnapshotTags}
            onChange={(e) => setNewSnapshotTags(e.target.value)}
          />
        </Space>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="导入布局"
        open={isImportModalVisible}
        onOk={handleImportSnapshot}
        onCancel={() => setIsImportModalVisible(false)}
        okText="导入"
        cancelText="取消"
        width={600}
      >
        <Input.TextArea
          placeholder="粘贴布局数据（JSON格式）"
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          rows={10}
        />
      </Modal>
    </div>
  );
};