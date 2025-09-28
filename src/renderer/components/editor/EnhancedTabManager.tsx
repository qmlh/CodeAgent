/**
 * Enhanced Tab Manager with Grouping, Search, and History
 * Implements advanced tab management features for task 17
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Tabs,
  Button,
  Dropdown,
  Space,
  Tooltip,
  Modal,
  Input,
  List,
  Tag,
  Divider,
  Select,
  Badge,
  Popover
} from 'antd';
import {
  CloseOutlined,
  SearchOutlined,
  HistoryOutlined,
  GroupOutlined,
  MoreOutlined,
  PushpinOutlined,
  SaveOutlined,
  CloseCircleOutlined,
  SplitCellsOutlined,
  StarOutlined,
  StarFilled,
  FilterOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setActiveFile, closeFile, saveFile } from '../../store/slices/fileSlice';
import { OpenFile } from '../../store/slices/fileSlice';
import type { MenuProps } from 'antd';

interface TabGroup {
  id: string;
  name: string;
  color: string;
  files: string[];
  isPinned: boolean;
  isCollapsed: boolean;
}

interface TabHistoryItem {
  filePath: string;
  fileName: string;
  timestamp: Date;
  duration: number; // Time spent in file (ms)
}

interface EnhancedTabManagerProps {
  onTabChange?: (filePath: string) => void;
  onTabClose?: (filePath: string) => void;
  onSplitTab?: (filePath: string, direction: 'horizontal' | 'vertical') => void;
  enableGrouping?: boolean;
  enableHistory?: boolean;
  enableSearch?: boolean;
  maxHistoryItems?: number;
}

export const EnhancedTabManager: React.FC<EnhancedTabManagerProps> = ({
  onTabChange,
  onTabClose,
  onSplitTab,
  enableGrouping = true,
  enableHistory = true,
  enableSearch = true,
  maxHistoryItems = 50
}) => {
  const dispatch = useAppDispatch();
  const { openFiles, activeFile } = useAppSelector(state => state.file);

  // Tab management state
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([
    { id: 'default', name: 'Main', color: '#1890ff', files: [], isPinned: false, isCollapsed: false }
  ]);
  const [activeGroup, setActiveGroup] = useState('default');
  const [pinnedTabs, setPinnedTabs] = useState<Set<string>>(new Set());
  const [favoriteTabs, setFavoriteTabs] = useState<Set<string>>(new Set());

  // Search and filter state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dirty' | 'pinned' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'type'>('name');

  // History state
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [tabHistory, setTabHistory] = useState<TabHistoryItem[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Map<string, Date>>(new Map());

  // Group management state
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#1890ff');

  // Refs for tracking time
  const lastActiveTime = useRef<Date>(new Date());
  const currentActiveFile = useRef<string | null>(null);

  // Update tab groups when files change
  useEffect(() => {
    const allFilePaths = openFiles.map(f => f.path);

    setTabGroups(prev => prev.map(group => ({
      ...group,
      files: group.id === 'default'
        ? allFilePaths.filter(path => !prev.some(g => g.id !== 'default' && g.files.includes(path)))
        : group.files.filter(path => allFilePaths.includes(path))
    })));
  }, [openFiles]);

  // Track file access time for history
  useEffect(() => {
    if (activeFile && activeFile !== currentActiveFile.current) {
      const now = new Date();

      // Record time spent in previous file
      if (currentActiveFile.current) {
        const timeSpent = now.getTime() - lastActiveTime.current.getTime();
        updateTabHistory(currentActiveFile.current, timeSpent);
      }

      // Start tracking new file
      currentActiveFile.current = activeFile;
      lastActiveTime.current = now;
      sessionStartTime.set(activeFile, now);
    }
  }, [activeFile]);

  // Update tab history
  const updateTabHistory = useCallback((filePath: string, duration: number) => {
    const file = openFiles.find(f => f.path === filePath);
    if (!file) return;

    setTabHistory(prev => {
      const existingIndex = prev.findIndex(item => item.filePath === filePath);
      const historyItem: TabHistoryItem = {
        filePath,
        fileName: file.name,
        timestamp: new Date(),
        duration
      };

      let newHistory;
      if (existingIndex >= 0) {
        // Update existing item
        newHistory = [...prev];
        newHistory[existingIndex] = {
          ...newHistory[existingIndex],
          timestamp: historyItem.timestamp,
          duration: newHistory[existingIndex].duration + duration
        };
      } else {
        // Add new item
        newHistory = [historyItem, ...prev];
      }

      // Limit history size
      return newHistory.slice(0, maxHistoryItems);
    });
  }, [openFiles, maxHistoryItems]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let files = [...openFiles];

    // Apply search filter
    if (searchQuery) {
      files = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'dirty':
        files = files.filter(file => file.isDirty);
        break;
      case 'pinned':
        files = files.filter(file => pinnedTabs.has(file.path));
        break;
      case 'favorites':
        files = files.filter(file => favoriteTabs.has(file.path));
        break;
    }

    // Apply sorting
    files.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'modified':
          return (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0);
        case 'type':
          return (a.language || '').localeCompare(b.language || '');
        default:
          return 0;
      }
    });

    return files;
  }, [openFiles, searchQuery, filterType, sortBy, pinnedTabs, favoriteTabs]);

  // Handle tab change
  const handleTabChange = useCallback((key: string) => {
    dispatch(setActiveFile(key));
    onTabChange?.(key);
  }, [dispatch, onTabChange]);

  // Handle tab close
  const handleTabClose = useCallback((targetKey: string) => {
    dispatch(closeFile(targetKey));
    onTabClose?.(targetKey);

    // Remove from pinned and favorites
    setPinnedTabs(prev => {
      const newSet = new Set(prev);
      newSet.delete(targetKey);
      return newSet;
    });

    setFavoriteTabs(prev => {
      const newSet = new Set(prev);
      newSet.delete(targetKey);
      return newSet;
    });
  }, [dispatch, onTabClose]);

  // Toggle pin tab
  const togglePinTab = useCallback((filePath: string) => {
    setPinnedTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  // Toggle favorite tab
  const toggleFavoriteTab = useCallback((filePath: string) => {
    setFavoriteTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  // Create new group
  const createGroup = useCallback(() => {
    if (!newGroupName.trim()) return;

    const newGroup: TabGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      color: newGroupColor,
      files: [],
      isPinned: false,
      isCollapsed: false
    };

    setTabGroups(prev => [...prev, newGroup]);
    setNewGroupName('');
    setIsGroupModalVisible(false);
  }, [newGroupName, newGroupColor]);

  // Move tab to group
  const moveTabToGroup = useCallback((filePath: string, groupId: string) => {
    setTabGroups(prev => prev.map(group => ({
      ...group,
      files: group.id === groupId
        ? [...group.files.filter(f => f !== filePath), filePath]
        : group.files.filter(f => f !== filePath)
    })));
  }, []);

  // Get tab context menu
  const getTabContextMenu = useCallback((file: OpenFile): MenuProps => ({
    items: [
      {
        key: 'pin',
        label: pinnedTabs.has(file.path) ? 'Unpin Tab' : 'Pin Tab',
        icon: <PushpinOutlined />,
        onClick: () => togglePinTab(file.path)
      },
      {
        key: 'favorite',
        label: favoriteTabs.has(file.path) ? 'Remove from Favorites' : 'Add to Favorites',
        icon: favoriteTabs.has(file.path) ? <StarFilled /> : <StarOutlined />,
        onClick: () => toggleFavoriteTab(file.path)
      },
      { type: 'divider' },
      {
        key: 'save',
        label: 'Save',
        icon: <SaveOutlined />,
        onClick: () => dispatch(saveFile({ filePath: file.path, content: file.content })),
        disabled: !file.isDirty
      },
      { type: 'divider' },
      {
        key: 'splitHorizontal',
        label: 'Split Horizontal',
        onClick: () => onSplitTab?.(file.path, 'horizontal')
      },
      {
        key: 'splitVertical',
        label: 'Split Vertical',
        onClick: () => onSplitTab?.(file.path, 'vertical')
      },
      { type: 'divider' },
      ...(enableGrouping ? [{
        key: 'moveToGroup',
        label: 'Move to Group',
        children: tabGroups.map(group => ({
          key: `group-${group.id}`,
          label: group.name,
          onClick: () => moveTabToGroup(file.path, group.id)
        }))
      }, { type: 'divider' as const }] : []),
      {
        key: 'close',
        label: 'Close',
        icon: <CloseOutlined />,
        onClick: () => handleTabClose(file.path)
      },
      {
        key: 'closeOthers',
        label: 'Close Others',
        onClick: () => {
          openFiles.forEach(f => {
            if (f.path !== file.path) {
              handleTabClose(f.path);
            }
          });
        }
      },
      {
        key: 'closeAll',
        label: 'Close All',
        icon: <CloseCircleOutlined />,
        onClick: () => {
          openFiles.forEach(f => handleTabClose(f.path));
        }
      }
    ]
  }), [pinnedTabs, favoriteTabs, tabGroups, enableGrouping, openFiles, dispatch, togglePinTab, toggleFavoriteTab, onSplitTab, handleTabClose, moveTabToGroup]);

  // Render tab label with enhanced features
  const renderTabLabel = useCallback((file: OpenFile) => {
    const isPinned = pinnedTabs.has(file.path);
    const isFavorite = favoriteTabs.has(file.path);

    return (
      <Dropdown menu={getTabContextMenu(file)} trigger={['contextMenu']}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          maxWidth: '200px'
        }}>
          {isPinned && (
            <PushpinOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
          )}
          {isFavorite && (
            <StarFilled style={{ color: '#faad14', fontSize: '12px' }} />
          )}
          {file.isReadonly && (
            <Tooltip title="File is locked by another agent">
              <span style={{ color: '#ff4d4f', fontSize: '12px' }}>🔒</span>
            </Tooltip>
          )}
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {file.name}
          </span>
          {file.isDirty && (
            <Tooltip title="Unsaved changes">
              <span style={{ color: '#faad14' }}>●</span>
            </Tooltip>
          )}
          <Button
            type="text"

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
  }, [pinnedTabs, favoriteTabs, getTabContextMenu, handleTabClose]);

  // Render tab toolbar
  const renderTabToolbar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      background: '#2d2d30',
      borderBottom: '1px solid #3e3e42'
    }}>
      <Space >
        {enableSearch && (
          <Tooltip title="Search Tabs">
            <Button
              type="text"

              icon={<SearchOutlined />}
              onClick={() => setIsSearchVisible(!isSearchVisible)}
            />
          </Tooltip>
        )}

        {enableHistory && (
          <Tooltip title="Tab History">
            <Badge count={tabHistory.length} >
              <Button
                type="text"

                icon={<HistoryOutlined />}
                onClick={() => setIsHistoryVisible(true)}
              />
            </Badge>
          </Tooltip>
        )}

        {enableGrouping && (
          <Tooltip title="Manage Groups">
            <Button
              type="text"

              icon={<GroupOutlined />}
              onClick={() => setIsGroupModalVisible(true)}
            />
          </Tooltip>
        )}

        <Popover
          content={
            <div style={{ width: '200px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label>Filter:</label>
                <Select
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: '100%', marginTop: '4px' }}

                >
                  <Select.Option value="all">All Files</Select.Option>
                  <Select.Option value="dirty">Unsaved</Select.Option>
                  <Select.Option value="pinned">Pinned</Select.Option>
                  <Select.Option value="favorites">Favorites</Select.Option>
                </Select>
              </div>
              <div>
                <label>Sort by:</label>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: '100%', marginTop: '4px' }}

                >
                  <Select.Option value="name">Name</Select.Option>
                  <Select.Option value="modified">Modified</Select.Option>
                  <Select.Option value="type">Type</Select.Option>
                </Select>
              </div>
            </div>
          }
          title="Filter & Sort"
          trigger="click"
        >
          <Tooltip title="Filter & Sort">
            <Button
              type="text"

              icon={<FilterOutlined />}
            />
          </Tooltip>
        </Popover>
      </Space>

      <div style={{ flex: 1 }} />

      <Space >
        <Tooltip title={`${openFiles.length} files open`}>
          <Badge count={openFiles.length} showZero>
            <span style={{ color: '#888', fontSize: '12px' }}>Files</span>
          </Badge>
        </Tooltip>

        <Tooltip title={`${openFiles.filter(f => f.isDirty).length} unsaved`}>
          <Badge count={openFiles.filter(f => f.isDirty).length} showZero>
            <span style={{ color: '#888', fontSize: '12px' }}>Unsaved</span>
          </Badge>
        </Tooltip>
      </Space>
    </div>
  );

  // Render search bar
  const renderSearchBar = () => (
    isSearchVisible && (
      <div style={{
        padding: '8px',
        background: '#252526',
        borderBottom: '1px solid #3e3e42'
      }}>
        <Input
          placeholder="Search tabs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          autoFocus
        />
      </div>
    )
  );

  // Create tab items
  const tabItems = filteredFiles.map(file => ({
    key: file.path,
    label: renderTabLabel(file),
    children: null // Content will be handled by parent component
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {renderTabToolbar()}
      {renderSearchBar()}

      <Tabs
        type="editable-card"
        activeKey={activeFile || undefined}
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

      {/* Tab History Modal */}
      <Modal
        title="Tab History"
        open={isHistoryVisible}
        onCancel={() => setIsHistoryVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={tabHistory}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="link"

                  onClick={() => {
                    handleTabChange(item.filePath);
                    setIsHistoryVisible(false);
                  }}
                >
                  Open
                </Button>
              ]}
            >
              <List.Item.Meta
                title={item.fileName}
                description={
                  <div>
                    <div>{item.filePath}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      Last accessed: {item.timestamp.toLocaleString()}
                      {' | '}
                      Time spent: {Math.round(item.duration / 1000)}s
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Group Management Modal */}
      <Modal
        title="Manage Tab Groups"
        open={isGroupModalVisible}
        onCancel={() => setIsGroupModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: '16px' }}>
          <Input
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>Color:</span>
            <Input
              type="color"
              value={newGroupColor}
              onChange={(e) => setNewGroupColor(e.target.value)}
              style={{ width: '50px' }}
            />
            <Button type="primary" onClick={createGroup}>
              Create Group
            </Button>
          </div>
        </div>

        <Divider />

        <List
          dataSource={tabGroups}
          renderItem={(group) => (
            <List.Item
              actions={[
                <Button
                  type="link"

                  danger
                  onClick={() => {
                    if (group.id !== 'default') {
                      setTabGroups(prev => prev.filter(g => g.id !== group.id));
                    }
                  }}
                  disabled={group.id === 'default'}
                >
                  Delete
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: group.color
                      }}
                    />
                    {group.name}
                    <Badge count={group.files.length} />
                  </div>
                }
                description={`${group.files.length} files`}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default EnhancedTabManager;