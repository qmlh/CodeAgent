/**
 * Enhanced Component Library
 * Provides components with animations, loading states, and error states
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Spin, Alert, Progress, Skeleton, Empty, Result } from 'antd';
import { 
  LoadingOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';

// Animation utilities
const useAnimation = (trigger: boolean, duration: number = 300) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (trigger) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);
  
  return isAnimating;
};

const useFadeIn = (delay: number = 0) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return isVisible;
};

// Enhanced Button with loading and success states
interface EnhancedButtonProps {
  children: React.ReactNode;
  onClick?: () => Promise<void> | void;
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'small' | 'middle' | 'large';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  showSuccessState?: boolean;
  successDuration?: number;
  loadingText?: string;
  successText?: string;
  errorText?: string;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  onClick,
  showSuccessState = true,
  successDuration = 2000,
  loadingText = '处理�?..',
  successText = '完成',
  errorText = '失败',
  ...props
}) => {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const theme = useAppSelector(state => state.theme);
  
  const handleClick = async () => {
    if (!onClick || state === 'loading') return;
    
    setState('loading');
    
    try {
      await onClick();
      if (showSuccessState) {
        setState('success');
        setTimeout(() => setState('idle'), successDuration);
      } else {
        setState('idle');
      }
    } catch (error) {
      setState('error');
      setTimeout(() => setState('idle'), successDuration);
    }
  };
  
  const getButtonContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <LoadingOutlined spin style={{ marginRight: '8px' }} />
            {loadingText}
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
            {successText}
          </>
        );
      case 'error':
        return (
          <>
            <ExclamationCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
            {errorText}
          </>
        );
      default:
        return children;
    }
  };
  
  return (
    <Button
      {...props}
      onClick={handleClick}
      loading={state === 'loading'}
      style={{
        transition: theme.preferences.enableTransitions ? 'all 0.3s ease' : 'none',
        transform: state === 'success' ? 'scale(1.05)' : 'scale(1)',
        ...props.style
      }}
    >
      {getButtonContent()}
    </Button>
  );
};

// Enhanced Card with loading and error states
interface EnhancedCardProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyDescription?: string;
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
  size?: 'default' | 'small';
  hoverable?: boolean;
  fadeIn?: boolean;
  fadeInDelay?: number;
  skeleton?: boolean;
  skeletonRows?: number;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  title,
  loading = false,
  error = null,
  empty = false,
  emptyDescription = '暂无数据',
  onRetry,
  fadeIn = false,
  fadeInDelay = 0,
  skeleton = false,
  skeletonRows = 3,
  hoverable = false,
  ...props
}) => {
  const theme = useAppSelector(state => state.theme);
  const isVisible = useFadeIn(fadeInDelay);
  const [isHovered, setIsHovered] = useState(false);
  
  const cardStyle: React.CSSProperties = {
    transition: theme.preferences.enableTransitions ? 'all 0.3s ease' : 'none',
    opacity: fadeIn ? (isVisible ? 1 : 0) : 1,
    transform: fadeIn ? (isVisible ? 'translateY(0)' : 'translateY(20px)') : 'none',
    ...(hoverable && isHovered && theme.preferences.enableAnimations ? {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
    } : {}),
    ...props.style
  };
  
  const renderContent = () => {
    if (loading) {
      return skeleton ? (
        <Skeleton active paragraph={{ rows: skeletonRows }} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
            加载�?..
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <Result
          status="error"
          title="加载失败"
          subTitle={error}
          extra={
            onRetry && (
              <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
                重试
              </Button>
            )
          }
        />
      );
    }
    
    if (empty) {
      return (
        <Empty
          description={emptyDescription}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    
    return children;
  };
  
  return (
    <Card
      {...props}
      title={title}
      style={cardStyle}
      onMouseEnter={() => hoverable && setIsHovered(true)}
      onMouseLeave={() => hoverable && setIsHovered(false)}
    >
      {renderContent()}
    </Card>
  );
};

// Progress indicator with animations
interface AnimatedProgressProps {
  percent: number;
  status?: 'normal' | 'active' | 'success' | 'exception';
  showInfo?: boolean;
  size?: 'default' | 'small';
  strokeColor?: string;
  trailColor?: string;
  animate?: boolean;
  duration?: number;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  percent,
  animate = true,
  duration = 1000,
  ...props
}) => {
  const [displayPercent, setDisplayPercent] = useState(0);
  const theme = useAppSelector(state => state.theme);
  
  useEffect(() => {
    if (!animate || !theme.preferences.enableAnimations) {
      setDisplayPercent(percent);
      return;
    }
    
    const startTime = Date.now();
    const startPercent = displayPercent;
    const targetPercent = percent;
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentPercent = startPercent + (targetPercent - startPercent) * easeOut;
      
      setDisplayPercent(Math.round(currentPercent));
      
      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      }
    };
    
    requestAnimationFrame(updateProgress);
  }, [percent, animate, duration, theme.preferences.enableAnimations]);
  
  return <Progress {...props} percent={displayPercent} />;
};

// Loading overlay component
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  tip?: string;
  size?: 'small' | 'default' | 'large';
  delay?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  tip = '加载�?..',
  size = 'default',
  delay = 0
}) => {
  const [showLoading, setShowLoading] = useState(false);
  const theme = useAppSelector(state => state.theme);
  
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowLoading(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [loading, delay]);
  
  return (
    <Spin 
      spinning={showLoading} 
      tip={tip} 
      size={size}
      style={{
        transition: theme.preferences.enableTransitions ? 'opacity 0.3s ease' : 'none'
      }}
    >
      {children}
    </Spin>
  );
};

// Status indicator with pulse animation
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'error';
  size?: number;
  showPulse?: boolean;
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 8,
  showPulse = true,
  label
}) => {
  const theme = useAppSelector(state => state.theme);
  
  const getStatusColor = () => {
    switch (status) {
      case 'online': return '#52c41a';
      case 'offline': return '#8c8c8c';
      case 'busy': return '#ff4d4f';
      case 'away': return '#faad14';
      case 'error': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };
  
  const statusColor = getStatusColor();
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: statusColor,
            transition: theme.preferences.enableTransitions ? 'all 0.3s ease' : 'none'
          }}
        />
        {showPulse && status === 'online' && theme.preferences.enableAnimations && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: statusColor,
              animation: 'pulse 2s infinite',
              opacity: 0.6
            }}
          />
        )}
      </div>
      {label && (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.3;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Notification toast with auto-dismiss
interface NotificationToastProps {
  visible: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  visible,
  type,
  title,
  message,
  duration = 4000,
  onClose,
  position = 'top-right'
}) => {
  const theme = useAppSelector(state => state.theme);
  const [isVisible, setIsVisible] = useState(visible);
  
  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);
  
  const getPositionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      maxWidth: '400px',
      minWidth: '300px'
    };
    
    switch (position) {
      case 'top-right':
        return { ...base, top: '20px', right: '20px' };
      case 'top-left':
        return { ...base, top: '20px', left: '20px' };
      case 'bottom-right':
        return { ...base, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      default:
        return { ...base, top: '20px', right: '20px' };
    }
  };
  
  if (!visible && !isVisible) return null;
  
  return (
    <div
      style={{
        ...getPositionStyle(),
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: theme.preferences.enableTransitions ? 'all 0.3s ease' : 'none'
      }}
    >
      <Alert
        type={type}
        message={title}
        description={message}
        showIcon
        closable
        onClose={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '6px'
        }}
      />
    </div>
  );
};