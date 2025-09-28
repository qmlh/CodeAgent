/**
 * Usage Statistics Component
 * Usage and performance statistics
 */

import React from 'react';
import { Card, Space, Alert, Progress, Statistic, Row, Col } from 'antd';
import { BarChartOutlined, ClockCircleOutlined, RobotOutlined, FileTextOutlined } from '@ant-design/icons';

const UsageStatistics: React.FC = () => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="使用统计"
        description="查看应用使用情况和性能统计数据"
        type="info"
        showIcon
        icon={<BarChartOutlined />}
      />
      
      <Card title="今日统计">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="使用时长"
              value={4.5}
              suffix="小时"
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Agent 任务"
              value={23}
              suffix="个"
              prefix={<RobotOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="编辑文件"
              value={15}
              suffix="个"
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="协作会话"
              value={3}
              suffix="个"
            />
          </Col>
        </Row>
      </Card>

      <Card title="本周统计">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>使用时长</span>
              <span>28.5 小时</span>
            </div>
            <Progress percent={75} />
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Agent 效率</span>
              <span>92%</span>
            </div>
            <Progress percent={92} status="active" />
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>任务完成率</span>
              <span>87%</span>
            </div>
            <Progress percent={87} />
          </div>
        </Space>
      </Card>

      <Card title="Agent 使用情况">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <div><strong>前端 Agent:</strong> 45 个任务 (38%)</div>
            <div><strong>后端 Agent:</strong> 32 个任务 (27%)</div>
            <div><strong>测试 Agent:</strong> 28 个任务 (24%)</div>
            <div><strong>代码审查 Agent:</strong> 13 个任务 (11%)</div>
          </div>
        </Space>
      </Card>

      <Card title="性能指标">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div>平均响应时间: 1.2 秒</div>
            <div>内存使用: 245 MB</div>
            <div>CPU 使用率: 12%</div>
            <div>磁盘使用: 1.2 GB</div>
          </div>
        </Space>
      </Card>
    </Space>
  );
};

export default UsageStatistics;