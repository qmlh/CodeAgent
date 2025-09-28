/**
 * Service Status Indicator Component
 * Shows the current status of service integration
 */

import React, { useState, useEffect } from 'react';
import { Badge, Tooltip, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  LoadingOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { serviceIntegrationManager } from '../../services/ServiceIntegrationManager';

export interface ServiceStatusIndicatorProps {
  showLabel?: boolean;
  size?: 'small' | 'default';
}

export const ServiceStatusIndicator: React.FC<ServiceStatusIndicatorProps> = ({
  showLabel = false,
  size = 'default'
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = () => {
      const ready = serviceIntegrationManager.isReady();
      setIsReady(ready);
      setIsInitializing(!ready && !error);
    };

    // Initial check
    checkStatus();

    // Set up event listeners
    const handleInitialized = () => {
      setIsReady(true);
      setIsInitializing(false);
      setError(null);
    };

    const handleError = (err: Error) => {
      setIsReady(false);
      setIsInitializing(false);
      setError(err.message);
    };

    serviceIntegrationManager.on('initialized', handleInitialized);
    serviceIntegrationManager.on('error', handleError);

    // Periodic status check
    const interval = setInterval(checkStatus, 5000);

    return () => {
      serviceIntegrationManager.off('initialized', handleInitialized);
      serviceIntegrationManager.off('error', handleError);
      clearInterval(interval);
    };
  }, [error]);

  const getStatus = () => {
    if (isInitializing) {
      return {
        status: 'processing' as const,
        icon: <LoadingOutlined spin />,
        text: 'Initializing services...',
        color: '#1890ff'
      };
    }

    if (error) {
      return {
        status: 'error' as const,
        icon: <ExclamationCircleOutlined />,
        text: `Service error: ${error}`,
        color: '#ff4d4f'
      };
    }

    if (isReady) {
      return {
        status: 'success' as const,
        icon: <CheckCircleOutlined />,
        text: 'All services ready',
        color: '#52c41a'
      };
    }

    return {
      status: 'default' as const,
      icon: <DisconnectOutlined />,
      text: 'Services not available',
      color: '#d9d9d9'
    };
  };

  const status = getStatus();

  const handleRetryInitialization = async () => {
    if (!isReady && !isInitializing) {
      setIsInitializing(true);
      setError(null);
      
      try {
        await serviceIntegrationManager.initialize();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Initialization failed');
        setIsInitializing(false);
      }
    }
  };

  if (showLabel) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Badge 
          status={status.status} 
          style={{ color: status.color }}
        />
        <span style={{ 
          fontSize: size === 'small' ? '12px' : '14px',
          color: status.color
        }}>
          {status.text}
        </span>
        {error && (
          <Button 
             
            type="link" 
            onClick={handleRetryInitialization}
            style={{ padding: 0, height: 'auto' }}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <Tooltip title={status.text}>
      <Badge 
        status={status.status}
        style={{ color: status.color }}
      />
    </Tooltip>
  );
};