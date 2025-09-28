/**
 * Plugin Manager Component
 * Plugin browsing, installation, configuration, and management
 */

import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Card,
  Button,
  Input,
  Select,
  Switch,
  Space,
  Badge,
  Tag,
  Modal,
  Form,
  List,
  Typography,
  Divider,
  Avatar,
  Rate,
  Progress,
  Tooltip,
  Empty
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  SettingOutlined,
  DeleteOutlined,
  ReloadOutlined,
  StarOutlined,
  BugOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  setPlugins, 
  updatePlugin, 
  togglePlugin 
} from '../../store/slices/systemSlice';
import { Plugin, PluginCategory } from '../../types/system';
import './PluginManager.css';

const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;
const { Text, Title, Paragraph } = Typography;
const { Meta } = Card;

interface PluginCardProps {
  plugin: Plugin;
  onInstall: (plugin: Plugin) => void;
  onUninstall: (plugin: Plugin) => void;
  onToggle: (plugin: Plugin) => void;
  onConfigure: (plugin: Plugin) => void;
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  onInstall,
  onUninstall,
  onToggle,
  onConfigure
}) => {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    await onInstall(plugin);
    setInstalling(false);
  };

  const actions = [];

  if (plugin.installed) {
    actions.push(
      <Tooltip title={plugin.enabled ? 'Disable' : 'Enable'}>
        <Switch
          
          checked={plugin.enabled}
          onChange={() => onToggle(plugin)}
        />
      </Tooltip>
    );
    actions.push(
      <Tooltip title="Configure">
        <Button
          type="text"
          
          icon={<SettingOutlined />}
          onClick={() => onConfigure(plugin)}
        />
      </Tooltip>
    );
    actions.push(
      <Tooltip title="Uninstall">
        <Button
          type="text"
          
          icon={<DeleteOutlined />}
          danger
          onClick={() => onUninstall(plugin)}
        />
      </Tooltip>
    );
  } else {
    actions.push(
      <Button
        type="primary"
        
        icon={<DownloadOutlined />}
        loading={installing}
        onClick={handleInstall}
      >
        Install
      </Button>
    );
  }

  return (
    <Card
      className="plugin-card"
      actions={actions}
      extra={
        <Space>
          {plugin.updateAvailable && (
            <Badge dot>
              <Tag color="orange">Update</Tag>
            </Badge>
          )}
          {plugin.installed && (
            <Tag color={plugin.enabled ? 'green' : 'default'}>
              {plugin.enabled ? 'Enabled' : 'Disabled'}
            </Tag>
          )}
        </Space>
      }
    >
      <Meta
        avatar={<Avatar icon={<GlobalOutlined />} />}
        title={
          <Space>
            {plugin.name}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              v{plugin.version}
            </Text>
          </Space>
        }
        description={
          <div>
            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
              {plugin.description}
            </Paragraph>
            <div className="plugin-meta">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                by {plugin.author}
              </Text>
              <div className="plugin-keywords">
                {plugin.keywords.slice(0, 3).map(keyword => (
                  <Tag key={keyword}>{keyword}</Tag>
                ))}
              </div>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export const PluginManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { plugins } = useAppSelector(state => state.system);
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [form] = Form.useForm();

  // Mock plugin data
  useEffect(() => {
    const mockPlugins: Plugin[] = [
      {
        id: 'prettier-plugin',
        name: 'Prettier Code Formatter',
        version: '2.8.0',
        description: 'An opinionated code formatter that supports many languages.',
        author: 'Prettier Team',
        homepage: 'https://prettier.io',
        repository: 'https://github.com/prettier/prettier',
        keywords: ['formatter', 'code', 'style'],
        enabled: true,
        installed: true,
        config: {
          tabWidth: 2,
          semi: true,
          singleQuote: true
        }
      },
      {
        id: 'eslint-plugin',
        name: 'ESLint',
        version: '8.45.0',
        description: 'Find and fix problems in your JavaScript code.',
        author: 'ESLint Team',
        homepage: 'https://eslint.org',
        keywords: ['linter', 'javascript', 'code-quality'],
        enabled: true,
        installed: true,
        updateAvailable: '8.46.0'
      },
      {
        id: 'git-lens',
        name: 'GitLens',
        version: '13.6.0',
        description: 'Supercharge Git within VS Code â€?Visualize code authorship.',
        author: 'GitKraken',
        keywords: ['git', 'version-control', 'blame'],
        enabled: false,
        installed: false
      },
      {
        id: 'live-server',
        name: 'Live Server',
        version: '5.7.9',
        description: 'Launch a development local Server with live reload feature.',
        author: 'Ritwick Dey',
        keywords: ['server', 'live-reload', 'development'],
        enabled: false,
        installed: false
      }
    ];

    dispatch(setPlugins(mockPlugins));
  }, [dispatch]);

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || 
                           (categoryFilter === 'installed' && plugin.installed) ||
                           (categoryFilter === 'enabled' && plugin.enabled) ||
                           plugin.keywords.includes(categoryFilter);
    
    return matchesSearch && matchesCategory;
  });

  const installedPlugins = plugins.filter(p => p.installed);
  const enabledPlugins = plugins.filter(p => p.enabled);

  const handleInstallPlugin = async (plugin: Plugin) => {
    // Simulate installation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    dispatch(updatePlugin({
      id: plugin.id,
      installed: true,
      enabled: true
    }));
  };

  const handleUninstallPlugin = (plugin: Plugin) => {
    Modal.confirm({
      title: 'Uninstall Plugin',
      content: `Are you sure you want to uninstall ${plugin.name}?`,
      okText: 'Uninstall',
      okType: 'danger',
      onOk: () => {
        dispatch(updatePlugin({
          id: plugin.id,
          installed: false,
          enabled: false
        }));
      }
    });
  };

  const handleTogglePlugin = (plugin: Plugin) => {
    dispatch(togglePlugin(plugin.id));
  };

  const handleConfigurePlugin = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    if (plugin.config) {
      form.setFieldsValue(plugin.config);
    }
    setConfigModalVisible(true);
  };

  const handleSaveConfig = () => {
    if (!selectedPlugin) return;
    
    const config = form.getFieldsValue();
    dispatch(updatePlugin({
      id: selectedPlugin.id,
      config
    }));
    
    setConfigModalVisible(false);
    setSelectedPlugin(null);
    form.resetFields();
  };

  const categories = [
    { value: 'all', label: 'All Plugins' },
    { value: 'installed', label: 'Installed' },
    { value: 'enabled', label: 'Enabled' },
    { value: 'formatter', label: 'Formatters' },
    { value: 'linter', label: 'Linters' },
    { value: 'git', label: 'Git Tools' },
    { value: 'server', label: 'Servers' }
  ];

  return (
    <div className="plugin-manager">
      <div className="plugin-manager-header">
        <Title level={4}>Plugin Manager</Title>
        <div className="plugin-stats">
          <Space>
            <Badge count={installedPlugins.length} showZero>
              <Text>Installed</Text>
            </Badge>
            <Badge count={enabledPlugins.length} showZero>
              <Text>Enabled</Text>
            </Badge>
          </Space>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Browse" key="browse">
          <div className="plugin-browser">
            <div className="plugin-filters">
              <Space wrap>
                <Search
                  placeholder="Search plugins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 300 }}
                  allowClear
                />
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: 150 }}
                >
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
                <Button icon={<ReloadOutlined />}>Refresh</Button>
              </Space>
            </div>

            <div className="plugin-grid">
              {filteredPlugins.length > 0 ? (
                filteredPlugins.map(plugin => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    onInstall={handleInstallPlugin}
                    onUninstall={handleUninstallPlugin}
                    onToggle={handleTogglePlugin}
                    onConfigure={handleConfigurePlugin}
                  />
                ))
              ) : (
                <Empty description="No plugins found" />
              )}
            </div>
          </div>
        </TabPane>

        <TabPane tab={`Installed (${installedPlugins.length})`} key="installed">
          <div className="installed-plugins">
            <List
              dataSource={installedPlugins}
              renderItem={(plugin) => (
                <List.Item
                  actions={[
                    <Switch
                      key="toggle"
                      checked={plugin.enabled}
                      onChange={() => handleTogglePlugin(plugin)}
                    />,
                    <Button
                      key="config"
                      type="text"
                      icon={<SettingOutlined />}
                      onClick={() => handleConfigurePlugin(plugin)}
                    />,
                    <Button
                      key="uninstall"
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => handleUninstallPlugin(plugin)}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<GlobalOutlined />} />}
                    title={
                      <Space>
                        {plugin.name}
                        <Text type="secondary">v{plugin.version}</Text>
                        {plugin.updateAvailable && (
                          <Tag color="orange">Update Available</Tag>
                        )}
                        <Tag color={plugin.enabled ? 'green' : 'default'}>
                          {plugin.enabled ? 'Enabled' : 'Disabled'}
                        </Tag>
                      </Space>
                    }
                    description={plugin.description}
                  />
                </List.Item>
              )}
            />
          </div>
        </TabPane>

        <TabPane tab="Settings" key="settings">
          <div className="plugin-settings">
            <Card title="Plugin Settings">
              <Form layout="vertical">
                <Form.Item label="Auto-update plugins">
                  <Switch defaultChecked />
                </Form.Item>
                <Form.Item label="Check for updates">
                  <Select defaultValue="daily" style={{ width: 200 }}>
                    <Option value="never">Never</Option>
                    <Option value="daily">Daily</Option>
                    <Option value="weekly">Weekly</Option>
                    <Option value="monthly">Monthly</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Plugin installation directory">
                  <Input defaultValue="~/.kiro/plugins" />
                </Form.Item>
              </Form>
            </Card>
          </div>
        </TabPane>
      </Tabs>

      {/* Plugin configuration modal */}
      <Modal
        title={`Configure ${selectedPlugin?.name}`}
        open={configModalVisible}
        onOk={handleSaveConfig}
        onCancel={() => {
          setConfigModalVisible(false);
          setSelectedPlugin(null);
          form.resetFields();
        }}
        width={500}
      >
        {selectedPlugin && (
          <Form form={form} layout="vertical">
            {selectedPlugin.id === 'prettier-plugin' && (
              <>
                <Form.Item name="tabWidth" label="Tab Width">
                  <Select>
                    <Option value={2}>2 spaces</Option>
                    <Option value={4}>4 spaces</Option>
                    <Option value={8}>8 spaces</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="semi" label="Semicolons" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="singleQuote" label="Single Quotes" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </>
            )}
            {selectedPlugin.id === 'eslint-plugin' && (
              <>
                <Form.Item name="autoFix" label="Auto Fix on Save" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="rules" label="Rules">
                  <Select mode="multiple" placeholder="Select rules">
                    <Option value="no-console">no-console</Option>
                    <Option value="no-unused-vars">no-unused-vars</Option>
                    <Option value="prefer-const">prefer-const</Option>
                  </Select>
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
};