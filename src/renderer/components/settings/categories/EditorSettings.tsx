/**
 * Editor Settings Component
 * Code editor configuration and behavior settings
 */

import React from 'react';
import { Card, Switch, Slider, Select, Space, Alert } from 'antd';

const EditorSettings: React.FC = () => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="编辑器设置"
        description="配置代码编辑器的行为、外观和功能"
        type="info"
        showIcon
      />
      
      <Card title="编辑器行为" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>自动保存</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>自动格式化</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>显示行号</span>
            <Switch defaultChecked />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>代码折叠</span>
            <Switch defaultChecked />
          </div>
        </Space>
      </Card>

      <Card title="代码提示" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>启用智能提示</span>
            <Switch defaultChecked />
          </div>
          
          <div>
            <label>提示延迟 (ms):</label>
            <Slider
              min={0}
              max={1000}
              defaultValue={300}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Card>

      <Card title="缩进设置" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>缩进类型:</label>
            <Select defaultValue="spaces" style={{ width: '100%', marginTop: 8 }}>
              <Select.Option value="spaces">空格</Select.Option>
              <Select.Option value="tabs">制表符</Select.Option>
            </Select>
          </div>
          
          <div>
            <label>缩进大小:</label>
            <Slider
              min={1}
              max={8}
              defaultValue={2}
              marks={{ 1: '1', 2: '2', 4: '4', 8: '8' }}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Card>
    </Space>
  );
};

export default EditorSettings;