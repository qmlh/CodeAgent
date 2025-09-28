/**
 * File Lock Indicator Component
 * Shows file lock status in file tree and editor tabs
 */

import React from 'react';
import { Tooltip, Tag, Avatar } from 'antd';
import { 
  LockOutlined, 
  UnlockOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { FileLockIndicator as FileLockIndicatorType } from '../../types/conflict';
import { formatDistanceToNow } from 'date-fns';
import './FileLockIndicator.css';

interface FileLockIndicatorProps {
  lockInfo: FileLockIndicatorType;
  size?: 'small' | 'default' | 'large';
  showDetails?: boolean;
  className?: string;
}

export const FileLockIndicator: React.FC<FileLockIndicatorProps> = ({
  lockInfo,
  size = 'default',
  showDetails = false,
  className = ''
}) => {
  if (!lockInfo.isLocked) {
    return showDetails ? (
      <Tag 
        icon={<UnlockOutlined />} 
        color="green" 
        className={`file-lock-indicator unlocked ${className}`}
      >
        Available
      </Tag>
    ) : null;
  }

  const getLockTypeColor = (lockType?: string) => {
    switch (lockType) {
      case 'read':
        return 'blue';
      case 'write':
        return 'orange';
      case 'exclusive':
        return 'red';
      default:
        return 'default';
    }
  };

  const getLockTypeLabel = (lockType?: string) => {
    switch (lockType) {
      case 'read':
        return 'Read Lock';
      case 'write':
        return 'Write Lock';
      case 'exclusive':
        return 'Exclusive Lock';
      default:
        return 'Locked';
    }
  };

  const isExpiringSoon = lockInfo.expiresAt && 
    new Date(lockInfo.expiresAt).getTime() - Date.now() < 5 * 60 * 1000; // 5 minutes

  const tooltipContent = (
    <div className="lock-tooltip-content">
      <div className="lock-tooltip-header">
        <LockOutlined /> File Locked
      </div>
      
      {lockInfo.lockedBy && (
        <div className="lock-tooltip-row">
          <UserOutlined /> 
          <span>Locked by: {lockInfo.lockedBy.name}</span>
        </div>
      )}
      
      {lockInfo.lockType && (
        <div className="lock-tooltip-row">
          <ExclamationCircleOutlined />
          <span>Type: {getLockTypeLabel(lockInfo.lockType)}</span>
        </div>
      )}
      
      {lockInfo.lockedAt && (
        <div className="lock-tooltip-row">
          <ClockCircleOutlined />
          <span>Locked: {formatDistanceToNow(lockInfo.lockedAt)} ago</span>
        </div>
      )}
      
      {lockInfo.expiresAt && (
        <div className="lock-tooltip-row">
          <ClockCircleOutlined />
          <span>
            Expires: {formatDistanceToNow(lockInfo.expiresAt)} 
            {isExpiringSoon && ' (soon)'}
          </span>
        </div>
      )}
    </div>
  );

  if (showDetails) {
    return (
      <Tooltip title={tooltipContent} placement="top">
        <div className={`file-lock-indicator detailed locked ${className}`}>
          <Tag 
            icon={<LockOutlined />} 
            color={getLockTypeColor(lockInfo.lockType)}
            className={isExpiringSoon ? 'expiring-soon' : ''}
          >
            {getLockTypeLabel(lockInfo.lockType)}
          </Tag>
          
          {lockInfo.lockedBy && (
            <div className="lock-agent-info">
              <Avatar 
                 
                icon={<UserOutlined />}
                style={{ 
                  backgroundColor: lockInfo.lockedBy.type === 'frontend' ? '#1890ff' : 
                                   lockInfo.lockedBy.type === 'backend' ? '#52c41a' : 
                                   '#722ed1' 
                }}
              />
              <span className="agent-name">{lockInfo.lockedBy.name}</span>
            </div>
          )}
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipContent} placement="top">
      <LockOutlined 
        className={`file-lock-icon locked ${isExpiringSoon ? 'expiring-soon' : ''} ${className}`}
        style={{ 
          color: getLockTypeColor(lockInfo.lockType),
          fontSize: size === 'small' ? 12 : size === 'large' ? 18 : 14
        }}
      />
    </Tooltip>
  );
};