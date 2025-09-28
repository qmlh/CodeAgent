/**
 * Conflict Prevention Alerts Component
 * Shows real-time warnings when multiple agents edit the same file
 */

import React from 'react';
import { Alert, Button, Space, Avatar, Typography, Drawer, List, Empty } from 'antd';
import { 
  WarningOutlined, 
  CloseOutlined, 
  EyeOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  DeleteOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { 
  dismissAlert, 
  clearDismissedAlerts, 
  setAlertsVisible 
} from '../../store/slices/conflictSlice';
import { ConflictPreventionAlert } from '../../types/conflict';
import { formatDistanceToNow } from 'date-fns';
import './ConflictPreventionAlerts.css';

const { Text } = Typography;

interface ConflictPreventionAlertsProps {
  showInDrawer?: boolean;
  maxVisible?: number;
}

export const ConflictPreventionAlerts: React.FC<ConflictPreventionAlertsProps> = ({
  showInDrawer = false,
  maxVisible = 3
}) => {
  const dispatch = useDispatch();
  const { preventionAlerts, alertsVisible } = useSelector((state: RootState) => state.conflict);
  const [drawerVisible, setDrawerVisible] = React.useState(false);

  const activeAlerts = preventionAlerts.filter((alert: ConflictPreventionAlert) => !alert.dismissed);
  const visibleAlerts = showInDrawer ? activeAlerts : activeAlerts.slice(0, maxVisible);

  const handleDismissAlert = (alertId: string) => {
    dispatch(dismissAlert(alertId));
  };

  const handleToggleVisibility = () => {
    dispatch(setAlertsVisible(!alertsVisible));
  };

  const handleClearDismissed = () => {
    dispatch(clearDismissedAlerts());
  };

  const getSeverityColor = (severity: ConflictPreventionAlert['severity']) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getSeverityIcon = (severity: ConflictPreventionAlert['severity']) => {
    switch (severity) {
      case 'error':
        return <WarningOutlined />;
      case 'warning':
        return <WarningOutlined />;
      case 'info':
        return <BellOutlined />;
      default:
        return <BellOutlined />;
    }
  };

  const renderAlert = (alert: ConflictPreventionAlert) => (
    <Alert
      key={alert.id}
      type={getSeverityColor(alert.severity)}
      icon={getSeverityIcon(alert.severity)}
      message={
        <div className="alert-header">
          <Text strong>Potential Conflict Warning</Text>
          <Text type="secondary" className="alert-time">
            {formatDistanceToNow(alert.timestamp)} ago
          </Text>
        </div>
      }
      description={
        <div className="alert-content">
          <div className="alert-message">
            {alert.message}
          </div>
          
          <div className="alert-file">
            <Text code>{alert.filePath}</Text>
          </div>
          
          <div className="alert-agents">
            <Text type="secondary">Involved agents:</Text>
            <Space >
              {alert.involvedAgents.map(agent => (
                <div key={agent.id} className="alert-agent">
                  <Avatar 
                     
                    icon={<UserOutlined />}
                    style={{ 
                      backgroundColor: agent.type === 'frontend' ? '#1890ff' : 
                                       agent.type === 'backend' ? '#52c41a' : 
                                       '#722ed1' 
                    }}
                  />
                  <Text>{agent.name}</Text>
                </div>
              ))}
            </Space>
          </div>
        </div>
      }
      action={
        <Button 
           
          icon={<CloseOutlined />}
          onClick={() => handleDismissAlert(alert.id)}
        >
          Dismiss
        </Button>
      }
      closable={false}
      className="prevention-alert"
    />
  );

  if (!alertsVisible && !showInDrawer) {
    return null;
  }

  if (showInDrawer) {
    return (
      <>
        <Button 
          type="text" 
          icon={<BellOutlined />}
          onClick={() => setDrawerVisible(true)}
          className="alerts-drawer-trigger"
        >
          Alerts ({activeAlerts.length})
        </Button>
        
        <Drawer
          title={
            <div className="alerts-drawer-header">
              <Space>
                <BellOutlined />
                <span>Conflict Prevention Alerts</span>
              </Space>
              <Space>
                <Button 
                   
                  icon={<DeleteOutlined />}
                  onClick={handleClearDismissed}
                >
                  Clear Dismissed
                </Button>
                <Button 
                   
                  icon={alertsVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={handleToggleVisibility}
                >
                  {alertsVisible ? 'Hide' : 'Show'} Alerts
                </Button>
              </Space>
            </div>
          }
          placement="right"
          width={400}
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        >
          {activeAlerts.length === 0 ? (
            <Empty 
              description="No active alerts"
              image={<BellOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
            />
          ) : (
            <List
              dataSource={activeAlerts}
              renderItem={(alert: ConflictPreventionAlert) => (
                <List.Item className="alert-list-item">
                  {renderAlert(alert)}
                </List.Item>
              )}
            />
          )}
        </Drawer>
      </>
    );
  }

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="conflict-prevention-alerts">
      <div className="alerts-header">
        <Space>
          <WarningOutlined />
          <Text strong>Conflict Prevention Alerts</Text>
          {activeAlerts.length > maxVisible && (
            <Text type="secondary">
              ({activeAlerts.length - maxVisible} more)
            </Text>
          )}
        </Space>
        
        <Space>
          {activeAlerts.length > maxVisible && (
            <Button 
               
              type="link"
              onClick={() => setDrawerVisible(true)}
            >
              View All
            </Button>
          )}
          <Button 
             
            icon={<EyeInvisibleOutlined />}
            onClick={handleToggleVisibility}
          >
            Hide
          </Button>
        </Space>
      </div>
      
      <div className="alerts-list">
        {visibleAlerts.map(renderAlert)}
      </div>
    </div>
  );
};