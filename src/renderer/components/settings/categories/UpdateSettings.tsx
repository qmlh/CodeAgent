/**
 * Update Settings Component
 * Auto-update and version management settings
 */

import React from 'react';
import { Card, Switch, Space, Alert, Button, Tag } from 'antd';
import { CloudDownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';

const UpdateSettings: React.FC = () => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="更新管理"
        description="管理应用程序的自动更新和版本控制设置"
        type="info"
        showIcon
        icon={<CloudDownloadOutlined />}
      />
      
      <Card title="当前版本">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Multi-Agent IDE</span>
            <Tag color="blue">v1.0.0</Tag>
            <Tag color="green" icon={<CheckCircleOutlined />}>最新</Tag>
          </div>
          
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            发布日期: 2024-01-15
          </div>
          
          <Button type="primary">
            检查更新
          </Button>
        </Space>
      </Card>

      <Card title="自动更新设置">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>启用自动更新</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>自动下载更新</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>包含预发布版本</span>
            <Switch />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>更新通知</span>
            <Switch defaultChecked />
          </div>
        </Space>
      </Card>

      <Card title="更新历史">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div><strong>v1.0.0</strong> - 2024-01-15</div>
            <div>• 初始版本发布</div>
            <div>• 多Agent协作功能</div>
            <div>• 完整的IDE界面</div>
          </div>
          
          <Button>
            查看完整更新日志
          </Button>
        </Space>
      </Card>

      <Card title="更新渠道">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            当前渠道: 稳定版
          </div>
          
          <Space>
            <Button type="primary">稳定版</Button>
            <Button>测试版</Button>
            <Button>开发版</Button>
          </Space>
        </Space>
      </Card>
    </Space>
  );
};

export default UpdateSettings;