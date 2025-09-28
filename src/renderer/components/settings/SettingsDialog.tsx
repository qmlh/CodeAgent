import React, { useState, useEffect } from 'react';
import { Modal, Layout, Menu, Input, Button, Space, Typography, Divider } from 'antd';
import {
  SettingOutlined,
  BgColorsOutlined,
  CodeOutlined,
  RobotOutlined,
  KeyOutlined,
  DatabaseOutlined,
  CloudDownloadOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  SearchOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { RootState } from '../../store/store';
import {
  setActiveCategory,
  setSearchQuery,
  saveSettings,
  loadSettings,
  resetSettings
} from '../../store/slices/settingsSlice';
import { SettingsCategory } from '../../types/settings';

// Import category components
import AppearanceSettings from './categories/AppearanceSettings';
import EditorSettings from './categories/EditorSettings';
import AgentSettings from './categories/AgentSettings';
import ShortcutSettings from './categories/ShortcutSettings';
import DataManagementSettings from './categories/DataManagementSettings';
import UpdateSettings from './categories/UpdateSettings';
import UsageStatistics from './categories/UsageStatistics';
import AdvancedSettings from './categories/AdvancedSettings';

import './SettingsDialog.css';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

interface SettingsDialogProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  visible,
  onClose,
  initialCategory = 'appearance'
}) => {
  const dispatch = useAppDispatch();
  const {
    settings,
    activeCategory,
    searchQuery,
    isDirty,
    isLoading,
    lastSaved
  } = useSelector((state: RootState) => state.settings);

  const [filteredCategories, setFilteredCategories] = useState<SettingsCategory[]>([]);

  const categories: SettingsCategory[] = [
    {
      id: 'appearance',
      name: '外观',
      icon: 'BgColorsOutlined',
      description: '主题、颜色和字体设置',
      component: AppearanceSettings
    },
    {
      id: 'editor',
      name: '编辑器',
      icon: 'CodeOutlined',
      description: '代码编辑器器配置和行为',
      component: EditorSettings
    },
    {
      id: 'agents',
      name: 'Agent',
      icon: 'RobotOutlined',
      description: 'Agent类型和性能设置',
      component: AgentSettings
    },
    {
      id: 'shortcuts',
      name: '快捷键',
      icon: 'KeyboardOutlined',
      description: '键盘快捷键配置',
      component: ShortcutSettings
    },
    {
      id: 'data',
      name: '数据管理',
      icon: 'DatabaseOutlined',
      description: '备份、恢复和同步设置',
      component: DataManagementSettings
    },
    {
      id: 'updates',
      name: '更新',
      icon: 'CloudDownloadOutlined',
      description: '自动更新和版本管理',
      component: UpdateSettings
    },
    {
      id: 'statistics',
      name: '使用统计',
      icon: 'BarChartOutlined',
      description: '使用情况和性能统计',
      component: UsageStatistics
    },
    {
      id: 'advanced',
      name: '高级',
      icon: 'ExperimentOutlined',
      description: '调试和实验性功能',
      component: AdvancedSettings
    }
  ];

  const iconMap: { [key: string]: React.ReactNode } = {
    BgColorsOutlined: <BgColorsOutlined />,
    CodeOutlined: <CodeOutlined />,
    RobotOutlined: <RobotOutlined />,
    KeyboardOutlined: <KeyOutlined />,
    DatabaseOutlined: <DatabaseOutlined />,
    CloudDownloadOutlined: <CloudDownloadOutlined />,
    BarChartOutlined: <BarChartOutlined />,
    ExperimentOutlined: <ExperimentOutlined />
  };

  useEffect(() => {
    if (visible) {
      dispatch(loadSettings());
      dispatch(setActiveCategory(initialCategory));
    }
  }, [visible, initialCategory, dispatch]);

  useEffect(() => {
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [searchQuery]);

  const handleCategoryChange = (categoryId: string) => {
    dispatch(setActiveCategory(categoryId));
  };

  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value));
  };

  const handleSave = async () => {
    try {
      await dispatch(saveSettings(settings)).unwrap();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleReset = () => {
    Modal.confirm({
      title: '重置设置',
      content: '确定要将所有设置重置为默认值吗？此操作无法撤销。',
      okText: '重置',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        dispatch(resetSettings());
      }
    });
  };

  const handleReload = () => {
    dispatch(loadSettings());
  };

  const activeComponent = categories.find(cat => cat.id === activeCategory)?.component;
  const ActiveComponent = activeComponent || AppearanceSettings;

  return (
    <Modal
      title={
        <div className="settings-dialog-header">
          <Space>
            <SettingOutlined />
            <Title level={4} style={{ margin: 0 }}>设置</Title>
          </Space>
          <Space>
            <Search
              placeholder="搜索设置..."
              allowClear
              style={{ width: 200 }}
              onChange={(e) => handleSearch(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Space>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      height={700}
      className="settings-dialog"
      footer={
        <div className="settings-dialog-footer">
          <div className="settings-status">
            {isDirty && <Text type="warning">有未保存的更改</Text>}
            {lastSaved && (
              <Text type="secondary">
                上次保存: {lastSaved.toLocaleTimeString()}
              </Text>
            )}
          </div>
          <Space>
            <Button onClick={handleReload} icon={<ReloadOutlined />}>
              重新加载
            </Button>
            <Button onClick={handleReset} danger>
              重置为默认?
            </Button>
            <Button onClick={onClose}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={isLoading}
              disabled={!isDirty}
              icon={<SaveOutlined />}
            >
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <Layout className="settings-layout">
        <Sider width={250} className="settings-sidebar">
          <div className="settings-search">
            <Search
              placeholder="搜索设置分类..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </div>
          <Divider />
          <Menu
            mode="inline"
            selectedKeys={[activeCategory]}
            className="settings-menu"
            onSelect={({ key }) => handleCategoryChange(key as string)}
          >
            {(searchQuery ? filteredCategories : categories).map(category => (
              <Menu.Item key={category.id} icon={iconMap[category.icon]}>
                <div className="menu-item-content">
                  <div className="menu-item-title">{category.name}</div>
                  <div className="menu-item-description">{category.description}</div>
                </div>
              </Menu.Item>
            ))}
          </Menu>
        </Sider>
        <Content className="settings-content">
          <div className="settings-content-wrapper">
            <ActiveComponent />
          </div>
        </Content>
      </Layout>
    </Modal>
  );
};

export default SettingsDialog;