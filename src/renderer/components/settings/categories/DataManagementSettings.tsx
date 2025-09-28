/**
 * Data Management Settings Component
 * Backup, restore, and sync settings
 */

import React from 'react';
import { Card, Space, Alert, Button, Progress } from 'antd';
import { DatabaseOutlined, CloudUploadOutlined, CloudDownloadOutlined, SaveOutlined } from '@ant-design/icons';

const DataManagementSettings: React.FC = () => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="数据管理"
        description="管理项目数据的备份、恢复和同步"
        type="info"
        showIcon
        icon={<DatabaseOutlined />}
      />
      
      <Card title="数据备份" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            上次备份: 2024-01-15 14:30:00
          </div>
          
          <Progress percent={0} status="normal" />
          
          <Space>
            <Button icon={<SaveOutlined />} type="primary">
              立即备份
            </Button>
            <Button>
              备份设置
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="数据恢复" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            从备份文件恢复项目数据和设置
          </div>
          
          <Space>
            <Button icon={<CloudDownloadOutlined />}>
              从文件恢�?
            </Button>
            <Button>
              查看备份历史
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="数据同步" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            同步状�? 未配�?
          </div>
          
          <Space>
            <Button icon={<CloudUploadOutlined />}>
              配置云同�?
            </Button>
            <Button>
              同步设置
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="存储信息" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div>项目数据: 125 MB</div>
            <div>设置文件: 2.3 MB</div>
            <div>缓存文件: 45 MB</div>
            <div>总计: 172.3 MB</div>
          </div>
          
          <Button>
            清理缓存
          </Button>
        </Space>
      </Card>
    </Space>
  );
};

export default DataManagementSettings;