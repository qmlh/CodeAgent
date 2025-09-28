/**
 * Agent Settings Component
 * Agent configuration and behavior settings
 */

import React from 'react';
import { Card, Switch, Slider, Select, Space, Alert, Button } from 'antd';
import { RobotOutlined, SettingOutlined } from '@ant-design/icons';

const AgentSettings: React.FC = () => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="Agent 设置"
        description="配置 AI Agent 的行为、性能和协作模式"
        type="info"
        showIcon
        icon={<RobotOutlined />}
      />
      
      <Card title="Agent 性能" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>最大并发 Agent 数量:</label>
            <Slider
              min={1}
              max={10}
              defaultValue={3}
              marks={{ 1: '1', 3: '3', 5: '5', 10: '10' }}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <label>任务超时时间 (分钟):</label>
            <Slider
              min={1}
              max={60}
              defaultValue={10}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>启用 Agent 协作</span>
            <Switch defaultChecked />
          </div>
        </Space>
      </Card>

      <Card title="Agent 类型配置" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>前端开�?Agent</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>后端开�?Agent</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>测试 Agent</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>代码审查 Agent</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>文档 Agent</span>
            <Switch />
          </div>
        </Space>
      </Card>

      <Card title="协作模式" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>默认协作模式:</label>
            <Select defaultValue="parallel" style={{ width: '100%', marginTop: 8 }}>
              <Select.Option value="serial">串行模式</Select.Option>
              <Select.Option value="parallel">并行模式</Select.Option>
              <Select.Option value="hybrid">混合模式</Select.Option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>自动任务分配</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>智能冲突检测</span>
            <Switch defaultChecked />
          </div>
        </Space>
      </Card>

      <Card title="高级设置" >
        <Space>
          <Button icon={<SettingOutlined />}>
            Agent 模型配置
          </Button>
          <Button>
            重置 Agent 设置
          </Button>
        </Space>
      </Card>
    </Space>
  );
};

export default AgentSettings;