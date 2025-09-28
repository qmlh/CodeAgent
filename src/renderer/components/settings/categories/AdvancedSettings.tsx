/**
 * Advanced Settings Component
 * Debug and experimental features
 */

import React from 'react';
import { Card, Switch, Space, Alert, Button, Input, Divider } from 'antd';
import { ExperimentOutlined, BugOutlined, WarningOutlined } from '@ant-design/icons';

const AdvancedSettings: React.FC = () => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="高级设置"
        description="调试功能和实验性特性，请谨慎使用。"
        type="warning"
        showIcon
        icon={<ExperimentOutlined />}
      />
      
      <Card title="调试功能" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>启用调试模式</span>
            <Switch />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>显示开发者工具</span>
            <Switch />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>详细日志记录</span>
            <Switch />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>性能监控</span>
            <Switch />
          </div>
          
          <Button icon={<BugOutlined />}>
            打开调试面板
          </Button>
        </Space>
      </Card>

      <Card title="实验性功能" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="实验性功能可能不稳定"
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16 }}
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>AI 代码生成增强</span>
            <Switch />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>智能重构建议</span>
            <Switch />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>自动测试生成</span>
            <Switch />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>协作预测分析</span>
            <Switch />
          </div>
        </Space>
      </Card>

      <Card title="系统配置" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>最大内存使用(MB):</label>
            <Input
              type="number"
              defaultValue="512"
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <label>日志保留天数:</label>
            <Input
              type="number"
              defaultValue="30"
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <label>缓存大小 (MB):</label>
            <Input
              type="number"
              defaultValue="100"
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Card>

      <Card title="危险操作" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="以下操作可能导致数据丢失"
            type="error"
            showIcon
          />
          
          <Space>
            <Button danger>
              清除所有缓存
            </Button>
            <Button danger>
              重置所有设置
            </Button>
            <Button danger>
              清除用户数据
            </Button>
          </Space>
        </Space>
      </Card>
    </Space>
  );
};

export default AdvancedSettings;