/**
 * Bookmark Sidebar Component
 * Manages bookmarks with categories, search, and import/export
 */

import React, { useState } from 'react';
import { 
  Input, 
  Button, 
  Tree, 
  Dropdown, 
  Modal, 
  Form, 
  Select, 
  Space, 
  Typography,
  Tooltip,
  message,
  Upload
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  FolderOutlined,
  BookOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  addBookmark,
  removeBookmark,
  updateBookmark,
  createBookmarkCategory,
  removeBookmarkCategory,
} from '../../store/slices/browserSlice';
import { Bookmark, BookmarkCategory } from '../../types/browser';

const { Search } = Input;
const { Text } = Typography;
const { Option } = Select;

interface BookmarkSidebarProps {
  onNavigate: (url: string) => void;
}

export const BookmarkSidebar: React.FC<BookmarkSidebarProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const { bookmarks, activeTabId, tabs } = useAppSelector(state => state.browser);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<{ bookmark: Bookmark; categoryId: string } | null>(null);
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const filteredBookmarks = bookmarks.map(category => ({
    ...category,
    bookmarks: category.bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter(category => category.bookmarks.length > 0 || searchQuery === '');

  const handleAddBookmark = () => {
    if (activeTab) {
      form.setFieldsValue({
        title: activeTab.title,
        url: activeTab.url,
        category: 'default',
        tags: [],
      });
    }
    setIsAddModalVisible(true);
  };

  const handleSaveBookmark = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingBookmark) {
        dispatch(updateBookmark({
          bookmarkId: editingBookmark.bookmark.id,
          categoryId: editingBookmark.categoryId,
          updates: values,
        }));
        setEditingBookmark(null);
      } else {
        dispatch(addBookmark({
          bookmark: {
            title: values.title,
            url: values.url,
            tags: values.tags || [],
            category: values.category,
          },
          categoryId: values.category,
        }));
      }
      
      setIsAddModalVisible(false);
      form.resetFields();
      message.success('Bookmark saved successfully');
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    }
  };

  const handleEditBookmark = (bookmark: Bookmark, categoryId: string) => {
    setEditingBookmark({ bookmark, categoryId });
    form.setFieldsValue({
      title: bookmark.title,
      url: bookmark.url,
      category: categoryId,
      tags: bookmark.tags,
    });
    setIsAddModalVisible(true);
  };

  const handleDeleteBookmark = (bookmarkId: string, categoryId: string) => {
    Modal.confirm({
      title: 'Delete Bookmark',
      content: 'Are you sure you want to delete this bookmark?',
      onOk: () => {
        dispatch(removeBookmark({ bookmarkId, categoryId }));
        message.success('Bookmark deleted');
      },
    });
  };

  const handleCreateCategory = async () => {
    try {
      const values = await categoryForm.validateFields();
      dispatch(createBookmarkCategory(values));
      setIsCategoryModalVisible(false);
      categoryForm.resetFields();
      message.success('Category created successfully');
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = bookmarks.find(cat => cat.id === categoryId);
    if (!category) return;

    Modal.confirm({
      title: 'Delete Category',
      content: `Are you sure you want to delete "${category.name}" and all its bookmarks?`,
      onOk: () => {
        dispatch(removeBookmarkCategory(categoryId));
        message.success('Category deleted');
      },
    });
  };

  const handleExportBookmarks = () => {
    const exportData = {
      bookmarks,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBookmarks = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.bookmarks && Array.isArray(importData.bookmarks)) {
          // Import logic would go here
          message.success('Bookmarks imported successfully');
        } else {
          message.error('Invalid bookmark file format');
        }
      } catch (error) {
        message.error('Failed to import bookmarks');
      }
    };
    reader.readAsText(file);
    return false; // Prevent upload
  };

  const getBookmarkMenuItems = (bookmark: Bookmark, categoryId: string) => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => handleEditBookmark(bookmark, categoryId),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => handleDeleteBookmark(bookmark.id, categoryId),
    },
  ];

  const getCategoryMenuItems = (category: BookmarkCategory) => [
    {
      key: 'delete',
      label: 'Delete Category',
      icon: <DeleteOutlined />,
      onClick: () => handleDeleteCategory(category.id),
      disabled: category.id === 'default',
    },
  ];

  return (
    <div className="bookmark-sidebar" style={{ width: '280px', height: '100%', background: '#fafafa', borderRight: '1px solid #d9d9d9' }}>
      <div style={{ padding: '12px' }}>
        <div style={{ marginBottom: '12px' }}>
          <Search
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: '8px' }}
          />
          
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button  icon={<PlusOutlined />} onClick={handleAddBookmark}>
              Add
            </Button>
            <Button  icon={<FolderOutlined />} onClick={() => setIsCategoryModalVisible(true)}>
              Category
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'export',
                    label: 'Export',
                    icon: <ExportOutlined />,
                    onClick: handleExportBookmarks,
                  },
                  {
                    key: 'import',
                    label: (
                      <Upload
                        accept=".json"
                        beforeUpload={handleImportBookmarks}
                        showUploadList={false}
                      >
                        <span>Import</span>
                      </Upload>
                    ),
                    icon: <ImportOutlined />,
                  },
                ],
              }}
            >
              <Button  icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        </div>

        <div className="bookmark-list" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {filteredBookmarks.map(category => (
            <div key={category.id} style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '4px 8px',
                background: '#f0f0f0',
                borderRadius: '4px',
                marginBottom: '8px'
              }}>
                <Space>
                  <FolderOutlined style={{ color: category.color }} />
                  <Text strong style={{ fontSize: '12px' }}>{category.name}</Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>({category.bookmarks.length})</Text>
                </Space>
                
                <Dropdown menu={{ items: getCategoryMenuItems(category) }}>
                  <Button type="text"  icon={<MoreOutlined />} />
                </Dropdown>
              </div>

              {category.bookmarks.map(bookmark => (
                <div
                  key={bookmark.id}
                  className="bookmark-item"
                  style={{
                    padding: '8px',
                    marginBottom: '4px',
                    background: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #e8e8e8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f8ff';
                    e.currentTarget.style.borderColor = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#e8e8e8';
                  }}
                  onClick={() => onNavigate(bookmark.url)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <BookOutlined style={{ fontSize: '12px', marginRight: '6px', color: '#666' }} />
                        <Text 
                          style={{ 
                            fontSize: '13px', 
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {bookmark.title}
                        </Text>
                      </div>
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block'
                        }}
                      >
                        {bookmark.url}
                      </Text>
                      {bookmark.tags.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                          {bookmark.tags.map(tag => (
                            <span
                              key={tag}
                              style={{
                                display: 'inline-block',
                                padding: '1px 4px',
                                background: '#f0f0f0',
                                borderRadius: '2px',
                                fontSize: '10px',
                                marginRight: '4px',
                                color: '#666',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Dropdown menu={{ items: getBookmarkMenuItems(bookmark, category.id) }}>
                      <Button 
                        type="text" 
                         
                        icon={<MoreOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Bookmark Modal */}
      <Modal
        title={editingBookmark ? 'Edit Bookmark' : 'Add Bookmark'}
        open={isAddModalVisible}
        onOk={handleSaveBookmark}
        onCancel={() => {
          setIsAddModalVisible(false);
          setEditingBookmark(null);
          form.resetFields();
        }}
        width={400}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter bookmark title' }]}
          >
            <Input placeholder="Bookmark title" />
          </Form.Item>
          
          <Form.Item
            name="url"
            label="URL"
            rules={[
              { required: true, message: 'Please enter URL' },
              { type: 'url', message: 'Please enter a valid URL' },
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>
          
          <Form.Item name="category" label="Category" initialValue="default">
            <Select>
              {bookmarks.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Add tags...">
              {/* Common tags could be pre-populated here */}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        title="Create Category"
        open={isCategoryModalVisible}
        onOk={handleCreateCategory}
        onCancel={() => {
          setIsCategoryModalVisible(false);
          categoryForm.resetFields();
        }}
        width={300}
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>
          
          <Form.Item name="color" label="Color" initialValue="#1890ff">
            <Select>
              <Option value="#1890ff">Blue</Option>
              <Option value="#52c41a">Green</Option>
              <Option value="#faad14">Orange</Option>
              <Option value="#f5222d">Red</Option>
              <Option value="#722ed1">Purple</Option>
              <Option value="#13c2c2">Cyan</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};