/**
 * File Favorites Component
 * Bookmark and quick access to frequently used files and folders
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  List, 
  Button, 
  Input, 
  Typography, 
  Card, 
  Space, 
  Tag, 
  Tooltip,
  message,
  Modal,
  Dropdown,
  Menu,
  Empty,
  Collapse
} from 'antd';
import { 
  StarOutlined,
  StarFilled,
  FolderOutlined,
  FileOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  GroupOutlined,
  MoreOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { FileItem } from '../../store/slices/fileSlice';

const { Text } = Typography;
const { Panel } = Collapse;

interface FavoriteItem {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'directory';
  group?: string;
  note?: string;
  addedAt: Date;
  lastAccessed?: Date;
  accessCount: number;
}

interface FavoriteGroup {
  id: string;
  name: string;
  color: string;
  items: FavoriteItem[];
}

interface FileFavoritesProps {
  currentWorkspace?: string | null;
  onFileSelect?: (path: string) => void;
  onDirectorySelect?: (path: string) => void;
}

const DEFAULT_GROUPS = [
  { id: 'recent', name: 'Recently Added', color: 'blue' },
  { id: 'frequent', name: 'Frequently Used', color: 'green' },
  { id: 'important', name: 'Important', color: 'red' },
  { id: 'temp', name: 'Temporary', color: 'orange' }
];

export const FileFavorites: React.FC<FileFavoritesProps> = ({
  currentWorkspace,
  onFileSelect,
  onDirectorySelect
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [groups, setGroups] = useState<FavoriteGroup[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteItem | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'access'>('date');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('fileFavorites');
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        setFavorites(parsed.map((fav: any) => ({
          ...fav,
          addedAt: new Date(fav.addedAt),
          lastAccessed: fav.lastAccessed ? new Date(fav.lastAccessed) : undefined
        })));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }

    const savedGroups = localStorage.getItem('favoriteGroups');
    if (savedGroups) {
      try {
        setGroups(JSON.parse(savedGroups));
      } catch (error) {
        console.error('Failed to load groups:', error);
        setGroups(DEFAULT_GROUPS.map(g => ({ ...g, items: [] })));
      }
    } else {
      setGroups(DEFAULT_GROUPS.map(g => ({ ...g, items: [] })));
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((favs: FavoriteItem[]) => {
    try {
      localStorage.setItem('fileFavorites', JSON.stringify(favs));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }, []);

  // Save groups to localStorage
  const saveGroups = useCallback((grps: FavoriteGroup[]) => {
    try {
      localStorage.setItem('favoriteGroups', JSON.stringify(grps));
    } catch (error) {
      console.error('Failed to save groups:', error);
    }
  }, []);

  // Add file/folder to favorites
  const addToFavorites = useCallback(async (file: FileItem, group?: string, note?: string) => {
    // Check if already in favorites
    const existing = favorites.find(fav => fav.path === file.path);
    if (existing) {
      message.warning('This item is already in favorites');
      return;
    }

    const newFavorite: FavoriteItem = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      path: file.path,
      name: file.name,
      type: file.isDirectory ? 'directory' : 'file',
      group,
      note,
      addedAt: new Date(),
      accessCount: 0
    };

    const newFavorites = [...favorites, newFavorite];
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
    
    message.success(`Added "${file.name}" to favorites`);
  }, [favorites, saveFavorites]);

  // Remove from favorites
  const removeFromFavorites = useCallback((favoriteId: string) => {
    const newFavorites = favorites.filter(fav => fav.id !== favoriteId);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
    message.success('Removed from favorites');
  }, [favorites, saveFavorites]);

  // Update favorite
  const updateFavorite = useCallback((favoriteId: string, updates: Partial<FavoriteItem>) => {
    const newFavorites = favorites.map(fav => 
      fav.id === favoriteId ? { ...fav, ...updates } : fav
    );
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  // Access favorite (increment count and update last accessed)
  const accessFavorite = useCallback((favorite: FavoriteItem) => {
    const updates = {
      accessCount: favorite.accessCount + 1,
      lastAccessed: new Date()
    };
    updateFavorite(favorite.id, updates);

    // Open the file/directory
    if (favorite.type === 'file' && onFileSelect) {
      onFileSelect(favorite.path);
    } else if (favorite.type === 'directory' && onDirectorySelect) {
      onDirectorySelect(favorite.path);
    }
  }, [updateFavorite, onFileSelect, onDirectorySelect]);

  // Create new group
  const createGroup = useCallback((name: string, color: string) => {
    const newGroup: FavoriteGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name,
      color,
      items: []
    };

    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    saveGroups(newGroups);
    message.success(`Created group "${name}"`);
  }, [groups, saveGroups]);

  // Sort favorites
  const sortedFavorites = useCallback((favs: FavoriteItem[]) => {
    return [...favs].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.addedAt.getTime() - a.addedAt.getTime();
        case 'access':
          return b.accessCount - a.accessCount;
        default:
          return 0;
      }
    });
  }, [sortBy]);

  // Filter favorites by group
  const filteredFavorites = useCallback((favs: FavoriteItem[]) => {
    if (filterGroup === 'all') return favs;
    if (filterGroup === 'ungrouped') return favs.filter(fav => !fav.group);
    return favs.filter(fav => fav.group === filterGroup);
  }, [filterGroup]);

  // Group favorites
  const groupedFavorites = useCallback(() => {
    const filtered = filteredFavorites(favorites);
    const sorted = sortedFavorites(filtered);

    if (filterGroup === 'all') {
      // Group by category
      const grouped: Record<string, FavoriteItem[]> = {};
      
      sorted.forEach(fav => {
        const groupKey = fav.group || 'ungrouped';
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(fav);
      });

      return grouped;
    } else {
      return { [filterGroup]: sorted };
    }
  }, [favorites, filteredFavorites, sortedFavorites, filterGroup]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  }, []);

  // Check if file is favorited
  const isFavorited = useCallback((filePath: string) => {
    return favorites.some(fav => fav.path === filePath);
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (file: FileItem) => {
    const existing = favorites.find(fav => fav.path === file.path);
    if (existing) {
      removeFromFavorites(existing.id);
    } else {
      await addToFavorites(file);
    }
  }, [favorites, addToFavorites, removeFromFavorites]);

  // Render favorite item
  const renderFavoriteItem = useCallback((favorite: FavoriteItem) => {
    const contextMenu = (
      <Menu>
        <Menu.Item 
          key="edit" 
          icon={<EditOutlined />}
          onClick={() => setEditingFavorite(favorite)}
        >
          Edit
        </Menu.Item>
        <Menu.Item 
          key="remove" 
          icon={<DeleteOutlined />}
          onClick={() => removeFromFavorites(favorite.id)}
          danger
        >
          Remove
        </Menu.Item>
      </Menu>
    );

    return (
      <List.Item
        key={favorite.id}
        style={{ 
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '4px',
          margin: '2px 0'
        }}
        onClick={() => accessFavorite(favorite)}
        actions={[
          <Dropdown overlay={contextMenu} trigger={['click']}>
            <Button 
               
              icon={<MoreOutlined />} 
              type="text"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        ]}
      >
        <List.Item.Meta
          avatar={
            favorite.type === 'directory' ? 
              <FolderOutlined style={{ color: '#dcb67a' }} /> : 
              <FileOutlined style={{ color: '#cccccc' }} />
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text style={{ color: '#cccccc', fontSize: '13px' }}>
                {favorite.name}
              </Text>
              {favorite.group && (
                <Tag 
                   
                  color={groups.find(g => g.id === favorite.group)?.color || 'default'}
                >
                  {groups.find(g => g.id === favorite.group)?.name || favorite.group}
                </Tag>
              )}
              {favorite.accessCount > 0 && (
                <Tag  color="blue">
                  {favorite.accessCount} uses
                </Tag>
              )}
            </div>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {favorite.path}
              </Text>
              {favorite.note && (
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  {favorite.note}
                </div>
              )}
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                Added {formatTimestamp(favorite.addedAt)}
                {favorite.lastAccessed && (
                  <span style={{ marginLeft: '8px' }}>
                    â€?Last used {formatTimestamp(favorite.lastAccessed)}
                  </span>
                )}
              </div>
            </div>
          }
        />
      </List.Item>
    );
  }, [accessFavorite, removeFromFavorites, groups, formatTimestamp]);

  // Expose toggle function globally
  useEffect(() => {
    (window as any).fileFavorites = { 
      toggleFavorite, 
      isFavorited, 
      addToFavorites 
    };
  }, [toggleFavorite, isFavorited, addToFavorites]);

  const grouped = groupedFavorites();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Text strong style={{ fontSize: '13px' }}>
          Favorites ({favorites.length})
        </Text>
        <Space>
          <Tooltip title="Sort">
            <Dropdown
              overlay={
                <Menu selectedKeys={[sortBy]} onClick={({ key }) => setSortBy(key as any)}>
                  <Menu.Item key="name">Name</Menu.Item>
                  <Menu.Item key="date">Date Added</Menu.Item>
                  <Menu.Item key="access">Most Used</Menu.Item>
                </Menu>
              }
            >
              <Button  icon={<SortAscendingOutlined />} />
            </Dropdown>
          </Tooltip>
          
          <Tooltip title="Filter by Group">
            <Dropdown
              overlay={
                <Menu selectedKeys={[filterGroup]} onClick={({ key }) => setFilterGroup(key as string)}>
                  <Menu.Item key="all">All Groups</Menu.Item>
                  <Menu.Item key="ungrouped">Ungrouped</Menu.Item>
                  <Menu.Divider />
                  {groups.map(group => (
                    <Menu.Item key={group.id}>
                      <Tag color={group.color} >{group.name}</Tag>
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <Button  icon={<GroupOutlined />} />
            </Dropdown>
          </Tooltip>
        </Space>
      </div>

      {/* Favorites List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {favorites.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Empty 
              description="No favorites yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Right-click on files or folders to add them to favorites
            </Text>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Empty 
              description="No favorites in this group"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <Collapse 
            ghost 
            
            defaultActiveKey={Object.keys(grouped)}
          >
            {Object.entries(grouped).map(([groupKey, items]) => {
              const group = groups.find(g => g.id === groupKey);
              const groupName = group?.name || (groupKey === 'ungrouped' ? 'Ungrouped' : groupKey);
              const groupColor = group?.color || 'default';

              return (
                <Panel
                  key={groupKey}
                  header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color={groupColor} >
                        {groupName}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </Text>
                    </div>
                  }
                >
                  <List
                    
                    dataSource={items}
                    renderItem={renderFavoriteItem}
                    style={{ padding: '0 4px' }}
                  />
                </Panel>
              );
            })}
          </Collapse>
        )}
      </div>

      {/* Edit Modal */}
      {editingFavorite && (
        <Modal
          title="Edit Favorite"
          open={true}
          onCancel={() => setEditingFavorite(null)}
          onOk={() => {
            // Handle edit save
            setEditingFavorite(null);
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text>Group:</Text>
              <br />
              <select 
                value={editingFavorite.group || ''}
                onChange={(e) => setEditingFavorite(prev => prev ? { ...prev, group: e.target.value } : null)}
                style={{ width: '100%', padding: '4px' }}
              >
                <option value="">No Group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Text>Note:</Text>
              <br />
              <Input.TextArea
                value={editingFavorite.note || ''}
                onChange={(e) => setEditingFavorite(prev => prev ? { ...prev, note: e.target.value } : null)}
                placeholder="Add a note..."
                rows={3}
              />
            </div>
          </Space>
        </Modal>
      )}
    </div>
  );
};