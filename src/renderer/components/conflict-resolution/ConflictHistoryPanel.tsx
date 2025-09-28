/**
 * Conflict History Panel
 * Displays historical conflict data with search and filtering
 */

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Tag, 
  Button, 
  Typography,
  Card,
  Statistic,
  Row,
  Col,
  Tooltip,
  Modal
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  HistoryOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  ClearOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { 
  loadConflictHistory, 
  setHistoryFilter, 
  clearHistoryFilters 
} from '../../store/slices/conflictSlice';
import { ConflictHistoryEntry } from '../../types/conflict';
import { formatDistanceToNow, format } from 'date-fns';
import type { ColumnsType } from 'antd/es/table';
import './ConflictHistoryPanel.css';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export const ConflictHistoryPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    conflictHistory, 
    historyFilter, 
    isLoadingHistory,
    activeConflicts 
  } = useSelector((state: RootState) => state.conflict);

  const [searchText, setSearchText] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<ConflictHistoryEntry | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useEffect(() => {
    (dispatch as any)(loadConflictHistory({}));
  }, [dispatch]);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    dispatch(setHistoryFilter({ [key]: value }));
  };

  const handleClearFilters = () => {
    dispatch(clearHistoryFilters());
    setSearchText('');
  };

  const handleViewDetails = (entry: ConflictHistoryEntry) => {
    setSelectedEntry(entry);
    setDetailsModalVisible(true);
  };

  const getConflictTypeColor = (type: string) => {
    switch (type) {
      case 'concurrent_modification':
        return 'orange';
      case 'lock_timeout':
        return 'red';
      case 'merge_conflict':
        return 'volcano';
      default:
        return 'default';
    }
  };

  const getResolutionStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'auto_merge':
        return 'blue';
      case 'manual':
        return 'green';
      case 'overwrite':
        return 'orange';
      case 'abort':
        return 'red';
      default:
        return 'default';
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Filter and search the history data
  const filteredHistory = conflictHistory.filter((entry: ConflictHistoryEntry) => {
    // Text search
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchesFile = entry.conflict.filePath.toLowerCase().includes(searchLower);
      const matchesType = entry.conflict.conflictType.toLowerCase().includes(searchLower);
      const matchesStrategy = entry.resolution.strategy.toLowerCase().includes(searchLower);
      const matchesResolvedBy = entry.resolution.resolvedBy.toLowerCase().includes(searchLower);
      
      if (!matchesFile && !matchesType && !matchesStrategy && !matchesResolvedBy) {
        return false;
      }
    }
    
    // Date range filter
    if (historyFilter.dateRange) {
      const [startDate, endDate] = historyFilter.dateRange;
      const entryDate = entry.resolvedAt;
      if (entryDate < startDate || entryDate > endDate) {
        return false;
      }
    }
    
    // Agent filter
    if (historyFilter.agentFilter.length > 0) {
      const hasMatchingAgent = entry.conflict.involvedAgents.some((agentId: string) =>
        historyFilter.agentFilter.includes(agentId)
      );
      if (!hasMatchingAgent) {
        return false;
      }
    }
    
    // File filter
    if (historyFilter.fileFilter.length > 0) {
      if (!historyFilter.fileFilter.some((file: string) => 
        entry.conflict.filePath.includes(file)
      )) {
        return false;
      }
    }
    
    // Resolution type filter
    if (historyFilter.resolutionTypeFilter.length > 0) {
      if (!historyFilter.resolutionTypeFilter.includes(entry.resolution.strategy)) {
        return false;
      }
    }
    
    return true;
  });

  const columns: ColumnsType<ConflictHistoryEntry> = [
    {
      title: 'File',
      dataIndex: ['conflict', 'filePath'],
      key: 'filePath',
      ellipsis: true,
      render: (filePath: string) => (
        <Tooltip title={filePath}>
          <Text code>{filePath.split('/').pop()}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Type',
      dataIndex: ['conflict', 'conflictType'],
      key: 'conflictType',
      render: (type: string) => (
        <Tag color={getConflictTypeColor(type)}>
          {type.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: 'Resolution',
      dataIndex: ['resolution', 'strategy'],
      key: 'strategy',
      render: (strategy: string) => (
        <Tag color={getResolutionStrategyColor(strategy)}>
          {strategy}
        </Tag>
      )
    },
    {
      title: 'Resolved By',
      dataIndex: ['resolution', 'resolvedBy'],
      key: 'resolvedBy',
      render: (resolvedBy: string) => (
        <Space>
          <UserOutlined />
          <Text>{resolvedBy}</Text>
        </Space>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'timeTaken',
      key: 'timeTaken',
      render: (timeTaken: number) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{formatDuration(timeTaken)}</Text>
        </Space>
      )
    },
    {
      title: 'Resolved',
      dataIndex: 'resolvedAt',
      key: 'resolvedAt',
      render: (resolvedAt: Date) => (
        <Tooltip title={format(resolvedAt, 'PPpp')}>
          <Text>{formatDistanceToNow(resolvedAt)} ago</Text>
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, entry) => (
        <Button 
           
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(entry)}
        >
          Details
        </Button>
      )
    }
  ];

  // Calculate statistics
  const totalConflicts = conflictHistory.length;
  const avgResolutionTime = totalConflicts > 0 
    ? conflictHistory.reduce((sum: number, entry: ConflictHistoryEntry) => sum + entry.timeTaken, 0) / totalConflicts
    : 0;
  const mostCommonType = conflictHistory.reduce((acc: Record<string, number>, entry: ConflictHistoryEntry) => {
    const type = entry.conflict.conflictType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topConflictType = Object.entries(mostCommonType)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'None';

  return (
    <div className="conflict-history-panel">
      <div className="history-header">
        <Title level={4}>
          <HistoryOutlined /> Conflict History
        </Title>
        
        <Row gutter={16} className="history-stats">
          <Col span={6}>
            <Card >
              <Statistic 
                title="Total Conflicts" 
                value={totalConflicts}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card >
              <Statistic 
                title="Active Conflicts" 
                value={activeConflicts.length}
                valueStyle={{ color: activeConflicts.length > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card >
              <Statistic 
                title="Avg Resolution Time" 
                value={formatDuration(avgResolutionTime)}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card >
              <Statistic 
                title="Most Common Type" 
                value={topConflictType.replace('_', ' ')}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="history-filters">
        <Space wrap>
          <Input
            placeholder="Search conflicts..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 200 }}
          />
          
          <RangePicker
            placeholder={['Start Date', 'End Date']}
            value={historyFilter.dateRange as any}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
          />
          
          <Select
            mode="multiple"
            placeholder="Filter by resolution type"
            style={{ minWidth: 150 }}
            value={historyFilter.resolutionTypeFilter}
            onChange={(value) => handleFilterChange('resolutionTypeFilter', value)}
          >
            <Option value="auto_merge">Auto Merge</Option>
            <Option value="manual">Manual</Option>
            <Option value="overwrite">Overwrite</Option>
            <Option value="abort">Abort</Option>
          </Select>
          
          <Button 
            icon={<ClearOutlined />}
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredHistory}
        rowKey="id"
        loading={isLoadingHistory}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} conflicts`
        }}
        scroll={{ x: 800 }}
      />

      <Modal
        title="Conflict Details"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedEntry && (
          <div className="conflict-details-modal">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={5}>Conflict Information</Title>
                <Space direction="vertical">
                  <Text><strong>File:</strong> {selectedEntry.conflict.filePath}</Text>
                  <Text><strong>Type:</strong> {selectedEntry.conflict.conflictType}</Text>
                  <Text><strong>Description:</strong> {selectedEntry.conflict.description}</Text>
                  <Text><strong>Created:</strong> {format(selectedEntry.conflict.createdAt, 'PPpp')}</Text>
                </Space>
              </div>
              
              <div>
                <Title level={5}>Resolution Information</Title>
                <Space direction="vertical">
                  <Text><strong>Strategy:</strong> {selectedEntry.resolution.strategy}</Text>
                  <Text><strong>Resolved By:</strong> {selectedEntry.resolution.resolvedBy}</Text>
                  <Text><strong>Resolved At:</strong> {format(selectedEntry.resolvedAt, 'PPpp')}</Text>
                  <Text><strong>Time Taken:</strong> {formatDuration(selectedEntry.timeTaken)}</Text>
                </Space>
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};