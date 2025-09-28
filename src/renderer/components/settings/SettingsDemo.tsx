import React, { useState } from 'react';
import { Button, Space, Typography, Card, Row, Col } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import SettingsDialog from './SettingsDialog';

const { Title, Text } = Typography;

const SettingsDemo: React.FC = () => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [initialCategory, setInitialCategory] = useState('appearance');

  const openSettings = (category?: string) => {
    if (category) {
      setInitialCategory(category);
    }
    setSettingsVisible(true);
  };

  const settingsCategories = [
    { key: 'appearance', name: '外观设置', description: '主题、颜色和字体配置' },
    { key: 'editor', name: '编辑器设置', description: '代码编辑器行为配置' },
    { key: 'agents', name: 'Agent设置', description: 'Agent类型和性能配置' },
    { key: 'shortcuts', name: '快捷键设置', description: '键盘快捷键自定义' },
    { key: 'data', name: '数据管理', description: '备份、恢复和同步' },
    { key: 'updates', name: '更新设置', description: '自动更新配置' },
    { key: 'statistics', name: '使用统计', description: '使用情况和性能统计' },
    { key: 'advanced', name: '高级设置', description: '调试和实验性功能' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SettingOutlined /> 应用配置和用户偏好设置
        </Title>
        <Text type="secondary">
          演示完整的应用配置界面，包含所有设置分类和功能
        </Text>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button type="primary" icon={<SettingOutlined />} onClick={() => openSettings()}>
            打开设置
          </Button>
          <Button onClick={() => openSettings('appearance')}>
            外观设置
          </Button>
          <Button onClick={() => openSettings('agents')}>
            Agent设置
          </Button>
          <Button onClick={() => openSettings('data')}>
            数据管理
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {settingsCategories.map(category => (
          <Col span={6} key={category.key}>
            <Card
              title={category.name}
              hoverable
              onClick={() => openSettings(category.key)}
              style={{ cursor: 'pointer', height: '120px' }}
            >
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {category.description}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: '24px' }}>
        <Title level={3}>功能特性</Title>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card title="设置分类导航" size="small">
              <ul style={{ fontSize: '12px', paddingLeft: '16px' }}>
                <li>分类导航菜单</li>
                <li>搜索功能</li>
                <li>设置项描述</li>
                <li>实时预览</li>
              </ul>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="主题配置" size="small">
              <ul style={{ fontSize: '12px', paddingLeft: '16px' }}>
                <li>深色/浅色主题</li>
                <li>自定义颜色方案</li>
                <li>字体大小调整</li>
                <li>预设主题模板</li>
              </ul>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Agent配置" size="small">
              <ul style={{ fontSize: '12px', paddingLeft: '16px' }}>
                <li>Agent类型启用/禁用</li>
                <li>性能参数调整</li>
                <li>行为偏好设置</li>
                <li>协作模式配置</li>
              </ul>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="数据管理" size="small">
              <ul style={{ fontSize: '12px', paddingLeft: '16px' }}>
                <li>自动备份配置</li>
                <li>手动备份管理</li>
                <li>配置导入导出</li>
                <li>云端同步设置</li>
              </ul>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="更新管理" size="small">
              <ul style={{ fontSize: '12px', paddingLeft: '16px' }}>
                <li>自动更新检查</li>
                <li>更新通道选择</li>
                <li>下载进度显示</li>
                <li>更新日志查看</li>
              </ul>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="使用统计" size="small">
              <ul style={{ fontSize: '12px', paddingLeft: '16px' }}>
                <li>使用时长统计</li>
                <li>功能使用频率</li>
                <li>性能指标图表</li>
                <li>Agent工作统计</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </div>

      <SettingsDialog
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        initialCategory={initialCategory}
      />
    </div>
  );
};

export default SettingsDemo;